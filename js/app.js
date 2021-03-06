define(['jquery', 'juxta', 'container', 'cache', 'connection', 'sidebar', 'request', 'notification', 'explorer', 'browser', 'table', 'server', 'auth', 'modal'], function ($, Juxta, Container, Cache, Connection, Sidebar, Request, Notification, Explorer, Browser, Table, Server, Auth, Modal) {

    'use strict';

    /**
     * @class Juxta application
     * @extends Juxta.Container
     */
    function App(options) {

        Container.prototype.constructor.call(this, window.document.body);

        /**
         * @type {String}
         */
        this._state = null;

        /**
         * @type {Cache}
         */
        this._cache = new Cache();

        /**
         * @type {Juxta.Connection}
         */
        this._connection = new Connection();

        /**
         * @type {Juxta.Sidebar}
         */
        this._sidebar = new Sidebar('#sidebar', this._connection);

        /**
         * Request/response
         *
         * @type Juxta.Request
         */
        this._request = new Request(this._connection, this._cache, {
            request: $.extend({
                beforeSend: this.loading.bind(this, null),
                complete: this.loading.bind(this, false),
                error: (function (xhr, status, error) {
                    if (status === 'parsererror') {
                        this.error(error.message);
                    } else if (status !== 'abort') {
                        this.error(xhr.status + ' ' + xhr.statusText);
                    }
                }).bind(this)
            }, options && options.request),
            response: {
                connectionError: (function (response) {
                    this.error(response.errormsg);
                    this._auth.show();
                }).bind(this),
                sessionNotFound: this.redirect.bind(this, 'login', undefined),
                queryError: (function (response) {
                    this.error(response.errormsg);
                }).bind(this),
                error: this.error.bind(this, 'An error has occured')
            }
        });

        /**
         * Notification messages
         *
         * @type {Juxta.Notification}
         */
        this._notification = new Notification(this.find('.notifications').eq(0));

        /**
         * @type {Explorer}
         */
        this._explorer = new Explorer('.application.explorer', this._request);

        /**
         * Table data browser
         *
         * @type {Juxta.Browser}
         */
        this.browser = new Browser('#data-browser', this._request);

        /**
         * Table editor
         *
         * @type {Juxta.Table}
         */
        this.table = new Table('#table', this._request);

        /**
         * Server information
         *
         * @type {Juxta.Server}
         */
        this._server = new Server('#server-info', this._request);

        /**
         * Connect to server form
         *
         * @type {Juxta.Auth}
         */
        this._auth = new Auth('#login', this._request);

        /**
         * Modal window for dialogs
         *
         * @type {Juxta.Modal}
         */
        this.messageBox = new Modal('#message');


        // Show Juxta when application ready
        $.each([this._explorer, this._server, this.browser, this.table], (function (i, application) {
            application.on('ready', this.show.bind(this))
                .on('maximize', (function () {
                    this.find('#sidebar').hide();
                }).bind(this))
                .on('restore', (function () {
                    this.find('#sidebar').toggle(this.find('#applications').is(':visible'));
                }).bind(this));
        }).bind(this));

        this._explorer.on('alert', this.message.bind(this))
            .on('modal-hide', this._notification.hide.bind(this._notification));

        this._connection.on('change', this._changeConnectionCallback.bind(this));

        this._auth
            .on('before-show', (function () {
                this.hide()._updateWindowTitle();
                this._connection.reset();
            }).bind(this))
            .on('login', (function (connection) {
                this._connection.set(connection.cid, connection);
                this.redirect('databases', connection.cid);
            }).bind(this))
            .on('logout', (function () {
                this._cache.flush();
                this._updateWindowTitle().redirect('login');
            }).bind(this))
            .on('change', (function (cid) {
                this.redirect('', cid);
            }).bind(this));

        this._auth.on('notify', (function (message, type, options) {
            if (type === 'error') {
                this.error(message, options);
            } else if (type === 'loading') {
                this.loading(message, options);
            } else {
                this.notify(message, options);
            }
        }).bind(this));

        // Header links

        this.find('#header .sql a').on('click', (function () {
            //
            if (this.browser.is(':visible') && this.browser.mode == 'browse') {
                this.browser.toggleEditor();
                return false;
            }
        }).bind(this));

        this.find('.header-change-connection').on('click', (function () {
            //
            var container = this.find('.header-connections-container'),
                list = container.find('.header-connections');

            container.css({right: ''}).toggle();

            if (container.is(':visible') && $(window.document.body).width() - container.offset().left < container.width()) {
                container.css({right: 7});
            }

            list.toggleClass('scroll', list.prop('scrollHeight') > list.prop('offsetHeight'));

            return false;
        }).bind(this));

        this.find('#header a[name=logout]').on('click', (function () {
            this._auth.logout();
            return false;
        }).bind(this));

        // @todo Remove this
        this._container.on('click', function () {
            $('.context:visible').trigger('hide').hide();
        });

        this.run();
    }

    App.prototype = Object.create(Container.prototype);
    App.prototype.constructor = App;

    /**
     * Run application
     *
     * @return {Juxta.App}
     */
    App.prototype.run = function () {

        setInterval(this.route.bind(this), 200);

        return this;
    };

    /**
     *
     */
    App.prototype.route = function () {

        var hash = window.location.hash.replace(/#\/?/g, '').split('?'),
            query = hash[0].split('/'),
            paramsString = hash[1],
            params = [],
            pathParams = [],
            cid,
            action;

        function parseParamsString(str) {
            //
            var ret = {},
                seg = str.replace(/^\?/, '').split('&'),
                len = seg.length, i = 0, s;

            for (; i < len; i++) {
                if (!seg[i]) {
                    continue;
                }
                s = seg[i].split('=');
                ret[decodeURIComponent(s[0])] = decodeURIComponent(s[1]);
            }

            return ret;
        }

        if (paramsString) {
            params = parseParamsString(paramsString);
        }

        if (/^\d+$/.test(query[0])) {
            cid = Number(query.shift());
        }

        if (query.length > 0) {
            action = query.pop();
            pathParams = query;
        }

        if (cid === undefined && action !== 'login') {
            this.redirect('login');
            return;
        }

        if (hash[0] != this._state) {
            switch (action) {
                case 'databases':
                case 'processlist':
                case 'users':
                    this.explore({cid: cid, show: action});
                    break;
                case 'status':
                case 'variables':
                case 'charsets':
                case 'engines':
                    this._sidebar.highlight('status');
                    this._server.info({cid: cid, show: action});
                    break;
                case 'login':
                    this._auth.show(params.id);
                    break;
                //
                case 'tables':
                case 'views':
                case 'triggers':
                case 'routines':
                    this.explore({cid: cid, show: action, from: pathParams[0]});
                    break;
                //
                case 'browse':
                    this.browser.browse({cid: cid, browse: pathParams[1], from: pathParams[0]});
                    break;
                case 'sql':
                    this.browser.sql({cid: cid, db: pathParams[0]});
                    break;
                case 'columns':
                case 'indexes':
                case 'foreign':
                    this._sidebar.highlight('columns', {'database': pathParams[0], 'table': pathParams[1]});
                    this.table.edit({cid: cid, edit: action, table: pathParams[1], from: pathParams[0]});
                    break;
                case 'flush':
                    this._cache.flush();
                    this.redirect('databases', cid);
                    return;
                default:
                    this.redirect('databases', cid);
                    return;
            }

            this._state = hash[0];
        }
    };

    /**
     * Change window title
     *
     * @param {Object} connection
     * @return {this}
     */
    App.prototype._updateWindowTitle = function (connection) {

        var title = '';

        if (connection) {
            title = this._connection.get('name');

            if (!title) {
                title = Juxta.composeConnectionName(connection);
            }
        }

        window.document.title = (title ? title + ' - ' : '') + 'Juxta';

        return this;
    };

    /**
     * Fix header links href attr
     *
     * @param {Object} connection
     * @return {Juxta}
     */
    App.prototype._repairHeaderLinks = function (connection) {

        this.find('.header a[name]').each(function (i, link) {
            $(link).attr('href', '#/' + connection.cid + '/' + $(link).attr('name'));
        });

        return this;
    };

    /**
     * Show the application
     *
     * @return {Juxta.App}
     */
    App.prototype.show = function () {

        this.find('#sidebar').not(':visible').slideDown(250);

        this.find('.modal').hide();

        if (this.find('#applications').not(':visible')) {
            this.find('#applications').fadeIn(250);
            this.find('#header h1, #header .header-links').fadeIn(250);
        }

        return this;
    };

    /**
     * Hide
     *
     * @return {Juxta.App}
     */
    App.prototype.hide = function () {

        this.find('#header h1, #header .header-links, #sidebar, #applications, .modal, .context').hide();

        return this;
    };

    /**
     * Explore a server
     *
     * @param {Object} params
     * @return {jqXHR}
     */
    App.prototype.explore = function (params) {

        if (params.from) {
            this._sidebar.highlight(params.show, {'database': params.from});
        } else {
            this._sidebar.highlight(params.show);
        }

        return this._explorer.explore(params);
    };

    /**
     * Notifications shortcuts
     */
    App.prototype.notify = function (message, options) {
        return this._notification.show(message, options);
    };

    /**
     * Show the notification on loading
     *
     * @param {String} message
     * @param {Object} options
     */
    App.prototype.loading = function (message, options) {
        return this._notification.loading(message, options);
    };

    /**
     * Show error notification
     *
     * @param {String} message
     * @param {Object} options
     * @return {jQuery}
     */
    App.prototype.error = function (message, options) {
        return this._notification.show(message, $.extend({}, {type: 'error', hide: false, fast: true}, options));
    };

    /**
     * Show dialog box with message
     *
     * @param {String} message
     * @param {Object} options
     * @return {Juxta.Modal}
     */
    App.prototype.message = function (message, options) {
        return this.messageBox.show(options, message);
    };

    /**
     * Redirect
     *
     * @param {String} action
     * @param {Number} [cid] Connection ID
     * @return {Juxta}
     */
    App.prototype.redirect = function (action, cid) {

        this._state = null;

        window.document.location.hash = '#/' + (typeof cid !== 'undefined' ? cid + '/' : '') + action;

        return this;
    };

    /**
     * @param {Number} cid
     */
    App.prototype._changeConnectionCallback = function (cid) {

        if (cid === undefined) {
            return;
        }

        var text = this._connection.get('name'),
            connections = this.find('.header-connections');

        if (!text) {
            text = Juxta.composeConnectionName(this._connection.get());
        }

        this.find('.header-change-connection').text(text);

        this._updateWindowTitle(this._connection.get())
            ._repairHeaderLinks(this._connection.get());

        connections.empty();

        this._request.send({
            action: {get: 'connections'}, context: this, success: function (response) {
                $.each(response, (function (key, connection) {
                    //
                    var li = $('<li>').addClass('header-connection'),
                        a = $('<a>');

                    if (connection.cid === undefined) {
                        li.toggleClass('established', connection.password !== undefined);
                        a.attr('href', '#/login?id=' + key);

                    } else if (!this._connection.isCurrent(connection.cid)) {
                        li.addClass('established');
                        a.attr('href', '#/' + connection.cid + '/');

                    } else {
                        li.addClass('current');
                    }

                    if (a.attr('href')) {
                        a.on('click', this.hide.bind(this));
                    }

                    connections.append(li.append(a.text(Juxta.composeConnectionName(connection))));

                }).bind(this));
            }
        });
    };

    return App;

});
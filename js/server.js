/*global window */

define(['window', 'grid2'], function (Frame, Grid2) {

    /**
     * @class Server Information
     * @extends Window
     *
     * @param {jQuery|String} element
     * @param {Juxta.Request} request
     */
    function Server(element, request) {

        /**
         * @type {Object}
         */
        this._settings = {
            cache: 60
        };

        Frame.prototype.constructor.call(this, element);


        /**
         * @type {Request}
         */
        this._request = request;


        /**
         * @type {Grid}
         */
        this._grid = new Grid2(this.find('.grid2'));


        /**
         * @type {String}
         */
        this._preparedFor = null;


        this._grid.disableSelectRows();

        // Stretch grid by height
        $(window).on('resize', this._stretch.bind(this));

    }

    Server.prototype = Object.create(Frame.prototype);

    Server.prototype.constructor = Server;

    /**
     * Show application
     *
     * @param {Object} options
     */
    Server.prototype.show = function () {
        //
        Frame.prototype.show.apply(this, arguments);

        this._stretch();

        return this;
    };

    /**
     * Stretch grid to window height
     */
    Server.prototype._stretch = function () {
        //
        var height = 0;

        if (this.is(':visible')) {
            height = this._applicationsContainer.height();
            height -= this.find('.grid2-body').position().top + this._status.outerHeight(true); // minus padding from top, minus status bar height
            height -= this.find('.grid2-body').outerHeight() - this.find('.grid2-body').height(); // minus grid body padding + border

            this._grid.setHeight(height);
        }
    };

    /**
     * Prepare grid for response data
     *
     * @param {String} template
     * @return {Boolean}
     */
    Server.prototype._prepare = function (template) {
        //
        if (template === this._preparedFor) {
            return true;

        } else if (this._grid.prepare(this._gridParams[template])) {
            this._preparedFor = template;
            return true;
        }

        return false;
    };

    /**
     * Request information (shortcut)
     *
     * @param {Object} params
     * @return {jqXHR}
     */
    Server.prototype.info = function (params) {
        return this._serverInformationRequest(params);
    };

    /**
     * Request data
     *
     * @param {Object} params
     * @return {jqXHR}
     */
    Server.prototype._serverInformationRequest = function (params) {
        //
        this.show(this._headerOptions[params.show], params);

        if (params.show === 'charsets' || params.show === 'engines') {
            $.extend(params, {cache: Infinity}, params);
        }

        // Move options values from query to options variable
        var query = $.extend({}, params),
            options = {};

        $.each(['cache', 'refresh'], function (index, value) {
            delete query[value];
            if (params[value] !== undefined) {
                options[value] = params[value];
            }
        });

        if (this._prepare(query.show)) {
            return this._request.send($.extend({},
                {
                    action: query, context: this, success: function (response) {
                    return this._serverInformationCallback(response, query);
                }
                },
                this._settings, options
            ));
        }
    };

    /**
     * Response callback
     *
     * @param {Object} response
     * @param {Object} request
     * @return {Explorer}
     */
    Server.prototype._serverInformationCallback = function (response, request) {
        //
        this._grid.fill(response, this._gridParams[request.show]);

        return this.ready();
    };

    /**
     * @type {Object}
     */
    Server.prototype._headerOptions = {
        status: {
            header: 'Server Status',
            menu: {
                'Server Status': null,
                'System Variables': '#/{cid}/variables',
                'Charsets': '#/{cid}/charsets',
                'Engines': '#/{cid}/engines'
            }
        },
        variables: {
            header: 'System Variables',
            menu: {
                'Server Status': '#/{cid}/status',
                'System Variables': null,
                'Charsets': '#/{cid}/charsets',
                'Engines': '#/{cid}/engines'
            }
        },
        charsets: {
            header: 'Charsets',
            menu: {
                'Server Status': '#/{cid}/status',
                'System Variables': '#/{cid}/variables',
                'Charsets': null,
                'Engines': '#/{cid}/engines'
            }
        },
        engines: {
            header: 'Engines',
            menu: {
                'Server Status': '#/{cid}/status',
                'System Variables': '#/{cid}/variables',
                'Charsets': '#/{cid}/charsets',
                'Engines': null
            }
        }
    };

    /**
     * Resources
     *
     * @type {Object}
     */
    Server.prototype._gridParams = {
        status: {
            columns: ['Variable', 'Value']
        },
        variables: {
            columns: ['Variable', 'Value']
        },
        charsets: {
            columns: ['Charset', 'Default collation', 'Description']
        },
        engines: {
            columns: ['Engine', 'Support', 'Description']
        }
    };

    return Server;

});

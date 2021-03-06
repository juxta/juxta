define(['window', 'grid2', 'createdatabase', 'sqleditor', 'routineeditor', 'template'], function (Frame, Grid2, CreateDatabase, SqlEditor, RoutineEditor, render) {

    /**
     * @class Explorer
     * @extends {Window}
     *
     * @param {jQuery|String} element
     * @param {Request} request
     */
    function Explorer(element, request) {

        Frame.prototype.constructor.call(this, element, {cache: 3600});

        /**
         * @type {Request}
         */
        this._request = request;

        /**
         * @type {Grid2}
         */
        this._grid = new Grid2(this.find('.grid2'));

        /**
         * @type {String}
         */
        this._cacheKey = null;

        /**
         * @type {String}
         */
        this._preparedFor = null;

        /**
         * @type {Juxta.CreateDatabase}
         */
        this._createDatabase = new CreateDatabase($('#create-database'), this._request);

        /**
         * @type {Juxta.SqlEditor}
         */
        this._sqlEditor = new SqlEditor($('#edit-sql'));

        /**
         * @type {Juxta.RoutineEditor}
         */
        this._routineEditor = new RoutineEditor($('#edit-routine'), this._request);


        // Stretch grid by height
        $(window).on('resize', this._stretch.bind(this));

        this._grid
            .on('context-menu-click', this._gridActionCallback.bind(this))
            .on('action', this._gridActionCallback.bind(this));

        // Update status bar text
        this._grid.on('change', (function () {
            //
            var status = '';

            if (this._grid.count > 0) {
                status += this._grid.count + ' items';
            }

            this._status.html(status);

        }).bind(this));

        // Hide notifications on dialog box hide
        $.each([this._createDatabase], (function (i, application) {
            application.on('hide', this.trigger.bind(this, 'modal-hide'));
        }).bind(this));

        // Refresh databases list after create
        this._createDatabase.on('created', this.explore.bind(this, {show: 'databases', refresh: true}));

    }

    Explorer.prototype = Object.create(Frame.prototype);

    /**
     * Show explorer
     *
     * @param {Object} options
     */
    Explorer.prototype.show = function () {
        //
        Frame.prototype.show.apply(this, arguments);
        this._stretch();

        return this;
    };

    /**
     * Stretch grid to window height
     */
    Explorer.prototype._stretch = function () {
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
     * Prepare grid for response
     *
     * @param {string} template
     */
    Explorer.prototype._prepare = function (template) {
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
     * Explore
     *
     * @param {Object} params
     */
    Explorer.prototype.explore = function (params) {
        return this._exploreRequest(params);
    };

    /**
     * Request for explore
     *
     * @param {Object} request
     * @return {jqXHR}
     */
    Explorer.prototype._exploreRequest = function (request) {
        //
        var query = $.extend({}, request),
            params = {};

        this.show(this._explorerShowParams[request.show], request);

        if (request.show === 'processlist') {
            request = $.extend({
                cache: Infinity,
                index: {name: 'processId', field: 0, path: ['data']},
                refresh: true
            }, request);
        }

        // Move options values from query to options variable
        $.each(['cache', 'index', 'refresh'], function (index, value) {
            delete query[value];
            if (request[value] !== undefined) {
                params[value] = request[value];
            }
        });

        // Store key cache for last request
        this._cacheKey = this._request.queryString(query);

        if (this._prepare(query.show)) {
            return this._request.send($.extend({},
                {
                    action: query, context: this, success: function (response) {
                    return this._exploreCallback(response, query);
                }
                },
                this._settings, params
            ));
        }
    };

    /**
     * Response for explore requests
     *
     * @param {Object} response
     * @param {Object} request
     * @return {Explorer}
     */
    Explorer.prototype._exploreCallback = function (response, request) {
        //
        if (request.show !== this._preparedFor) {
            return this;
        }

        this._grid.fill(response, this._gridParams[request.show], request);

        return this.ready();
    };

    /**
     * @type {Object}
     */
    Explorer.prototype._explorerShowParams = {
        databases: {
            header: 'Databases',
            menu: {
                'Create Database': function () {
                    this._createDatabase.show();
                    return false;
                }
            }
        },
        processlist: {
            header: 'Processlist',
            menu: {
                'Refresh': {
                    href: '#/{cid}/processlist', click: function (event) {
                        this.explore({show: 'processlist', cid: $(event.target).attr('href').match(/#\/(\d+)\//)[1]});
                        return false;
                    }
                }
            }
        },
        users: {
            header: 'Users',
            menu: {
                'Create User': null,
                'Flush': null
            }
        },
        tables: {
            header: {title: 'Tables', from: null},
            menu: {'Create Table': null}
        },
        views: {
            header: {title: 'Views', from: null},
            menu: {'Create View': null}
        },
        routines: {
            header: {title: 'Stored Routines', from: null},
            menu: {'Create Routine': null}
        },
        triggers: {
            header: {title: 'Triggers', from: null},
            menu: {'Create Trigger': null}
        }
    };

    /**
     * @type {Object}
     */
    Explorer.prototype._gridParams = {
        databases: {
            columns: ['Database'],
            row: '<tr><td><a href="#/{cid}/{database}/tables">{database}</a></td></tr>',
            contextMenu: {
                'tables': {title: 'Tables', href: '#/{cid}/{name}/tables'},
                'drop-databases': 'Drop',
                'database-properties': 'Show Properties'
            },
            actions: {'drop-databases': 'Drop'}
        },
        processlist: {
            columns: ['Process Id', 'User', {title: 'Host', hidden: true}, 'Database', 'Command', 'Time', 'Info'],
            row: '<tr><td><a>{process_id}</td><td>{user}@{host}</td><td>{database}</td><td>{command}</td><td>{time}</td><td>{info}</td><td></td></tr>',
            contextMenu: {
                'show-process-query': 'Show Query',
                'kill': 'Kill'
            },
            actions: {kill: 'Kill'}
        },
        users: {
            columns: ['Username', 'Host', 'Password', 'Grant', {name: 'privileges', title: 'Global Privileges'}],
            row: '<tr><td><a name="\'{username}\'@\'{host}\'">{username}</a><td>{host}</td><td>{password}</td><td>{grant}</td><td>{privileges}</td><td></td></tr>',
            contextMenu: {
                'edit-privileges': 'Edit Privileges',
                'change-password': 'Change Password',
                'rename': 'Rename',
                'drop-users': 'Drop'
            },
            actions: {'drop-users': 'Drop'}
        },
        tables: {
            columns: [
                {title: 'Table', hint: 'Table name'},
                {title: 'Engine', hint: 'Storage engine'},
                {title: 'Rows', hint: 'Number of rows'},
                {title: 'Size', hint: 'Length of data and index files'}
            ],
            row: '<tr><td><a href="#/{cid}/{from}/{table}/browse">{table}</a></td><td>{engine}</td><td>{rows|number}</td><td>{size|size}</td><td></td></tr>',
            contextMenu: {
                'browse': {title: 'Browse', href: '#/{cid}/{from}/{name}/browse'},
                'columns': {title: 'Show Columns & Indexes', href: '#/{cid}/{from}/{name}/columns'},
                'truncate-tables': 'Truncate',
                'drop-tables': 'Drop',
                'table-properties': 'Show Properties'
            },
            actions: {'drop-tables': 'Drop'}
        },
        views: {
            columns: ['View', 'Updatable'],
            row: '<tr><td><a href="#/{cid}/{from}/{view}/browse">{view}</a></td><td>{updatable}</td></tr>',
            contextMenu: {
                'browse': {title: 'Browse', href: '#/{cid}/{from}/{name}/browse'},
                'edit-view': 'Show Create Syntax',
                'drop-views': 'Drop',
                'view-properties': 'Show Properties'
            },
            actions: {'drop-views': 'Drop'}
        },
        routines: {
            'head': {
                'routine': 'Routine',
                'routine-definer': 'Definer',
                'routine-return': 'Returns'
            },
            columns: ['Routine', {title: 'Type', hidden: true}, 'Return'],
            row: '<tr><td><input type="checkbox" name="{routine}" item-type="{type}"><a>{routine}</a></td><td>{return}</td></tr>',
            contextMenu: {
                'edit-routine': 'Show Create Syntax',
                'drop-routines': 'Drop',
                'routine-properties': 'Show Properties'
            },
            actions: {'drop-routines': 'Drop'}
        },
        triggers: {
            columns: ['Trigger', 'Event', {title: 'Timing', hidden: true}, {name: 'trigger_table', title: 'Table'},],
            row: '<tr><td><a>{trigger}</a></td><td>{timing}&nbsp;{event}</td><td>{trigger_table}</td></tr>',
            contextMenu: {
                'edit-trigger': 'Show Create Syntax',
                'drop-triggers': 'Drop',
                'trigger-properties': 'Show Properties'
            },
            actions: {'drop-triggers': 'Drop'}
        }
    };

    /**
     * Callback on grid group action or context menu click
     *
     * @param {String} event Event name
     * @param {String,Array,Object} row Object type and name
     * @param context Context
     */
    Explorer.prototype._gridActionCallback = function (event, row, context) {

        if (event === 'database-properties') {
            return this._request.send({
                action: {show: 'database-properties', database: row, cid: context.cid},
                success: this._showPropertiesCallback.bind(this, event)
            });

        } else if (event === 'drop-databases') {
            return this.drop('databases', $.isArray(row) ? row : [row]);

        } else if (event === 'drop-users') {
            return this.drop('users', $.isArray(row) ? row : [row]);

        } else if (event === 'table-properties') {
            return this._request.send({
                action: {
                    show: 'table-properties',
                    table: row,
                    from: context.from,
                    cid: context.cid
                }, success: this._showPropertiesCallback.bind(this, event)
            });

        } else if (event === 'truncate-tables') {
            return this.truncate($.isArray(row) ? row : [row], context.from);

        } else if (event === 'drop-tables') {
            return this.drop('tables', $.isArray(row) ? row : [row], context.from);

        } else if (event === 'view-properties') {
            return this._request.send({
                action: {
                    show: 'view-properties',
                    view: row,
                    from: context.from,
                    cid: context.cid
                }, success: this._showPropertiesCallback.bind(this, event)
            });

        } else if (event === 'drop-views') {
            return this.drop('views', $.isArray(row) ? row : [row], context.from);

        } else if (event === 'kill') {
            return this.kill($.isArray(row) ? row : [row]);

        } else if (event === 'show-process-query') {
            this._sqlEditor.view(
                this._request.cache.search(this._cacheKey, {processId: row})[6],
                {title: 'Process {id}', id: this._request.cache.search(this._cacheKey, {processId: row})[0]}
            );

        } else if (event === 'edit-view') {
            return this._routineEditor.edit({view: row, from: context.from});

        } else if (event === 'edit-routine' && (row.procedure || row['function'])) {
            return this._routineEditor.edit($.extend(row, {from: context.from}));

        } else if (event === 'drop-routines') {
            return this.drop('routines', row, context.from);

        } else if (event === 'routine-properties') {
            if (row.procedure) {
                return this._request.send({
                    action: {
                        show: 'procedure-properties',
                        procedure: row.procedure,
                        from: context.from,
                        cid: context.cid
                    },
                    success: this._showPropertiesCallback.bind(this, 'procedure-properties')
                });

            } else if (row.function) {
                return this._request.send({
                    action: {show: 'function-properties', function: row.function, from: context.from, cid: context.cid},
                    success: this._showPropertiesCallback.bind(this, 'function-properties')
                });
            }

        } else if (event === 'edit-trigger') {
            return this._routineEditor.edit({trigger: row, from: context.from});

        } else if (event === 'trigger-properties') {
            return this._request.send({
                action: {
                    show: 'trigger-properties',
                    trigger: row,
                    from: context.from,
                    cid: context.cid
                }, success: this._showPropertiesCallback.bind(this, event)
            });

        } else if (event === 'drop-triggers') {
            return this.drop('triggers', $.isArray(row) ? row : [row], context.from);
        }

    };

    /**
     * Response for getting database or table properties request
     *
     * @param {Object} response
     */
    Explorer.prototype._showPropertiesCallback = function (name, response) {
        //
        var template = $('#' + name);

        if (name === 'database-properties' && template.is('[type=text/html]')) {
            this.trigger('alert', render(template.html(), response), {
                title: 'Database {name}',
                name: response.name
            });

        } else if (name === 'table-properties' && template.is('[type=text/html]')) {
            this.trigger('alert', render(template.html(), response), {title: 'Table {name}', name: response.name});

        } else if (name === 'view-properties' && template.is('[type=text/html]')) {
            this.trigger('alert', render(template.html(), response), {
                title: 'View {name}',
                name: response.table_name
            });

        } else if (name === 'procedure-properties' && template.is('[type=text/html]')) {
            this.trigger('alert', render(template.html(), response), {
                title: 'Procedure {name}',
                name: response.routine_name
            });

        } else if (name === 'function-properties' && template.is('[type=text/html]')) {
            this.trigger('alert', render(template.html(), response), {
                title: 'Function {name}',
                name: response.routine_name
            });

        } else if (name === 'trigger-properties' && template.is('[type=text/html]')) {
            this.trigger('alert', render(template.html(), response), {
                title: 'Trigger {name}',
                name: response.trigger_name
            });
        }

    };

    /**
     * Drop items
     *
     * @param {String} drop
     * @param {Array} items
     * @param {String} from
     * @return {jqXHR}
     */
    Explorer.prototype.drop = function (drop, items, from) {
        //
        var action = {drop: drop},
            message = 'Drop ',
            data = {},
            text = {
                databases: ['database', 'databases'],
                users: ['user', 'users'],
                tables: ['table', 'tables'],
                views: ['view', 'views'],
                routines: ['routine', 'stored routines'],
                triggers: ['trigger', 'triggers']
            },
            dropItemsCount = 0,
            dropItemName = null;

        if (from) {
            action.from = from;
        }

        data[drop] = items;

        if ($.isPlainObject(items)) {
            data = items;

        } else {
            data[drop] = items;
        }

        if ($.isArray(items)) {
            dropItemsCount = items.length;
            dropItemName = items[0];

        } else if ($.isPlainObject(items)) {
            $.each(items, function (i, item) {
                if ($.isArray(item)) {
                    dropItemsCount += item.length;
                    dropItemName = item[0];
                } else {
                    dropItemsCount++;
                    dropItemName = item;
                }

            });
        }

        if (dropItemsCount === 1) {
            message += text[drop][0] + ' ' + dropItemName;

        } else if (text[drop]) {
            message += dropItemsCount + ' ' + text[drop][1];
        }

        message += '?';

        if (confirm(message)) {
            return this._request.send({
                action: action,
                data: data,
                success: this._dropCallback.bind(this, drop),
                error: (function (response) {
                    this._dropCallback(drop, response.dropped || null);
                } ).bind(this)
            });
        }
    };

    /**
     * Response for drop request
     *
     * @param {Object} response
     */
    Explorer.prototype._dropCallback = function (entity, response) {
        //
        this._grid.deselectAll();

        if (response) {
            this._grid.remove(response);
        }

        this._request.cache.flush(this._cacheKey);
    };

    /**
     * Kill processes
     *
     * @param {Array} pids
     * @return jqXHR
     */
    Explorer.prototype.kill = function (pids) {
        //
        var message;

        if (pids.length === 1) {
            message = 'Kill ' + pids;
        } else {
            message = 'Kill ' + pids.length + ' processes';
        }

        if (confirm(message + '?')) {
            return this._request.send({
                action: 'kill',
                data: {processes: pids},
                success: this._grid.remove.bind(this._grid),
                context: this
            });
        }
    };

    /**
     * Truncate tables from a database
     *
     * @param {Array} tables List of tables for truncate
     * @param {String} from Database
     * @return jqXHR|undefined
     */
    Explorer.prototype.truncate = function (tables, from) {
        //
        var message;

        if (tables.length === 1) {
            message = 'Truncate table `' + tables + '`?';

        } else {
            message = 'Truncate ' + tables.length + ' tables?';
        }

        if (!confirm(message)) {
            return;
        }

        return this._request.send({
            action: 'truncate',
            data: {tables: tables, from: from},
            success: this._truncateCallback.bind(this)
        });
    };

    /**
     * Callback on truncate table request
     *
     * @param {Object} response
     */
    Explorer.prototype._truncateCallback = function (response) {
        this._grid.deselectAll()
            .getRowsByName(response).find('.grid2-body-column._column-rows').text(0);

        this._request.cache.flush(this._cacheKey);
    };

    return Explorer;

});

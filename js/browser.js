define(['window', 'grid2', 'editor'], function (Frame, Grid2, Editor) {

    /**
     * @class Data browser
     * @extends Window
     *
     * @param {jQuery|String} element
     * @param {Request} request
     */
    function Browser(element, request) {

        Frame.prototype.constructor.call(this, element, {header: 'Browse', closable: true, maximized: true});

        /**
         * Options
         *
         * @type {Object}
         */
        this._options = {limit: 50, editor: {height: 100}};

        /**
         * Client
         *
         * @type {Request}
         */
        this._request = request;

        /**
         * Last request
         *
         * @type {jqXHR}
         */
        this._lastRequest = null;

        /**
         * Last request params
         *
         * @type {Object}
         */
        this._lastQuery = {
            browse: null,
            from: null,
            limit: 30,
            offset: 0
        };

        /**
         * @type {Grid2}
         */
        this._grid = new Grid2(this.find('.grid2'));

        /**
         * @type {Editor}
         */
        this._editor = new Editor(this.find('textarea[name=browser]'));

        /**
         * @type {Number}
         */
        this.total = null;

        /**
         * Mode (browse or sql)
         * @type {String}
         */
        this.mode = null;

        //

        this._grid.on('change', this._updateStatus.bind(this));

        $(window).on('resize', {that: this}, this.stretch);

        this._grid.on('scrollBottom', (function () {
            //
            if (this._grid.count < this.total && this._lastRequest.state() == 'resolved') {
                this._browseNextRowsRequest();
            }
        }).bind(this));
    }

    Browser.prototype = Object.create(Frame.prototype);
    Browser.prototype.constructor = Browser;

    /**
     * Show data browser
     *
     * @param {Object} options
     * @retrun {Browser}
     */
    Browser.prototype.show = function () {
        Frame.prototype.show.apply(this, arguments);
        this.stretch();

        return this;
    };

    /**
     * Reset browser state
     *
     * @return {Browser}
     */
    Browser.prototype._reset = function () {
        this._lastQuery = {};
        this._grid.clear();
        this.total = null;

        return this;
    };

    /**
     * Stretch grid to window height
     *
     * @param {Event} event
     */
    Browser.prototype.stretch = function (event) {

        var that = event && event.data.that || this,
            height = 0;

        if (that.is(':visible')) {
            if (that._grid.is(':visible')) {
                if (that._editor.is(':visible')) {
                    that.find('.sql').height(that._options.editor.height);
                    that._editor.setHeight(that._options.editor.height);
                }
                height = $('#applications').height() - that.find('.grid2-body').position().top - that._status.height() - 24;
                that._grid.setHeight(height);

            } else {
                height = $('#applications').height() - that.find('.sql').position().top - that._status.height() - 19;
                that.find('.sql').height(height);
                that._editor.setHeight(height);
            }
        }
    };

    /**
     * Show SQL editor
     *
     * @return {Browser}
     */
    Browser.prototype.showEditor = function () {

        this.find('.sql').show();
        this.stretch();

        return this;
    };

    /**
     * Hide SQL editor
     *
     * @return {Browser}
     */
    Browser.prototype.hideEditor = function () {

        this.find('.sql').hide();
        this.stretch();

        return this;
    };

    /**
     * Toggle editor
     *
     * @return {Browser}
     */
    Browser.prototype.toggleEditor = function () {

        this.find('.sql').toggle();
        this.stretch();

        return this;
    };

    /**
     * Browse a table
     *
     * @param {Object} params
     * @return {jqXHR}
     */
    Browser.prototype.browse = function (params) {

        this._reset();

        this._grid.show();
        this.find('.sql').hide();

        this.show({
            header: {title: 'Browse', name: null, from: null},
            menu: {
                'SQL': {
                    click: (function () {
                        this.toggleEditor();
                        return false;
                    }).bind(this)
                }
            }
        }, params);

        this.mode = 'browse';

        return this._browseRequest(params);
    };

    /**
     * Request data
     *
     * @param {Object} params
     * @return {jqXHR}
     */
    Browser.prototype._browseRequest = function (params) {

        var query = $.extend({}, params);

        if (query.limit === undefined) {
            query.limit = this._options.limit;
        }
        if (query.offset === undefined) {
            query.offset = 0;
        }

        this._lastRequest = this._request.send($.extend({},
            {
                action: query,
                context: this,
                success: function (response) {
                    this._browseCallback(response, query);
                }
            },
            this._settings
        ));

        this._editor.edit('SELECT * FROM `' + query.browse + '`;');

        $.when(this._lastRequest).then((function () {
            if (!this._grid.vertScrollEnabled() && this._grid.count < this.total && this._lastRequest.state() == 'resolved') {
                this.requestNextRows();
            }
        }).bind(this));

        return this._lastRequest;
    };

    /**
     * Response callback
     *
     * @param {Object} response
     * @param {Object} query
     */
    Browser.prototype._browseCallback = function (response, query) {

        var params = {columns: [], head: {}};

        this._lastQuery = query;
        this.total = response.total;

        $.each(response.columns, function (i, column) {
            params.columns.push(column[0]);
        });

        if (this._grid.prepared === false) {
            this._grid.prepare(params);
        }

        this._grid.disableSelectRows().fill(response.data);

        this.ready()._updateStatus();
    };

    /**
     * Browse next rows
     *
     * @return {jqXHR}
     */
    Browser.prototype._browseNextRowsRequest = function () {

        var query = this._lastQuery;

        query.offset = query.offset + query.limit;

        return this._browseRequest(query);
    };

    /**
     * Show the Browser in 'Run SQL' mode
     *
     * @param {Object} params
     * @return {jqXHR}
     */
    Browser.prototype.sql = function (params) {

        this._reset().showEditor();
        this._grid.hide();

        if (params.db) {
            this.show({header: {title: 'Run SQL query on', name: params.db}});
        } else {
            this.show({header: {title: 'Run SQL query'}});
        }

        this.mode = 'sql';
        this.ready();

        return this;
    };

    /**
     * Change status bar text
     *
     * @param {Object} response
     * @return {jqXHR}
     */
    Browser.prototype._updateStatus = function () {

        var status = '';

        if (this._grid.count) {
            if (this._grid.count < this.total) {
                status = this._grid.count + (this._grid.count == 1 ? ' row' : ' rows') + ' from ' + this.total;
            } else {
                status = this._grid.count + (this._grid.count == 1 ? ' row' : ' rows');
            }
        }

        this._status.text(status);

        return this;
    };

    return Browser;

});

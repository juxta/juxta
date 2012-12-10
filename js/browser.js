/**
 * @class Data browser
 * @extends Juxta.Application
 * @param {jQuery|String} element
 * @param {Juxta.Request} request
 */
Juxta.Browser = function(element, request) {

	var that = this;

	Juxta.Application.prototype.constructor.call(this, element, {header: 'Browse', closable: true, maximized: true});

	/**
	 * Options
	 * @type {Object}
	 */
	this.options = {
		limit: 50,
		sqlEditorHeight: 100
	}


	/**
	 * Client
	 * @type {Juxta.Request}
	 */
	this.request = request;


	/**
	 * Last request
	 * @type {jqXHR}
	 */
	this._lastRequest = null;


	/**
	 * @type {Number}
	 */
	this.total;


	/**
	 * Last request params
	 * @type {Object}
	 */
	this._lastQuery = {
		browse: null,
		from: null,
		limit: 30,
		offset: 0
	}


	/**
	 * @type {Juxta.TreeGrid}
	 */
	this.grid = new Juxta.Grid2(this.find('.grid2'));


	/**
	 * Juxta.SqlEditor
	 * @type {Juxta.SqlEditor}
	 */
	this._editor = new Juxta.SqlEditor(this.find('textarea[name=browser]'));


	/**
	 * Mode (browse or sql)
	 * @type {String}
	 */
	this.mode = null;


	$(this.grid).bind('change', function () {
		that.updateStatus();
	});

	$(window).bind('resize', {that: this}, this.stretch);

	$(this.grid).bind('scrollBottom', function() {
		//
		if (that.grid.count < that.total && that._lastRequest.state() == 'resolved') {
			that.requestNextRows();
		}
	});

}

Juxta.Lib.extend(Juxta.Browser, Juxta.Application);

/**
 * Show explorer
 * @param {Object} options
 * @retrun {Juxta.Browser}
 */
Juxta.Browser.prototype.show = function(options) {
	Juxta.Application.prototype.show.apply(this, arguments);
	this.stretch();

	return this;
}


/**
 * Reset browser state
 * @return {Juxta.Browser}
 */
Juxta.Browser.prototype._reset = function () {
	this._lastQuery = null;
	this._lastQuery = {};
	this.total = null;
	this.grid.clear();

	return this;
}


/**
 * Stretch grid to window height
 * @param {Event} event
 */
Juxta.Browser.prototype.stretch = function(event) {
	//
	var that = event && event.data.that || this,
		height = 0;

	if (that.is(':visible')) {
		if (that.grid.is(':visible')) {
			if (that._editor.is(':visible')) {
				that.find('.sql').height(that.options.sqlEditorHeight);
				that._editor.setHeight(that.options.sqlEditorHeight);
			}
			height = $('#applications').height() - that.find('.grid2-body').position().top - that._statusBar.height() - 24;
			that.grid.setHeight(height);

		} else {
			height = $('#applications').height() - that.find('.sql').position().top - that._statusBar.height() - 19;
			that.find('.sql').height(height);
			that._editor.setHeight(height);
		}
	}
}


/**
 * Show SQL editor
 * @return {Juxta.Browser}
 */
Juxta.Browser.prototype.showEditor = function() {
	this.find('.sql').show();
	this.stretch();

	return this;
}


/**
 * Hide SQL editor
 * @return {Juxta.Browser}
 */
Juxta.Browser.prototype.hideEditor = function() {
	this.find('.sql').hide();
	this.stretch();

	return this;
}


/**
 * Toggle editor
 * @return {Juxta.Browser}
 * @private
 */
Juxta.Browser.prototype.toggleEditor = function() {
	this.find('.sql').toggle();
	this.stretch();

	return this;
}


/**
 * Browse a table
 * @param {Object} params
 * @return {jqXHR}
 */
Juxta.Browser.prototype.browse = function(params) {
	//
	this._reset();

	this.grid.show();
	this.find('.sql').hide();

	var that = this;

	this.show({
		header: {title: 'Browse', name: params.browse, from: params.from},
		menu: {'SQL': {click: function() { that.toggleEditor(); return false; }}}
	});

	this.mode = 'browse';

	return this.requestBrowse(params);
}


/**
 * Request next rows
 * @return {jqXHR}
 */
Juxta.Browser.prototype.requestNextRows = function() {
	//
	var query = this._lastQuery;
	query.offset = query.offset + query.limit;

	return this.requestBrowse(query);
}


/**
 * Request data
 * @param {Object} params
 * @return {jqXHR}
 */
Juxta.Browser.prototype.requestBrowse = function(params) {
	var query = $.extend({}, params),
		options = {};

	var that= this;

	if (query.limit == undefined) {
		query.limit = this.options.limit;
	}
	if (query.offset === undefined) {
		query.offset = 0;
	}

	this._lastRequest = this.request.send($.extend(
		{},
		{
			action: query,
			context: this,
			success: function(response) {
				that.responseBrowse(response, query);
			}
		},
		this._settings,
		options
	));

	this._editor.edit('SELECT * FROM `' + query.browse + '`;');

	$.when(this._lastRequest).then(function() {
		if (!that.grid.vertScrollEnabled() && that.grid.count < that.total && that._lastRequest.state() == 'resolved') {
			that.requestNextRows();
		}
	});

	return this._lastRequest;
}


/**
 * Response
 * @param {Object} response
 */
Juxta.Browser.prototype.responseBrowse = function(response, query) {
	//
	var that = this;

	this._lastQuery = query;
	this.total = response.total;

	var params = {
		columns: [],
		contextMenu: [
			{title: 'Delete', action: function() { console.log('Drop'); }},
			{title: 'Edit', action: function() { console.log('Edit');  }}
		],
		head: {}
	};

	$.each(response.columns, function(i, column) {
		params.columns.push(column[0]);
	});

	if (this.grid.prepared === false) {
		this.grid.prepare(params);
	}

	this.grid.fill(response.data);
	this.ready().updateStatus();
}


/**
 * Show the Browser in 'Run SQL' mode
 * @param {Object} params
 * @return {jqXHR}
 */
Juxta.Browser.prototype.sql = function(params) {
	//
	this._reset().showEditor();
	this.grid.hide();

	if (params.db) {
		this.show({header: {title: 'Run SQL query on', name: params.db}});
	} else {
		this.show({header: {title: 'Run SQL query'}});
	}

	this.mode = 'sql';
	this.ready();

	return this;
}


/**
 * Change status bar text
 * @param {Object} response
 * @return {jqXHR}
 */
Juxta.Browser.prototype.updateStatus = function() {
	var status = '';
	if (this.grid.count) {
		if (this.grid.count < this.total) {
			status = this.grid.count + (this.grid.count == 1 ? ' row' : ' rows') + ' from ' + this.total;
		} else {
			status = this.grid.count + (this.grid.count == 1 ? ' row' : ' rows');
		}
	}

	this._statusBar.text(status);

	return this;
}
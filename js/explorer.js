/*global window */

/**
 * @class Juxta.Explorer
 * @extends {Juxta.Application}
 * @param {jQuery|String} element
 * @param {Juxta.Request} request
 */
Juxta.Explorer = function(element, request) {

	Juxta.Application.prototype.constructor.call(this, element, {cache: 3600});

	/**
	 * @type {Juxta.Request}
	 */
	this._request = request;


	/**
	 * @type {Juxta.Grid2}
	 */
	this._grid = new Juxta.Grid2(this.find('.grid2'));


	/**
	 * @type {String}
	 */
	this._cacheKey = null;


	/**
	 * @type {String}
	 */
	this._preparedFor = null;


	// Stretch grid by height
	$(window).on('resize', this._stretch.bind(this));


	//
	this._grid.on('context', (function(event, name) {
		if (event === 'database-properties') {
			this._request.send({action: {show: 'properties', database: name}, success: this._showPropertiesCallback.bind(this, event)});

		} else if (event === 'drop-database') {
			this.drop('databases', [name]);
		}

	}).bind(this));

	// Update status bar text
	this._grid.on('change', (function() {
		//
		var status = '';

		if (this._grid.count > 0) {
			status += this._grid.count + ' items';
		}

		this._status.html(status);

	}).bind(this));

};

Juxta.Lib.extend(Juxta.Explorer, Juxta.Application);


/**
 * Show explorer
 *
 * @param {Object} options
 */
Juxta.Explorer.prototype.show = function() {
	//
	Juxta.Application.prototype.show.apply(this, arguments);
	this._stretch();

	return this;
};


/**
 * Stretch grid to window height
 */
Juxta.Explorer.prototype._stretch = function() {
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
Juxta.Explorer.prototype._prepare = function(template) {
	//
	if (template === this._preparedFor) {
		return true;

	} else if (this._grid.prepare(this._gridParams[template])) {
		this._preparedFor = template;
		return true;

	} else {
		return false;
	}
};


/**
 * Explore
 *
 * @param {Object} params
 */
Juxta.Explorer.prototype.explore = function(params) {
	return this._exploreRequest(params);
};


/**
 * Request for explore
 *
 * @param {Object} params
 * @return {jqXHR}
 * @protected
 */
Juxta.Explorer.prototype._exploreRequest = function(params) {
	//
	if (this._explorerShowParams[params.show].header.from === null) {
		this._explorerShowParams[params.show].header.from = params.from;
	}

	this.show(this._explorerShowParams[params.show], params);

	if (params.show === 'processlist') {
		params = $.extend({cache: Infinity, index: {name: 'processId', field: 0, path: ['data']}, refresh: true}, params);
	}

	// Move options values from query to options variable
	var query = $.extend({}, params),
		options = {};

	$.each(['cache', 'index', 'refresh'], function(index, value) {
		delete query[value];
		if (params[value] !== undefined) {
			options[value] = params[value];
		}
	});

	// Store key cache for last request
	this._cacheKey = this._request.queryString(query);

	if (this._prepare(query.show)) {
		return this._request.send($.extend(
			{},
			{action: query, context: this, success: function(response) { return this._exploreCallback(response, query); } },
			this._settings,
			options
		));
	}
};


/**
 * Response for explore requests
 *
 * @param {Object} response
 * @param {Object} request
 * @return {Juxta.Explorer}
 * @protected
 */
Juxta.Explorer.prototype._exploreCallback = function(response, request) {
	//
	if (response.contents !== this._preparedFor) {
		return this;
	}

	this._grid.fill(response.data, this._gridParams[response.contents], request);

	return this.ready();
};


/**
 * @type {Object}
 * @protected
 */
Juxta.Explorer.prototype._explorerShowParams = {
	databases: {
		header: 'Databases',
		menu: {'Create Database': function() { this._createDatabase.show(); return false; }}
	},
	tables: {
		header: {title: 'Tables', from: null},
		menu: {'Create Table': null}
	}
};


/**
 * @type {Object}
 * @protected
 */
Juxta.Explorer.prototype._gridParams = {
	databases: {
		columns: ['Database'],
		row: '<tr><td><a href="#/{cid}/{database}/tables">{database}</a></td></tr>',
		contextMenu: {
			'tables': {title: 'Tables', href: '#/{cid}/{name}/tables'},
			'drop-database': 'Drop',
			'database-properties': 'Properties'
		}
	},
	tables: {
		columns: ['Table', 'Engine', 'Rows', 'Size'],
		row: '<tr><td><a href="#/{cid}/{from}/{table}/browse">{table}</a></td><td>{engine}</td><td>{rows|number}</td><td>{size|size}</td><td></td></tr>',
		contextMenu: {
			browse: {title: 'Browse', href: '#/{cid}/{from}/{name}/browse'},
			columns: {title: 'Columns & Indexes', href: '#/{cid}/{from}/{name}/columns'},
			drop: 'Drop',
			properties: 'Properties'}
	}
};


/**
 * Response for getting database properties request
 *
 * @param {Object} response
 * @protected
 */
Juxta.Explorer.prototype._showPropertiesCallback = function(templateName, response) {
	//
	var template = $('#' + templateName);

	if (templateName === 'database-properties' && template.is('[type=text/html]')) {
		this.trigger('alert', $.template(template.html(), response.properties), {title: 'Database {name}', name: response.properties.name});
	}

};


/**
 * Drop items
 *
 * @param {String} drop
 * @param {Array} items
 * @return {jqXHR}
 */
Juxta.Explorer.prototype.drop = function(drop, items) {
	//
	var message = 'Drop ';

	if (drop === 'databases') {
		if (items.length > 1) {
			message += items.length + ' databases';
		} else {
			message += 'database ';
			message += items[0];
		}

		message += '?';
	}

	if (confirm(message)) {
		return this._request.send({
			action: {drop: drop},
			data: {database: items},
			success: this._dropCallback.bind(this, 'database'),
			error: this._dropCallback.bind(this, 'database')
		});
	}
};


/**
 * Response for drop request
 *
 * @param {Object} response
 * @protected
 */
Juxta.Explorer.prototype._dropCallback = function(entity, response) {
	//
	//this._grid.deselect();

	this._grid.remove(response.dropped);

	// Flush last cached response
	this._request.cache.flush(this._cacheKey);
};
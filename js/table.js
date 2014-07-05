/*global window */
/*jshint camelcase: false */

/**
 * @class Table editor
 * @extends {Juxta.Window}
 *
 * @param {jQuery} element
 */
Juxta.Table = function(element, request) {

	Juxta.Window.prototype.constructor.call(this, element, {closable: false, mazimized: false, menu: {'Browse Table': null}, cache: 3600});

	/**
	 * @type {Juxta.Request}
	 */
	this._request = request;


	/**
	 * @type {Juxta.Grid2}
	 */
	this._columns = new Juxta.Grid2(this.find('.grid2'));


	$(window).on('resize', this._stretch.bind(this));

};

Juxta.Lib.extend(Juxta.Table, Juxta.Window);


/**
 * Show editor
 *
 * @param {Object} options
 * @return {Juxta.Table}
 */
Juxta.Table.prototype.show = function() {

	Juxta.Window.prototype.show.apply(this, arguments);

	this._stretch();

	return this;
};


/**
 * Stretch grid to window height
 */
Juxta.Table.prototype._stretch = function() {
	//
	var height = 0;

	if (this.is(':visible')) {
		height = this._applicationsContainer.height();
		height -= this.find('.grid2-body').position().top + this._status.outerHeight(true); // minus padding from top, minus status bar height
		height -= this.find('.grid2-body').outerHeight() - this.find('.grid2-body').height(); // minus grid body padding + border

		this._columns.setHeight(height);
	}
};


/**
 * Show editor
 *
 * @param {Object} params
 * @return {jqXHR}
 */
Juxta.Table.prototype.edit = function(params)
{
	this.show(
		{
			header: {title: 'Table ', name: params.table},
			menu: {'Browse': {href: '#/{cid}/{from}/{table}/browse'}},
			menuRight: this._rightMenuOptions[params.edit]
		},
		params
	);

	if (params.edit === 'columns') {
		return this._requestShowTable(params);

	} else if (params.edit === 'indexes') {
		return this._requestIndexes(params);

	} else if (params.edit === 'foreign') {
		return this._requestShowForeign(params);

	}
};


/**
 * Request data
 *
 * @param {Object} params
 * @return {jqXHR}
 */
Juxta.Table.prototype._requestShowTable = function(params) {
	//
	var query = {cid: params.cid, show: 'table', table: params.table, from: params.from},
		options = {};

	function row(column)
	{
		var row = [];

		row.push(column.column_name);
		row.push(column.column_type.toUpperCase().replace('(', ' ('));

		// IS NULL
		row.push('<input type=checkbox disabled ' + (column.column_is_null === 'YES' ? 'checked' : '') + '>');

		// attributes
		if (Array.isArray(column.column_attributes)) {
			row.push(column.column_attributes.join(', ').toUpperCase());
		} else {
			row.push('');
		}

		// default
		if (column.column_default === null && column.column_is_null === 'YES') {
			row.push('<span class="badge _null">NULL</span>');

		} else if (column.column_default !== null) {
			row.push(column.column_default.toUpperCase());

		} else {
			row.push('');
		}

		// options
		if (Array.isArray(column.column_options)) {
			for (var option in column.column_options) {
				if (column.column_options[option] ===  'primary') {
					column.column_options[option] = '<span class="badge">' + column.column_options[option] + '</span>';

				} else if (column.column_options[option] ===  'auto_increment') {
					column.column_options[option] = '<span class="badge">' + column.column_options[option] + '</span>';

				} else {
					column.column_options[option] = column.column_options[option].toUpperCase();
				}
			}

			row.push(column.column_options.join(''));

		} else {
			row.push('');
		}

		return '<tr><td>' + row.join('</td><td>') + '</td></tr>';
	}

	this._columns.prepare({
		columns: {
			'column_name': 'Column',
			'column_type': 'Type',
			'column_is_null': {title: 'NULL', 'hint': 'Allow NULL'},
			'column_attributes': 'Attributes',
			'column_default': 'Default',
			'column_options': 'Options'
		},
		row: row,
		actions: null
	});

	return this._request.send(
		$.extend({}, {action: query, success: this._responseShowTable.bind(this)}, this._settings, options)
	);
};

/**
 *
 * @param response
 * @private
 */
Juxta.Table.prototype._responseShowTable = function(response) {
	//
	this._columns.disableSelectRows().fill(response.columns);
	this.ready();
};

/**
 * Request for table indices
 *
 * @param params
 * @return {jqXHR}
 */
Juxta.Table.prototype._requestIndexes = function(params)
{
	var request;

	this._columns.prepare({
		columns: {
			'index_name': 'Name',
			'index_type': 'Type',
			'index_unique': 'Unique',
			'index_columns': 'Columns'
		},
		row: '<tr><td>{index_name}</td><td>{index_type}</td><td>{index_unique|bool:YES:NO}</td><td>{index_columns}</td></tr>',
		actions: null
	});

	request = {
		action: {cid: params.cid, show: 'indexes', table: params.table, from: params.from},
		context: this,
		success: (function(response) { this._columns.disableSelectRows().fill(response); this.ready(); }).bind(this)
	};

	return this._request.send($.extend({}, request, this._settings));
};

/**
 * Request for table foreign keys
 *
 * @param params
 * @return {jqXHR}
 */
Juxta.Table.prototype._requestShowForeign = function(params)
{
	var request;

	this._columns.prepare({
		columns: ['Name', 'Column', 'Reference', 'Update', 'Delete'],
		row: '<tr><td>{name}</td><td>{column}</td><td>{reference}</td><td>{update}</td><td>{delete}</td></tr>',
		actions: null
	});

	request = {
		action: {cid: params.cid, show: 'foreign', table: params.table, from: params.from},
		context: this,
		success: (function(response) { this._columns.disableSelectRows().fill(response); this.ready(); }).bind(this)
	};

	return this._request.send($.extend({}, request, this._settings));
};

/**
 * Right menu options
 *
 * @type {Object}
 */
Juxta.Table.prototype._rightMenuOptions = {
	columns: {
		'Columns': null,
		'Indexes': '#/{cid}/{from}/{table}/indexes',
		'Foreign Keys': '#/{cid}/{from}/{table}/foreign'
	},
	indexes: {
		'Columns': '#/{cid}/{from}/{table}/columns',
		'Indexes': null,
		'Foreign Keys': '#/{cid}/{from}/{table}/foreign'
	},
	foreign: {
		'Columns': '#/{cid}/{from}/{table}/columns',
		'Indexes': '#/{cid}/{from}/{table}/indexes',
		'Foreign Keys': null
	}
};

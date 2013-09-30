/*global window */
/*jshint camelcase: false */

/**
 * @class Table editor
 * @extends {Juxta.Application}
 * @param {jQuery} element
 */
Juxta.Table = function(element, request) {

	Juxta.Application.prototype.constructor.call(this, element, {closable: false, mazimized: false, menu: {'Browse Table': null}});

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

Juxta.Lib.extend(Juxta.Table, Juxta.Application);


/**
 * Show editor
 *
 * @param {Object} options
 * @return {Juxta.TableEditor}
 */
Juxta.Table.prototype.show = function() {
	Juxta.Application.prototype.show.apply(this, arguments);
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
 * Show table editor
 *
 * @param {Object} params
 * @return {jqXHR}
 */
Juxta.Table.prototype.edit = function(params) {
	this.show({
		header: {title: 'Table ', name: params.table},
		menu: {'Browse Table': {href: '#/' + params.cid + '/' + params.from + '/' + params.table + '/browse'}}
	});

	return this._requestShowTable(params);
};


/**
 * Request data
 *
 * @param {Object} params
 * @return {jqXHR}
 */
Juxta.Table.prototype._requestShowTable = function(params) {
	//
	var that = this,
		query = {cid: params.cid, show: 'table', table: params.table, from: params.from},
		options = {};

	var row = function(column) {

		var template = '';

		template += '<tr><td>' + column.name + '</td>';
		template += '<td>' + column.type + '</td>';

		// IS NULL
		template += '<td><input type=checkbox disabled ' + (column.is_null === 'YES' ? 'checked' : '') + '></td>';

		// attributes
		template += '<td>';
		if ($.isArray(column.attributes)) {
			$.each(column.attributes, function(i, attribute) {
				template += '<span class="badge badge-hidden y">' + attribute + '</span>';
			});
		}
		template += '</td>';

		// default
		template += '<td>';
		if (column['default'] === null && column.is_null === 'YES') {
			template += '<span class="badge badge-null">NULL</span>';
		} else if (column['default'] === 'CURRENT_TIMESTAMP') {
			template += '<span class="badge badge-current-timestamp">CURRENT_TIMESTAMP</span>';
		} else if (column['default'] !== null) {
			template += column['default'];
		}
		template += '</td>';

		// options
		template += '<td>';
		if ($.isArray(column.options)) {
			$.each(column.options, function(i, option) {
				template += '<span class="badge badge-hidden y">' + option + '</span>';
			});
		}
		template += '</td>';

		return template;
	};

	this._columns.prepare({
		columns: [{name: 'name', title: 'Column'}, 'Type', {name: 'is_null', title: 'NULL', 'hint': 'Allow NULL'}, 'Attributes', 'Default', 'Options'],
		row: row,
		actions: null
	});

	return this._request.send($.extend({},
		{
			action: query,
			context: this,
			success: function(response) {
				that._responseShowTable(response, query);
			}
		},
		this._settings,
		options
	));
};


Juxta.Table.prototype._responseShowTable = function(response) {
	//
	this._columns.disableSelectRows().fill(response.columns);
	this.ready();
};
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


	$(window).bind('resize', {that: this}, this.stretch);
}

Juxta.Lib.extend(Juxta.Table, Juxta.Application);

/**
 * Show editor
 * @param {Object} options
 * @return {Juxta.TableEditor}
 */
Juxta.Table.prototype.show = function(options) {
	Juxta.Application.prototype.show.apply(this, arguments);
	this.stretch();

	return this;
}


/**
 * Stretch a grid
 * @param {Event} event
 */
Juxta.Table.prototype.stretch = function(event) {
	var that = event && event.data.that || this;
	if (that.is(':visible')) {
		that._columns.setHeight($('#applications').height() - that.find('.grid2-body').position().top - that._status.height() - 24);
	}
}


/**
 * Show table editor
 * @param {Object} params
 * @return {jqXHR}
 */
Juxta.Table.prototype.edit = function(params) {
	this.show({
		header: {title: 'Table ', name: params.table},
		menu: {'Browse Table': {href: '#' + params.from + '/' + params.table + '/browse'}}
	});

	return this._requestShowTable(params);
}


/**
 * Request data
 * @param {Object} params
 * @return {jqXHR}
 */
Juxta.Table.prototype._requestShowTable = function(params) {
	//
	var that = this,
		query = {show: 'table', table: params.table, from: params.from},
		options = {};

	var row = function(column) {
		var template = '';

		template += '<tr class="grid2-body-row"><td class="grid2-body-column checkbox"><input type="checkbox"></td>';
		template += '<td class="grid2-body-column first-column column"><div>' + column.name + '</div></td>';
		template += '<td class="grid2-body-column type"><div>' + column.type + '</div></td>';

		// IS NULL
		template += '<td class="grid2-body-column null"><div><input type=checkbox disabled ' + (column.is_null === 'YES' ? 'checked' : '') + '></div></td>';

		// attributes
		template += '<td class="grid2-body-column attributes"><div>';
		if ($.isArray(column.attributes)) {
			$.each(column.attributes, function(i, attribute) {
				template += '<span class="badge badge-hidden y">' + attribute + '</span>';
			});
		}
		template += '</div></td>';

		// default
		template += '<td class="grid2-body-column default"><div>';
		if (column.default === null && column.is_null === 'YES') {
			template += '<span class="badge badge-null">NULL</span>';
		} else if (column.default === 'CURRENT_TIMESTAMP') {
			template += '<span class="badge badge-current-timestamp">CURRENT_TIMESTAMP</span>';
		} else if (column.default !== null) {
			template += column.default;
		}
		template += '</div></td>';

		// options
		template += '<td class="grid2-body-column options"><div>';
		if ($.isArray(column.options)) {
			$.each(column.options, function(i, option) {
				template += '<span class="badge badge-hidden y">' + option + '</span>';
			});
		}

		return template;
	}

	this._columns.prepare({
		columns: [{name: 'name', title: 'Column'}, 'Type', {name: 'is_null', title: 'NULL', 'hint': 'Allow NULL'}, 'Attributes', 'Default', 'Options'],
		row: row,
		actions: null
	});

	return this._request.send($.extend(
		{},
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
}



Juxta.Table.prototype._responseShowTable = function(response, query) {
	//
	this._columns.fill(response.columns);
	this.ready();
}

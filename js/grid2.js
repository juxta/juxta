/**
 * @class Grid 2
 */
Juxta.Grid2 = function(grid) {

	/**
	 * @type {jQuery}
	 */
	this._container = $(grid);


	/**
	 * Group actions panel
	 *
	 * @type {jQuery}
	 */
	this._actions = this._container.find('.grid2-actions');


	/**
	 * @type {jQuery}
	 */
	this._head = this._container.find('.grid2-head thead');


	/**
	 * @type {jQuery}
	 */
	this._bodyContainer = this._container.find('.grid2-body');


	/**
	 * Grid body
	 *
	 * @type {jQuery}
	 */
	this._body = this._bodyContainer.find('tbody');


	/**
	 * @type {jQuery}
	 */
	this._emptyMessage = this._bodyContainer.find('.grid2-body-empty');


	/**
	 * @type {Juxta.Grid2.ContextMenu}
	 */
	this._contextMenu = new Juxta.Grid2.ContextMenu(this);


	/**
	 * @type {Array}
	 */
	this._columns = [];


	/**
	 * @type {String}
	 */
	this._rowTemplate = '';


	/**
	 * @type {Number}
	 */
	this.count = 0;


	/**
	 * @type {Number}
	 */
	this.selected = 0;


	/**
	 * @type {Boolean}
	 */
	this.prepared = null;


	/**
	 * @type {Object}
	 */
	this._context = {};


	// Select row
	this._bodyContainer.on('change', '.grid2-body-column:first-child input[type=checkbox]', (function(event) {
		//
		var checkbox = $(event.target),
			checked = Boolean(checkbox.prop('checked')),
			row = checkbox.closest('.grid2-body-row');

		row.toggleClass('_selected', Boolean(checked));

		this.selected = this._bodyContainer.find('.grid2-body-column:first-child input[type=checkbox]:checked').length;

		this.trigger('check', row, checkbox.attr('name'), checked)
			.trigger(checked ? 'select' : 'deselect', row, checkbox.attr('name'));

	}).bind(this));

	// Select all/none
	this._actions.on('change', '.grid2-actions-select_all-checkbox', (function(event) {
		this._bodyContainer.find('.grid2-body-column:first-child input[type=checkbox]')
			.prop('checked', $(event.target).prop('checked'))
			.trigger('change');
	}).bind(this));

	// Change 'Select all' checkbox state on row selection
	this.on('check', function() {
		this._actions.find('.grid2-actions-select_all-checkbox')
			.prop('checked', this.count === this.selected ? true : false)
			.prop('indeterminate', (this.count > this.selected && this.selected > 0) ? true : false);

		this._actions.find('.grid2-actions-button')
			.prop('disabled', this.selected === 0);
	});

	this.on('change', function() {
		this._actions
			.find('input').prop('disabled', this.count === 0)
			.not('.grid2-actions-select_all-checkbox').prop('disabled', this.count === 0 || this.selected === 0);
	});

	//
	this._actions.on('click', '.grid2-actions-button', (function(event) {
		//
		var button = $(event.target);

		if (button.attr('name') && !button.prop('disabled')) {
			this.trigger('action', button.attr('name'), this.getSelected(), this._context);
		}
	}).bind(this));

	//
	this._bodyContainer.on('scroll', (function(event) {
		//
		this._head.parent('table').css({marginLeft: -$(event.target).scrollLeft()});

		if (this._bodyContainer.scrollTop() < 10) {
			this.trigger('scrollTop');

		} else if (this._bodyContainer.scrollTop() > this._body.height()- this._bodyContainer.height() - 10) {
			this.trigger('scrollBottom');
		}
	}).bind(this));

	//
	this._contextMenu.on('click', (function(event, name, context) {
		this.trigger('context-menu-click', event, name, context);
	}).bind(this));

};

Juxta.Lib.extend(Juxta.Grid2, Juxta.Events);


/**
 * Set grid body height
 *
 * @param {Number} height
 * @return {Juxta.Grid2}
 */
Juxta.Grid2.prototype.setHeight = function(height) {
	//
	this._emptyMessage.css({top: height/2});
	this._bodyContainer.height(height);

	return this;
};


/**
 * Prepare a grid for data entry
 *
 * @param {Object} params
 * @param {Object} context
 * @return {Boolean}
 */
Juxta.Grid2.prototype.prepare = function(params, context) {
	//
	if (!params) {
		return false;
	}

	// Columns
	if (!params.columns) {
		throw new ReferenceError('Columns are not defined');
	}

	this.clear();

	this._context = context;

	//
	$.each(params.columns, (function (i, column) {
		//
		if (typeof column !== 'object') {
			column = {name: String(isNaN(i) ? i : column), title: String(column)};

		} else if (!column.name  && isNaN(i)) {
			column.name = String(i);

		} else if (!column.name && column.title) {
			column.name = String(column.title);
		}

		if (!column.title) {
			column.title = column.name;
		}

		column.name = column.name.toLowerCase().replace(/\s+/, '_');

		if (column.style && !$.isArray(column.style)) {
			column.style = new Array(column.style);
		}

		this._columns.push(column);

	}).bind(this));

	//
	if (params.row) {
		this._rowTemplate = params.row;

	} else {
		//
		this._rowTemplate = '<tr>';
		$.each(this._columns, (function(i, column) { this._rowTemplate += '<td>{' + column.name + '}</td>'; }).bind(this));
		this._rowTemplate += '</tr>';
	}

	// Empty grid header and body
	if (params.head) {
		this._head.empty().show().parent('table').css({marginLeft: 0});
	} else {
		this._head.empty().hide();
	}


	// Make grid header
	$.each(this._columns, (function(i, column) {
		//
		var th,
			styles = ['grid2-head-column', '_column-' + column.name.replace(/_/g, '-')];

		if (column.hidden) {
			return;
		}

		if (column.style) {
			styles = styles.concat(column.style);
		}

		th = $('<th>').addClass(styles.join(' ')).html(column.title);

		if (column.hint) {
			th.attr('title', column.hint);
		}

		this._head.append(th);
	}).bind(this));

	this._head.show();

	// Group actions
	if (params.actions && typeof params.actions === 'string') {
		//
		this._actions.html(params.action);

	} else if (params.actions && typeof params.actions === 'object') {
		//
		this._actions.empty()
			.append($('<label>').addClass('grid2-actions-select_all').text('Select all').prepend($('<input>').attr('type', 'checkbox').attr('name', 'select-all').addClass('grid2-actions-select_all-checkbox')));

		$.each(params.actions, (function(name, title) {
			this._actions
				.append($('<input>')
				.addClass('grid2-actions-button')
				.attr('type', 'button')
				.attr('name', name)
				.attr('disabled', true)
				.val(title));
		}).bind(this));

	} else {
		this._actions.empty();
	}

	return this.prepared = true;
};


/**
 * Fill grid data
 *
 * @param {Array} data
 * @param {Object} params
 * @param {Object} extra
 */
Juxta.Grid2.prototype.fill = function(data, params, extra) {
	//
	var valuesForTemplate,
		row,
		$row,
		$headRow,
		table = this._bodyContainer.find('table'),
		context = {},
		columns = [];

	if (extra && extra.cid !== undefined) {
		context.cid = extra.cid;
	}
	if (extra && extra.from) {
		context.from = extra.from;
	}

	// Filter visible columns
	$.each(this._columns, function(i, column) {
		if (!column.hidden) {
			columns.push(column);
		}
	});

	if (params) {
		//
		this.prepare(params, context);

		if (params.contextMenu) {
			this._contextMenu.load(params.contextMenu, this._context);
		}
	}

	if (data && data.length > 0) {
		//
		this.count = this.count + data.length;

		$.each(data, (function(i, value) {
			//
			valuesForTemplate = $.extend({}, context);

			$.each(this._columns, function(j, column) { valuesForTemplate[column.name] = value[j]; });

			if (typeof this._rowTemplate === 'function') {
				row = this._rowTemplate(valuesForTemplate);
			} else {
				row = $.template(this._rowTemplate, valuesForTemplate);
			}

			// Row for thead
			if (!$headRow) {
				//
				$headRow = $(row);
				$headRow.find('> td').addClass('grid2-head-column').empty();

				$.each($headRow.find('> td'), (function(i, td) {
					//
					if (columns[i]) {
						$(td).addClass('_column-' + columns[i].name.replace(/_/g, '-'));

						if (columns[i].style) {
							$(td).addClass(columns[i].style.join(' '));
						}
					}
				}).bind(this));

				if (table.find('thead').is('thead')) {
					table.find('thead').empty().append($headRow);
				} else {
					table.prepend($('<thead>').append($headRow));
				}
			}

			// Render body row
			$row = $(row);

			if (!$row.find('td:first-child [type=checkbox]').is(':input')) {
				$row.find('> td:first-child').prepend($('<input>').attr('type', 'checkbox'));
			}

			$row.find('td:first-child [type=checkbox]').attr('name', $row.find('td:first-child a').attr('name') ? $row.find('td:first-child a').attr('name') : $row.find('td:first-child a').text());

			$row.addClass('grid2-body-row')
				.find('> td').addClass('grid2-body-column');

			$.each($row.find('> td'), (function(i, td) {
				//
				if (columns[i]) {
					$(td).addClass('_column-' + columns[i].name.replace(/_/g, '-'));

					if (columns[i].style) {
						$(td).addClass(columns[i].style.join(' '));
					}
				}
			}).bind(this));

			this._body.append($row);

		}).bind(this));

	} else if (this.count === 0) {
		this._emptyMessage.css({top: this._bodyContainer.height()/2}).show();
	}

	this.trigger('change');
};


/**
 * Empty grid body
 *
 * @return {Juxta.Grid2}
 */
Juxta.Grid2.prototype.empty = function() {
	//
	this._body.empty();

	this.count = 0;
	this.selected = 0;

	this.trigger('change');

	return this;
};


/**
 *
 */
Juxta.Grid2.prototype.clear = function() {
	//
	this.empty();
	this._head.empty();
	this._contextMenu.clear();
	this._emptyMessage.hide();

	this._columns = [];
	this.prepared = false;
	this._context = {};

	return this;
};


/**
 *
 */
Juxta.Grid2.prototype.enableSelectRows = function() {
	//
	this._container.removeClass('_select-rows-disabled');

	return this;
};


/**
 *
 */
Juxta.Grid2.prototype.disableSelectRows = function() {
	//
	this._container.addClass('_select-rows-disabled');

	return this;
};


/**
 * @return {Boolean}
 */
Juxta.Grid2.prototype.vertScrollEnabled = function() {
	return this._bodyContainer.height() < this._body.height();
};


Juxta.Grid2.prototype.is = function() {
	return $.fn.is.apply(this._container, arguments);
};

Juxta.Grid2.prototype.show = function() {
	this._container.show();
};

Juxta.Grid2.prototype.hide = function() {
	this._container.hide();
};


/**
 * Remove rows by name
 *
 * @param {String|Array|Object} rows
 */
Juxta.Grid2.prototype.remove = function(rows) {
	//
	var checkboxes = this._bodyContainer
			.find('.grid2-body-column:first-child input[type=checkbox]');

	function removeRowByName(checkboxes, type, i, name) {
		checkboxes.filter((type ? '[item-type=' + type + ']' : '') + '[name=' + name + ']')
			.closest('.grid2-body-row').remove();
	}

	if (!$.isArray(rows) && !$.isPlainObject(rows)) {
		rows = [rows];
	}

	if ($.isArray(rows)) {
		$.each(rows, removeRowByName.bind(this, checkboxes, undefined));

	} else if ($.isPlainObject(rows)) {
		$.each(rows, (function (type, rows) {
			$.each(rows, removeRowByName.bind(this, checkboxes, type));
		}).bind(this));
	}

	this.trigger('change');

	return this;
};


/**
 * Return selected rows
 *
 * @ return {Array|Object}
 */
Juxta.Grid2.prototype.getSelected = function() {
	//
	var rows = [],
		rowsByType = {};

	$.each(this._body.find('.grid2-body-column:first-child input[type=checkbox]:checked'), function(i, checkbox) {
		//
		checkbox = $(checkbox);

		if (checkbox.attr('item-type')) {
			if (!rowsByType[checkbox.attr('item-type')]) {
				rowsByType[checkbox.attr('item-type')] = [];
			}

			rowsByType[checkbox.attr('item-type')].push(checkbox.attr('name'));

		} else if (checkbox.attr('name')) {
			rows.push(checkbox.attr('name'));
		}
	});

	if (!$.isEmptyObject(rowsByType)) {
		return rowsByType;
	}

	return rows;
};


/**
 * Deselects all rows
 *
 * @return {Juxta.Grid2}
 */
Juxta.Grid2.prototype.deselectAll = function() {
	//
	this._bodyContainer.find('.grid2-body-column:first-child input[type=checkbox]:checked')
		.prop('checked', false)
		.trigger('change');

	return this;
};


/**
 *
 * Return rows by name and type
 *
 * @param {Array|Object} names
 * @return jQuery
 */
Juxta.Grid2.prototype.getRowsByName = function(names)
{
	var checkboxes = this._bodyContainer.find('.grid2-body-column:first-child input[type=checkbox]'),
		filtered,
		rows = $(),
		type;

	for (i in names) {

		filtered = $();

		if (Array.isArray(names[i])) {
			type = i;
			for (j in names[i]) {
				filtered = filtered.add(checkboxes.filter('[name=' + names[type][j] + ']'));
			}

			filtered = filtered.filter('[item-type=' + type + ']');

		} else {
			filtered = checkboxes.filter('[name=' + names[i] + ']');
		}

		rows = rows.add(filtered);
	}

	return rows.closest('.grid2-body-row');
};
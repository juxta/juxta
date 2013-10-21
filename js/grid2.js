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
	 * Rows cache
	 *
	 * @type {Object}
	 */
	this._cache = {};


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


	// Trigger event with type equals action name
	this._actions.find('.grid2-actions-link, .grid2-actions-button').on('click', (function(event) {
		if ($(event.target).attr('name')) {
			this.trigger('actions/' + $(event.target).attr('name'));
		}
	}).bind(this));

	// Select all/nothing
	this.on('actions/all', function() {
		this.select();
	}).on('actions/nothing', function() {
		this.deselect();
	});

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

	// Hilight row on select
	this._bodyContainer.on('change', '.grid2-body-column:first-child input[type=checkbox]', (function(event) {
		//
		var checkbox = $(event.target),
			row = checkbox.closest('.grid2-body-row');

		row.toggleClass('_selected', Boolean(checkbox.prop('checked')));
		this.trigger('select', row, Boolean(checkbox.attr('name')));

	}).bind(this));

	//
	this._contextMenu.on('click', (function(name, type, row, context) {
		this.trigger('context-menu-click', name, type, row, context);
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
 * Prepeare grid for filling
 */
Juxta.Grid2.prototype.prepare = function(params) {
	//
	if (!params) {
		return false;
	}

	// Columns
	if (!params.columns) {
		throw new ReferenceError('Columns are not defined');
	}

	this.clear();

	//
	$.each(params.columns, (function (i, column) {
		//
		if (typeof column !== 'object') {
			column = {name: String(column), title: String(column)};

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

	// Set actions panel
	if (params.actions === null) {
		this._actions.empty();
	} else if (params.actions === false) {
		this._actions.hide();
	} else if (params.actions) {
		this._actions.html(params.actions);
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
			styles = ['grid2-head-column', '_column-' + column.name];

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
		cacheName,
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
			this._contextMenu.load(params.contextMenu, context);
		}
	}

	if (data && data.length > 0) {
		//
		this.count = this.count + data.length;

		$.each(data, (function(i, value) {
			//
			cacheName = null;

			valuesForTemplate = $.extend({}, context);

			$.each(this._columns, function(j, column) {
				//
				valuesForTemplate[column.name] = value[j];

				if (!cacheName) {
					cacheName = column.name;
				}
			});

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
						$(td).addClass('_column-' + columns[i].name);

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

			$row.find('td:first-child [type=checkbox]').attr('name', $row.find('td:first-child a').text());

			$row.addClass('grid2-body-row')
				.find('> td').addClass('grid2-body-column');

			$.each($row.find('> td'), (function(i, td) {
				//
				if (columns[i]) {
					$(td).addClass('_column-' + columns[i].name);

					if (columns[i].style) {
						$(td).addClass(columns[i].style.join(' '));
					}
				}
			}).bind(this));

			this._cache[valuesForTemplate[cacheName]] = $row.appendTo(this._body);

		}).bind(this));

		this.trigger('change');

	} else if (this.count === 0) {
		this._emptyMessage.css({top: this._bodyContainer.height()/2}).show();
	}
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
	this.selected = undefined;

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

	this._cache = {};
	this._columns = [];
	this.prepared = false;

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
 */
Juxta.Grid2.prototype.remove = function(rows) {
	//
	if (!$.isArray(rows)) {
		rows = [rows];
	}

	$.each(rows, (function(i, name) {
		if (this._cache[name]) {
			this.count = this.count - this._cache[name].remove().length;
		}
	}).bind(this));

	this.trigger('change');

	return this;
};
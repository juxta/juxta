/**
 * @class Grid 2
 */
Juxta.Grid2 = function(grid, options) {

	/* Containers */

	/**
	 * @type {jQuery}
	 */
	this.container = $(grid);


	/**
	 * Group actions panel
	 * @type {jQuery}
	 */
	this.actions = this.container.find('.grid2-actions');


	/**
	 * @type {jQuery}
	 */
	this.head = this.container.find('.grid2-head thead');


	/**
	 * @type {jQuery}
	 */
	this.bodyContainer = this.container.find('.grid2-body');


	/**
	 * Grid body
	 * @type {jQuery}
	 */
	this.body = this.bodyContainer.find('tbody');


	/**
	 * @type {jQuery}
	 */
	this.emptyMessage = this.bodyContainer.find('.grid2-body-empty');


	/* Properties */

	/**
	 * @type {Array}
	 */
	this.columns = [];


	/**
	 * @type {Number}
	 */
	this.count = 0;


	/**
	 * @type {Number}
	 */
	this.selected = 0;


	/**
	 * @type {String}
	 */
	this.rowTemplate;


	/**
	 * @type {String}
	 */
	this.from = null;


	/**
	 * @type {jQuery}
	 */
	this.prepared = null


	/**
	 * Cache for rows
	 * @type {Object}
	 */
	this.cache = {};


	/**
	 * @type {Juxta.ContextMenu}
	 */
	this.contextMenu = null;


	var that = this;

	this.bodyContainer.scroll(function() {
		that.head.parent('table').css({marginLeft: -$(this).scrollLeft()});
	});

	// Trigger event with type equals action name
	this.actions.find('.grid2-actions-link,.grid2-actions-button').bind('click', function(event) {
		if ($(this).attr('name')) {
			$(that).trigger('actions/' + $(this).attr('name'));
		}
	});

	// Select all/nothing
	$(this).bind('actions/all', function() {
		that.select();
	}).bind('actions/nothing', function() {
		that.deselect();
	});

	// Change all, nothing links states
	if (that.count > 0 && that.count == that.selected) {
		that.actions.find('[name=all]').addClass('active');
		that.actions.find('[name=nothing]').removeClass('active');
	} else if (that.selected == 0) {
		that.actions.find('[name=all]').removeClass('active');
		that.actions.find('[name=nothing]').addClass('active');
	} else{
		that.actions.find('[name=all]').removeClass('active');
		that.actions.find('[name=nothing]').removeClass('active');
	}

	// Disable group actions buttons if nothing selected, enable else
	if (that.selected < 1) {
		that.actions.find('input[type=button]').attr('disabled', true);
	} else{
		that.actions.find('input[type=button]').attr('disabled', false);
	}

	this.bodyContainer.bind('scroll', function(event) {
		if (that.bodyContainer.scrollTop() < 10) {
			$(that).trigger('scrollTop');
		} else if (that.bodyContainer.scrollTop() > that.body.height()- that.bodyContainer.height() - 10) {
			$(that).trigger('scrollBottom');
		}
	});

}


/**
 * Set grid body height
 * @param {Number} height
 * @return {Juxta.Grid2}
 */
Juxta.Grid2.prototype.setHeight = function(height) {
	//
	this.emptyMessage.css({top: height/2});
	this.bodyContainer.height(height)

	return this;
}


/**
 * @todo Пресмотреть
 * Prepeare grid for filling
 */
Juxta.Grid2.prototype.prepare = function(params) {

	this.clear();

	if (!params) {
		return false;
	}

	var that = this;

	if (params.from) {
		this.from = params.from;
	}

	// Columns
	if (!params.columns) {
		throw new ReferenceError('columns is not defined');
	}
	that.columns = params.columns;

	if (params.row) {
		this.rowTemplate = params.row;
	} else {
		//
		this.rowTemplate = '<tr class="grid2-body-row"><td class="grid2-body-column checkbox"><input type="checkbox"></td>';

		var first = true;
		$.each(that.columns, function(i, column) {
			var name,
				styles = ['grid2-body-column'];

			if (first) {
				styles.push('first-column');
			}
			if (typeof column === 'object') {
				if (column.title) {
					name = column.title;
				} else {
					name = column.name;
				}
				styles.push(column.style);
			} else {
				name = column;
			}

			name = name.toLowerCase();
			styles.push(name.toLowerCase());

			that.rowTemplate += '<td class="' + styles.join(' ') + '"><div>{' + name + '}</div></td>';

			first = false;
		});

		that.rowTemplate += '</tr>';
	}

	// Set actions panel
	if (params.actions === null) {
		this.actions.empty();
	} else if (params.actions === false) {
		this.actions.hide();
	} else if (params.actions) {
		this.actions.html(params.actions);
	}

	// Empty grid header and body
	if (params.head) {
		this.head.empty().show();
		that.head.parent('table').css({marginLeft: 0});
	} else {
		this.head.empty().hide();
	}

	// Make grid header
	$.each(that.columns, function(i, column) {
		//
		var name,
			styles = ['grid2-head-column'],
			hint,
			th;

		if (typeof column === 'object') {
			if (column.title) {
				name = column.title;
			} else {
				name = column.name;
			}
			styles.push(column.style);
			if (column.hint) {
				hint = column.hint;
			}
		} else {
			name = column;
		}

		styles.push(name.toLowerCase());

		th = $('<th>').addClass(styles.join(' ')).append($('<div>').html(name));

		if (hint) {
			th.attr('title', hint)
		}

		that.head.append(th);
	});

	this.head.show();

	this.prepared = true;

	return true;
}


/**
 * @todo Пресмотреть
 * Fill grid data
 * @param {Array} data
 * @param {Object} params
 */
Juxta.Grid2.prototype.fill = function(data, params) {
	//
	if (params) {
		this.prepare(params);
	}

	var that = this;

	if (data && data.length > 0) {
		//
		this.count = this.count + data.length;

		$.each(data, function(i, value) {
			//
			var forTemplate = {},
				cacheName;

			jQuery.each(that.columns, function(j, column) {
				var name;
				if (typeof column === 'object') {
					name = column.name;
				} else {
					name = column;
				}
				name = name.toLowerCase();

				forTemplate[name] = value[j];

				if (!cacheName) {
					cacheName = name;
				}
			});

			var row;

			if (typeof that.rowTemplate === 'function') {
				row = that.rowTemplate(forTemplate);
			} else {
				row = $.template(that.rowTemplate, forTemplate);
			}

			that.cache[forTemplate[cacheName]] = $(row).appendTo(that.body);
		});

		$(this).trigger('change');

	} else if (this.count == 0) {
		// Show empty grid message
		this.emptyMessage.css({top: this.bodyContainer.height()/2}).show();
	}
}


/**
 * Empty grid body
 * @return {Juxta.Grid2}
 */
Juxta.Grid2.prototype.empty = function() {
	//
	this.body.empty();

	this.count = 0;
	this.selected = undefined;

	$(this).trigger('change');

	return this;
}


/**
 * 
 */
Juxta.Grid2.prototype.clear = function() {
	//
	this.head.empty();
	this.empty();
	this.emptyMessage.hide();

	this.cache = {};
	this.content = null;
	this.from = null;
	this.columns = [];
	this.prepared = false;

	//$(this).trigger('clear');

	return this;
}


/**
 * @todo Пресмотреть
 * Select rows
 */
Juxta.Grid2.prototype.select = function(row) {
	if (row) {
		this.selectRow(row);
	} else {
		this.selectAll();
	}
}


/**
 * @todo Пресмотреть
 * Deselect rows
 */
Juxta.Grid2.prototype.deselect = function(row) {
	if (row) {
		this.deselectRow(row);
	} else {
		this.deselectAll();
	}
}


/**
 * Select all rows
 */
Juxta.Grid2.prototype.selectAll = function() {
}


/**
 * Deselect all rows
 */
Juxta.Grid2.prototype.deselectAll = function() {
}


/**
 * Select one row
 */
Juxta.Grid2.prototype.selectRow = function(row) {
	// Highlight link
	$(row).find('.grid-body-column.checkbox').next('td').find('a').addClass('checked');
}

/**
 * Deselect one row
 */
Juxta.Grid2.prototype.deselectRow = function(row) {
	// Unhighlight link
	$(row).find('td.check').next('td').find('a').removeClass('checked');
}

/**
 * @todo Пресмотреть
 * Returns names of selected rows
 */
Juxta.Grid2.prototype.getSelectedRows = function(filter, group) {
}

/**
 * Removes rows by name
 */
Juxta.Grid2.prototype.remove = function(names, filter) {
}


Juxta.Grid2.prototype.enableSelectRows = function() {
	$.each(this.cache, function() {
		this.find('.grid2-body-column.checkbox').show();
	});
	this.container.addClass('select-rows');
}


Juxta.Grid2.prototype.disableSelectRows = function() {
	$.each(this.cache, function() {
		this.find('.grid2-body-column.checkbox').hide();
	});
	this.container.removeClass('select-rows');
}


Juxta.Grid2.prototype.vertScrollEnabled = function() {
	return this.bodyContainer.height() < this.body.height();
}
/**
 * @class Grid 2
 */
Juxta.Grid2 = function(grid) {

	this.statistics = {
		item: 'item',
		items: 'items',
		all: 0,
		selected: 0
	}

	this.content = null;

	this.from = null;

	this.columns = [];

	this.cache = {};

	this.$container = $(grid);
	this.$bodyContainer = this.$container.find('.body');
	this.$bodyHead = this.$bodyContainer.find('table thead');
	this.$body = this.$bodyContainer.find('table tbody');
	this.$notFound = this.$bodyContainer.find('.not-found')
	this.head = this.$container.find('.head');
	this.$actions = this.$container.find('.actions');
	this.$context = this.$container.find('.context');

	/**
	 * @type {Juxta.ContextMenu}
	 */
	this.contextMenu = null;

	var that = this;

	this.$body.change(function(event) {
		// Select/deselect row
		if ($(event.target).is('[type=checkbox]')) {
			$('.context:visible').hide();

			var $row = $(event.target).parent().parent();
			if ($(event.target).is('[type=checkbox]:checked')) {
				that.select($row);
			} else{
				that.deselect($row);
			}
		}

		// Count all and selected items
		that.statistics.all = that.$body.find('tr:not(tr tr):not(.content)').find('[type=checkbox]').length;
		that.statistics.selected = that.$body.find('tr:not(tr tr):not(.content)').find('[type=checkbox]:checked').length;

		// Change all, nothing links states
		if (that.statistics.all > 0 && that.statistics.all == that.statistics.selected) {
			that.$actions.find('.all').addClass('active');
			that.$actions.find('.nothing').removeClass('active');
		} else if(that.statistics.selected == 0) {
			that.$actions.find('.all').removeClass('active');
			that.$actions.find('.nothing').addClass('active');
		} else{
			that.$actions.find('.all').removeClass('active');
			that.$actions.find('.nothing').removeClass('active');
		}

		// Disable group actions' buttons if nothing selected, enable else
		if (that.statistics.selected < 1) {
			that.$actions.find('input[type=button]').attr('disabled', true);
		} else{
			that.$actions.find('input[type=button]').attr('disabled', false);
		}
	});

	// Trigger event with type equals action name
	this.$actions.bind('click', function(event) {
		var $button = $(event.target);
		if ($button.is('span.like-a, input') && $button.attr('name')) {
			that.$actions.trigger($button.attr('name'));
			that.$body.trigger($button.attr('name'));
		}
	});

	this.$actions.bind('all', function() {
		that.select();
	});
	this.$actions.bind('nothing', function() {
		that.deselect();
	});

	if (this.$context.is('.context')) {
		this.contextMenu = new Juxta.ContextMenu(this.$body, this.$context);
	}
}


Juxta.Grid2.prototype.height = function(height) {
	if (height) {
		this.$notFound.css('top', height / 2 - 14 + 'px');
	}
	return this.$bodyContainer.height(height);
}

Juxta.Grid2.prototype.prepare = function(template) {
	if (template) {
		var that = this;

		this.$actions.empty();
		if (template['actions']) {
			this.$actions.html(template['actions']);
		}

		// Empty grid header and body
		if (template['head']) {
			this.empty();
			this.head.empty().show();
			this.$bodyContainer.show();
			this.$container.find('.proper').hide();
		} else {
			this.empty();
			this.head.empty().hide();
			this.$bodyContainer.hide();
		}

		// Make grid header
		if (template['head']) {
			this.head.empty();
			$.each(template['head'], function(i, value) {
				that.head.append('<li class="' + i + '">' + value + '</li>');
			});
		}

		// Define context for status bar
		if ($.isArray(template.context[0])) {
			this.statistics.item = template.context[0][0];
			this.statistics.items = template.context[0][1];
		} else{
			this.statistics.item = template.context[0];
			this.statistics.items = 'items';
		}

		//
		this.statistics.all = 0;
		this.$body.trigger('change');

		return true;
	} else {
		return false;
	}
}

/**
 * Fill grid data
 * @param {Array} data
 * @param {Object} params
 */
Juxta.Grid2.prototype.fill = function(data, params) {
	var that = this;

	this.empty();
	this.content = params.contents;
	if (params.from) {
		this.from = params.from;
	}
	if (data && (data.length > 0 || $.isPlainObject(data))) {
		this.statistics.all = data.length;

		var template = params.row;
		jQuery.each(data, function(i, value) {
			if ($.isPlainObject(data)) {
				value = [i, value];
			}
			var forTemplate = {},
				cacheName;
			jQuery.each(params.context, function(j, valueName) {
				var name;
				if (params.context.length == 1) {
					if ($.isArray(valueName)) {
						name = valueName[0];
					} else{
						name = valueName;
					}
					forTemplate[name] = value;
				} else{
					if ($.isArray(valueName)) {
						name = valueName[0];
					} else{
						name = valueName;
					}
					forTemplate[name] = value[j];
				}
				if (!cacheName) {
					cacheName = name;
				}
			});
			// @todo Rewrite this
			if (params.from) {
				$.extend(forTemplate, {database: params['from']});
			}

			var $q = $($.template(template, forTemplate)).appendTo(that.$body);
			that.cache[forTemplate[cacheName]] = $q;
		});
		this.$body.trigger('change');

		// Make context menu
		if (params.contextMenu && this.contextMenu) {
			if (params.from) {
				var menu = $.template(params.contextMenu, {database: params.from});
			} else {
				var menu = params.contextMenu;
			}
			this.contextMenu.load(menu);
		}
	} else {
		this.$notFound.css('top', this.$container.find('.body').height() / 2 - 14 + 'px').show();
	}
}

/**
 * Empty grid body
 */
Juxta.Grid2.prototype.empty = function() {
	this.$body.empty();
	this.$notFound.hide();

	this.cache = {};
	this.content = null;
	this.from = null;
	this.statistics.all = 0;
	this.statistics.selected = 0;
}

/**
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
	$('.context:visible').hide();
	this.$body.find('input[type=checkbox]').attr('checked', 'checked').parent().next('td').find('a').addClass('checked');
	this.$body.trigger('change');
}

/**
 * Deselect all rows
 */
Juxta.Grid2.prototype.deselectAll = function() {
	this.$body.find('input[type=checkbox]').removeAttr('checked', '');
	this.$body.find('a.checked').removeClass('checked');
	this.$body.trigger('change');
}

/**
 * Select one row
 */
Juxta.Grid2.prototype.selectRow = function(row) {
	var $row = $(row);

	// Highlight link
	$row.find('td.check').next('td').find('a').addClass('checked');
}

/**
 * Deselect one row
 */
Juxta.Grid2.prototype.deselectRow = function(row) {
	var $row = $(row);

	// Unhighlight link
	$row.find('td.check').next('td').find('a').removeClass('checked');
}

/**
 * Returns names of selected rows
 */
Juxta.Grid2.prototype.selected = function(filter, group) {
	var selected = this.$body.find('input[type=checkbox]:checked');

	// Apply filter
	if (filter) {
		selected = selected.filter(filter);
	}

	// Collect to arrya and group by attribute
	if (group) {
		var grouped = {};
		jQuery.each(selected, function() {
			if (grouped[$(this).attr(group)] === undefined) {
				grouped[$(this).attr(group)] = [];
			}
			grouped[$(this).attr(group)].push($(this).attr('name'));
		});
		selected = grouped;
	} else {
		selected = selected.map(function() { return $(this).attr('name'); }).toArray();
	}

	return !$.isEmptyObject(selected) ? selected : null;
}

/**
 * Removes rows by name
 */
Juxta.Grid2.prototype.remove = function(names, filter) {
	var that = this;

	if (!$.isArray(names)) {
		names = [names];
	}

	$.each(names, function(i, name) {
		if (that.cache[name] && (filter === undefined || that.cache[name].find('.check :checkbox').is(filter))) {
			that.cache[name].remove();
		}
	});

	that.$body.trigger('change');
}

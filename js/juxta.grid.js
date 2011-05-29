Juxta.Grid = function(grid) {
	this.init(grid);
}
Juxta.Grid.prototype = {
	statistics: {
		item: 'item',
		items: 'items',
		cardinality: 0,
		selected: 0
	},
	cache: {},
	content: null,
	from: null,
	init: function(grid) {
		this.$container = $(grid);
		this.$bodyContainer = this.$container.find('.body');
		this.body = this.$bodyContainer.find('table');
		this.$notFound = this.$bodyContainer.find('.not-found')
		this.head = this.$container.find('.head');
		this.$actions = this.$container.find('.actions');
		this.$context = this.$container.find('.context');

		var that = this;

		this.body.change(function(event) {
			if ($(event.target).is('[type=checkbox]')) {
				$('.context:visible').hide();

				var $row = $(event.target).parent().parent();
				if ($(event.target).is('[type=checkbox]:checked')) {
					that.select($row);
				} else{
					that.deselect($row);
				}
			}

			that.statistics.selected = that.body.find('tr:not(tr tr):not(.content)').find('[type=checkbox]:checked').length;
			var status = '';
			if (that.statistics.cardinality > 0) {
				status += that.statistics.cardinality;
				if (that.statistics.cardinality == 1) {
					status += ' ' + that.statistics.item;
				} else {
					status += ' ' + that.statistics.items;
				}
			}
			if (that.statistics.selected > 0) {
				status += ', ';
				status += that.statistics.selected;
				status += ' selected';
			}
			Juxta.explorer.status(status);

			if (that.statistics.cardinality > 0 && that.statistics.cardinality == that.statistics.selected) {
				that.$actions.find('.all').addClass('active');
				that.$actions.find('.nothing').removeClass('active');
			} else if(that.statistics.selected == 0) {
				that.$actions.find('.all').removeClass('active');
				that.$actions.find('.nothing').addClass('active');
			} else{
				that.$actions.find('.all').removeClass('active');
				that.$actions.find('.nothing').removeClass('active');
			}

			if (that.statistics.selected < 1) {
				that.$actions.find('input[type=button]').attr('disabled', true);
			} else{
				that.$actions.find('input[type=button]').attr('disabled', false);
			}
		});

		// Trigger event with type equals action name
		this.$actions.bind('click', function() {
			var $button = $(event.target);
			if ($button.is('span.like-a, input') && $button.attr('name')) {
				that.$actions.trigger($button.attr('name'));
				that.body.trigger($button.attr('name'));
			}
		});

		this.$actions.bind('all', function() {
			that.select();
		});
		this.$actions.bind('nothing', function() {
			that.deselect();
		});

		if (this.$context.is('.context')) {
			this.contextMenu = new Juxta.ContextMenu(this.body, this.$container.find('.context'));
		}

	},
	height: function(height) {
		if (height) {
			this.$notFound.css('top', height / 2 - 14 + 'px');
		}
		return this.$bodyContainer.height(height);
	},
	prepare: function(template) {
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
			this.statistics.cardinality = 0;
			this.body.trigger('change');

			return true;
		} else {
			return false;
		}
	},
	fill: function(data) {
		var that = this;

		this.empty();
		this.content = data.contents;
		if (data.from) {
			this.from = data.from;
		}
		if (data && data.data && (data.data.length > 0 || $.isPlainObject(data.data))) {
			this.statistics.cardinality = data.data.length;

			var template = data['data-template'];
			jQuery.each(data.data, function(i, value) {
				if ($.isPlainObject(data.data)) {
					value = [i, value];
				}
				var forTemplate = {},
					cacheName;
				jQuery.each(data.context, function(j, valueName) {
					var name;
					if (data.context.length == 1) {
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
				$.extend(forTemplate, {database: data['from']});
				var $q = $($.template(template, forTemplate)).appendTo(that.body);
				that.cache[forTemplate[cacheName]] = $q;
			});
			this.body.trigger('change');

			// Make context menu
			if (data.contextMenu) {
				this.$container.find('.context ul').html($.template(data.contextMenu, {database: data['from']}));
			}
		} else {
			this.$notFound.css('top', this.$container.find('.body').height() / 2 - 14 + 'px').show();
		}
	},
	empty: function() {
		this.body.empty();
		this.$notFound.hide();
		this.cache = {};
		this.content = null;
		this.from = null;
	},
	/**
	 * Select rows
	 * 
	 */
	select: function(row) {
		if (row) {
			this.selectRow(row);
		} else {
			this.selectAll();
		}
	},
	/**
	 * Deselect rows
	 * 
	 */
	deselect: function(row) {
		if (row) {
			this.deselectRow(row);
		} else {
			this.deselectAll();
		}
	},
	/**
	 * Select all rows
	 * 
	 */
	selectAll: function() {
		$('.context:visible').hide();
		this.body.find('input[type=checkbox]').attr('checked', 'checked').parent().next('td').find('a').addClass('checked');
		this.body.trigger('change');
	},
	/**
	 * Deselect all rows
	 * 
	 */
	deselectAll: function() {
		this.body.find('input[type=checkbox]').removeAttr('checked', '');
		this.body.find('a.checked').removeClass('checked');
		this.body.trigger('change');
	},
	/**
	 * Select one row
	 * 
	 */
	selectRow: function(row) {
		var $row = $(row);

		// Highlight link
		$row.find('td.check').next('td').find('a').addClass('checked');
	},
	/**
	 * Deselect one row
	 * 
	 */
	deselectRow: function(row) {
		var $row = $(row);

		// Unhighlight link
		$row.find('td.check').next('td').find('a').removeClass('checked');
	},
	selected: function() {
		var selected = this.body.find('input[type=checkbox]:checked').map(function() { return $(this).attr('name') }).toArray();
		if ($.isEmptyObject(selected)) {
			selected = null;
		}
		return selected;
	},
	remove: function(names) {
		var grid = this;

		if (!$.isArray(names)) {
			names = [names];
		}

		$.each(names, function(i, name) {
			if (grid.cache[name]) {
				grid.cache[name].remove();
			}
		});
	}
}

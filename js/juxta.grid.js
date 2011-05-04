Juxta.Grid = $.Class();
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
		this.container = $(grid);
		this.$bodyContainer = this.container.find('.body');
		this.body = this.$bodyContainer.find('table');
		this.$notFound = this.$bodyContainer.find('.not-found')
		this.head = this.container.find('.head');
		this.actions = this.container.find('.actions');
		this.$context = this.container.find('.context');

		var self = this;
		this.body.change(function(event) {
			if ($(event.target).is('[type=checkbox]')) {
				$('.context:visible').hide();
				if ($(event.target).is('[type=checkbox]:checked')) {
					// Highlight link
					$(event.target).parent().next('td').find('a').addClass('checked');
					// Check parent row if its child  selected all
					if ($(event.target).parents('tr.content').find('[type=checkbox]').length > 0 &&
						$(event.target).parents('tr.content').find('[type=checkbox]').length == $(event.target).parents('tr.content').find('[type=checkbox]:checked').length)
					{
						$(event.target).parents('tr.content').prev('tr')
							.find('[type=checkbox]').attr('checked', true)
							.parents('tr').find('a').addClass('checked');
					}
					// Check child rows
					$(event.target).parents('tr').next('tr.content')
						.find('[type=checkbox]').attr('checked', true)
						.parents('tr').find('a').addClass('checked');
				} else{
					// Unhighlight link
					$(event.target).parent().next('td').find('a').removeClass('checked');
					// Uncheck parent row if its child slected none
					if ($(event.target).parents('tr.content').find('[type=checkbox]').length > 0 &&
						$(event.target).parents('tr.content').find('[type=checkbox]:checked').length == 0)
					{
						$(event.target).parents('tr.content').prev('tr')
							.find('[type=checkbox]').attr('checked', false)
							.parents('tr').find('a').removeClass('checked');
					}
					// Uncheck child rows
					$(event.target).parents('tr').next('tr.content')
						.find('[type=checkbox]').attr('checked', false)
						.parents('tr').find('a').removeClass('checked');
				}
			}
			self.statistics.selected = self.body.find('tr:not(tr tr):not(.content)').find('[type=checkbox]:checked').length;
			var status = '';
			if (self.statistics.cardinality > 0) {
				status += self.statistics.cardinality;
				if (self.statistics.cardinality == 1) {
					status += ' ' + self.statistics.item;
				} else {
					status += ' ' + self.statistics.items;
				}
			}
			if (self.statistics.selected > 0) {
				status += ', ';
				status += self.statistics.selected;
				status += ' selected';
			}
			Juxta.explorer.status(status);

			if (self.statistics.cardinality > 0 && self.statistics.cardinality == self.statistics.selected) {
				self.actions.find('.all').addClass('active');
				self.actions.find('.nothing').removeClass('active');
			} else if(self.statistics.selected == 0) {
				self.actions.find('.all').removeClass('active');
				self.actions.find('.nothing').addClass('active');
			} else{
				self.actions.find('.all').removeClass('active');
				self.actions.find('.nothing').removeClass('active');
			}

			if (self.statistics.selected < 1) {
				self.actions.find('input[type=button]').attr('disabled', true);
			} else{
				self.actions.find('input[type=button]').attr('disabled', false);
			}
		});

		this.body.find('td.expand, td.collapse').live('click', function(event) {
			// Temporary
			$target = $(event.target);
			if (!$target.parents('tr').next('tr.content').get(0)) {
				$target.parents('tr').after('<tr class="content"><td colspan="99"><table cellspacing="0"><tr><td class="check"><input type="checkbox" /></td><td class="table"><a>test_1</a></td><td></td></tr><tr><td class="check"><input type="checkbox" /></td><td class="table"><a>test_2</a></td><td></td></tr></table></td></tr>');
			}
			//
			if ($target.hasClass('expand')) {
				$target.removeClass('expand').addClass('collapse');
				$target.parents('tr').next('.content').show();
				if ($target.parents('tr').find('[type=checkbox]').is(':checked')) {
					$target.parents('tr').next('tr.content').find('[type=checkbox]')
						.attr('checked', true)
						.parents('tr').find('a').addClass('checked');
				}
			} else{
				$target.removeClass('collapse').addClass('expand');
				$target.parents('tr').next('.content').hide();
			}

			$('.context:visible').hide();
			return false;
		});

		this.container.find('.actions .all').live('click', function() {
			self.select('all')
			return false
		});

		this.container.find('.actions .nothing').live('click', function() {
			self.select();
			return false;
		});

		if (this.$context.is('.context')) {
			this.contextMenu = {
				menu: this.container.find('.context'),
				page: this.body,
				target: null,
				value: null,
			};
		}

		if (self.contextMenu) {
			this.$context.bind('hide', self.contextMenu, function(event) {
				contextMenu = event.data;
				contextMenu.target.find('td:nth-child(2)').find('a').removeClass('checked');

				contextMenu.target = null;
				contextMenu.value = null;
			});

			this.body.bind('contextmenu', self.contextMenu, function(event) {
				contextMenu = event.data;

				if (!contextMenu.menu.find('ul').is(':empty')) {
					contextMenu.menu.show().offset({top: event.clientY, left: event.clientX});

					contextMenu.page.find('a.checked').removeClass('checked');
					contextMenu.page.find('[type=checkbox]:checked').removeAttr('checked');
					contextMenu.target = $(event.target).parents('tr');
					contextMenu.target.find('td:nth-child(2)').find('a').addClass('checked');

					contextMenu.value = contextMenu.target.find('td:nth-child(2)').find('a').text();

					contextMenu.page.trigger('change');

					return false;
				}
			});
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
			var self = this;

			// Empty grid header and body
			if (template['head']) {
				this.empty();
				this.head.empty().show();
				this.$bodyContainer.show();
				this.container.find('.proper').hide();
			} else {
				this.empty();
				this.head.empty().hide();
				this.$bodyContainer.hide();
			}

			// Make grid header
			if (template['head']) {
				this.head.empty();
				$.each(template['head'], function(i, value) {
					self.head.append('<li class="' + i + '">' + value + '</li>');
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
		var self = this;

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
				var $q = $($.template(template, forTemplate)).appendTo(self.body);
				self.cache[forTemplate[cacheName]] = $q;
			});
			this.body.trigger('change');

			// Make context menu
			if (data.contextMenu) {
				this.container.find('.context ul').html($.template(data.contextMenu, {database: data['from']}));
			}
		} else {
			this.$notFound.css('top', this.container.find('.body').height() / 2 - 14 + 'px').show();
		}
	},
	empty: function() {
		this.body.empty();
		this.$notFound.hide();
		this.cache = {};
		this.content = null;
		this.from = null;
	},
	select: function(all) {
		if (all) {
			$('.context:visible').hide();
			this.body.find('input[type=checkbox]').attr('checked', 'checked').parent().next('td').find('a').addClass('checked');
		} else{
			this.body.find('input[type=checkbox]').removeAttr('checked', '');
			this.body.find('a.checked').removeClass('checked');
		}
		this.body.trigger('change')
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
};

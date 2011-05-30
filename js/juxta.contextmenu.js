Juxta.ContextMenu = $.Class();
Juxta.ContextMenu.prototype = {
	target: null,
	value: null,
	callbacks: {},
	init: function(page, menu) {
		//
		this.$page = $(page);
		this.$container = $(menu);

		var that = this;
		this.$page.bind('contextmenu', function(event) {
			that.show();
			return false;
		});

		this.$container
			.bind('show', function(event) {
			})
			.bind('hide', function(event) {
				that.hide();
			});
	},
	hide: function() {
		this.target.find(':checkbox').attr('checked', false);
		this.target.find('td:nth-child(2)').find('a').removeClass('checked');

		this.$page.trigger('change');

		this.target = null;
		this.value = null;
	},
	show: function() {
		this.$container.show().offset({top: event.clientY, left: event.clientX});

		this.$page.find('a.checked').removeClass('checked');
		this.$page.find('[type=checkbox]:checked').removeAttr('checked');

		this.target = $(event.target).parents('tr');
		this.target.find(':checkbox').attr('checked', true);
		this.target.find('td:nth-child(2)').find('a').addClass('checked');
		this.value = this.target.find('td:nth-child(2)').find('a').text();

		this.$page.trigger('change');
	}
};

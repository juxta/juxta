Juxta.Application = $.Class({
	settings: {
		closable: false,
		maximized: false
	},
	init: function(element, options) {
		this.settings = $.extend({}, this.settings, options);
		
		this.$application = $(element);
		this.$menu = this.$application.find('.menu');
		this.$statusBar = this.$application.find('.status');
		
		this.tune(this.settings);
		
		if (this.settings.closable) {
			this.$application.find('.close').show();
			this.$application.find('.close').click(function() { history.back(); });
		} else{
			this.$application.find('.close').hide();
		}
	},
	tune: function(options) {
		if ($.isPlainObject(options.header)) {
			this.$application.find('h1').html(
				options.header.title + 
				(options.header.name ? ' <a>' + options.header.name + '</a>' : '') +
				(options.header.from ? ' <span class="from">from <a>' + options.header.from + '</a></span>' : '')
			);
		} else{
			this.$application.find('h1').html(options.header);
		}
		this.menu(options.menu);
	},
	show: function(options) {
		if (!options) {
			Juxta.show();
		} else {
			options = $.extend({}, this.settings, options);
			this.tune(options);
		}

		if (!this.$application.is(':visible')) {
			$('#applications .application').hide();
			this.$application.show();
		}

		if (this.settings.maximized) {
			this.maximize();
		} else{
			this.restore();
		}

		return this;
	},
	hide: function() {
		this.$application.hide();
		return this;
	},
	menu: function(menu) {
		this.$menu.empty();
		var _this = this;
		if ($.isPlainObject(menu)) {
			jQuery.each(menu, function(title, action) {
				if ($.isPlainObject(action)) {
					_this.$menu.append('<a href="' + (action.href ? action.href : '') + (action.click ? '" onclick="' + action.click + '"' : '"') + '>' + title + '</a>');
				} else if (action) {
					_this.$menu.append('<a href="' + action + '">' + title + '</a>');
				} else{
					_this.$menu.append('<a>' + title + '</a>');
				}
			});
		}
		return this;
	},
	maximize: function() {
		$('#sidebar').addClass('minimized');
		$('#applications').addClass('maximized');
		return this;
	},
	restore: function() {
		$('#applications').removeClass('maximized');
		$('#sidebar').removeClass('minimized');
		return this;
	},
	status: function(text) {
		this.$statusBar.text(text);
	}
});

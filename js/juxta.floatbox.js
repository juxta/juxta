Juxta.FloatBox = function(element, options) {
	this.init(element, options);
}

Juxta.FloatBox.prototype = {
	settings: {
		title: 'New window',
		closable: true,
		center: true
	},
	init: function(element, options) {
		var that = this;

		this.settings = $.extend({}, this.settings, options);

		this.$container = $(element);

		// @depricated
		this.$floatBox = this.$container;

		// Head
		if (this.$container.find('h3').is('h3')) {
			this.$head = this.$container.find('h3');
		} else {
			this.$head = this.$container.prepend('<h3>'+ this.settings.title + '</h3>').find('h3');
		}

		this.settings.title = this.$head.html();

		// Close button
		if (this.$container.find('input[type=button].close').is('input')) {
			this.$terminator = this.$container.find('input[type=button].close');
		} else {
			this.$terminator = $('<input type="button" class="close"/>').insertAfter(this.$head).attr('disabled', !this.settings.closable);
		}

		this.$terminator.click(function() { that.hide(); });

		// Drag options
		this.$container.draggable({scroll: false, handle: 'h3'});

		this.center();
	},
	show: function(options, content) {
		console.log(options);
		options = $.extend({}, this.settings, options);

		this.$head.html(
			options.title +
			(options.name ? ' <a>' + options.name + '</a>' : '') +
			(options.from ? ' <span class="from">from <a>' + options.from + '</a></span>' : '')
		);

		// Appent content
		if (content) {
			this.clear();
			$(content).insertAfter(this.$terminator);
		}

		this.$container.show();

		if (options.center) {
			this.center();
		}
	},
	hide: function() {
		this.$floatBox.hide();
	},
	/**
	 * Center box
	 */
	center: function() {
		var body = {
			height: $(document.body).height(),
			width: $(document.body).width()
		};

		this.$floatBox.css({
			left: (body.width - this.$floatBox.width()) / 2,
			top: parseInt(0.75 * (body.height - this.$floatBox.height()) / 2)
		});
	},
	/**
	 * Clear content
	 */
	clear: function() {
		this.$container.find(':not(h3):not([type=button].close)').remove();
	}
};

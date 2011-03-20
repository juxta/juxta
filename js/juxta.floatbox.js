Juxta.FloatBox = $.Class({
	settings: {
		title: 'New window',
		closable: true
	},
	init: function(element, options) {
		var _this = this;
		this.settings = $.extend({}, _this.settings, options);

		this.$floatBox = $(element);
		this.$head = this.$floatBox.find('h3').is('h3') ? this.$floatBox.find('h3') : this.$floatBox.prepend('<h3>'+ this.settings.title + '</h3>').find('h3');

		this.$terminator = this.$floatBox.find('input[type=button].close').is('input')
			? this.$floatBox.find('input[type=button].close')
			: $('<input type="button" class="close"/>').insertAfter(this.$head).attr('disabled', !this.settings.closable);
		this.$terminator.click(function() { _this.hide(); });

		this.$floatBox.draggable({scroll: false, handle: 'h3'});
		
		var body = {
			height: $(document.body).height(),
			width: $(document.body).width()
		};
		this.$floatBox.css({
			left: (body.width - this.$floatBox.width())/2,
			top:  parseInt(0.75*(body.height - this.$floatBox.height())/2)
		});
	},
	show: function(options) {
		_this = this;
		options = $.extend({}, _this.settings, options);
		
		this.$head.html(
			options.title +
			(options.name ? ' <a>' + options.name + '</a>' : '') +
			(options.from ? ' <span class="from">from <a>' + options.from + '</a></span>' : '')
		);
		
		this.$floatBox.show();
	},
	hide: function() {
		this.$floatBox.hide();
	}
});

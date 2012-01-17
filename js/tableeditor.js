Juxta.TableEditor = $.Class(Juxta.Application, {
	init: function(element) {
		this._super(element, {closable: false, mazimized: false, menu: {'Browse table' : {click: "Juxta.browse({browse: '123', from: 'Qq'}); return false;"}}});
		$(window).bind('resize', {_this: this}, this.stretch);
	},
	show: function(options) {
		this._show(options);
		this.stretch();
	},
	stretch: function(event) {
		var _this = event && event.data._this || this;
		if (_this.$application.is(':visible')) {
			if ($('#applications').height() < 500) {
				_this.$application.find('.grid.indexes .body').height(72);
			} else{
				_this.$application.find('.grid.indexes .body').height($('#applications').height() * 0.225);
			}
			_this.$application.find('.grid.columns .body').height($('#applications').height() - _this.$application.find('.grid.columns .body').position().top - _this.$statusBar.height() - 24 - _this.$application.find('.grid.indexes')[0].offsetHeight - 54 /* H2 height with margins */);
		}
	}
});

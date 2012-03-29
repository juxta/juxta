Juxta.CreateUser = $.Class(Juxta.FloatBox, {
	init: function(element) {
		this._super(element, {title: 'Add a User'});

		var _this = this;
		this.$floatBox.find('.buttons input[value=Create]').click(function() {
			_this.hide();
			Jux.notify('User created');
		});
	},
	show: function(options) {
		this.$floatBox.find('input[type=text]').attr('value', null);
		this._show(options);
	}
});



Juxta.CreateDatabase = $.Class(Juxta.FloatBox, {
	init: function(element, request) {
		this._super(element);

		this.$form = this.$floatBox.find('form[name=create-database]');
		this.$collations = this.$form.find('[name=collation]');
		this.$submit = this.$form.find('input[type=submit]');
		this.request = request;

		var that = this;
		this.$form.bind('submit', function() {
			that.requestCreateDatabase();
			return false;
		});
	},
	show: function(options) {
		//this.requestGetCollations();
		this._show(options);
		this.$submit.attr('disabled', false);
		this.$floatBox.find('input[type=text]').focus().val(null);
	},
	hide: function() {
		Jux.notification.hide();
		this._hide();
	},
	requestCreateDatabase: function() {
		this.$submit.attr('disabled', true);
		this.request.send({
			action: {create: 'database'},
			data: this.$form.serialize(),
			success: this.responseCreateDatabase,
			error: function() { this.$submit.attr('disabled', false); },
			context: this
		});
	},
	responseCreateDatabase: function(response) {
		this.$floatBox.hide();
		Jux.explore({show: 'databases', refresh: true});
	},
	requestGetCollations: function() {
		this.request.send({
			action: {show: 'collations'},
			cache: true,
			context: this,
			success: this.responseGetCollations
		});
	},
	responseGetCollations: function(response) {
		var that = this;
		if (!$.isEmptyObject(response.data)) {
			var $collations = this.$collations;
			this.$collations.empty().append('<option>Default</option>');
			$.each(response.data, function(charset, collations) {
				var $charset = $('<optgroup>').attr('label', charset);
				if (!$.isEmptyObject(collations)) {
					$.each(collations, function(index, charset) {
						$charset.append($('<option>').text(charset));
					});
				}
				that.$collations.append($charset);
			});
		}
	}
});

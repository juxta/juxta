/**
 * @class Create Database
 * @extends Juxta.FloatBox
 * @param {jQuery} element
 * @param {Object} options
 */
Juxta.CreateDatabase = function(element, request) {

	Juxta.Auth.prototype.constructor.call(this, element);

	/**
	 * @type {Juxta.Request}
	 */
	this.request = request;


	/**
	 * @type {jQuery}
	 */
	this.$form = this.$floatBox.find('form[name=create-database]');
	
	
	/**
	 * @type {jQuery}
	 */
	this.$collations = this.$form.find('[name=collation]');
	
	
	/**
	 * @type {jQuery}
	 */
	this.$submit = this.$form.find('input[type=submit]');

	var that = this;
	this.$form.bind('submit', function() {
		that.requestCreateDatabase();
		return false;
	});
}

Juxta.Lib.extend(Juxta.CreateDatabase, Juxta.FloatBox);

/**
 * @param {Object} options
 */
Juxta.CreateDatabase.prototype.show = function(options) {
	//this.requestGetCollations();
	Juxta.FloatBox.prototype.show.apply(this, arguments);
	this.$submit.attr('disabled', false);
	this.$floatBox.find('input[type=text]').focus().val(null);
}


/**
 * Hide window
 */
Juxta.CreateDatabase.prototype.hide = function() {
	// @todo Remove global
	Jux.notification.hide();
	this._hide();
}


/**
 * Request
 */
Juxta.CreateDatabase.prototype.requestCreateDatabase = function() {
	this.$submit.attr('disabled', true);
	this.request.send({
		action: {create: 'database'},
		data: this.$form.serialize(),
		success: this.responseCreateDatabase,
		error: function() { this.$submit.attr('disabled', false); },
		context: this
	});
}


/**
 * Response
 * @param {Object} response
 */
Juxta.CreateDatabase.prototype.responseCreateDatabase = function(response) {
	this.$floatBox.hide();
	// @todo Remove global
	Jux.explore({show: 'databases', refresh: true});
}


/**
 * Get collations request
 */
Juxta.CreateDatabase.prototype.requestGetCollations = function() {
	this.request.send({
		action: {show: 'collations'},
		cache: true,
		context: this,
		success: this.responseGetCollations
	});
}


/**
 * Response for get collations request
 * @param {Object} response
 */
Juxta.CreateDatabase.prototype.responseGetCollations = function(response) {
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

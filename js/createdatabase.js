/**
 * @class Create Database
 * @extends Juxta.Modal
 * @param {jQuery} element
 * @param {Object} options
 */
Juxta.CreateDatabase = function(element, request) {

	Juxta.Modal.prototype.constructor.call(this, element);

	/**
	 * @type {Juxta.Request}
	 */
	this.request = request;


	/**
	 * @type {jQuery}
	 */
	this.form = this.container.find('form[name=create-database]');


	/**
	 * @type {jQuery}
	 */
	this.collations = this.form.find('[name=collation]');


	/**
	 * @type {jQuery}
	 */
	this.submit = this.form.find('input[type=submit]');


	var that = this;

	this.form.bind('submit', function() {
		that.requestCreateDatabase();
		return false;
	});
}

Juxta.Lib.extend(Juxta.CreateDatabase, Juxta.Modal);

/**
 * Show dialog window
 * @param {Object} options
 * @return {Juxta.CreateDatabase}
 */
Juxta.CreateDatabase.prototype.show = function(options) {
	//this.requestGetCollations();
	Juxta.Modal.prototype.show.apply(this, arguments);

	this.submit.attr('disabled', false);
	this.container.find('input[type=text]').focus().val(null);

	return this;
}


/**
 * Request
 * @return {jqXHR}
 */
Juxta.CreateDatabase.prototype.requestCreateDatabase = function() {
	//
	this.submit.attr('disabled', true);

	return this.request.send({
		action: {create: 'database'},
		data: this.form.serialize(),
		success: this.responseCreateDatabase,
		error: function() { this.submit.attr('disabled', false); },
		context: this
	});
}


/**
 * Response
 * @param {Object} response
 * @return {Juxta.CreateDatabase}
 */
Juxta.CreateDatabase.prototype.responseCreateDatabase = function(response) {
	//
	this.container.hide();
	this.trigger('created');

	return this;
}


/**
 * Get collations request
 * @return {jqXHR}
 */
Juxta.CreateDatabase.prototype.requestGetCollations = function() {
	//
	return this.request.send({
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
	//
	var that = this;

	if (!$.isEmptyObject(response.data)) {
		//
		this.collations.empty().append('<option>Default</option>');

		$.each(response.data, function(charset, collations) {
			var $charset = $('<optgroup>').attr('label', charset);
			if (!$.isEmptyObject(collations)) {
				$.each(collations, function(index, charset) {
					$charset.append($('<option>').text(charset));
				});
			}
			that.collations.append($charset);
		});
	}
}
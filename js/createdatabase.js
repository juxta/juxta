/**
 * @class Create Database
 * @extends Juxta.Modal
 * @param {jQuery} element
 * @param {Juxta.Request} request
 */
Juxta.CreateDatabase = function(element, request) {

	Juxta.Modal.prototype.constructor.call(this, element);

	/**
	 * @type {Juxta.Request}
	 */
	this._request = request;


	/**
	 * @type {jQuery}
	 */
	this._form = this._container.find('form[name=create-database]');


	/**
	 * @type {jQuery}
	 */
	this._submit = this._form.find('input[type=submit]');


	this._form.on('submit', (function() { this._createDatabaseRequest(); return false; }).bind(this));

};

Juxta.Lib.extend(Juxta.CreateDatabase, Juxta.Modal);


/**
 * Show dialog window
 *
 * @see {Juxta.Modal.prototype.show}
 * @return {Juxta.CreateDatabase}
 */
Juxta.CreateDatabase.prototype.show = function() {
	//
	Juxta.Modal.prototype.show.apply(this, arguments);

	this._submit.attr('disabled', false);
	this._container.find('input[type=text]').focus().val(null);

	return this;
};


/**
 * Request to create database
 *
 * @return {jqXHR}
 */
Juxta.CreateDatabase.prototype._createDatabaseRequest = function() {
	//
	this._submit.attr('disabled', true);

	return this._request.send({
		action: {create: 'database'},
		data: this._form.serialize(),
		success: this._createDatabaseCallback,
		error: function() { this._submit.attr('disabled', false); },
		context: this
	});
};


/**
 * Callback on database create
 *
 * @return {Juxta.CreateDatabase}
 */
Juxta.CreateDatabase.prototype._createDatabaseCallback = function() {
	//
	this._container.hide();
	this.trigger('created');

	return this;
};
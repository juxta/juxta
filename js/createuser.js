/**
 * @class Create user dialog
 * @extends Juxta.Modal
 * @param {jQuery} element
 */
Juxta.CreateUser = function(element) {

	Juxta.Modal.prototype.constructor.call(this, element, {title: 'Add a User'});

}

Juxta.Lib.extend(Juxta.CreateUser, Juxta.Modal);

/**
 * Show the box
 * @return {Juxta.CreateUser}
 */
Juxta.CreateUser.prototype.show = function() {
	//
	this.container.find('input[type=text]').attr('value', null);

	Juxta.Modal.prototype.show.apply(this, arguments);

	return this;
}
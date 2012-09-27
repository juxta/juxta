/**
 * @class Create User
 * @extend Juxta.FloatBox
 * @param {jQuery} element
 */
Juxta.CreateUser = function(element) {

	Juxta.FloatBox.prototype.constructor.call(this, element, {title: 'Add a User'});

	var that = this;

	this.container.find('.buttons input[value=Create]').click(function() {
		that.hide();
		that.trigger('notify', 'User created');
	});
}

Juxta.Lib.extend(Juxta.CreateUser, Juxta.FloatBox);

/**
 * Show the box
 * @return {Juxta.CreateUser}
 */
Juxta.CreateUser.prototype.show = function() {
	this.container.find('input[type=text]').attr('value', null);
	Juxta.FloatBox.prototype.show.apply(this, arguments);

	return this;
}
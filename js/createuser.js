/**
 * @class Create User
 * @extend Juxta.FloatBox
 * @constructor
 * @param {jQuery} element
 */
Juxta.CreateUser = function(element) {

	Juxta.FloatBox.prototype.constructor.call(this, element, {title: 'Add a User'});

	var that = this;

	this.$floatBox.find('.buttons input[value=Create]').click(function() {
		that.hide();
		Jux.notify('User created');
	});
}

Juxta.Lib.extend(Juxta.CreateUser, Juxta.FloatBox);

/**
 * Show the box
 */
Juxta.CreateUser.prototype.show = function() {
	this.$floatBox.find('input[type=text]').attr('value', null);
	Juxta.FloatBox.prototype.show.apply(this, arguments);

	return this;
}


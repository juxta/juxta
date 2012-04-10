/**
 * @class Dummy application
 * @param {jQuery} element
 */
Juxta.Dummy = function(element) {
	Juxta.Application.prototype.constructor.call(this, element, {header: 'Don\'t work'});
}

Juxta.Lib.extend(Juxta.Dummy, Juxta.Application);

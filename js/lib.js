/**
 * @namespace Utility library
 */
Juxta.Lib = {
}

/**
 * Extend object
 * @static
 * @param {Object} child
 * @param {Object} parent
 * @return {Object}
 */
Juxta.Lib.extend = function (child, parent) {
	var F = function() {};
	F.prototype = parent.prototype;
	F.prototype.constructor = parent;
	return child.prototype = new F;
}
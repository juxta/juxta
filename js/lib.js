/**
 * Juxta 0.0.1
 *
 * Copyright (c) 2010-2011 Alexey Golovnya
 * Licensed under the MIT license
 * http://juxta.ru
 */

/**
 * Utility library
 */
Juxta.Lib = {

	/**
	 * Extend object
	 * @static
	 * @param {Object} child
	 * @param {Object} parent
	 * @retunr {Object}
	 */
	extend: function (child, parent) {
		var F = function() {};
		F.prototype = parent.prototype;
		F.prototype.constructor = parent;
		return child.prototype = new F;
	}

}
/**
 * @class HTML container
 * @constructor
 * @param {HTMLElement} element
 */
Juxta.Container = function(element) {

    /**
     * @type {jQuery}
     */
    this._container = $(element);

};


/**
 * Check container element against a selector
 *
 * @return {Boolean}
 */
Juxta.Container.prototype.is = function() {
    return $.fn.is.apply(this._container, arguments);
};


/**
 * Find elements by selector in current container
 *
 * @return {jQuery}
 */
Juxta.Container.prototype.find = function() {
    return $.fn.find.apply(this._container, arguments);
};


/**
 * Shows the container
 *
 * @return {Juxta.Container}
 */
Juxta.Container.prototype.show = function() {
    //
    $.fn.show.apply(this._container, arguments);

    return this;
};


/**
 * Hides the container
 *
 * @return {Juxta.Container}
 */
Juxta.Container.prototype.hide = function() {
    //
    $.fn.hide.apply(this._container, arguments);

    return this;
};


/**
 * Toggle the container
 *
 * @return {Juxta.Container}
 */
Juxta.Container.prototype.toggle = function() {
    //
    $.fn.toggle.apply(this._container, arguments);

    return this;
};


/**
 * Returns HTML element
 *
 * @return {HTMLElement}
 */
Juxta.Container.prototype.get = function() {
    //
    return $.fn.get.apply(this._container, arguments);
};


/**
 * Get the current computed width or set the CSS width for the container
 *
 * @param {Number} width
 * @return {Number|Juxta.Container}
 */
Juxta.Container.prototype.width = function(width) {
    //
    if (width) {
        $.fn.width.apply(this._container, arguments);
        return this;
    }

    return $.fn.width.apply(this._container, arguments);
};


/**
 * Get the current computed height or set the CSS height for the container
 *
 * @param {Number} height
 * @return {Number|Juxta.Container}
 */
Juxta.Container.height = function(height) {
    //
    if (height) {
        $.fn.height.apply(this._container, arguments);
        return this;
    }

    return $.fn.height.apply(this._container, arguments);
};

define(['jquery'], function ($) {

    /**
     * @class HTML container
     * @constructor
     * @param {HTMLElement} element
     */
    function Container(element) {

        /**
         * @type {jQuery}
         */
        this._container = $(element);

    }

    /**
     * Check container element against a selector
     *
     * @return {Boolean}
     */
    Container.prototype.is = function () {
        return $.fn.is.apply(this._container, arguments);
    };

    /**
     * Find elements by selector in current container
     *
     * @return {jQuery}
     */
    Container.prototype.find = function () {
        return $.fn.find.apply(this._container, arguments);
    };

    /**
     * Shows the container
     *
     * @return {Juxta.Container}
     */
    Container.prototype.show = function () {
        //
        $.fn.show.apply(this._container, arguments);

        return this;
    };

    /**
     * Hides the container
     *
     * @return {Juxta.Container}
     */
    Container.prototype.hide = function () {
        //
        $.fn.hide.apply(this._container, arguments);

        return this;
    };

    /**
     * Toggle the container
     *
     * @return {Juxta.Container}
     */
    Container.prototype.toggle = function () {
        //
        $.fn.toggle.apply(this._container, arguments);

        return this;
    };

    /**
     * Returns HTML element
     *
     * @return {HTMLElement}
     */
    Container.prototype.get = function () {
        //
        return $.fn.get.apply(this._container, arguments);
    };

    /**
     * Get the current computed width or set the CSS width for the container
     *
     * @param {Number} width
     * @return {Number|Juxta.Container}
     */
    Container.prototype.width = function (width) {
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
    Container.prototype.height = function (height) {
        if (height) {
            $.fn.height.apply(this._container, arguments);
            return this;
        }

        return $.fn.height.apply(this._container, arguments);
    };

    return Container;

});

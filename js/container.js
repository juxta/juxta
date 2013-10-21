Juxta.Container = function(element) {

	/**
	 * @type {jQuery}
	 */
	this._container = $(element);

};


/**
 * Check container element against a selector
 *
 * @see <a href="http://api.jquery.com/is/">jQuery.is()</a>
 * @return {Object}
 */
Juxta.Container.prototype.is = function() {
	return $.fn.is.apply(this._container, arguments);
};


/**
 * Find elements by selector in current container
 * @return {Object}
 * @todo Move to abstract Juxta.Widget
 */
Juxta.Container.prototype.find = function() {
	return $.fn.find.apply(this._container, arguments);
};


/**
 * Показывает контейнер
 * @return {Billing.Widget.Abstract}
 */
Juxta.Container.prototype.show = function() {
	//
	$.fn.show.apply(this._container, arguments);

	return this;
};


/**
 * Скрывает контейнер
 * @return {Billing.Widget.Abstract}
 */
Juxta.Container.prototype.hide = function() {
	//
	$.fn.hide.apply(this._container, arguments);

	return this;
};


/**
 * Показывает/скрывает контейнер
 * @return {Billing.Widget.Abstract}
 */
Juxta.Container.prototype.toggle = function() {
	//
	$.fn.toggle.apply(this._container, arguments);

	return this;
};


/**
 * Возвращает DOM элемент
 * @return {HTMLElement}
 */
Juxta.Container.prototype.get = function() {
	//
	return $.fn.get.apply(this._container, arguments);
};


/**
 * Устанавливает/возвращает ширину виджета в пикселях
 * @param {Number} width
 * @return {Number}
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
 * Устанавливает/возвращает высоту виджета в пикселях
 *
 * @param {Number} height
 * @return {Number}
 */
Juxta.Container.height = function(height) {
	//
	if (height) {
		$.fn.height.apply(this._container, arguments);
		return this;
	}

	return $.fn.height.apply(this._container, arguments);
};
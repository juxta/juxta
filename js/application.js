/**
 * @class Application base class
 * @param {jQuery|String} element
 * @param {Object} options
 */
Juxta.Application = function(element, options) {

	/**
	 * @type {Object}
	 */
	this._settings = {
		closable: false,
		maximized: false
	}

	this._settings = $.extend({}, this._settings, options);


	/**
	 * @type {jQuery}
	 * @private
	 */
	this._container = $(element);


	/**
	 * @type {Object}
	 * @private
	 */
	this._menu = this.find('.menu');


	/**
	 * @type {jQuery}
	 */
	this._statusBar = this.find('.status');


	if (this._settings.closable) {
		this.find('.close').show();
		this.find('.close').click(function() { history.back(); });
	} else {
		this.find('.close').hide();
	}

	this.tune(this._settings);
}

Juxta.Lib.extend(Juxta.Application, Juxta.Events);

/**
 * @param {Object} options
 */
Juxta.Application.prototype.tune = function(options) {
	if ($.isPlainObject(options.header)) {
		this.find('h1').html(
			options.header.title + 
			(options.header.name ? ' <a>' + options.header.name + '</a>' : '') +
			(options.header.from ? ' <span class="from">from <a>' + options.header.from + '</a></span>' : '')
		);
	} else{
		this.find('h1').html(options.header);
	}

	this.setMenu(options.menu);
}


/**
 * Show application
 * @param {Object} options
 * @return {Juxta.Application}
 */
Juxta.Application.prototype.show = function(options) {
	//
	if (options) {
		this.tune($.extend({}, this._settings, options));
	}

	if (!this.is(':visible')) {
		$('#applications .application').hide();
		this._container.show();
	}

	if (this._settings.maximized) {
		this.maximize();
	} else {
		this.restore();
	}

	return this;
}


/**
 * Show application and trigger event 'ready'
 * @param {Object} options
 * @return {Juxta.Application}
 */
Juxta.Application.prototype.ready = function(options) {
	//
	this.trigger('ready');
	this.show();

	return this;
}


/**
 * Hide application
 * @return {Juxta.Application}
 */
Juxta.Application.prototype.hide = function() {
	this._container.hide();

	return this;
}


/**
 * Set application menu
 * @param {Object} menu
 * @return {Juxta.Application}
 */
Juxta.Application.prototype.setMenu = function(menu) {
	//
	var that = this;

	this._menu.empty();

	if ($.isPlainObject(menu)) {
		$.each(menu, function(title, action) {
			//
			var item = $('<a>')
				.html(title)
				.attr('disabled', true);

			if (action && typeof action == 'object') {
				if (action.href) {
					item.attr('href', action.href).attr('disabled', false);
				}
				if (action.click && typeof action.click == 'function') {
					item.click(action.click).attr('disabled', false);
				}

			} else if (typeof action == 'function') {
				item.click(action).attr('disabled', false);

			} else if (action) {
				item.attr('href', action).attr('disabled', false);
			}

			that._menu.append(item);
		});
	}

	return this;
}


/**
 * Maximize window
 * @return {Juxta.Applcation}
 */
Juxta.Application.prototype.maximize = function() {
	$('#sidebar').addClass('minimized');
	$('#applications').addClass('maximized');

	return this;
}


/**
 * Restore maximized application to standarts size
 * @return {Juxta.Applcation}
 */
Juxta.Application.prototype.restore = function() {
	$('#sidebar').removeClass('minimized');
	if ($('#applications').removeClass('maximized').is(':visible')) {
		$('#sidebar').show();
	}

	return this;
}


/**
 * Check container element against a selector
 * @return {Object}
 */
Juxta.Application.prototype.is = function() {
	return $.fn.is.apply(this._container, arguments);
}


/**
 * Find elements by selectors in current container
 * @return {Object}
 */
Juxta.Application.prototype.find = function() {
	return $.fn.find.apply(this._container, arguments);
}

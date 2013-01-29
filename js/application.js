/*global history */

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
	};

	$.extend(this._settings, options);


	/**
	 * @type {jQuery}
	 */
	this._container = $(element);


	/**
	 * @type {Object}
	 */
	this._menu = this.find('.menu');


	/**
	 * @type {jQuery}
	 */
	this._status = this.find('.status');


	if (this._settings.closable) {
		this.find('.close').show();
		this.find('.close').click(function() { history.back(); });
	} else {
		this.find('.close').hide();
	}

	this._applySettings(this._settings);

};

Juxta.Lib.extend(Juxta.Application, Juxta.Events);

/**
 * Apply settings to application
 * @param {Object} options
 * @return {Juxta.Application}
 */
Juxta.Application.prototype._applySettings = function(options) {
	//
	if ($.isPlainObject(options.header)) {
		this.find('h1').html(
			options.header.title + 
			(options.header.name ? ' <a>' + options.header.name + '</a>' : '') +
			(options.header.from ? ' <span class="from">from <a>' + options.header.from + '</a></span>' : '')
		);
	} else{
		this.find('h1').html(options.header);
	}

	this._setMenu(options.menu);

	return this;
};


/**
 * Set application menu
 * @param {Object} menu
 * @return {Juxta.Application}
 */
Juxta.Application.prototype._setMenu = function(menu) {
	//
	this._menu.empty();

	if ($.isPlainObject(menu)) {
		//
		var that = this;

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
};


/**
 * Show application
 * @param {Object} options
 * @return {Juxta.Application}
 */
Juxta.Application.prototype.show = function(options) {
	//
	if (options) {
		this._applySettings($.extend({}, this._settings, options));
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
};


/**
 * Show application and trigger event 'ready'
 * @return {Juxta.Application}
 */
Juxta.Application.prototype.ready = function() {
	//
	return this.trigger('ready').show();
};


/**
 * Hide application
 * @return {Juxta.Application}
 */
Juxta.Application.prototype.hide = function() {
	this._container.hide();

	return this;
};



/**
 * Maximize window
 * @return {Juxta.Applcation}
 */
Juxta.Application.prototype.maximize = function() {
	$('#sidebar').addClass('minimized');
	$('#applications').addClass('maximized');

	return this;
};


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
};


/**
 * Check container element against a selector
 * @return {Object}
 * @todo Move to abstract Juxta.Widget
 */
Juxta.Application.prototype.is = function() {
	return $.fn.is.apply(this._container, arguments);
};


/**
 * Find elements by selectors in current container
 * @return {Object}
 * @todo Move to abstract Juxta.Widget
 */
Juxta.Application.prototype.find = function() {
	return $.fn.find.apply(this._container, arguments);
};
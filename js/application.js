/*global history */

/**
 * @class Application base class
 * @abstract
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
	 * @type {jQuery}
	 */
	this._applicationsContainer = $('#applications');


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
 * @param {Object} variables
 * @return {Juxta.Application}
 */
Juxta.Application.prototype._applySettings = function(options, variables) {
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

	this._setMenu(options.menu, variables);

	return this;
};


/**
 * Set application menu
 *
 * @param {Object} menu
 * @param {Object} variables
 * @return {Juxta.Application}
 */
Juxta.Application.prototype._setMenu = function(menu, variables) {
	//
	this._menu.empty();

	if ($.isPlainObject(menu)) {
		$.each(menu, $.proxy(function(title, item) {
			//
			var link = $('<a>').html(title).attr('disabled', true),
				href,
				action,
				name;

			if (item && typeof item == 'object') {
				if (item.href) {
					href= item.href;
				}
				if (item.click && typeof item.click == 'function') {
					action = item.click;
				}
				if (item.name) {
					name = item.name;
				}

			} else if (typeof item == 'function') {
				action = item;

			} else if (item) {
				href = item;
			}

			if (href) {
				link.attr('href', $.template(href, variables)).attr('disabled', false);
			}
			if (action) {
				link.on('click', $.proxy(function (event) { action.call(this, event, variables); }, this)).attr('disabled', false);
			}
			if (name) {
				link.attr('name', name);
			}

			this._menu.append(link);

		}, this));
	}

	return this;
};


/**
 * Show application
 *
 * @param {Object} options
 * @param {Object} variables
 * @return {Juxta.Application}
 */
Juxta.Application.prototype.show = function(options, variables) {
	//
	if (options) {
		this._applySettings($.extend({}, this._settings, options), variables);
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
 *
 * @return {Juxta.Application}
 */
Juxta.Application.prototype.ready = function() {
	//
	return this.trigger('ready').show();
};


/**
 * Hide application
 *
 * @return {Juxta.Application}
 */
Juxta.Application.prototype.hide = function() {
	this._container.hide();

	return this;
};



/**
 * Maximize window
 *
 * @return {Juxta.Applcation}
 */
Juxta.Application.prototype.maximize = function() {
	$('#sidebar').addClass('_minimized');
	$('#applications').addClass('maximized');

	return this;
};


/**
 * Restore maximized application to standards size
 *
 * @return {Juxta.Application}
 */
Juxta.Application.prototype.restore = function() {
	//
	$('#sidebar').removeClass('_minimized');
	if ($('#applications').removeClass('maximized').is(':visible')) {
		$('#sidebar').show();
	}

	return this;
};


/**
 * Check container element against a selector
 *
 * @return {Object}
 * @todo Move to abstract Juxta.Widget
 */
Juxta.Application.prototype.is = function() {
	return $.fn.is.apply(this._container, arguments);
};


/**
 * Find elements by selectors in current container
 *
 * @return {Object}
 * @todo Move to abstract Juxta.Widget
 */
Juxta.Application.prototype.find = function() {
	return $.fn.find.apply(this._container, arguments);
};
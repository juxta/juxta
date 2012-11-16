/**
 * @class Application base class
 * @param {jQuery|String} element
 * @param {Object} options
 */
Juxta.Application = function(element, options) {

	/**
	 * @type {Object}
	 */
	this.settings = {
		closable: false,
		maximized: false
	}

	this.settings = $.extend({}, this.settings, options);


	/**
	 * @type {jQuery}
	 * @private
	 */
	this._container = $(element);

	/**
	 * @type {jQuery}
	 * @deprecated
	 */
	this.$application = this._container;


	/**
	 * @type {jQuery}
	 */
	this.$menu = this.$application.find('.menu');


	/**
	 * @type {jQuery}
	 */
	this.$statusBar = this.$application.find('.status');

	this.tune(this.settings);

	if (this.settings.closable) {
		this.$application.find('.close').show();
		this.$application.find('.close').click(function() { history.back(); });
	} else {
		this.$application.find('.close').hide();
	}

}

Juxta.Lib.extend(Juxta.Application, Juxta.Events);

/**
 * @param {Object} options
 */
Juxta.Application.prototype.tune = function(options) {
	if ($.isPlainObject(options.header)) {
		this.$application.find('h1').html(
			options.header.title + 
			(options.header.name ? ' <a>' + options.header.name + '</a>' : '') +
			(options.header.from ? ' <span class="from">from <a>' + options.header.from + '</a></span>' : '')
		);
	} else{
		this.$application.find('h1').html(options.header);
	}
	this.menu(options.menu);
}


/**
 * Show application
 * @param {Object} options
 * @return {Juxta.Application}
 */
Juxta.Application.prototype.show = function(options) {
	//
	if (options) {
		this.tune($.extend({}, this.settings, options));
	}

	if (!this.$application.is(':visible')) {
		$('#applications .application').hide();
		this.$application.show();
	}

	if (this.settings.maximized) {
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
	this.$application.hide();

	return this;
}


/**
 * Set application menu
 * @param {Object} menu
 */
Juxta.Application.prototype.menu = function(menu) {
	this.$menu.empty();
	var that = this;
	if ($.isPlainObject(menu)) {
		$.each(menu, function(title, action) {
			var item = $('<a>').html(title);
			if ($.isPlainObject(action)) {
				if (action.href) {
					item.attr('href', action.href);
				}
				if (action.click && typeof action.click == 'function') {
					item.click(action.click);
				}
			} else if (action) {
				item.attr('href', action);
			}
			that.$menu.append(item);
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
 * Set status text
 * @param {String} text
 * @return {Juxta.Application}
 */
Juxta.Application.prototype.status = function(text) {
	this.$statusBar.text(text);

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
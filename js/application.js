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
	 */
	this.$application = $(element);


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
 */
Juxta.Application.prototype.show = function(options) {
	if (!options) {
		// @todo Remove global
		Jux.show();
	} else {
		options = $.extend({}, this.settings, options);
		this.tune(options);
	}

	if (!this.$application.is(':visible')) {
		$('#applications .application').hide();
		this.$application.show();
	}

	if (this.settings.maximized) {
		this.maximize();
	} else{
		this.restore();
	}

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
		jQuery.each(menu, function(title, action) {
			if ($.isPlainObject(action)) {
				that.$menu.append('<a href="' + (action.href ? action.href : '') + (action.click ? '" onclick="' + action.click + '"' : '"') + '>' + title + '</a>');
			} else if (action) {
				that.$menu.append('<a href="' + action + '">' + title + '</a>');
			} else{
				that.$menu.append('<a>' + title + '</a>');
			}
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

/*global document */

/**
 * @class Modal dialog
 * @param element
 * @param options
 */
Juxta.Modal = function(element, options) {

	/**
	 * Settings
	 * @type {Object}
	 */
	this._settings = {
		title: 'New window',
		closable: true,
		center: true
	};


	/**
	 * @type {jQuery}
	 */
	this._container = $(element);

	this.container = this._container;


	/**
	 * @type {jQuery}
	 */
	this.header =  this.container.find('h3');

	if (!this.header.is('h3')) {
		this.header = this.container.prepend('<h3>'+ this._settings.title + '</h3>').find('h3');
	}


	/**
	 * Close button
	 * @type {jQuery}
	 */
	this.close = this.container.find('input[type=button].close');


	$.extend(this._settings, options);

	if (!this.close.is('input')) {
		this.close = $('<input>').attr('type', 'button').addClass('close').insertAfter(this.header).attr('disabled', !this._settings.closable);
	}

	this._settings.title = this.header.html();

	this.close.click($.proxy(this.hide, this));

	this.container.draggable({scroll: false, handle: 'h3'});

	this.center();
};

Juxta.Lib.extend(Juxta.Modal, Juxta.Events);

/**
 * Show a float box
 * @param {Object} options
 * @param {String} content
 * @return {Juxta.Modal}
 */
Juxta.Modal.prototype.show = function(options, content) {
	//
	this.trigger('before-show');

	options = $.extend({}, this._settings, options);
	if (options.name) {
		options.name = '<a href="">' + options.name + '</a>';
	}
	if (options.from) {
		options.from = '<span class="from">from <a>' + options.from + '</a></span>';
	}

	this.header.html($.template(options.title, options));

	// Append content
	if (content) {
		this.clear();
		$(content).insertAfter(this.close);
	}

	this.container.show();

	if (options.center) {
		this.center();
	}

	this.trigger('show');

	return this;
};


/**
 * Hide a float box
 * @return {Juxta.Modal}
 */
Juxta.Modal.prototype.hide = function() {
	//
	this.container.hide();
	this.trigger('hide');

	return this;
};


/**
 * Center a box
 * @return {Juxta.Modal}
 */
Juxta.Modal.prototype.center = function() {
	//
	var height = $(document.body).height(),
		width = $(document.body).width(),
		left = (width - this.container.width()) / 2,
		top = parseInt(0.75 * (height - this.container.height()) / 2, 10);

	if (top <= 5) {
		top = 5;
	}

	this.container.css({left: left, top: top});

	return this;
};


/**
 * Clear a box
 * @return {Juxta.Modal}
 */
Juxta.Modal.prototype.clear = function() {
	//
	this.container.find('> *:not(h3):not([type=button].close)').remove();

	return this;
};

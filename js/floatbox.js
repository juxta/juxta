Juxta.FloatBox = function(element, options) {

	/**
	 * Settings
	 * @type {Object}
	 */
	this.settings = {
		title: 'New window',
		closable: true,
		center: true
	};

	this.settings = $.extend({}, this.settings, options);


	/**
	 * @type {jQuery}
	 */
	this.container = $(element);


	/**
	 * @type {jQuery}
	 */
	this.header =  this.container.find('h3');

	if (!this.header.is('h3')) {
		this.header = this.container.prepend('<h3>'+ this.settings.title + '</h3>').find('h3');
	}


	/**
	 * Close button
	 * @type {jQuery}
	 */
	this.close = this.container.find('input[type=button].close');

	if (!this.close.is('input')) {
		this.close = $('<input>').attr('type', 'button').addClass('close').insertAfter(this.header).attr('disabled', !this.settings.closable);
	}


	this.settings.title = this.header.html();

	this.close.click($.proxy(this.hide, this));

	this.container.draggable({scroll: false, handle: 'h3'});

	this.center();
}

Juxta.Lib.extend(Juxta.FloatBox, Juxta.Events);

/**
 * Show a float box
 * @param {} options
 * @param {} content
 * @return {Juxta.FloatBox}
 */
Juxta.FloatBox.prototype.show = function(options, content) {
	//
	this.trigger('before-show');

	options = $.extend({}, this.settings, options);
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
}


/**
 * Hide a float box
 * @return {Juxta.FloatBox}
 */
Juxta.FloatBox.prototype.hide = function() {
	//
	this.container.hide();
	this.trigger('hide');

	return this;
}


/**
 * Center a box
 * @return {Juxta.FloatBox}
 */
Juxta.FloatBox.prototype.center = function() {
	//
	var height = $(document.body).height(),
		width = $(document.body).width(),
		left = (width - this.container.width()) / 2,
		top = parseInt(0.75 * (height - this.container.height()) / 2);

	if (top <= 5) {
		top = 5;
	}

	this.container.css({left: left, top: top});

	return this;
}


/**
 * Clear a box
 * @return {Juxta.FloatBox}
 */
Juxta.FloatBox.prototype.clear = function() {
	this.container.find('> *:not(h3):not([type=button].close)').remove();
	return this;
}

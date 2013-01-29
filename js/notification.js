/**
 * @class Notifications
 */
Juxta.Notification = function() {

	/**
	 * @type {jQuery}
	 */
	this.container = $('#notify ul');


	/**
	 * @type {}
	 */
	this.load = null;


	/**
	 * @type {Number}
	 */
	this.loads = 0;


	/**
	 * @type {Object}
	 */
	this.settings = {
		hide: true,
		delay: 3000,
		hideSpeed: 300
	};


	/**
	 * @type {Object}
	 */
	this.loadingSettings = {
		hide: false,
		delay: 250,
		hideSpeed: 100,
		type: 'loading'
	};

};


/**
 * @param {String} message
 * @param {Object} options
 * @return {jQuery}
 */
Juxta.Notification.prototype.show = function(message, options) {
	//
	var that = this, notify;

	options = $.extend({}, that.settings, options);

	if (options.fast) {
		this.container.empty();
	}

	if (options.element) {
		notify = options.element;
	} else {
		notify = $('<li><span></span></li>').appendTo(this.container);
	}

	notify.show().find('span').text(message);

	if (options.hide) {
		this.hide(notify, options);
	}

	return notify.find('span').addClass(options.type);
};


/**
 * @param {jQuery} element
 * @param {Object} options
 */
Juxta.Notification.prototype.hide = function(element, options) {
	if (arguments.length == 2) {
		element.delay(options.delay).slideUp(options.hideSpeed, function() { $(this).remove(); });
		this.load = null;
	} else {
		this.load = null;
		this.loads = 0;
		this.container.empty();
	}
};


/**
 * @param {String} message
 * @param {Object} options
 */
Juxta.Notification.prototype.loading = function(message, options) {
	var that = this;
	options = $.extend({}, that.loadingSettings, options);
	if (message === false && this.load) {
		if (--this.loads === 0) {
			this.hide(this.load, options);
		}
	} else if(message !== false) {
		if (this.loads++ === 0) {
			this.container.empty();
			message = message || 'Loading..'; 
			if (this.load) {
				options.element = this.load;
			}
			this.load = this.show(message, options);
		}
	}
};
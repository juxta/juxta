/**
 * @class Notifications
 */
Juxta.Notification = function(element) {

	/**
	 * @type {jQuery}
	 */
	this._container = $(element);


	/**
	 * @type {jQuery}
	 */
	this._load = null;


	/**
	 * @type {Number}
	 */
	this._count = 0;


	/**
	 * @type {Object}
	 */
	this._settings = {
		hide: true,
		delay: 3000,
		hideSpeed: 300
	};


	/**
	 * @type {Object}
	 */
	this._showLoadingMessageParams = {
		hide: false,
		delay: 250,
		hideSpeed: 100,
		type: 'loading'
	};

};


/**
 * Notify
 *
 * @param {String} message
 * @param {Object} options
 * @return {jQuery}
 */
Juxta.Notification.prototype.show = function(message, options) {
	//
	var notify;

	options = $.extend({}, this._settings, options);

	if (options.fast) {
		this._container.empty();
	}

	if (options.element) {
		notify = options.element;

	} else {
		notify = $('<li>').addClass('notifications-message-container')
			.appendTo(this._container)
			.append($('<span>').addClass('notifications-message'));
	}

	notify.show().find('.notifications-message')
		.addClass('_' + options.type)
		.text(message);

	if (options.hide) {
		this.hide(notify, options);
	}

	return notify;
};


/**
 * Hide a notification
 * @param {jQuery} element
 * @param {Object} options
 */
Juxta.Notification.prototype.hide = function(element, options) {
	//
	this._load = null;

	if (arguments.length == 2) {
		element.delay(options.delay).slideUp(options.hideSpeed, function() { $(this).remove(); });

	} else {
		this._count = 0;
		this._container.empty();
	}
};


/**
 * Show loading notification
 *
 * @param {String} message
 * @param {Object} options
 * @return {jQuery}
 */
Juxta.Notification.prototype.loading = function(message, options) {
	//
	options = $.extend({}, this._showLoadingMessageParams, options);

	if (message === false && this._load) {
		if (--this._count === 0) {
			this.hide(this._load, options);
		}
	} else if (message !== false) {

		if (this._count++ === 0) {
			this._container.empty();
			if (this._load) {
				options.element = this._load;
			}
			this._load = this.show(message || 'Loading..', options);

			return this._load;
		}
	}
};
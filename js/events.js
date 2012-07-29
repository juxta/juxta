/**
 * @class Events
 */
Juxta.Events = function() {

	/**
	 * List of bound callbacks by event
	 * @type {Object}
	 */
	this._callbacks = {};

}


/**
 * Bind a function to an event
 * @param {String} event
 * @param {Function} callback
 * @return {*}
 */
Juxta.Events.prototype.on = function(event, callback) {
	if (!this._callbacks) {
		this._callbacks = {};
	}

	if (!this._callbacks[event]) {
		this._callbacks[event] = [];
	}

	this._callbacks[event].push(callback);

	return this;
}


/**
 * Unbind a callback
 * @param event
 * @param callback
 * @return {Boolean}
 */
Juxta.Events.prototype.off = function(event, callback) {
	if (!this._callbacks) {
		this._callbacks = {};
		return this;
	}

	if (!this._callbacks[event]) {
		return this;
	}

	if (!callback) {
		delete this._callbacks[event];
		return this;
	}

	for (var i = this._callbacks[event].length - 1; i >= 0; i--) {
		subscription = this._callbacks[event][i];
		if (this._callbacks[event][i] === callback) {
			this._callbacks[event].splice(i, 1);
		}
	}
}


/**
 * Trigger an event
 * @param {String} event
 * @return {*}
 */
Juxta.Events.prototype.trigger = function(event) {
	if (!this._callbacks) {
		this._callbacks = {};
		return this;
	}

	if (!this._callbacks[event]) {
		return this;
	}

	var args = [], callback;
	for (var i = 1, length = arguments.length; i < length; i++) {
		args.push(arguments[i]);
	}

	for (var i = 0, length = this._callbacks[event].length; i < length; i++) {
		callback = this._callbacks[event][i];
		if (typeof callback == 'function') {
			callback.apply(this, args);
		}
	}

	return this;
}

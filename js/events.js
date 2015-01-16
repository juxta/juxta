/**
 * @class Events
 */
Juxta.Events = function() {

    /**
     * List of bound callbacks by event
     * @type {Object}
     */
    this._callbacks = {};

};


/**
 * Bind a function to an event
 *
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
};


/**
 * Unbind a callback
 *
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
        if (this._callbacks[event][i] === callback) {
            this._callbacks[event].splice(i, 1);
        }
    }
};


/**
 * Trigger an event
 *
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

    var args = [],
        callback;

    for (var i = 1, argumentsLength = arguments.length; i < argumentsLength; i++) {
        args.push(arguments[i]);
    }

    for (var j = 0, callbacksLength = this._callbacks[event].length; j <callbacksLength; j++) {
        callback = this._callbacks[event][j];
        if (typeof callback == 'function') {
            callback.apply(this, args);
        }
    }

    return this;
};

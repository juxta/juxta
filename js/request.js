/**
 * @class Common Ajax request/response interface
 * @param {Juxta.Cache} Cache
 * @param {Object} Request and reponse options
 */
Juxta.Request = function(connection, cache, options) {

	/**
	 * @type {Juxta.Connection}
	 */
	this.connection = connection;


	/**
	 * Cache
	 * @type {Juxta.Cache}
	 */
	this.cache = cache;


	/**
	 * Ajax options
	 * @type {Object}
	 */
	this._ajaxSettings = {
		url: 'php/',
		dataType: 'json',
		type: 'POST',
		data: {
			debug: true
		}
	}

	if (options && !$.isEmptyObject(options.request)) {
		$.extend(this._ajaxSettings, options.request);
	}

	$.ajaxSetup(this._ajaxSettings);

	/**
	 * Response status callbacks
	 * @type {Object}
	 */
	this._responseCallbacks = {
		connectionError: null,
		sessionNotFound: null,
		error: null,
		unknowStatus: null
	}

	if (options && !$.isEmptyObject(options.response)) {
		$.extend(this._responseCallbacks, options.response);
	}

}


/**
 * Make an AJAX request
 * @return {jqXHR}
 */
Juxta.Request.prototype.send = function (params) {
	var that = this,
		queryString = this.queryString(params.action);

	params.url = this._ajaxSettings.url + '?' + queryString;

	// Cache options
	var cache = {};
	if (params.cache !== undefined && params.cache !== false) {
		cache = {key: queryString, time: params.cache};
		if (params.index) {
			cache.index = params.index;
		}
	}

	// Collect response callbacks
	var callbacks = {};
	if ($.isFunction(params.success)) {
		callbacks.ok = params.context ? $.proxy(params.success, params.context) : params.success;
		delete(params.success);
	}
	if ($.isFunction(params.error)) {
		callbacks.error = params.error ? $.proxy(params.error, params.context) : params.error;
		delete(params.error);
	}

	// Response
	params.success = function (data) {
		that._response(data, callbacks, cache);
	}

	var getSession = new jQuery.Deferred(),
		getResponse = new jQuery.Deferred();

	if (!this.connection.is()
		&& queryString !== 'get=connections'
		&& queryString !== 'login'
	) {
		$.ajax({
			url: this._ajaxSettings.url + '?get=session',
			success: function(response) {
				if (response.connection) {
					that.connection.set(response.connection);
					getSession.resolveWith(that);
				} else if (response.status === 'session_not_found'
					&& $.isFunction(that._responseCallbacks.sessionNotFound)
				) {
					that._responseCallbacks.sessionNotFound.call(that, response);
				} else {
					throw new Error('Getting connection information failed');
				}
			}
		});
	} else {
		getSession.resolveWith(this);
	}

	// Response from cache or make request
	getSession.done(function() {
		var fromCache = null;
		if (params.refresh !== true) {
			fromCache = this.cache.get(queryString);
		}
		if (fromCache) {
			fromCache.cache = true;
			params.success(fromCache);
			getResponse.resolve();
			return;
		} else {
			return $.ajax(params).done(function() { getResponse.resolve(); });
		}
	});

	return getResponse;
}


/**
 * Success response callback
 *
 */
Juxta.Request.prototype._response = function(response, callbacks, cache) {
	switch (response.status) {
		case 'ok':
			if (cache.key) {
				this.cache.set(cache.key, response, cache.time, cache.index);
			}
			if ($.isFunction(callbacks.ok)) {
				callbacks.ok(response);
			}
			break;

		case 'connection_error':
			if ($.isFunction(this._responseCallbacks.connectionError)) {
				this._responseCallbacks.connectionError.call(this, response);
			}
			break;

		case 'session_not_found':
			if ($.isFunction(this._responseCallbacks.sessionNotFound)) {
				this._responseCallbacks.sessionNotFound.call(this, response);
			}
			break;

		case 'error':
			if ($.isFunction(callbacks.error)) {
				callbacks.error(response);
			}
			if ($.isFunction(this._responseCallbacks.error)) {
				this._responseCallbacks.error.call(this, response);
			}
			break;

		default:
			if ($.isFunction(this._responseCallbacks.unknowStatus)) {
				this._responseCallbacks.unknowStatus.call(this, response);
			}
	}
}


/**
 * Create a serialized representation of object for query
 * @returns {String}
 */
Juxta.Request.prototype.queryString = function(action) {
	var query = action;
	if (query && $.isPlainObject(query) && !$.isEmptyObject(query)) {
		query = $.param(query);
	}

	return query;
}

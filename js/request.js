/**
 * @class Common Ajax request/response interface
 *
 * @param {Juxta.Cache} Cache
 * @param {Object} Request and reponse options
 */
Juxta.Request = function(connection, cache, options) {

	/**
	 * @type {Juxta.Connection}
	 */
	this.connection = connection;


	/**
	 * @type {Juxta.Cache}
	 */
	this.cache = cache;


	/**
	 * @type {Object}
	 */
	this._ajaxSettings = {
		url: 'php/',
		dataType: 'json',
		type: 'POST',
		data: {
			debug: true
		}
	};

	if (options && !$.isEmptyObject(options.request)) {
		$.extend(this._ajaxSettings, options.request);
	}

	$.ajaxSetup(this._ajaxSettings);

	/**
	 * @type {Object}
	 */
	this._responseCallbacks = {
		connectionError: null,
		sessionNotFound: null,
		queryError: null,
		error: null
	};

	if (options && !$.isEmptyObject(options.response)) {
		$.extend(this._responseCallbacks, options.response);
	}

};


/**
 * Make an AJAX request
 *
 * @param {Object} params
 * @return {jqXHR}
 */
Juxta.Request.prototype.send = function (params) {
	//
	var that = this,
		cid = Number(params.action.cid),
		cache = {},
		callbacks = {},
		getSession = new jQuery.Deferred(),
		getResponse = new jQuery.Deferred(),
		fromCache = null,
		queryString;

	if (isNaN(cid)) {
		cid = this.connection.get('cid');
	}

	if (cid !== undefined && params.action !== 'login' && params.action !== 'get=connections' && params.action.get !== 'connections') {
		if (typeof params.action === 'object') {
			params.action.cid = cid;
		} else {
			params.action = 'cid=' + cid + '&' + params.action;
		}
	}

	// Change current connection
	if (this.connection.is(cid)) {
		this.connection.set(cid);
	}

	queryString = this.queryString(params.action);

	// Cache options
	if (params.cache !== undefined && params.cache !== false) {
		cache = {key: queryString, time: params.cache};
		if (params.index) {
			cache.index = params.index;
		}
	}

	// Collect response callbacks
	if ($.isFunction(params.success)) {
		callbacks.ok = params.context ? params.success.bind(params.context) : params.success;
		delete(params.success);
	}
	if ($.isFunction(params.error)) {
		callbacks.error = params.context ? params.error.bind(params.context) : params.error;
		delete(params.error);
	}

	// Response
	params.success = function(data) {
		that._response(data, callbacks, cache);
	};

	if (!this.connection.is(cid) && queryString.search('get=connections') < 0 && queryString.search('login') < 0) {
		//
		$.ajax({
			url: this._ajaxSettings.url + '?get=session&cid=' + cid,
			success: function(response) {
				if (response.cid !== undefined) {
					that.connection.set(cid, response);
					getSession.resolveWith(that);

				} else if (response.error === 'session_not_found' &&
					$.isFunction(that._responseCallbacks.sessionNotFound)
				) {
					that._responseCallbacks.sessionNotFound.call(that, response);
				}
			}
		});

	} else {
		getSession.resolveWith(this);
	}

	params.url = this._ajaxSettings.url + '?' + queryString;

	// Response from cache or make request
	getSession.done(function() {
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
};


/**
 * Success response callback
 *
 */
Juxta.Request.prototype._response = function(response, callbacks, cache) {
	//
	if (response && response.error) {
		switch (response.error) {
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

			case 'query_error':
				if ($.isFunction(this._responseCallbacks.queryError)) {
					this._responseCallbacks.queryError.call(this, response);
				}
				break;

			default:
				if ($.isFunction(this._responseCallbacks.error)) {
					this._responseCallbacks.error.call(this, response);
				}
		}

		if ($.isFunction(callbacks.error)) {
			callbacks.error(response);
		}

		return;
	}

	if (cache.key) {
		this.cache.set(cache.key, response, cache.time, cache.index);
	}

	if ($.isFunction(callbacks.ok)) {
		callbacks.ok(response);
	}
};


/**
 * Create a serialized representation of object for query
 *
 * @returns {String}
 */
Juxta.Request.prototype.queryString = function(action) {

	var query = action;
	if (query && $.isPlainObject(query) && !$.isEmptyObject(query)) {
		query = $.param(query);
	}

	return query;
};

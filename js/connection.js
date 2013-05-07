/**
 * @class Connection
 */
Juxta.Connection = function() {

	/**
	 * Connections data
	 * @type {Object}
	 */
	this._connections = {};


	/**
	 * Current connection ID
	 * @type {Number}
	 */
	this._current = null;

};

Juxta.Lib.extend(Juxta.Connection, Juxta.Events);


/**
 * Set connection
 * @param {Number} cid
 * @param {Object} connection
 */
Juxta.Connection.prototype.set = function(cid, connection) {
	//
	if (connection) {
		connection.cid = Number(cid);
		this._connections[cid] = connection;
	}

	if (this.is(cid) && this._current !== cid) {
		this._current = Number(cid);
		this.trigger('change');
	}

	return this;
};


Juxta.Connection.prototype.setCurrent = function(cid) {

	if (this.is(cid) && this._current != cid) {
		this._current = cid;
		this.trigger('change');
	}

	return this;
};


/**
 * Get connection object
 * @param param
 * @return {*}
 */
Juxta.Connection.prototype.get = function(param) {
	//
	if (typeof param === 'undefined') {
		return this._connections[this._current];
	}

	if (this._current !== null && this._connections[this._current]) {
		return this._connections[this._current][param];
	}
};


/**
 * Check connection
 * @return {Boolean}
 */
Juxta.Connection.prototype.is = function (cid) {
	return this._connections[cid] !== undefined;
};

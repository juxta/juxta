/**
 * @class Connection
 */
Juxta.Connection = function() {

	/**
	 * Connection data
	 * @type {Object}
	 */
	this._connection;

}

Juxta.Lib.extend(Juxta.Connection, Juxta.Events);


/**
 * Set connection
 * @param {Object} connection
 */
Juxta.Connection.prototype.set = function(connection) {
	this._connection = connection;
	this.trigger('change');
}


/**
 * Get connection object
 * @param param
 * @return {*}
 */
Juxta.Connection.prototype.get = function(param) {
	if (typeof param === 'undefined') {
		return this._connection;
	}

	if (param && this._connection[param]) {
		return this._connection[param];
	}
}


/**
 * Check connection
 * @return {Boolean}
 */
Juxta.Connection.prototype.is = function () {
	return typeof this._connection != 'undefined';
}
/**
 * @class Connection
 */
Juxta.Connection = function() {

	/**
	 * Connection data
	 * @type {Object}
	 */
	this._connection;


	/**
	 * Set connection
	 * @param {Object} connection
	 */
	this.set = function(connection) {
		this._connection = connection;
		this.trigger('change');
	}


	/**
	 * Get connection object
	 * @param param
	 * @return {*}
	 */
	this.get = function(param) {
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
	this.is = function () {
		return typeof this._connection != 'undefined';
	}

}

Juxta.Lib.extend(Juxta.Connection, Juxta.Events);

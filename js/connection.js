define(['events'], function (Events) {

    /**
     * @class Connection
     */
    function Connection() {

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

    }

    Connection.prototype = Object.create(Events.prototype);

    /**
     * Set connection
     *
     * @param {Number} cid
     * @param {Object} connection
     */
    Connection.prototype.set = function (cid, connection) {
        //
        if (connection) {
            connection.cid = Number(cid);
            this._connections[cid] = connection;
        }

        if (this.is(cid) && this._current !== cid) {
            this._current = Number(cid);
            this.trigger('change', this._current);
        }

        return this;
    };

    /**
     * Get connection object
     *
     * @param param
     * @return {*}
     */
    Connection.prototype.get = function (param) {
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
     *
     * @return {Boolean}
     */
    Connection.prototype.is = function (cid) {
        return this._connections[cid] !== undefined;
    };

    /**
     * Check connection is current
     *
     * @return {Boolean}
     */
    Connection.prototype.isCurrent = function (cid) {
        return this._current !== null && this._current === cid;
    };

    /**
     * Reset current connection
     *
     * @return {this}
     */
    Connection.prototype.reset = function () {
        //
        this._current = null;
        this.trigger('change');

        return this;
    };

    return Connection;

});

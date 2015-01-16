/**
 * @class Cache
 */
Juxta.Cache = function() {

    /**
     * @type {Number}
     */
    var defaultLifeTime = 10000;

    /**
     * @type {Object}
     */
    this._cache = {};


    /**
     * @param {String} key
     */
    this.get = function(key) {
        var timestamp = (new Date()).getTime();

        if (this._cache[key] && this._cache[key].expire >= timestamp) {
            return this._cache[key].data;
        } else if (this._cache[key]) {
            this.flush(key);
            return undefined;
        } else {
            return undefined;
        }
    };


    /**
     * @param {String} key
     * @param {} data
     * @param {Number} lifeTime
     * @param {Object} index
     */
    this.set = function(key, data, lifeTime, index) {
        var expire,
            timestamp = (new Date()).getTime();
        //
        if (lifeTime === 0 || lifeTime === Infinity) {
            expire = Infinity;
        } else if (lifeTime === true || lifeTime === undefined) {
            expire = timestamp + defaultLifeTime;
        } else if (Number(lifeTime) > 0) {
            expire = timestamp + lifeTime * 1000;
        }

        if (expire) {
            this._cache[key] = {data: data, expire: expire};
            if (index) {
                this.index(key, index);
            }
            return true;
        } else {
            return false;
        }
    };


    /**
     * Flush data by key
     * @param {String} key
     */
    this.flush = function(key) {
        if (key) {
            delete this._cache[key];
        } else {
            this._cache = {};
        }
    };


    /**
     * Index data in cache
     * @param {String} key
     * @param {Object} params
     */
    this.index = function(key, params) {
        if (this._cache[key]) {
            var data = this._cache[key].data,
                path = params.path;
            if (path && typeof path !== 'object') {
                data = data[path];
            } else if (path) {
                for (var i in path) {
                    if (data[path[i]]) {
                        data = data[path[i]];
                    }
                }
            }

            if (this._cache[key].index === undefined) {
                this._cache[key].index = {};
            }

            if (params.name && params.field !== undefined) {
                var field = params.field,
                    index = params.name;
                this._cache[key].index[index] = {};
                for (var row in data) {
                    if (data[row][field] !== undefined) {
                        if (path !== undefined) {
                            this._cache[key].index[index][data[row][field]] = [row, path];
                        } else {
                            this._cache[key].index[index][data[row][field]] = row;
                        }
                    }
                }
            }
        }
    };


    /**
     * Search data using index
     * @params {String} key
     * @params {String} search
     */
    this.search = function(key, search) {
        //
        var path,
            row,
            data;

        if (this._cache[key].index) {
            if (typeof search === 'object') {
                //
                for (var index in search) {
                    break;
                }

                if (index && this._cache[key].index[index] && this._cache[key].index[index][search[index]]) {

                    if (typeof this._cache[key].index[index][search[index]] === 'object') {
                        path = this._cache[key].index[index][search[index]][1];
                        row = this._cache[key].index[index][search[index]][0];
                    } else {
                        row = this._cache[key].index[index][search[index]][0];
                    }

                    data = this._cache[key].data;

                    if (path) {
                        for (var i in path) {
                            if (data[path[i]]) {
                                data = data[path[i]];
                            }
                        }
                    }

                    if (row && data[row]) {
                        return data[row];
                    }
                }
            }
        }
    };

};

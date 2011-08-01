/**
 * @class Cache
 */
Juxta.Cache = function() {

	this.cache = {};

	var defaultLifeTime = 10000;

	this.get = function(key) {
		var timestamp = (new Date()).getTime();

		if (this.cache[key] && this.cache[key]['expire'] >= timestamp) {
			return this.cache[key]['data'];
		} else if (this.cache[key]) {
			this.flush(key);
			return undefined;
		} else {
			return undefined;
		}
	}

	this.set = function(key, data, lifeTime) {
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
			this.cache[key] = {data: data, expire: expire};
			return true;
		} else {
			return false;
		}
	}

	this.flush = function(key) {
		if (key) {
			delete this.cache[key];
		} else {
			this.cache = {};
		}
	}

	/**
	 * Index data in cache
	 * @param {String} key
	 * @param {Object} params
	 */
	this.index = function(key, params) {
		if (this.cache[key]) {
			var data = this.cache[key]['data'],
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

			if (this.cache[key]['index'] === undefined) {
				this.cache[key]['index'] = {};
			}

			if (params.name && params.field !== undefined) {
				var field = params.field,
					index = params.name;
				this.cache[key]['index'][index] = {};
				for (var row in data) {
					if (data[row][field] !== undefined) {
						if (path !== undefined) {
							this.cache[key]['index'][index][data[row][field]] = [row, path];
						} else {
							this.cache[key]['index'][index][data[row][field]] = row;
						}
					}
				}
			}
		}
	}

	/**
	 * Search data using index
	 * @params {String} key
	 * @params {String} search
	 */
	this.search = function(key, search) {
		if (this.cache[key]['index']) {
			if (typeof search === 'object') {
				for (var index in search) break;
				if (index && this.cache[key]['index'][index] && this.cache[key]['index'][index][search[index]]) {
					if (typeof this.cache[key]['index'][index][search[index]] === 'object') {
						var path = this.cache[key]['index'][index][search[index]][1],
							row = this.cache[key]['index'][index][search[index]][0];
					} else {
						var row = this.cache[key]['index'][index][search[index]][0];
					}
					var data = this.cache[key]['data'];
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
	}

}

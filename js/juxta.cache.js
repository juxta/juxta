Juxta.Cache = $.Class();
Juxta.Cache.prototype = {
	cache: {},
	defaultLifeTime: 10000,

	get: function(key) {
		var timestamp = (new Date()).getTime();

		if (this.cache[key] && this.cache[key]['expire'] >= timestamp) {
			return this.cache[key]['data'];
		} else if (this.cache[key]) {
			this.flush(key);
			return undefined;
		} else {
			return undefined;
		}
	},
	set: function(key, data, lifeTime) {
		var expire,
			timestamp = (new Date()).getTime();
		//
		if (lifeTime === 0 || lifeTime === Infinity) {
			expire = Infinity;
		} else if (lifeTime === true || lifeTime === undefined) {
			expire = timestamp + this.defaultLifeTime;
		} else if (Number(lifeTime) > 0) {
			expire = timestamp + lifeTime * 1000;
		}
		//
		if (expire) {
			this.cache[key] = {data: data, expire: expire};
			return true;
		} else {
			return false;
		}
	},
	flush: function(key) {
		if (key) {
			delete this.cache[key];
		} else {
			this.cache = {};
		}
	}
}

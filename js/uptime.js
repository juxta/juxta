/**
 * @class Server uptime
 * @param {jQuery, String} Container
 */
Juxta.Uptime = function(container) {

	/**
	 * @type {jQuery}
	 */
	var _container = $(container);

	/**
	 * @type {String}
	 */
	var _selector = _container.selector;

	/**
	 * @type {Number}
	 */
	var _time;

	/**
	 * @type {String}
	 */
	var _interval;

	/**
	 * @type {String}
	 */
	var _state = null;

	/**
	 *  Timer
	 */
	var _timer = function() {
		//
		var days,
			hours,
			minutes,
			seconds = _time;

		days = Math.floor(seconds / (3600 * 24));
		seconds = Math.round(seconds / (3600 * 24) % 1 * (3600 * 24));
		hours = Math.floor(seconds / 3600);
		seconds = Math.round(seconds / 3600 % 1 * 3600);
		minutes = Math.floor(seconds / 60);
		seconds = Math.round(seconds / 60 % 1 * 60);

		_time++;

		var state = [days, hours, minutes].join();
		if (state === _state) {
			return;
		}
		
		_state = state;

		var uptimeString = '';
		if (days === 0 && hours === 0) {
			//
			if (minutes === 0) {
				minutes = 1;
			}
			uptimeString = minutes;
			if (minutes === 1) {
				uptimeString += ' minute';
			} else {
				uptimeString += ' minutes';
			}
		} else {
			if (days) {
				uptimeString += days;
				if (days === 1) {
					uptimeString += ' day, ';
				} else {
					uptimeString += ' days, ';
				}
			}

			uptimeString += hours + ':';

			// Minutes with leading zero
			uptimeString += (minutes < 10 ? '0' : '') + minutes;
		}

		_container.text(uptimeString);
	}
	
	var _startTime;

	/**
	 * Start timer
	 * @method start
	 */
	this.start = function(uptime) {
		//
		this.stop();

		_container = $(_selector);

		var that = this;
		_time = uptime;
		_startTime = new Date(Date.now() - uptime * 1000);
		_timer();
		_interval = setInterval(function() { _timer.call(that); }, 1000);
	}

	/**
	 * Stop timer
	 * @method stop
	 */
	this.stop = function () {
		clearInterval(_interval);
	}

	/**
	 * Returns start time
	 * @method getStartTime
	 * @return {Date}
	 */
	this.getStartTime = function() {
		return _startTime;
	}

}

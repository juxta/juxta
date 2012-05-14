/**
 * Counts the time since the server was started
 * @class Server uptime
 * @param {jQuery|String} element
 */
Juxta.Uptime = function(element) {

	/**
	 * @type {jQuery}
	 */
	var container = $(element);

	/**
	 * @type {String}
	 */
	var selector = container.selector;

	/**
	 * @type {Number}
	 */
	var time;

	/**
	 * @type {Date}
	 */
	var startTime;

	/**
	 * @type {String}
	 */
	var interval;

	/**
	 * @type {String}
	 */
	var state = null;

	/**
	 *  Timer
	 */
	var timer = function() {
		//
		time++;

		var newState = Math.floor(time / 60);
		if (state === newState) {
			return;
		}
		state = newState;

		container.text(Juxta.Lib.Date.uptime(time * 1000));
	}

	/**
	 * Start timer
	 * @method start
	 */
	this.start = function(uptime) {
		//
		this.stop();

		container = $(selector);

		var that = this;
		time = uptime;
		startTime = new Date(Date.now() - uptime * 1000);
		timer();
		interval = setInterval(function() { timer.call(that); }, 1000);
	}

	/**
	 * Stop timer
	 * @method stop
	 */
	this.stop = function () {
		clearInterval(interval);
	}

	/**
	 * Returns start time
	 * @method getStartTime
	 * @return {Date}
	 */
	this.getStartTime = function() {
		return startTime;
	}

}

/**
 * @namespace Utility library
 */
Juxta.Lib = {
}

/**
 * Extend object
 * @static
 * @param {Object} child
 * @param {Object} parent
 * @return {Object}
 */
Juxta.Lib.extend = function (child, parent) {
	var F = function() {};
	F.prototype = parent.prototype;
	F.prototype.constructor = parent;
	return child.prototype = new F;
}


/**
 * Date functions
 */
Juxta.Lib.Date = (function() {

	//
	var settings = {
		months : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
		monthsShort : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
		weekdays : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
		weekdaysShort : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
		midday: null,
		pretty: {
			lastDay : 'Yesterday %R',
			sameDay : '%R',
			nextDay : '%b %-d, %Y %R',
			lastWeek : '%b %-d, %Y %R',
			nextWeek : '%b %-d, %Y %R',
			sameElse : '%b %-d, %Y %R'
		},
		uptime: {
			days: '%d days, %-H:%M',
			day: '%d day, %-H:%M',
			hours: '%-H:%M',
			hour: '%-H:%M',
			minutes: '%-M minutes',
			minute: '%-M minute',
			less: '1 minute'
		}
	}

	//
	function padLeft(number, resultLength, symbol) {
		var result = String(number);

		while (result.length < resultLength) {
			result = (symbol ? symbol : '0') + result;
		}

		return result;
	}

	/**
	 * Format a date to string
	 * @param {Date} date
	 * @param {String} format
	 * @return {String}
	 */
	function strftime(date, format) {

		var formattingTokens = /%(-|\^|_|0)?(\d+)?([aAbBcCdDeFgGHIjklLmMpPrRsSTuUVwWxXyYzZ%])/g;

		var current = date,
			month = date.getMonth(),
			day = date.getDate(),
			year = date.getFullYear(),
			dayOfWeek = date.getDay(),
			hours = date.getHours(),
			minutes = date.getMinutes(),
			seconds = date.getSeconds(),
			milliseconds = date.getMilliseconds(),
			zone = date.getTimezoneOffset(),
			midday = settings.midday;

		function replace(specifier, flag, width, token) {
			//
			var t1, t2;

			switch (token) {
				// Month num
				case 'm':
					return padLeft(month + 1, flag == '-' ? 0 : width || 2, flag == '_' ? ' ' : '0');
				// Month Jan, Feb, ...
				case 'b':
				case 'h':
					return flag == '^' ? settings.monthsShort[month].toUpperCase() : settings.monthsShort[month];
				// Month January, February, ...
				case 'B' :
					return flag == '^' ? settings.months[month].toUpperCase() : settings.months[month];

				// YEAR
				case 'y' :
					return padLeft(year % 100, flag == '-' ? 0 : width || 2, flag == '_' ? ' ' : '0');
				case 'Y' :
					return padLeft(year, flag == '-' ? 0 : width || 4,  flag == '_' ? ' ' : '0');
				case 'C' :
					return Math.floor(year / 100);

				// Day
				case 'e':
					flag = '_';
					width = 2;
				case 'd' :
					return padLeft(day, flag == '-' ? 0 : width || 2, flag == '_' ? ' ' : '0');
				// Day of the year
				case 'j':
					t1 = new Date(year, month, day);
					t2 = new Date(year, 0, 1);
					return ~~(((t1 - t2) / 864e5) + 1.5);

				// 24-hour
				case 'H':
					return padLeft(hours, flag == '-' ? 0 : width || 2, flag == '_' ? ' ' : '0');
				case 'k':
					flag = '_';
					return padLeft(hours, flag == '-' ? 0 : width || 2, flag == '_' ? ' ' : '0');
				// 12-hour
				case 'I':
					return padLeft(hours % 12 || 12, flag == '-' ? 0 : width || 2, flag == '_' ? ' ' : '0');
				case 'l':
					flag = '_';
					return padLeft(hours % 12 || 12, flag == '-' ? 0 : width || 2, flag == '_' ? ' ' : '0');

				// Minutes
				case 'M':
					return padLeft(minutes, flag == '-' ? 0 : width || 2, flag == '_' ? ' ' : '0');

				// Seconds
				case 'S' :
					return padLeft(seconds, flag == '-' ? 0 : width || 2, flag == '_' ? ' ' : '0');

				// AM/PM
				case 'P' :
					flag = '^';
				case 'p':
					var ampm = typeof midday == 'function' ? midday(hours, minutes) : (hours > 11 ? 'pm' : 'am');
					if (flag === '^') {
						ampm = ampm.toUpperCase();
					}
					return ampm;

				// Milliseconds
				case 'L' :
					return padLeft(milliseconds, flag == '-' ? 0 : width || 3, flag == '_' ? ' ' : '0');

				// Timezone
				case 'z' :
					return (zone < 0 ? '-' : '+') + padLeft(~~(Math.abs(zone) / 60), 2, '0') + ':' + padLeft(~~(Math.abs(zone) % 60), 2, '0');

				// Weekday name
				case 'a' :
					return flag == '^' ? settings.weekdaysShort[dayOfWeek].toUpperCase() : settings.weekdaysShort[dayOfWeek];
				case 'A' :
					return flag == '^' ? settings.weekdays[dayOfWeek].toUpperCase() : settings.weekdays[dayOfWeek];

				// Week of the year
				case 'U' :
					t1 = new Date(year, month, day - dayOfWeek + 5);
					t2 = new Date(t1.getFullYear(), 0, 4);
					return padLeft(~~((t1 - t2) / 864e5 / 7 + 1.5) - 1, flag == '-' ? 0 : width || 2, flag == '_' ? ' ' : '0');

				// Shortcuts
				case 'c':
					return strftime(current, '%a %b %e %T %Y');
				case 'x':
				case 'D':
					return strftime(current, '%m/%d/%y');
				case 'F':
					return strftime(current, '%Y-%m-%d');
				case 'r':
					return strftime(current, '%I:%M:%S %p');
				case 'R':
					return strftime(current, '%H:%M');
				case 'X':
				case 'T':
					return strftime(current, '%H:%M:%S');
			}
		}

		return format.replace(formattingTokens, replace);
	}

	/**
	 *
	 * @param {Date} date
	 * @return {String}
	 */
	function pretty(date) {

		function diff(date1, date2) {
			return Math.floor((date1 - date2) / 864e5);
		}

		var startOfTheDate = new Date();

		startOfTheDate.setHours(0);
		startOfTheDate.setMinutes(0);
		startOfTheDate.setSeconds(0);
		startOfTheDate.setMilliseconds(0);

		var d = diff(new Date(date), startOfTheDate),
			f = d < -6 ? settings.pretty.sameElse :
			d < -1 ? settings.pretty.lastWeek :
			d < 0 ? settings.pretty.lastDay :
			d < 1 ? settings.pretty.sameDay :
			d < 2 ? settings.pretty.nextDay :
			d < 7 ? settings.pretty.nextWeek : settings.pretty.sameElse;

		return strftime(date, f);
	}

	/**
	 *
	 * @param {Number} duration
	 * @return {String}
	 */
	function uptime(duration) {
		//
		var diff = duration,
			result = {},
			format;

		result.d = Math.floor(diff / 1000 / 60 / 60 / 24);
		diff -= result.d * 1000 * 60 * 60 * 24;

		result.h = Math.floor(diff / 1000 / 60 / 60);
		diff -= result.h * 1000 * 60 * 60;

		result.m = Math.floor(diff / 1000 / 60);
		diff -= result.m * 1000 * 60;

		result.s = Math.floor(diff / 1000);

		format = result.d > 1 && ['days'] ||
			result.d === 1 && ['day'] ||
			result.h > 1 && ['hours'] ||
			result.h === 1 && ['hour'] ||
			result.m > 1 && ['minutes'] ||
			result.m === 1 && ['minute'] || ['less'];

		return settings.uptime[format] ? settings.uptime[format].replace(/%(-|\^|_|0)?(\d+)?([dHM])/g, function(specifier, flag, width, token) {
			switch (token) {
				case 'd':
					return padLeft(result.d, flag == '-' ? 0 : width || 0, flag == '_' ? ' ' : '0');
				case 'H':
					return padLeft(result.h, flag == '-' ? 0 : width || 2, flag == '_' ? ' ' : '0');
				case 'M':
					return padLeft(result.m, flag == '-' ? 0 : width || 2, flag == '_' ? ' ' : '0');
			}
		}) : '';
	}

	return {
		format: strftime,
		pretty: pretty,
		uptime: uptime
	}

})();


Juxta.Lib.Number = (function() {

	/**
	 * Format a number with grouped thousands
	 *
	 * @author Jonas Raoni Soares Silva, Kevin van Zonneveld and others
	 * @link http://phpjs.org/functions/number_format/
	 *
	 * @param number
	 * @param decimals
	 * @param decPoint
	 * @param thousandsSep
	 * @return {String}
	 *
	 */
	function format(number, decimals, decPoint, thousandsSep) {
		//
		number = (number + '').replace(/[^0-9+\-Ee.]/g, '');

		var n = !isFinite(+number) ? 0 : +number,
			prec = !isFinite(+decimals) ? 0 : Math.abs(decimals),
			sep = (typeof thousandsSep === 'undefined') ? ',' : thousandsSep,
			dec = (typeof decPoint === 'undefined') ? '.' : decPoint,
			s = '',
			toFixedFix = function (n, prec) {
				var k = Math.pow(10, prec);
				return '' + Math.round(n * k) / k;
			};

		// Fix for IE parseFloat(0.55).toFixed(0) = 0;
		s = (prec ? toFixedFix(n, prec) : '' + Math.round(n)).split('.');
		if (s[0].length > 3) {
			s[0] = s[0].replace(/\B(?=(?:\d{3})+(?!\d))/g, sep);
		}
		if ((s[1] || '').length < prec) {
			s[1] = s[1] || '';
			s[1] += new Array(prec - s[1].length + 1).join('0');
		}

		return s.join(dec);
	}

	return {
		format: format
	}

})();

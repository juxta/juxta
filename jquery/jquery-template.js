(function($){
	$.template = function(template, data) {
		return template.replace(/\{([\w\.|]*)\}/g, function (str, key) {
			var token = key.split('|'),
				variable = token.shift(),
				keys = variable.split('.'),
				value = data[keys.shift()],
				modifiers = token;
			//
			$.each(keys, function () { value = value[this]; });
			$.each(modifiers, function(m) {
				if (typeof(jQuery.template[this]) === 'function') {
					value = (jQuery.template[this])(value);
				}
			});
			return (value === null || value === undefined) ? '' : value;
		});
	};

	jQuery.template.size = function(value) {
		var precision = 1;

		if (value === undefined || value == 0) {
			return 0;
		}

		if (value < 1024) {
			return value + ' B';
		}

		value = Math.round(value/1024 * Math.pow(10, precision)) / Math.pow(10, precision);
		if (value < 1024) {
			return value + ' KB';
		}

		value = Math.round(value/1024 * Math.pow(10, precision)) / Math.pow(10, precision);
		if (value < 1024) {
			return value + ' MB';
		}

		value = Math.round(value/1024 * Math.pow(10, precision)) / Math.pow(10, precision);
		return value + ' GB';
	}

	jQuery.template.date = function(dateString) {
		if (dateString) {
			var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
				date = new Date(dateString),
				now = new Date(),
				yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1),
				today = new Date(now.getFullYear(), now.getMonth(), now.getDate()),
				tommorow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
				dateStringFormatted = '';

			if (date >= yesterday && date < today) {
				dateStringFormatted = 'Yesterday, '
			} else if (date < today || date >= tommorow) {
				dateStringFormatted += months[date.getMonth()] + ' ' + date.getDate();
				if (date.getFullYear() != today.getFullYear()) {
					dateStringFormatted += ' ' + date.getFullYear();
				}
				dateStringFormatted += ', ';
			}
			dateStringFormatted += date.getHours() + ':'
			dateStringFormatted += date.getMinutes() < 10 ? '0' : '';
			dateStringFormatted += date.getMinutes();

			return dateStringFormatted;
		} else {
			return dateString;
		}
	}

})(jQuery);

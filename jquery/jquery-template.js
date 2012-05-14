(function($){
	$.template = function(template, data) {
		return template.replace(/\{([\w\.|:\\/\s]*)\}/g, function (str, key) {
			var token = key.split('|'),
				variable = token.shift(),
				keys = variable.split('.'),
				value = data[keys.shift()],
				modifiers = token;
			//
			$.each(keys, function () { value = value[this]; });
			$.each(modifiers, function(m) {
				var args  = String(this).split(':'),
					modifier = args.shift();
				if (typeof(jQuery.template[modifier]) === 'function') {
					value = (jQuery.template[modifier]).apply(jQuery, [value].concat(args));
				}
			});
			return (value === null || value === undefined) ? '' : value;
		});
	}

	jQuery.template.empty = function(value, defaultValue) {
		if (value == 0 || value === null || value === undefined) {
			return defaultValue;
		} else {
			return value;
		}
	}

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
			return Juxta.Lib.Date.pretty(new Date(dateString));
		} else {
			return dateString;
		}
	}

})(jQuery);

define(['Juxta/Lib/date', 'Juxta/Lib/number'], function(Dates, Number) {

    function template(template, data) {
        return template.replace(/\{([\w\.|:\\/\s]*)\}/g, function (str, key) {
            var token = key.split('|'),
                variable = token.shift(),
                keys = variable.split('.'),
                value = data[keys.shift()],
                modifiers = token;

            $.each(keys, function () { value = value[this]; });

            if (value instanceof Array) {
                value = value.join(', ');
            }

            $.each(modifiers, function() {
                var args  = String(this).split(':'),
                    modifier = args.shift();

                if (typeof(registered[modifier]) === 'function') {
                    value = registered[modifier].apply(this, [value].concat(args));
                }
            });

            return (value === null || value === undefined) ? '' : value;
        });
    }

    // Modifiers

    var registered = {'empty': empty, 'size': size, 'date': date, 'number': number, 'bool': bool};

    function empty(value, defaultValue) {

        if (value == 0 || value === null || value === undefined) {
            return defaultValue;
        }

        return value;
    }

    function size(value) {

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

    function date(dateString) {

        if (dateString) {
            return Dates.pretty(new Date(dateString));
        }

        return dateString;
    }

    function number(number) {

        if (number) {
            return Number.format(number, 0, ',', '&thinsp;');
        }

        return number;
    }

    function bool(value, positive, negative) {
        return Boolean(Number(value)) ? positive : negative;
    }

    return template;

});

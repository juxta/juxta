/**
 * @class Server Information
 * @extends Juxta.Application
 * @param {jQuery|String} element
 * @param {Juxta.Request} request
 */
Juxta.ServerInformation = function (element, request) {

	/**
	 * @type {Object}
	 */
	this.settings ={
		cache: 60
	}

	Juxta.Application.prototype.constructor.call(this, element, {header: 'Server Status', menu: {'Server Status': null, 'System Variables': {href: '#variables'}, 'Charsets': '#charsets', 'Engines': '#engines'}});

	/**
	 * @type {Juxta.Request}
	 */
	this.request = request;


	/**
	 * @type {Juxta.Grid}
	 */
	this.grid = new Juxta.Grid(this.$application.find('.grid'));


	/**
	 * @type {Juxta.Uptime}
	 */
	this.uptime = new Juxta.Uptime(this.$application.find('.proper').find('.uptime'));

	var that = this;

	this.$application.find('.switch').click(function(event) {
		if (!$(event.target).hasClass('active')) {
			$(this).find('.active').removeClass('active');
			$(event.target).addClass('active');
		}
	});
	this.$application.find('.switch li').eq(0).click(function() {
		if (!$(this).hasClass('active')) {
			that.info({show: 'status-full'}, {});
		}
	});
	this.$application.find('.switch li').eq(1).click(function() {
		if (!$(this).hasClass('active')) {
			that.info({show: 'status'}, {});
		}
	});

	$(window).bind('resize', {that: this}, this.stretch);

}

Juxta.Lib.extend(Juxta.ServerInformation, Juxta.Application);

/**
 * Show application
 * @param {Object} options
 */
Juxta.ServerInformation.prototype.show = function(options) {
	Juxta.Application.prototype.show.apply(this, arguments);
	this.stretch();

	return this;
}


/**
 * Stretch grid to window height
 * @param {Event} event
 */
Juxta.ServerInformation.prototype.stretch = function(event) {
	var that = event && event.data.that || this;
	if (that.$application.find('.grid .body').is(':visible')) {
		that.$application.find('.grid .body').height($('#applications').height() - that.$application.find('.grid .body').position().top - that.$statusBar.height() - 24);
	} else if(that.$application.find('.proper').is(':visible')) {
		$('#server-info .proper').height($('#applications').height() - $('#server-info .proper').get(0).offsetTop - 32);
	}
}


/**
 * Prepare grid for response data
 * @param {String} template
 */
Juxta.ServerInformation.prototype.prepare = function(template) {
	if (this.grid.prepare(this.templates[template].grid)) {
		this.preparedFor = template;
		this.stretch();
		return true;
	} else {
		return false;
	}
}


/**
 * Request information shortcut
 * @param {Object} params
 */
Juxta.ServerInformation.prototype.info = function(params) {
	this.requestInfo(params);
}


/**
 * Server information request
 * @param {Object} params
 */
Juxta.ServerInformation.prototype.requestInfo = function(params) {
	this.show(this.templates[params.show]['head']);
	// Extend request options
	if (this.templates[params.show].query) {
		params = $.extend({}, this.templates[params.show].query, params);
	}
	// Move options values from query to options variable
	var query = $.extend({}, params),
		options = {};
	$.each(['cache', 'refresh'], function(index, value) {
		delete query[value];
		if (params[value] !== undefined) {
			options[value] = params[value];
		}
	});
	//
	if (this.prepare(query.show)) {
		this.request.send($.extend(
			{},
			{action: query, action: query, context: this, success: this.responseInfo},
			this.settings,
			options
		));
	}
}


/**
 * Response callback
 * @param {Object} response
 */
Juxta.ServerInformation.prototype.responseInfo = function(response) {
	if (response.contents == 'status') {
		this.properStatus(response.data);
		if (!response.cache) {
			this.uptime.start(response.data.Uptime);
			this.$application
				.find('.proper')
				.find('.startup .time')
				.text(Juxta.Lib.Date.format(this.uptime.getStartTime(), "%b %-d, %Y %T"));

		}
	} else {
		var params = $.extend({}, response, this.templates[response.contents].grid);
		delete params.data;
		this.grid.fill(response.data, params);
	}
	this.ready();
}


/**
 * Show status in compact way
 * @param {Array} data
 */
Juxta.ServerInformation.prototype.properStatus = function(data) {
	this.$application.find('.proper.server-status [class^=value_]').each(function() {
		$(this).text(data[this.className.split(' ', 1)[0].substr(6)]);
	});
	this.$application.find('.proper.server-status').show();
}


/**
 * Resources
 * @type {Object}
 */
Juxta.ServerInformation.prototype.templates = {
	status: {
		head: {
			header: 'Server Status'
		},
		grid: {
			context: ['variable', 'value'],
			actions: '<span style="float: left; margin-right: 11px;">View</span><ul class="switch"><li name="full">Full</li><li name="compact" class="active">Compact</li></ul>'
		}
	},
	'status-full': {
		head: {
			header: 'Server Status'
		},
		grid: {
			head: {
					'variable': 'Variable',
					'value': 'Value'
			},
			actions: '<span style="float: left; margin-right: 11px;">View</span><ul class="switch"><li name="full" class="active">Full</li><li name="compact">Compact</li></ul>',
			row: '<tr><td class="variable"><span class="overflowed"><a>{variable}</a></span></td><td class="value">{value}</td></tr>',
			context: ['variable', 'value']
		}
	},
	variables: {
		head: {
			header: 'System Variables',
			menu: {'Server Status': '#status', 'System Variables': null, 'Charsets': '#charsets', 'Engines': '#engines'}
		},
		grid: {
			head: {
					'variable': 'Variable',
					'value': 'Value'
				},
			row: '<tr><td class="variable"><span class="overflowed"><a>{variable}</a></span></td><td class="value">{value}</td></tr>',
			context: ['variable', 'value']
		}
	},
	charsets: {
		head: {
			header: 'Charsets',
			menu: {'Server Status': '#status', 'System Variables': '#variables', 'Charsets': null, 'Engines': '#engines'}
		},
		grid: {
			head: {
					'charset': 'Charset',
					'charset-default-collation': 'Default collation',
					'charset-description': 'Description'
				},
			row: '<tr><td class="charset"><a>{charset}</a></td><td class="charset-default-collation">{collation}</td><td class="charset-description">{description}</td></tr>',
			context: ['charset', 'description', 'collation', 'maxlen']
		},
		query: {cache: Infinity}
	},
	engines: {
		head: {
			header: 'Engines',
			menu: {'Server Status': '#status', 'System Variables': '#variables', 'Charsets': '#charsets', 'Engines': null}
		},
		grid: {
			head: {
					'engine': 'Engine',
					'engine-support': 'Support',
					'engine-comment': 'Description'
				},
			row: '<tr><td class="engine"><a>{engine}</a></td><td class="engine-support"><span class="{support}">{support}</span></td><td class="engine-comment">{comment}</td></tr>',
			context: ['engine', 'support', 'comment']
		},
		query: {cache: Infinity}
	}
}

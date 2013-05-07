/*global window */

/**
 * @class Server Information
 * @extends Juxta.Application
 * @param {jQuery|String} element
 * @param {Juxta.Request} request
 */
Juxta.Server = function (element, request) {

	/**
	 * @type {Object}
	 */
	this._settings ={
		cache: 60
	};

	Juxta.Application.prototype.constructor.call(this, element);

	/**
	 * @type {Juxta.Request}
	 */
	this._request = request;


	/**
	 * @type {Juxta.Grid}
	 */
	this._grid = new Juxta.Grid(this.find('.grid'));


	/**
	 * @type {Juxta.Uptime}
	 */
	this._uptime = new Juxta.Uptime(this.find('.proper').find('.uptime'));


	var that = this;

	this.find('.switch').click(function(event) {
		if (!$(event.target).hasClass('active')) {
			$(this).find('.active').removeClass('active');
			$(event.target).addClass('active');
		}
	});
	this.find('.switch li').eq(0).click(function() {
		if (!$(this).hasClass('active')) {
			that.info({show: 'status-full'}, {});
		}
	});
	this.find('.switch li').eq(1).click(function() {
		if (!$(this).hasClass('active')) {
			that.info({show: 'status'}, {});
		}
	});

	$(window).bind('resize', {that: this}, this.stretch);

};

Juxta.Lib.extend(Juxta.Server, Juxta.Application);

/**
 * Show application
 *
 * @param {Object} options
 */
Juxta.Server.prototype.show = function() {
	//
	Juxta.Application.prototype.show.apply(this, arguments);

	this.stretch();

	return this;
};


/**
 * Stretch grid to window height
 *
 * @param {Event} event
 */
Juxta.Server.prototype.stretch = function(event) {
	//
	var that = event && event.data.that || this;

	if (that.find('.grid .body').is(':visible')) {
		that.find('.grid .body').height($('#applications').height() - that.find('.grid .body').position().top - that._status.height() - 24);
	} else if(that.find('.proper').is(':visible')) {
		$('#server-info .proper').height($('#applications').height() - $('#server-info .proper').get(0).offsetTop - 32);
	}
};


/**
 * Prepare grid for response data
 *
 * @param {String} template
 * @return {Boolean}
 */
Juxta.Server.prototype._prepare = function(query) {
	//
	if (query.show && this.templates[query.show] && this._grid.prepare(this.templates[query.show].grid)) {
		//
		this.preparedFor = query.show;
		this.stretch();

		/*if (query.cid !== undefined) {
			$('[name=variables],[name=charsets],[name=engines]', this._container.find('.menu')).each(function(i, element) {
				$(element).attr('href', '#/' + query.cid + '/' + $(element).attr('name'))
			});
		}*/

		return true;
	}

	return false;
};


/**
 * Request information (shortcut)
 *
 * @param {Object} params
 */
Juxta.Server.prototype.info = function(params) {
	this.requestInfo(params);
};


/**
 * Server information request
 *
 * @param {Object} params
 */
Juxta.Server.prototype.requestInfo = function(params) {
	//
	this.show(this.templates[params.show].head, params);

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

	if (this._prepare(query)) {
		this._request.send($.extend(
			{},
			{action: query, context: this, success: this.responseInfo},
			this._settings,
			options
		));
	}
};


/**
 * Response callback
 *
 * @param {Object} response
 */
Juxta.Server.prototype.responseInfo = function(response) {
	if (response.contents == 'status') {
		this.properStatus(response.data);
		if (!response.cache) {
			this._uptime.start(response.data.Uptime);
			this.find('.proper')
				.find('.startup .time')
				.text(Juxta.Lib.Date.format(this._uptime.getStartTime(), '%b %-d, %Y %T'));

		}
	} else {
		var params = $.extend({}, response, this.templates[response.contents].grid);
		delete params.data;
		this._grid.fill(response.data, params);
	}
	this.ready();
};


/**
 * Show status in compact way
 *
 * @param {Array} data
 */
Juxta.Server.prototype.properStatus = function(data) {
	this.find('.proper.server-status [class^=value_]').each(function() {
		$(this).text(data[this.className.split(' ', 1)[0].substr(6)]);
	});
	this.find('.proper.server-status').show();
};


/**
 * Resources
 *
 * @type {Object}
 */
Juxta.Server.prototype.templates = {
	status: {
		head: {
			header: 'Server Status',
			menu: {'Server Status': null, 'System Variables': {href: '#/{cid}/variables'}, 'Charsets': '#/{cid}/charsets', 'Engines': '#/{cid}/engines'}
		},
		grid: {
			context: ['variable', 'value'],
			actions: '<span style="float: left; margin-right: 11px;">View</span><ul class="switch"><li name="full">Full</li><li name="compact" class="active">Compact</li></ul>'
		}
	},
	'status-full': {
		head: {
			header: 'Server Status',
			menu: {'Server Status': null, 'System Variables': '#/{cid}/variables', 'Charsets': '#/{cid}/charsets', 'Engines': '#/{cid}/engines'}
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
			menu: {'Server Status': '#/{cid}/status', 'System Variables': null, 'Charsets': '#/{cid}/charsets', 'Engines': '#/{cid}/engines'}
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
			menu: {'Server Status': '#/{cid}/status', 'System Variables': '#/{cid}/variables', 'Charsets': null, 'Engines': '#/{cid}/engines'}
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
			menu: {'Server Status': '#/{cid}/status', 'System Variables': '#/{cid}/variables', 'Charsets': '#/{cid}/charsets', 'Engines': null}
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
};

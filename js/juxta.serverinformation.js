Juxta.ServerInformation = $.Class(Juxta.Application, {

	/**
	 *
	 */
	settings: {
		cache: 60
	},


	/**
	 *
	 * @param {jQuery,String} element
	 * @param {Juxta.Request} request
	 */
	init: function(element, request) {
		this._super(element, {header: 'Server status', menu: {'Server status': null, 'System variables': {href: '#variables'}, 'Charsets': '#charsets', 'Engines': '#engines'}})
		this.grid = new Juxta.Grid(this.$application.find('.grid'));
		this.request = request;

		$(window).bind('resize', {_this: this}, this.stretch);

		var _this = this;
		this.$application.find('.switch').click(function(event) {
			if (!$(event.target).hasClass('active')) {
				$(this).find('.active').removeClass('active');
				$(event.target).addClass('active');
			}
		});
		this.$application.find('.switch li').eq(0).click(function() {
			if (!$(this).hasClass('active')) {
				_this.info({show: 'status-full'}, {});
			}
		});
		this.$application.find('.switch li').eq(1).click(function() {
			if (!$(this).hasClass('active')) {
				_this.info({show: 'status'}, {});
			}
		});
	},


	stretch: function(event) {
		var _this = event && event.data._this || this;
		if (_this.$application.find('.grid .body').is(':visible')) {
			_this.$application.find('.grid .body').height($('#applications').height() - _this.$application.find('.grid .body').position().top - _this.$statusBar.height() - 24);
		} else if(_this.$application.find('.proper').is(':visible')) {
			$('#server-info .proper').height($('#applications').height() - $('#server-info .proper').get(0).offsetTop - 32);
		}
	},
	show: function(options) {
		this._show(options);
		this.stretch();
	},
	info: function(params) {
		this.requestInfo(params);
	},
	requestInfo: function(params) {
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
	},
	responseInfo: function(response) {
		if (response.contents == 'status') {
			this.properStatus(response.data);
		} else {
			var params = $.extend({}, response, this.templates[response.contents].grid);
			delete params.data;
			this.grid.fill(response.data, params);
		}
		this.show();
	},
	prepare: function(template) {
		if (this.grid.prepare(this.templates[template].grid)) {
			this.preparedFor = template;
			this.stretch();
			return true;
		} else {
			return false;
		}
	},
	properStatus: function(data) {
		this.$application.find('.proper.server-status [class^=value_]').each(function() {
			$(this).text(data[this.className.split(' ', 1)[0].substr(6)]);
		});
		this.$application.find('.proper.server-status').show();
	},
	templates: {
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
});

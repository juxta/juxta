Juxta.ServerInformation = $.Class(Juxta.Application, {
	settings: {
		cache: 60
	},
	init: function(element) {
		this._super(element, {header: 'Server status', menu: {'Server status': null, 'System variables': {href: '#variables'}, 'Charsets': '#charsets', 'Engines': '#engines'}})
		this.grid = new Juxta.Grid(this.$application.find('.grid'));
		
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
				_this.request({show: 'status-full'}, {});
			}
		});
		this.$application.find('.switch li').eq(1).click(function() {
			if (!$(this).hasClass('active')) {
				_this.request({show: 'status'}, {});
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
	request: function(query, options) {
		if (this.prepare(query.show)) {
			Juxta.request($.extend({},
				{action: query, action: query, context: this, success: this.response},
				this.settings,
				options
			));
		}
	},
	response: function(response) {
		if (response.contents == 'status') {
			this.properStatus(response.data);
		} else {
			$.extend(response, this.templates[response.contents]);
			this.grid.fill(response);
		}
		this.show();
	},
	prepare: function(template) {
		if (this.grid.prepare(this.templates[template])) {
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
			'context': ['variable', 'value']
		},
		'status-full': {
			'head': {
					'variable': 'Variable',
					'value': 'Value'
			},
			'data-template': '<tr><td class="variable"><span class="overflowed"><a>{variable}</a></span></td><td class="value">{value}</td></tr>',
			'context': ['variable', 'value']
		},
		variables: {
			'head': {
					'variable': 'Variable',
					'value': 'Value'
				},
			'data-template': '<tr><td class="variable"><span class="overflowed"><a>{variable}</a></span></td><td class="value">{value}</td></tr>',
			'context': ['variable', 'value']
		},
		charsets: {
			'head': {
					'charset': 'Charset',
					'charset-default-collation': 'Default collation',
					'charset-description': 'Description'
				},
			'data-template': '<tr><td class="charset"><a>{charset}</a></td><td class="charset-default-collation">{collation}</td><td class="charset-description">{description}</td></tr>',
			'context': ['charset', 'description', 'collation', 'maxlen']
		},
		engines: {
			'head': {
					'engine': 'Engine',
					'engine-support': 'Support',
					'engine-comment': 'Description'
				},
			'data-template': '<tr><td class="engine"><a>{engine}</a></td><td class="engine-support"><span class="{support}">{support}</span></td><td class="engine-comment">{comment}</td></tr>',
			'context': ['engine', 'support', 'comment']
		}
	}
});

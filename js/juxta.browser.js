Juxta.Browser = $.Class(Juxta.Application, {
	init: function(element) {
		this._super(element, {header: 'Browse', closable: true, maximized: true});
		this.grid = new Juxta.TreeGrid(this.$application.find('.grid'));
		$(window).bind('resize', {_this: this}, this.stretch);
	},
	show: function(options) {
		this._show(options);
		this.stretch();
	},
	stretch: function(event) {
		var _this = event && event.data._this || this;
		if (_this.$application.is(':visible')) {
			_this.$application.find('.grid .body').height($('#applications').height() - _this.$application.find('.grid .body').position().top - _this.$statusBar.height() - 24);
		}
	},
	request: function(params) {
		var query = $.extend({}, params),
			options = {};

		this.grid.empty();

		this.show({
			header: {title: 'Browse', name: params.browse, from: params.from}/*,
			menu: {'Create Trigger': {click: 'return false;'}}*/
		});

		Juxta.request($.extend(
			{},
			{action: query, context: this, success: this.response},
			this.settings,
			options
		));
	},
	response: function(response) {
		$.extend(response, {
			head: {},
			row: null,
			context: [],
			contextMenu: '<li onclick="Juxta.edit({trigger: Juxta.explorer.grid.contextMenu.value.attr(\'name\'), from: \'sampdb\'})">Edit</li><li class="drop" onclick="Juxta.drop({drop: \'trigger\', item: \'trigger\', trigger: Juxta.explorer.grid.contextMenu.value.attr(\'name\'), from: Juxta.explorer.grid.from});">Drop</li><li>Properties</li>'
		});

		if (response.columns) {
			response.row = '<tr>';
			$.each(response.columns, function(i, column) {
				response.head[(
					'column' +
					(column[1] ? ' ' + column[1] : '') +
					' ' + column[0]
				).toLowerCase()] = column[0];
				//
				response.row += '<td class="column ' + column[0] + '"><div>{' + column[0] + '}</div></td>';
				//
				response.context.push(column[0]);
			});
			response.row += '<td></td></tr>';
		}
		console.log(response);

		this.grid.prepare(response);
		this.grid.fill(response);

		this.show();
	}
});

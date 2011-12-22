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
		var params = $.extend(
			{},
			response,
			{
				head: {},
				row: null,
				context: [],
				contextMenu: [
					{title: 'Delete', action: function() { console.log('Drop'); }},
					{title: 'Edit', action: function() { console.log('Edit');  }}
				]
			}
		);

		if (response.columns) {
			params.row = '<tr>';
			$.each(response.columns, function(i, column) {
				params.head[(
					'column' +
					(column[1] ? ' ' + column[1] : '') +
					' ' + column[0]
				).toLowerCase()] = column[0];
				//
				params.row += '<td class="column ' + column[0] + '"><div>{' + column[0] + '}</div></td>';
				//params.row += '<td>{' + column[0] + '}</td>';
				//
				params.context.push(column[0]);
			});
			params.row += '</tr>';
		}
		delete params.data;
		console.log(response.data);

		this.grid.prepare(params);
		this.grid.fill(response.data, params);

		this.show();
	}
});

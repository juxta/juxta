Juxta.BackupRestore = $.Class(Juxta.Application, {
	init: function(element) {
		this._super(element, {header: 'Backup', menu: {'Options': {href: '#backup/options', click: 'return false;'}}});
		this.grid = new Juxta.Grid(this.$application.find('.grid'));
		
		$(window).bind('resize', {_this: this}, this.stretch);
	},
	show: function(options) {
		this._show(options);
		this.stretch();
		
		response = {
			'head': {
				'database': 'Items for backup'
			},
			'data-template': '<tr><td class="expand"></td><td class="check"><input type="checkbox"></td><td class="database"><a>{database}</a></td></tr>',
			'context': ['database'],
			'data': ['information_schema', 'mysql', 'sampdb', 'test'],
		};
		this.grid.fill(response);
	},
	stretch: function(event) {
		var _this = event && event.data._this || this;
		if (_this.$application.is(':visible')) {
			_this.$application.find('.grid .body').height($('#applications').height() - _this.$application.find('.grid .body').position().top - _this.$statusBar.height() - 24);
		}
	}
});

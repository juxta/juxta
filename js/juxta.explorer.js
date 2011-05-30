Juxta.Explorer = $.Class(Juxta.Application, {
	settings: {
		cache: 60
	},
	cache: null,
	preparedFor: null,
	init: function(element) {
		this._super(element);
		this.grid = new Juxta.Grid('#explorer .grid');

		$(window).bind('resize', {_this: this}, this.stretch);

		this.createDatabase = new Juxta.CreateDatabase($('#create-database'));
		this.createUser = new Juxta.CreateUser($('#create-user'));

		var that = this,
			explorer = this;

		this.grid.$actions.bind('drop', function() {
			var params = {
					drop: explorer.grid.content,
					item: explorer.grid.statistics.item,
					items: explorer.grid.statistics.items
				};
			params[params.drop] = explorer.grid.selected();
			if (explorer.grid.from) {
				params['from'] = explorer.grid.from;
			}
			explorer.drop(params);
		});

		this.grid.$body.bind('change', function() {
			var status = '';
			if (that.grid.statistics.all > 0) {
				status += that.grid.statistics.all;
				if (that.grid.statistics.all == 1) {
					status += ' ' + that.grid.statistics.item;
				} else {
					status += ' ' + that.grid.statistics.items;
				}
			}
			if (that.grid.statistics.selected > 0) {
				status += ', ';
				status += that.grid.statistics.selected;
				status += ' selected';
			}
			Juxta.explorer.status(status);
		});
	},
	show: function(options) {
		this._show(options);
		this.stretch();
	},
	stretch: function(event) {
		var _this = event && event.data._this || this;
		if (_this.$application.is(':visible')) {
			_this.grid.height($('#applications').height() - _this.$application.find('.grid .body').position().top - _this.$statusBar.height() - 24);
		}
	},
	request: function(query, options) {
		this.cache = Juxta.queryString(query);
		if (this.prepare(query.show)) {
			Juxta.request($.extend({},
				{action: query, context: this, success: this.response},
				this.settings,
				options
			));
		}
	},
	response: function(data) {
		this.show();
		if (this.preparedFor == data.contents) {
			$.extend(data, this.templates[data.contents]);
			this.grid.fill(data);
		}
	},
	prepare: function(template) {
		if (this.grid.prepare(this.templates[template])) {
			this.preparedFor = template;
			return true;
		} else {
			return false;
		}
	},
	drop: function(params) {
		var message = 'Drop ';
		if (params.drop && (!$.isArray(params[params.drop]) || params[params.drop].length == 1)) {
			message += params.item;
			if ($.isArray(params[params.drop])) {
				message += ' `' + params[params.drop][0] + '`';
			} else {
				message += ' `' + params[params.drop] + '`';
			}
		} else {
			message += params[params.drop].length;
			message += ' ' + params.items;
		}
		if (Juxta.confirm(message + '?')) {
			this.requestDrop(params);
		}
	},
	requestDrop: function(params) {
		var action = {drop: params.drop},
			data = {};
		//
		if (params.from) {
			action['from'] = params.from
		}
		data[params.drop] = params[params.drop];

		Juxta.request({
			action: action,
			data: data,
			success: this.responseDrop,
			error: this.responseDrop,
			context: this
		});
	},
	responseDrop: function(response) {
		this.grid.deselect();
		if (response.dropped) {
			this.grid.remove(response.dropped);
		}
		Juxta.cache.flush(this.cache);
	},
	templates: {
		databases: {
			'head': {
				'database': 'Database'
			},
			'context': [['database', 'databases']],
			'actions': 'Select:&nbsp;<span name="all" class="like-a all">all</span>,&nbsp;<span name="nothing" class="like-a nothing">nothing</span>&nbsp;<input type="button" value="Drop" name="drop"/>',
			'data-template': '<tr><td class="check"><input type="checkbox" name="{database}"></td><td class="database"><a href="#{database}/tables">{database}</a></td></tr>',
			'contextMenu': '<li onclick="location.hash = Juxta.explorer.grid.contextMenu.value + \'/tables\'">Tables</li><li class="drop" onclick="Juxta.drop({drop: \'database\', item: \'database\', database: Juxta.explorer.grid.contextMenu.value});">Drop</li><li>Properties</li>'
		},
		processlist: {
			'head': {
				'process': 'Process Id',
				'process-user': 'User',
				'process-database': 'Database',
				'process-command': 'Command',
				'process-time': 'Time'
			},
			'actions': 'Select:&nbsp;<span name="all" class="like-a all">all</span>,&nbsp;<span name="nothing" class="like-a nothing">nothing</span>&nbsp;<input type="button" name="kill" value="Kill"/>',
			'data-template': '<tr><td class="check"><input type="checkbox" name="{process}"></td><td class="process"><a>{process}</td><td class="process-user">{user}@{host}</td><td class="process-database">{ondatabase}</td><td class="process-command">{command}</td><td class="process-time">{time}</td><td></td></tr>',
			'context': [['process', 'processes'], 'user', 'host', 'ondatabase', 'command', 'time'],
			'contextMenu': '<li>Information</li><li>Kill</li>'
		},
		users: {
			'head': {
				'user': 'Username',
				'user-host': 'Host',
				'user-password': 'Password',
				'user-global-privileges': 'Gloval privileges',
				'user-grant': 'Grant'
			},
			actions: 'Select:&nbsp;<span name="all" class="like-a all">all</span>,&nbsp;<span name="nothing" class="like-a nothing">nothing</span>&nbsp;<input type="button" name="delete" value="Delete"/>',
			'data-template': '<tr><td class="check"><input type="checkbox" name="{user}"></td><td class="user"><a>{user}</td><td class="user-host">{host}</td><td class="user-password"><span class="{password}">{password}</span></td><td class="user-global-privileges">{privileges}</td><td class="user-grant">{grant}</td></tr>',
			'context': [['user', 'users'], 'host', 'password', 'privileges', 'grant'],
			'contextMenu': '<li>Edit Privileges</li><li>Change Password</li><li>Rename</li><li>Delete</li>'
		},
		tables: {
			'head': {
				'table': 'Table',
				'table-engine': 'Engine',
				'table-rows': 'Rows',
				'table-size': 'Size',
				'table-update-date': 'Update',
			},
			actions: 'Select:&nbsp;<span name="all" class="like-a all">all</span>,&nbsp;<span name="nothing" class="like-a nothing">nothing</span>&nbsp;<input type="button" value="Drop" name="drop"/>',
			'data-template': '<tr><td class="check"><input type="checkbox" name="{table}"></td><td class="table"><span class="overflowed"><a href="#{database}/{table}/columns">{table}</a></span></td><td class="table-engine">{engine}</td><td class="table-rows">{rows}</td><td class="table-size">{size|size}</td><td class="table-update-date">{updateDate|date}</td></tr>',
			'context': [['table', 'tables'], 'engine', 'rows', 'size', 'updateDate'],
			'contextMenu': '<li onclick="location.hash = \'{database}/\' + Juxta.explorer.grid.contextMenu.value + \'/columns\'">Columns & Indexes</li><li onclick="location.hash = \'{database}/\' + Juxta.explorer.grid.contextMenu.value + \'/browse\'">Browse</li><li class="drop" onclick="Juxta.drop({drop: \'table\', item: \'table\', table: Juxta.explorer.grid.contextMenu.value, from: Juxta.explorer.grid.from});">Drop</li><li>Properties</li>'
		},
		views: {
			'head': {
				'view': 'View',
				'view-definer': 'Definer',
				'view-updatable': 'Updatable',
			},
			'actions': 'Select:&nbsp;<span name="all" class="like-a all">all</span>,&nbsp;<span name="nothing" class="like-a nothing">nothing</span>&nbsp;<input type="button" value="Drop" name="drop"/>',
			'data-template': '<tr><td class="check"><input type="checkbox" name="{view}"></td><td class="view"><a href="#{database}/{view}/browse">{view}</a></td><td class="view-definer">{definer}</td><td class="view-updatable"><span class="{updatable}">{updatable}</span></td></tr>',
			'context': [['view', 'views'], 'definer', 'updatable'],
			'contextMenu': '<li>Browse</li><li onclick="Juxta.edit({view: Juxta.explorer.grid.contextMenu.value, from: \'sampdb\'})">Edit</li><li class="drop" onclick="Juxta.drop({drop: \'view\', item: \'view\', view: Juxta.explorer.grid.contextMenu.value, from: Juxta.explorer.grid.from});">Drop</li><li>Properties</li>'
		},
		routines: {
			'head': {
				'routine': 'Routine',
				'routine-definer': 'Definer',
				'routine-return': 'Returns'
			},
			'actions': 'Select:&nbsp;<span name="all" class="like-a all">all</span>,&nbsp;<span name="nothing" class="like-a nothing">nothing</span>&nbsp;<input type="button" value="Drop" name="drop"/>',
			'data-template': '<tr><td class="check"><input type="checkbox" name="{routine}"></td><td class="routine"><a>{routine}</a></td><td class="routine-definer">{definer}</td><td class="routine-retunr">{return}</td></tr>',
			'context': ['routine', 'definer', 'return'],
			'contextMenu': '<li>Edit</li><li class="drop">Delete</li><li>Properties</li>'
		},
		triggers: {
			'head': {
				'trigger': 'Trigger',
				'trigger-table': 'Table',
				'trigger-event': 'Event',
				'trigger-definer': 'Definer',
			},
			'actions': 'Select:&nbsp;<span name="all" class="like-a all">all</span>,&nbsp;<span name="nothing" class="like-a nothing">nothing</span>&nbsp;<input type="button" value="Drop" name="drop"/>',
			'data-template': '<tr><td class="check"><input type="checkbox" name="{trigger}"></td><td class="trigger"><a>{trigger}</a></td><td class="trigger-table">{table}</td><td class="trigger-event"><span>{timing}</span>&nbsp;<span>{event}</span></td><td class="trigger-definer">{definer}</td></tr>',
			'context': [['trigger', 'triggers'], 'table', 'event', 'timing', 'definer', 'size'],
			'contextMenu': '<li onclick="Juxta.edit({trigger: Juxta.explorer.grid.contextMenu.value, from: \'sampdb\'})">Edit</li><li class="drop" onclick="Juxta.drop({drop: \'trigger\', item: \'trigger\', trigger: Juxta.explorer.grid.contextMenu.value, from: Juxta.explorer.grid.from});">Drop</li><li>Properties</li>'
		}
	}
});

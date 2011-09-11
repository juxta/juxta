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

		var that = this;

		this.grid.$actions.bind('drop', function() {
			var params = {
					drop: that.grid.content,
					item: that.grid.statistics.item,
					items: that.grid.statistics.items
				};

			// Stored routines group by attribute 'routine'
			if (that.grid.content === 'routines') {
				params[params.drop] = that.grid.selected(null, 'routine');
			} else {
				params[params.drop] = that.grid.selected();
			}

			// Set from
			if (that.grid.from) {
				params['from'] = that.grid.from;
			}

			that.drop(params);
		});

		this.grid.$actions.bind('kill', function() {
			that.kill({processes: that.grid.selected()});
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
	request: function(params) {
		if (this.templates[params.show]['head']['header']['from'] === null) {
			this.templates[params.show]['head']['header']['from'] = params.from;
		}
		this.show(this.templates[params.show]['head']);
		// Extend request options
		if (this.templates[params.show].query) {
			params = $.extend({}, this.templates[params.show].query, params);
		}
		// Move options values from query to options variable
		var query = $.extend({}, params),
			options = {};

		$.each(['cache', 'index', 'refresh'], function(index, value) {
			delete query[value];
			if (params[value] !== undefined) {
				options[value] = params[value];
			}
		});
		//
		this.cache = Juxta.queryString(query);
		if (this.prepare(query.show)) {
			Juxta.request($.extend(
				{},
				{action: query, context: this, success: this.response},
				this.settings,
				options
			));
		}
	},
	response: function(data) {
		this.show();
		if (this.preparedFor == data.contents) {
			$.extend(data, this.templates[data.contents].grid);
			this.grid.fill(data);
		}
	},
	prepare: function(template) {
		if (this.grid.prepare(this.templates[template].grid)) {
			this.preparedFor = template;
			return true;
		} else {
			return false;
		}
	},
	drop: function(params) {
		var message = '',
			countItemsForDrop = 0,
			singleItemForDrop = null;

		// Count items for drop
		if (typeof params[params.drop] === 'string') {
			countItemsForDrop = 1;
			singleItemForDrop = params[params.drop];
		} else if ($.isArray(params[params.drop])) {
			countItemsForDrop = params[params.drop].length;
			if (countItemsForDrop === 1) {
				singleItemForDrop = params[params.drop][0];
			}
		} else if ($.isPlainObject(params[params.drop])) {
			$.each(params[params.drop], function() {
				if ($.isArray(this)) {
					countItemsForDrop += this.length;
					if (countItemsForDrop === 1) {
						singleItemForDrop = this[0];
					}
				}
			});
		}

		// Compose message
		if (countItemsForDrop === 1) {
			message = 'Drop ' + params.item + ' `' + singleItemForDrop + '`';
		} else {
			message = 'Drop ' + countItemsForDrop + ' ' + params.items;
		}

		//
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

		// @todo Remove `response.dropped.procedure` etc.
		if ($.isPlainObject(response.dropped)) {
			if (response.dropped['procedure']) {
				this.grid.remove(response.dropped['procedure'], '[routine=procedure]');
			}
			if (response.dropped['function']) {
				this.grid.remove(response.dropped['function'], '[routine=function]');
			}
		} else {
			this.grid.remove(response.dropped);
		}

		Juxta.cache.flush(this.cache);
	},
	//
	properties: function(params) {
		var query = {},
			options = {};

		if (params.database) {
			query = {show: 'database-properties', database: params.database};
		}

		this.requestProperties(query, options);
	},
	requestProperties: function(query, options) {
		//
		Juxta.request({
			action: query,
			success: this.responseDatabaseProperties,
			context: this
		});

	},
	responseDatabaseProperties: function(response) {
		Juxta.message(
			$.template($('#database-properties').html(), response.properties),
			{title: 'Database {name}', name: response.properties.name}
		);
	},
	kill: function(params) {
		if (params['processes'].length === 1) {
			var message = 'Kill process ' + params['processes'];
		} else {
			var message = 'Kill ' + params['processes'].length;
		}
		//
		if (Juxta.confirm(message + '?')) {
			this.requestKill(params);
		}
	},
	requestKill: function(params) {
		Juxta.request({
			action: 'kill',
			data: {processes: params['processes']},
			success: this.responseKill,
			error: this.responseKill,
			context: this
		});
	},
	responseKill: function(response) {
		this.grid.deselect();
		this.grid.remove(response.killed);
	},
	templates: {
		databases: {
			head: {
				header: 'Databases',
				menu: {'Create Database': {href: '#databases/create', click: "Juxta.explorer.createDatabase.show(); return false;"}}
			},
			grid: {
				head: {
					'database': 'Database'
				},
				context: [['database', 'databases']],
				actions: 'Select:&nbsp;<span name="all" class="like-a all">all</span>,&nbsp;<span name="nothing" class="like-a nothing">nothing</span>&nbsp;<input type="button" name="drop" value="Drop"/>',
				'data-template': '<tr><td class="check"><input type="checkbox" name="{database}"></td><td class="database"><a href="#{database}/tables">{database}</a></td></tr>',
				contextMenu: '<li onclick="location.hash = Juxta.explorer.grid.contextMenu.value.attr(\'name\') + \'/tables\'">Tables</li><li class="drop" onclick="Juxta.drop({drop: \'database\', item: \'database\', database: Juxta.explorer.grid.contextMenu.value.attr(\'name\')});">Drop</li><li onclick="Juxta.explorer.properties({database: Juxta.explorer.grid.contextMenu.value.attr(\'name\')}); ">Properties</li>'
			}
		},
		processlist: {
			head: {
				header: 'Processlist',
				menu: {'Refresh': {href: '#processlist', click: "Juxta.explore({show: 'processlist'}); return false;"}}
			},
			grid: {
				context: [['process', 'processes'], 'user', 'host', 'ondatabase', 'command', 'time'],
				head: {
					'process': 'Process Id',
					'process-user': 'User',
					'process-database': 'Database',
					'process-command': 'Command',
					'process-time': 'Time'
				},
				actions: 'Select:&nbsp;<span name="all" class="like-a all">all</span>,&nbsp;<span name="nothing" class="like-a nothing">nothing</span>&nbsp;<input type="button" name="kill" value="Kill"/>',
				'data-template': '<tr><td class="check"><input type="checkbox" name="{process}"></td><td class="process"><a>{process}</td><td class="process-user">{user}@{host}</td><td class="process-database">{ondatabase}</td><td class="process-command">{command}</td><td class="process-time">{time}</td><td></td></tr>',
				contextMenu: '<li>Information</li><li onclick="Juxta.kill({processes: [Juxta.explorer.grid.contextMenu.value.attr(\'name\')]});">Kill</li>'
			},
			query: {cache: Infinity, index: {name: 'processId', field: 0, path: ['data']}, refresh: true}
		},
		users: {
			head: {
				header: 'Users',
				menu: {'Add User': {href: '#users/add', click: 'Juxta.explorer.createUser.show(); return false;'}, 'Flush Privileges': {href: '#users/flush', click: 'return false;'}}
			},
			grid: {
				head: {
					'user': 'Username',
					'user-host': 'Host',
					'user-password': 'Password',
					'user-global-privileges': 'Gloval privileges',
					'user-grant': 'Grant'
				},
				actions: 'Select:&nbsp;<span name="all" class="like-a all">all</span>,&nbsp;<span name="nothing" class="like-a nothing">nothing</span>&nbsp;<input type="button" name="delete" value="Delete"/>',
				'data-template': '<tr><td class="check"><input type="checkbox" name="{user}"></td><td class="user"><a>{user}</td><td class="user-host">{host}</td><td class="user-password"><span class="{password}">{password}</span></td><td class="user-global-privileges">{privileges}</td><td class="user-grant">{grant}</td></tr>',
				context: [['user', 'users'], 'host', 'password', 'privileges', 'grant'],
				contextMenu: '<li>Edit Privileges</li><li>Change Password</li><li>Rename</li><li>Delete</li>'
			}
		},
		tables: {
			head: {
				header: {title: 'Tables', from: null},
				menu: {'Create Table': {click: 'return false;'}}
			},
			grid: {
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
				'contextMenu': '<li onclick="location.hash = \'{database}/\' + Juxta.explorer.grid.contextMenu.value.attr(\'name\') + \'/columns\'">Columns & Indexes</li><li onclick="location.hash = \'{database}/\' + Juxta.explorer.grid.contextMenu.value.attr(\'name\') + \'/browse\'">Browse</li><li class="drop" onclick="Juxta.drop({drop: \'table\', item: \'table\', table: Juxta.explorer.grid.contextMenu.value.attr(\'name\'), from: Juxta.explorer.grid.from});">Drop</li><li>Properties</li>'
			}
		},
		views: {
			head: {
				header: {title: 'Views', from: null},
				menu: {'Create View': {click: 'return false;'}}
			},
			grid: {
				head: {
					'view': 'View',
					'view-definer': 'Definer',
					'view-updatable': 'Updatable',
				},
				actions: 'Select:&nbsp;<span name="all" class="like-a all">all</span>,&nbsp;<span name="nothing" class="like-a nothing">nothing</span>&nbsp;<input type="button" value="Drop" name="drop"/>',
				'data-template': '<tr><td class="check"><input type="checkbox" name="{view}"></td><td class="view"><a href="#{database}/{view}/browse">{view}</a></td><td class="view-definer">{definer}</td><td class="view-updatable"><span class="{updatable}">{updatable}</span></td></tr>',
				context: [['view', 'views'], 'definer', 'updatable'],
				contextMenu: '<li>Browse</li><li onclick="Juxta.edit({view: Juxta.explorer.grid.contextMenu.value.attr(\'name\'), from: \'sampdb\'})">Edit</li><li class="drop" onclick="Juxta.drop({drop: \'view\', item: \'view\', view: Juxta.explorer.grid.contextMenu.value.attr(\'name\'), from: Juxta.explorer.grid.from});">Drop</li><li>Properties</li>'
			}
		},
		routines: {
			head: {
				header: {title: 'Procedures & Functions', from: null}
			},
			grid: {
				'head': {
					'routine': 'Routine',
					'routine-definer': 'Definer',
					'routine-return': 'Returns'
				},
				'actions': 'Select:&nbsp;<span name="all" class="like-a all">all</span>,&nbsp;<span name="nothing" class="like-a nothing">nothing</span>&nbsp;<input type="button" value="Drop" name="drop"/>',
				'data-template': '<tr><td class="check"><input type="checkbox" name="{routine}" routine="{type}"></td><td class="routine"><a>{routine}</a></td><td class="routine-definer">{definer}</td><td class="routine-return">{return}</td></tr>',
				'context': [['routine', 'routines'], 'type', 'definer', 'return'],
				'contextMenu': '<li>Edit</li><li class="drop" onclick="var request = {drop: Juxta.explorer.grid.contextMenu.value.attr(\'routine\'), item: Juxta.explorer.grid.contextMenu.value.attr(\'routine\'), from: Juxta.explorer.grid.from}; request[request.drop] = Juxta.explorer.grid.contextMenu.value.attr(\'name\'); Juxta.drop(request);">Drop</li><li>Properties</li>'
			}
		},
		triggers: {
			head: {
				header: {title: 'Triggers', from: null},
				menu: {'Create Trigger': {click: 'return false;'}}
			},
			grid: {
				'head': {
					'trigger': 'Trigger',
					'trigger-table': 'Table',
					'trigger-event': 'Event',
					'trigger-definer': 'Definer',
				},
				'actions': 'Select:&nbsp;<span name="all" class="like-a all">all</span>,&nbsp;<span name="nothing" class="like-a nothing">nothing</span>&nbsp;<input type="button" value="Drop" name="drop"/>',
				'data-template': '<tr><td class="check"><input type="checkbox" name="{trigger}"></td><td class="trigger"><a>{trigger}</a></td><td class="trigger-table">{table}</td><td class="trigger-event"><span>{timing}</span>&nbsp;<span>{event}</span></td><td class="trigger-definer">{definer}</td></tr>',
				'context': [['trigger', 'triggers'], 'table', 'event', 'timing', 'definer', 'size'],
				'contextMenu': '<li onclick="Juxta.edit({trigger: Juxta.explorer.grid.contextMenu.value.attr(\'name\'), from: \'sampdb\'})">Edit</li><li class="drop" onclick="Juxta.drop({drop: \'trigger\', item: \'trigger\', trigger: Juxta.explorer.grid.contextMenu.value.attr(\'name\'), from: Juxta.explorer.grid.from});">Drop</li><li>Properties</li>'
			}
		}
	}
});

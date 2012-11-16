/**
 * @class Explorer
 * @extends Juxta.Application
 * @param {jQuery|String} element
 * @param {Juxta.Request} request
 */
Juxta.Explorer = function(element, request) {

	Juxta.Application.prototype.constructor.call(this, element, {cache: 60});

	/**
	 * @type {Juxta.Request} request
	 */
	this.request = request;


	/**
	 * @type {Juxta.Grid} grid
	 */
	this.grid = new Juxta.Grid('#explorer .grid');


	/**
	 * @type {Juxta.RoutineEditor}
	 */
	this.routineEditor = new Juxta.RoutineEditor($('#edit-routine'), this.request);


	/**
	 * @type {Juxta.CreateDatabase} createDatabase
	 */
	this.createDatabase = new Juxta.CreateDatabase($('#create-database'), this.request);


	/**
	 * @type {Juxta.CreateUser} createUser
	 */
	this.createUser = new Juxta.CreateUser($('#create-user'));


	/**
	 * @type {String} cache
	 * @private
	 */
	this._cacheKey = null;


	/**
	 * @type {String} preparedFor
	 * @private
	 */
	this.preparedFor = null;


	// Bind for grid events
	var that = this;

	this.grid.$actions.bind('drop', function() {
		var params = {
				drop: that.grid.content,
				item: that.grid.statistics.item,
				items: that.grid.statistics.items
			};

		// Group stored routines by attribute 'routine'
		if (that.grid.content === 'routines') {
			params[params.drop] = that.grid.selected(null, 'routine');
		} else {
			params[params.drop] = that.grid.selected();
		}

		// Set from
		if (that.grid.from) {
			params.from = that.grid.from;
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
		that._statusBar.text(status);
	});

	// Stretch grid by height
	$(window).bind('resize', {explorer: this}, this.stretch);

	// Hide notifications on float box hide
	$.each([this.createDatabase], function(i, application) {
		application.on('hide', function() {
			// @todo Remove global
			Jux.notification.hide();
		});
	});

	// Refresh databases list after create
	this.createDatabase.on('created', function() {
		that.explore({show: 'databases', refresh: true});
	});

}

Juxta.Lib.extend(Juxta.Explorer, Juxta.Application);

/**
 * Show explorer
 * @param {Object} options
 */
Juxta.Explorer.prototype.show = function(options) {
	//
	Juxta.Application.prototype.show.apply(this, arguments);
	this.stretch();

	return this;
}


/**
 * Stretch grid to window height
 * @param {Event} event
 */
Juxta.Explorer.prototype.stretch = function(event) {
	var that = event && event.data.explorer || this;
	if (that.is(':visible')) {
		// @todo Remove hardcoded number
		that.grid.height($('#applications').height() - that.find('.grid .body').position().top - that._statusBar.height() - 24);
	}
}


/**
 * Prepare grid for response
 * @param {string} template
 */
Juxta.Explorer.prototype.prepare = function(template) {
	if (template === this.preparedFor) {
		return true;
	} else if (this.grid.prepare(this.templates[template].grid)) {
		this.preparedFor = template;
		return true;
	} else {
		return false;
	}
}


/**
 * Explore
 * @param {Object} params
 */
Juxta.Explorer.prototype.explore = function(params) {
	return this.requestExplore(params);
}


/**
 * Request for explore
 * @param {Object} params
 */
Juxta.Explorer.prototype.requestExplore = function(params) {
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

	// Store key cache for last request
	this._cacheKey = this.request.queryString(query);

	if (this.prepare(query.show)) {
		return this.request.send($.extend(
			{},
			{action: query, context: this, success: this.responseExplore},
			this._settings,
			options
		));
	}
}


/**
 * Response for explore request
 * @param {Object} response
 */
Juxta.Explorer.prototype.responseExplore = function(response) {
	//
	this.ready();

	if (this.preparedFor == response.contents) {
		var params = $.extend({}, response, this.templates[response.contents].grid);
		delete params.data;
		this.grid.fill(response.data, params);
	}
}


/**
 * Drop item
 * @para {Object} params
 */
Juxta.Explorer.prototype.drop = function(params) {
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

	if (confirm(message + '?')) {
		this.requestDrop(params);
	}
}


/**
 * Request for drop
 * @param {Object} params
 */
Juxta.Explorer.prototype.requestDrop = function(params) {
	var action = {drop: params.drop},
		data = {};

	//
	if (params.from) {
		action.from = params.from
	}
	data[params.drop] = params[params.drop];

	this.request.send({
		action: action,
		data: data,
		success: this.responseDrop,
		error: this.responseDrop,
		context: this
	});
}


/**
 * Response for drop request
 * @param {Object} response
 */
Juxta.Explorer.prototype.responseDrop = function(response) {
	this.grid.deselect();

	// @todo Remove `response.dropped.procedure` etc.
	if ($.isPlainObject(response.dropped)) {
		if (response.dropped.procedure) {
			this.grid.remove(response.dropped.procedure, '[routine=procedure]');
		}
		if (response.dropped['function']) {
			this.grid.remove(response.dropped['function'], '[routine=function]');
		}
	} else {
		this.grid.remove(response.dropped);
	}

	// Flush last cached response
	this.request.cache.flush(this._cacheKey);
}


/**
 * Show objects' properties
 * @param {Object} params
 * @return {jqXHR}
 */
Juxta.Explorer.prototype.properties = function(params) {
	//
	if (params.database) {
		//
		return this.requestProperties(
			query = {show: 'properties', database: params.database},
			this.responseDatabaseProperties);

	} else if (params.table) {
		//
		return this.requestProperties(
			query = {show: 'properties', table: params.table, from: params.from},
			this.responseTableProperties);

	}
}


/**
 * Request for properties
 * @param {Object} query
 * @param {Function} callback
 * @return {jqXHR}
 */
Juxta.Explorer.prototype.requestProperties = function(query, callback) {
	//
	return this.request.send({action: query, success: callback, context: this});
}


/**
 * Response for getting database properties request
 * @param {Object} response
 */
Juxta.Explorer.prototype.responseDatabaseProperties = function(response) {
	// @todo Remove global
	Jux.message(
		$.template($('#database-properties').html(), response.properties),
		{title: 'Database {name}', name: response.properties.name}
	);
}


/**
 * Table properties
 * @param {Object} response
 */
Juxta.Explorer.prototype.responseTableProperties = function(response) {
	// @todo Remove global
	Jux.message(
		$.template($('#table-properties').html(), response.properties),
		{title: 'Table {name}', name: response.properties.name}
	);
}


/**
 * Kill processes
 * @param {Object} params
 */
Juxta.Explorer.prototype.kill = function(params) {
	if (params.processes.length === 1) {
		var message = 'Kill process ' + params.processes;
	} else {
		var message = 'Kill ' + params.processes.length;
	}

	if (confirm(message + '?')) {
		this.requestKill(params);
	}
}


/**
 * Request kill processes
 * @param {Object} params
 */
Juxta.Explorer.prototype.requestKill = function(params) {
	this.request.send({
		action: 'kill',
		data: {processes: params.processes},
		success: this.responseKill,
		error: this.responseKill,
		context: this
	});
}


/**
 * Kill processes response
 * @param {Object} response
 */
Juxta.Explorer.prototype.responseKill = function(response) {
	this.grid.deselect();
	this.grid.remove(response.killed);
}


/**
 * Run routine editing
 * @param {Object} params
 */
Juxta.Explorer.prototype.edit = function(params) {
	this.routineEditor.edit(params);
}


/**
 * Resources
 * @type {Object}
 * @todo Separate of behavior from markup
 */
Juxta.Explorer.prototype.templates = {
	databases: {
		head: {
			header: 'Databases',
			menu: {'Create Database': {href: '#databases/create', click: "Jux.explorer.createDatabase.show(); return false;"}}
		},
		grid: {
			head: {
				'database': 'Database'
			},
			context: [['database', 'databases']],
			actions: 'Select:&nbsp;<span name="all" class="like-a all">all</span>,&nbsp;<span name="nothing" class="like-a nothing">nothing</span>&nbsp;<input type="button" name="drop" value="Drop"/>',
			row: '<tr><td class="check"><input type="checkbox" name="{database}"></td><td class="database"><a href="#{database}/tables">{database}</a></td></tr>',
			contextMenu: '<li onclick="location.hash = Jux.explorer.grid.contextMenu.value.attr(\'name\') + \'/tables\'">Tables</li><li class="drop" onclick="Jux.drop({drop: \'database\', item: \'database\', database: Jux.explorer.grid.contextMenu.value.attr(\'name\')});">Drop</li><li onclick="Jux.explorer.properties({database: Jux.explorer.grid.contextMenu.value.attr(\'name\')}); ">Properties</li>'
		}
	},
	processlist: {
		head: {
			header: 'Processlist',
			menu: {'Refresh': {href: '#processlist', click: "Jux.explore({show: 'processlist'}); return false;"}}
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
			row: '<tr><td class="check"><input type="checkbox" name="{process}"></td><td class="process"><a>{process}</td><td class="process-user">{user}@{host}</td><td class="process-database">{ondatabase}</td><td class="process-command">{command}</td><td class="process-time">{time}</td><td></td></tr>',
			contextMenu: '<li>Information</li><li onclick="Jux.kill({processes: [Jux.explorer.grid.contextMenu.value.attr(\'name\')]});">Kill</li>'
		},
		query: {cache: Infinity, index: {name: 'processId', field: 0, path: ['data']}, refresh: true}
	},
	users: {
		head: {
			header: 'Users',
			menu: {'Create User': {href: '#users/add', click: 'Jux.explorer.createUser.show(); return false;'}, 'Flush Privileges': {href: '#users/flush', click: 'return false;'}}
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
			row: '<tr><td class="check"><input type="checkbox" name="{user}"></td><td class="user"><a>{user}</td><td class="user-host">{host}</td><td class="user-password"><span class="{password}">{password}</span></td><td class="user-global-privileges">{privileges}</td><td class="user-grant">{grant}</td></tr>',
			context: [['user', 'users'], 'host', 'password', 'privileges', 'grant'],
			contextMenu: '<li>Edit privileges</li><li>Change password</li><li>Rename</li><li>Delete</li>'
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
				'table-update-date': 'Update'
			},
			actions: 'Select:&nbsp;<span name="all" class="like-a all">all</span>,&nbsp;<span name="nothing" class="like-a nothing">nothing</span>&nbsp;<input type="button" value="Drop" name="drop"/>',
			row: '<tr><td class="check"><input type="checkbox" name="{table}"></td><td class="table"><span class="overflowed"><a href="#{database}/{table}/columns">{table}</a></span></td><td class="table-engine">{engine}</td><td class="table-rows">{rows}</td><td class="table-size">{size|size}</td><td class="table-update-date">{updateDate|date}</td></tr>',
			'context': [['table', 'tables'], 'engine', 'rows', 'size', 'updateDate'],
			'contextMenu': '<li onclick="location.hash = \'{database}/\' + Jux.explorer.grid.contextMenu.value.attr(\'name\') + \'/columns\'">Columns & Indexes</li><li onclick="location.hash = \'{database}/\' + Jux.explorer.grid.contextMenu.value.attr(\'name\') + \'/browse\'">Browse</li><li class="drop" onclick="Jux.drop({drop: \'table\', item: \'table\', table: Jux.explorer.grid.contextMenu.value.attr(\'name\'), from: Jux.explorer.grid.from});">Drop</li><li onclick="Jux.explorer.properties({table: Jux.explorer.grid.contextMenu.value.attr(\'name\'), from: \'{database}\'}); ">Properties</li>'
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
				'view-updatable': 'Updatable'
			},
			actions: 'Select:&nbsp;<span name="all" class="like-a all">all</span>,&nbsp;<span name="nothing" class="like-a nothing">nothing</span>&nbsp;<input type="button" value="Drop" name="drop"/>',
			row: '<tr><td class="check"><input type="checkbox" name="{view}"></td><td class="view"><a href="#{database}/{view}/browse">{view}</a></td><td class="view-definer">{definer}</td><td class="view-updatable"><span class="{updatable}">{updatable}</span></td></tr>',
			context: [['view', 'views'], 'definer', 'updatable'],
			contextMenu: '<li>Browse</li><li onclick="Jux.explorer.edit({view: Jux.explorer.grid.contextMenu.value.attr(\'name\'), from: Jux.explorer.grid.from})">Edit</li><li class="drop" onclick="Jux.drop({drop: \'view\', item: \'view\', view: Jux.explorer.grid.contextMenu.value.attr(\'name\'), from: Jux.explorer.grid.from});">Drop</li><li>Properties</li>'
		}
	},
	routines: {
		head: {
			header: {title: 'Stored Routines', from: null},
			menu: {'Create Routine': {click: 'return false;'}}
		},
		grid: {
			'head': {
				'routine': 'Routine',
				'routine-definer': 'Definer',
				'routine-return': 'Returns'
			},
			'actions': 'Select:&nbsp;<span name="all" class="like-a all">all</span>,&nbsp;<span name="nothing" class="like-a nothing">nothing</span>&nbsp;<input type="button" value="Drop" name="drop"/>',
			row: '<tr><td class="check"><input type="checkbox" name="{routine}" routine="{type}"></td><td class="routine"><a>{routine}</a></td><td class="routine-definer">{definer}</td><td class="routine-return">{return}</td></tr>',
			'context': [['routine', 'routines'], 'type', 'definer', 'return'],
			'contextMenu': '<li onclick="var params = {edit: Jux.explorer.grid.contextMenu.value.attr(\'routine\'), from: Jux.explorer.grid.from}; params[Jux.explorer.grid.contextMenu.value.attr(\'routine\')] = Jux.explorer.grid.contextMenu.value.attr(\'name\'); Jux.explorer.edit(params); ">Edit</li><li class="drop" onclick="var request = {drop: Jux.explorer.grid.contextMenu.value.attr(\'routine\'), item: Jux.explorer.grid.contextMenu.value.attr(\'routine\'), from: Jux.explorer.grid.from}; request[request.drop] = Jux.explorer.grid.contextMenu.value.attr(\'name\'); Jux.drop(request);">Drop</li><li>Properties</li>'
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
			row: '<tr><td class="check"><input type="checkbox" name="{trigger}"></td><td class="trigger"><a>{trigger}</a></td><td class="trigger-table">{table}</td><td class="trigger-event"><span>{timing}</span>&nbsp;<span>{event}</span></td><td class="trigger-definer">{definer}</td></tr>',
			'context': [['trigger', 'triggers'], 'table', 'event', 'timing', 'definer', 'size'],
			'contextMenu': '<li onclick="Jux.explorer.edit({trigger: Jux.explorer.grid.contextMenu.value.attr(\'name\'), from: Jux.explorer.grid.from})">Edit</li><li class="drop" onclick="Jux.drop({drop: \'trigger\', item: \'trigger\', trigger: Jux.explorer.grid.contextMenu.value.attr(\'name\'), from: Jux.explorer.grid.from});">Drop</li><li>Properties</li>'
		}
	}
}

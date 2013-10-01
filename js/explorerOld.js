/*global window, confirm, Jux */

/**
 * @class ExplorerOld
 * @extends Juxta.Application
 * @param {jQuery|String} element
 * @param {Juxta.Request} request
 */
Juxta.ExplorerOld = function(element, request) {

	Juxta.Application.prototype.constructor.call(this, element, {cache: 600});

	/**
	 * @type {Juxta.Request}
	 */
	this._request = request;


	/**
	 * @type {Juxta.Grid}
	 */
	this._grid = new Juxta.Grid('#explorer .grid');


	/**
	 * @type {Juxta.RoutineEditor}
	 */
	this._routineEditor = new Juxta.RoutineEditor($('#edit-routine'), this._request);


	/**
	 * @type {Juxta.CreateUser}
	 */
	this._createUser = new Juxta.CreateUser($('#create-user'));


	/**
	 * @type {String} cache
	 * @private
	 */
	this._cacheKey = null;


	/**
	 * @type {String}
	 * @private
	 */
	this._preparedFor = null;


	var that = this;

	// Bind for grid events
	this._grid.$actions.on('drop', function() {
		var params = {
				drop: that._grid.content,
				item: that._grid.statistics.item,
				items: that._grid.statistics.items
			};

		// Group stored routines by attribute 'routine'
		if (that._grid.content === 'routines') {
			params[params.drop] = that._grid.selected(null, 'routine');
		} else {
			params[params.drop] = that._grid.selected();
		}

		// Set from
		if (that._grid.from) {
			params.from = that._grid.from;
		}

		that.drop(params);
	});

	this._grid.$actions.on('kill', function() {
		that.kill({processes: that._grid.selected()});
	});

	this._grid.$body.on('change', function() {
		var status = '';
		if (that._grid.statistics.all > 0) {
			status += that._grid.statistics.all;
			if (that._grid.statistics.all == 1) {
				status += ' ' + that._grid.statistics.item;
			} else {
				status += ' ' + that._grid.statistics.items;
			}
		}
		that._status.text(status);
	});

	// Stretch grid by height
	$(window).on('resize', {explorer: this}, this.stretch);

	//
	this._settings.templates = {
		databases: {
			head: {
				header: 'Databases',
				menu: {'Create Database': function() { this._createDatabase.show(); return false; }}
			},
			grid: {
				head: {
					'database': 'Database'
				},
				context: [['database', 'databases']],
				actions: 'Select:&nbsp;<span name="all" class="like-a all">all</span>,&nbsp;<span name="nothing" class="like-a nothing">nothing</span>&nbsp;<input type="button" name="drop" value="Drop"/>',
				row: '<tr><td class="check"><input type="checkbox" name="{database}"></td><td class="database"><a href="#/{cid}/{database}/tables">{database}</a></td></tr>',
				contextMenu: '<li onclick="location.hash = \'/{cid}/\' + Jux._explorerOld._grid.contextMenu.value.attr(\'name\') + \'/tables\'">Tables</li><li class="drop" onclick="Jux.drop({drop: \'database\', item: \'database\', database: Jux._explorerOld._grid.contextMenu.value.attr(\'name\')});">Drop</li><li onclick="Jux._explorerOld.properties({database: Jux._explorerOld._grid.contextMenu.value.attr(\'name\')}); ">Properties</li>'
			}
		},
		processlist: {
			head: {
				header: 'Processlist',
				menu: {'Refresh': {href: '#/{cid}/processlist', click: function(event) { this.explore({show: 'processlist', cid: $(event.target).attr('href').match(/#\/(\d+)\//)[1]}); return false; }}}
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
				row: '<tr><td class="check"><input type="checkbox" name="{process}"></td><td class="process"><a>{process}</td><td class="process-user"><span class="overflowed">{user}@{host}</span></td><td class="process-database">{ondatabase}</td><td class="process-command">{command}</td><td class="process-time">{time}</td><td></td></tr>',
				contextMenu: '<li>Information</li><li onclick="Jux.kill({cid: \'{cid}\', processes: [Jux._explorerOld._grid.contextMenu.value.attr(\'name\')]});">Kill</li>'
			},
			query: {cache: Infinity, index: {name: 'processId', field: 0, path: ['data']}, refresh: true}
		},
		users: {
			head: {
				header: 'Users',
				menu: {
					'Create User': function() { this._createUser.show(); return false; },
					'Flush Privileges': null
				}
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
				menu: {'Create Table': null}
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
				row: '<tr><td class="check"><input type="checkbox" name="{table}"></td><td class="table"><span class="overflowed"><a href="#/{cid}/{database}/{table}/columns">{table}</a></span></td><td class="table-engine">{engine}</td><td class="table-rows">{rows|number}</td><td class="table-size">{size|size}</td><td class="table-update-date">{updateDate|date}</td></tr>',
				'context': [['table', 'tables'], 'engine', 'rows', 'size', 'updateDate'],
				'contextMenu': '<li onclick="location.hash = \'/{cid}/{database}/\' + Jux._explorerOld._grid.contextMenu.value.attr(\'name\') + \'/columns\'">Columns & Indexes</li><li onclick="location.hash = \'/{cid}/{database}/\' + Jux._explorerOld._grid.contextMenu.value.attr(\'name\') + \'/browse\'">Browse</li><li class="drop" onclick="Jux.drop({drop: \'table\', item: \'table\', table: Jux._explorerOld._grid.contextMenu.value.attr(\'name\'), from: Jux._explorerOld._grid.from});">Drop</li><li onclick="Jux._explorerOld.properties({table: Jux._explorerOld._grid.contextMenu.value.attr(\'name\'), from: \'{database}\'}); ">Properties</li>'
			}
		},
		views: {
			head: {
				header: {title: 'Views', from: null},
				menu: {'Create View': null}
			},
			grid: {
				head: {
					'view': 'View',
					'view-definer': 'Definer',
					'view-updatable': 'Updatable'
				},
				actions: 'Select:&nbsp;<span name="all" class="like-a all">all</span>,&nbsp;<span name="nothing" class="like-a nothing">nothing</span>&nbsp;<input type="button" value="Drop" name="drop"/>',
				row: '<tr><td class="check"><input type="checkbox" name="{view}"></td><td class="view"><a href="#/{cid}/{database}/{view}/browse">{view}</a></td><td class="view-definer">{definer}</td><td class="view-updatable"><span class="{updatable}">{updatable}</span></td></tr>',
				context: [['view', 'views'], 'definer', 'updatable'],
				contextMenu: '<li>Browse</li><li onclick="Jux._explorerOld.edit({view: Jux._explorerOld._grid.contextMenu.value.attr(\'name\'), from: Jux._explorerOld._grid.from})">Edit</li><li class="drop" onclick="Jux.drop({drop: \'view\', item: \'view\', view: Jux._explorerOld._grid.contextMenu.value.attr(\'name\'), from: Jux._explorerOld._grid.from});">Drop</li><li>Properties</li>'
			}
		},
		routines: {
			head: {
				header: {title: 'Stored Routines', from: null},
				menu: {'Create Routine': null}
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
				'contextMenu': '<li onclick="var params = {edit: Jux._explorerOld._grid.contextMenu.value.attr(\'routine\'), from: Jux._explorerOld._grid.from}; params[Jux._explorerOld._grid.contextMenu.value.attr(\'routine\')] = Jux._explorerOld._grid.contextMenu.value.attr(\'name\'); Jux._explorerOld.edit(params); ">Edit</li><li class="drop" onclick="var request = {drop: Jux._explorerOld._grid.contextMenu.value.attr(\'routine\'), item: Jux._explorerOld._grid.contextMenu.value.attr(\'routine\'), from: Jux._explorerOld._grid.from}; request[request.drop] = Jux._explorerOld._grid.contextMenu.value.attr(\'name\'); Jux.drop(request);">Drop</li><li>Properties</li>'
			}
		},
		triggers: {
			head: {
				header: {title: 'Triggers', from: null},
				menu: {'Create Trigger': null}
			},
			grid: {
				'head': {
					'trigger': 'Trigger',
					'trigger-table': 'Table',
					'trigger-event': 'Event',
					'trigger-definer': 'Definer'
				},
				'actions': 'Select:&nbsp;<span name="all" class="like-a all">all</span>,&nbsp;<span name="nothing" class="like-a nothing">nothing</span>&nbsp;<input type="button" value="Drop" name="drop"/>',
				row: '<tr><td class="check"><input type="checkbox" name="{trigger}"></td><td class="trigger"><a>{trigger}</a></td><td class="trigger-table">{table}</td><td class="trigger-event"><span>{timing}</span>&nbsp;<span>{event}</span></td><td class="trigger-definer">{definer}</td></tr>',
				'context': [['trigger', 'triggers'], 'table', 'event', 'timing', 'definer', 'size'],
				'contextMenu': '<li onclick=" Jux._explorerOld.edit({trigger: Jux._explorerOld._grid.contextMenu.value.attr(\'name\'), from: Jux._explorerOld._grid.from})">Edit</li><li class="drop" onclick="Jux.drop({drop: \'trigger\', item: \'trigger\', trigger: Jux._explorerOld._grid.contextMenu.value.attr(\'name\'), from: Jux._explorerOld._grid.from});">Drop</li><li>Properties</li>'
			}
		}
	};

};

Juxta.Lib.extend(Juxta.ExplorerOld, Juxta.Application);

/**
 * Show explorer
 * @param {Object} options
 */
Juxta.ExplorerOld.prototype.show = function() {
	//
	Juxta.Application.prototype.show.apply(this, arguments);
	this.stretch();

	return this;
};


/**
 * Stretch grid to window height
 * @param {Event} event
 */
Juxta.ExplorerOld.prototype.stretch = function(event) {
	var that = event && event.data.explorer || this;
	if (that.is(':visible')) {
		// @todo Remove hardcoded number
		that._grid.height($('#applications').height() - that.find('.grid .body').position().top - that._status.height() - 24);
	}
};


/**
 * Prepare grid for response
 * @param {string} template
 */
Juxta.ExplorerOld.prototype._prepare = function(template) {
	//
	if (template === this._preparedFor) {
		return true;
	} else if (this._grid.prepare(this._settings.templates[template].grid)) {
		this._preparedFor = template;
		return true;
	} else {
		return false;
	}
};


/**
 * Explore
 * @param {Object} params
 */
Juxta.ExplorerOld.prototype.explore = function(params) {
	return this._requestExplore(params);
};


/**
 * Request for explore
 * @param {Object} params
 */
Juxta.ExplorerOld.prototype._requestExplore = function(params) {
	//
	if (this._settings.templates[params.show].head.header.from === null) {
		this._settings.templates[params.show].head.header.from = params.from;
	}

	this.show(this._settings.templates[params.show].head, params);

	// Extend request options
	if (this._settings.templates[params.show].query) {
		params = $.extend({}, this._settings.templates[params.show].query, params);
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
	this._cacheKey = this._request.queryString(query);

	if (this._prepare(query.show)) {
		return this._request.send($.extend(
			{},
			{action: query, context: this, success: function(response) { return this._responseExplore(response, query); } },
			this._settings,
			options
		));
	}
};


/**
 * Response for explore requests
 *
 * @param {Object} response
 * @param {Object} request
 * @return {Juxta.Explorer}
 */
Juxta.ExplorerOld.prototype._responseExplore = function(response, request) {
	//
	this.ready();

	var params = $.extend({}, response, request, this._settings.templates[response.contents].grid);

	if (this._preparedFor == response.contents) {
		delete params.data;
		this._grid.fill(response.data, params);
	}

	return this;
};


/**
 * Drop item
 * @para {Object} params
 */
Juxta.ExplorerOld.prototype.drop = function(params) {
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
		this._requestDrop(params);
	}
};


/**
 * Request for drop
 * @param {Object} params
 */
Juxta.ExplorerOld.prototype._requestDrop = function(params) {
	var action = {drop: params.drop},
		data = {};

	//
	if (params.from) {
		action.from = params.from;
	}
	data[params.drop] = params[params.drop];

	this._request.send({
		action: action,
		data: data,
		success: this._responseDrop,
		error: this._responseDrop,
		context: this
	});
};


/**
 * Response for drop request
 * @param {Object} response
 */
Juxta.ExplorerOld.prototype._responseDrop = function(response) {
	this._grid.deselect();

	// @todo Remove `response.dropped.procedure` etc.
	if ($.isPlainObject(response.dropped)) {
		if (response.dropped.procedure) {
			this._grid.remove(response.dropped.procedure, '[routine=procedure]');
		}
		if (response.dropped['function']) {
			this._grid.remove(response.dropped['function'], '[routine=function]');
		}
	} else {
		this._grid.remove(response.dropped);
	}

	// Flush last cached response
	this._request.cache.flush(this._cacheKey);
};


/**
 * Show objects' properties
 * @param {Object} params
 * @return {jqXHR}
 */
Juxta.ExplorerOld.prototype.properties = function(params) {
	//
	if (params.database) {
		//
		return this._requestProperties(
			{show: 'properties', database: params.database},
			this._responseDatabaseProperties);

	} else if (params.table) {
		//
		return this._requestProperties(
			{show: 'properties', table: params.table, from: params.from},
			this._responseTableProperties);

	}
};


/**
 * Request for properties
 * @param {Object} query
 * @param {Function} callback
 * @return {jqXHR}
 */
Juxta.ExplorerOld.prototype._requestProperties = function(query, callback) {
	//
	return this._request.send({action: query, success: callback, context: this});
};


/**
 * Response for getting database properties request
 * @param {Object} response
 */
Juxta.ExplorerOld.prototype._responseDatabaseProperties = function(response) {
	// @todo Remove global
	Jux.message(
		$.template($('#database-properties').html(), response.properties),
		{title: 'Database {name}', name: response.properties.name}
	);
};


/**
 * Table properties
 * @param {Object} response
 */
Juxta.ExplorerOld.prototype._responseTableProperties = function(response) {
	// @todo Remove global
	Jux.message(
		$.template($('#table-properties').html(), response.properties),
		{title: 'Table {name}', name: response.properties.name}
	);
};


/**
 * Kill processes
 * @param {Object} params
 */
Juxta.ExplorerOld.prototype.kill = function(params) {
	//
	var message;

	if (params.processes.length === 1) {
		message = 'Kill process ' + params.processes;
	} else {
		message = 'Kill ' + params.processes.length;
	}

	if (confirm(message + '?')) {
		this._requestKill(params);
	}
};


/**
 * Request kill processes
 * @param {Object} params
 */
Juxta.ExplorerOld.prototype._requestKill = function(params) {
	this._request.send({
		action: 'kill',
		data: {processes: params.processes},
		success: this._responseKill,
		error: this._responseKill,
		context: this
	});
};


/**
 * Kill processes response
 * @param {Object} response
 */
Juxta.ExplorerOld.prototype._responseKill = function(response) {
	this._grid.deselect();
	this._grid.remove(response.killed);
};


/**
 * Run routine editing
 * @param {Object} params
 */
Juxta.ExplorerOld.prototype.edit = function(params) {
	this._routineEditor.edit(params);
};

/*global window, confirm */

/**
 * @class Juxta.Explorer
 * @extends {Juxta.Application}
 *
 * @param {jQuery|String} element
 * @param {Juxta.Request} request
 */
Juxta.Explorer = function(element, request) {

	Juxta.Application.prototype.constructor.call(this, element, {cache: 3600});

	/**
	 * @type {Juxta.Request}
	 */
	this._request = request;


	/**
	 * @type {Juxta.Grid2}
	 */
	this._grid = new Juxta.Grid2(this.find('.grid2'));


	/**
	 * @type {String}
	 */
	this._cacheKey = null;


	/**
	 * @type {String}
	 */
	this._preparedFor = null;


	/**
	 * @type {Juxta.CreateDatabase}
	 */
	this._createDatabase = new Juxta.CreateDatabase($('#create-database'), this._request);


	/**
	 * @type {Juxta.RoutineEditor}
	 */
	this._routineEditor = new Juxta.RoutineEditor($('#edit-routine'), this._request);


	// Stretch grid by height
	$(window).on('resize', this._stretch.bind(this));

	this._grid
		.on('context-menu-click', this._gridActionCallback.bind(this))
		.on('action', this._gridActionCallback.bind(this));

	// Update status bar text
	this._grid.on('change', (function() {
		//
		var status = '';

		if (this._grid.count > 0) {
			status += this._grid.count + ' items';
		}

		this._status.html(status);

	}).bind(this));

	// Hide notifications on dialog box hide
	$.each([this._createDatabase], (function(i, application) {
		application.on('hide', this.trigger.bind(this, 'modal-hide'));
	}).bind(this));

	// Refresh databases list after create
	this._createDatabase.on('created', this.explore.bind(this, {show: 'databases', refresh: true}));

};

Juxta.Lib.extend(Juxta.Explorer, Juxta.Application);


/**
 * Show explorer
 *
 * @param {Object} options
 */
Juxta.Explorer.prototype.show = function() {
	//
	Juxta.Application.prototype.show.apply(this, arguments);
	this._stretch();

	return this;
};


/**
 * Stretch grid to window height
 */
Juxta.Explorer.prototype._stretch = function() {
	//
	var height = 0;

	if (this.is(':visible')) {
		height = this._applicationsContainer.height();
		height -= this.find('.grid2-body').position().top + this._status.outerHeight(true); // minus padding from top, minus status bar height
		height -= this.find('.grid2-body').outerHeight() - this.find('.grid2-body').height(); // minus grid body padding + border

		this._grid.setHeight(height);
	}
};


/**
 * Prepare grid for response
 *
 * @param {string} template
 */
Juxta.Explorer.prototype._prepare = function(template) {
	//
	if (template === this._preparedFor) {
		return true;

	} else if (this._grid.prepare(this._gridParams[template])) {
		this._preparedFor = template;
		return true;
	}

	return false;
};


/**
 * Explore
 *
 * @param {Object} params
 */
Juxta.Explorer.prototype.explore = function(params) {
	return this._exploreRequest(params);
};


/**
 * Request for explore
 *
 * @param {Object} params
 * @return {jqXHR}
 */
Juxta.Explorer.prototype._exploreRequest = function(params) {
	//
	if (this._explorerShowParams[params.show].header.from === null) {
		this._explorerShowParams[params.show].header.from = params.from;
	}

	this.show(this._explorerShowParams[params.show], params);

	if (params.show === 'processlist') {
		params = $.extend({cache: Infinity, index: {name: 'processId', field: 0, path: ['data']}, refresh: true}, params);
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
			{action: query, context: this, success: function(response) { return this._exploreCallback(response, query); } },
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
Juxta.Explorer.prototype._exploreCallback = function(response, request) {
	//
	if (response.contents !== this._preparedFor) {
		return this;
	}

	this._grid.fill(response.data, this._gridParams[response.contents], request);

	return this.ready();
};


/**
 * @type {Object}
 */
Juxta.Explorer.prototype._explorerShowParams = {
	databases: {
		header: 'Databases',
		menu: {'Create Database': function() { this._createDatabase.show(); return false; }}
	},
	processlist: {
		header: 'Processlist',
		menu: {'Refresh': {href: '#/{cid}/processlist', click: function(event) { this.explore({show: 'processlist', cid: $(event.target).attr('href').match(/#\/(\d+)\//)[1]}); return false; }}}
	},
	users: {
		header: 'Users',
		menu: {
			'Create User': null,
			'Flush': null
		}
	},
	tables: {
		header: {title: 'Tables', from: null},
		menu: {'Create Table': null}
	},
	views: {
		header: {title: 'Views', from: null},
		menu: {'Create View': null}
	},
	routines: {
		header: {title: 'Stored Routines', from: null},
		menu: {'Create Routine': null}
	},
	triggers: {
		header: {title: 'Triggers', from: null},
		menu: {'Create Trigger': null}
	}
};


/**
 * @type {Object}
 */
Juxta.Explorer.prototype._gridParams = {
	databases: {
		columns: ['Database'],
		row: '<tr><td><a href="#/{cid}/{database}/tables">{database}</a></td></tr>',
		contextMenu: {
			'tables': {title: 'Tables', href: '#/{cid}/{name}/tables'},
			'drop-database': 'Drop',
			'database-properties': 'Properties'
		},
		actions: {'drop-database': 'Drop'}
	},
	processlist: {
		columns: ['Process Id', 'User', {title: 'Host', hidden: true}, 'Database', 'Command', 'Time', 'Info'],
		row: '<tr><td><a>{process_id}</td><td>{user}@{host}</td><td>{database}</td><td>{command}</td><td>{time}</td><td>{info}</td></tr>',
		contextMenu: {
			'information': 'Information',
			'kill': 'Kill'
		},
		actions: {kill: 'Kill'}
	},
	users: {
		columns: ['Username', 'Host', 'Password', {name: 'privileges', title: 'Gloval privileges'}, 'Grant'],
		row: '<tr><td>{username}<td>{host}</td><td>{password}</td><td>{privileges}</td><td>{grant}</td></tr>',
		contextMenu: {
			'edit-privileges': 'Edit privileges',
			'change-password': 'Change password',
			'rename': 'Rename',
			'delete': 'Delete'
		},
		actions: {drop: 'Drop'}
	},
	tables: {
		columns: ['Table', 'Engine', 'Rows', 'Size'],
		row: '<tr><td><a href="#/{cid}/{from}/{table}/browse">{table}</a></td><td>{engine}</td><td>{rows|number}</td><td>{size|size}</td><td></td></tr>',
		contextMenu: {
			'browse': {title: 'Browse', href: '#/{cid}/{from}/{name}/browse'},
			'columns': {title: 'Columns & Indexes', href: '#/{cid}/{from}/{name}/columns'},
			'drop-table': 'Drop',
			'table-properties': 'Properties'
		},
		actions: {drop: 'Drop'}
	},
	views: {
		columns: ['View', 'Definer', 'Updatable'],
		row: '<tr><td><a href="#/{cid}/{from}/{view}/browse">{view}</a></td><td>{definer}</td><td>{updatable}</td></tr>',
		contextMenu: {
			'browse': {title: 'Browse', href: '#/{cid}/{from}/{name}/browse'},
			'edit-view': 'Edit',
			'drop-view': 'Drop',
			'view-properties': 'Properties'
		},
		actions: {drop: 'Drop'}
	},
	routines: {
		'head': {
			'routine': 'Routine',
			'routine-definer': 'Definer',
			'routine-return': 'Returns'
		},
		columns: ['Routine', {title: 'Type', hiddne: true}, {name: 'routine_definer', title: 'Definer'}, 'Returns'],
		row: '<tr><td><input type="checkbox" name="{routine}" item-type="{type}"><a>{routine}</a></td><td>{routine_definer}</td><td>{returns}</td></tr>',
		contextMenu: {
			'edit-routine': 'Edit',
			'drop-routine': 'Drop',
			'routine-properties': 'Properties'
		},
		actions: {drop: 'Drop'}
	},
	triggers: {
		columns: ['Trigger', {name: 'trigger_table', title: 'Table'}, 'Event', {title: 'Timing', hidden: true}],
		row: '<tr><td><a href="#/{cid}/{from}/{view}/browse">{trigger}</a></td><td>{trigger_table}</td><td>{timing}&nbsp;{event}</td></tr>',
		contextMenu: {
			'edit-trigger': 'Edit',
			'drop-trigger': 'Drop',
			'trigger-properties': 'Properties'
		},
		actions: {drop: 'Drop'}
	}
};


/**
 * Callback on grid group action or context menu click
 *
 * @param {String} event Event name
 * @param {String} name Object name
 * @param {String} type Object type
 * @param context Context
 */
Juxta.Explorer.prototype._gridActionCallback = function(event, name, type, context) {

	if (event === 'database-properties') {
		this._request.send({action: {show: 'properties', database: name, cid: context.cid}, success: this._showPropertiesCallback.bind(this, event)});

	} else if (event === 'drop-database') {
		this.drop('databases', $.isArray(name) ? name : [name]);

	} else if (event === 'table-properties') {
		this._request.send({action: {show: 'properties', table: name, from: context.from, cid: context.cid}, success: this._showPropertiesCallback.bind(this, event)});

	} else if (event === 'drop-table') {
		this.drop('tables', [name], context.from);

	} else if (event === 'drop-view') {
		this.drop('views', [name], context.from);

	} else if (event === 'kill') {
		this.kill([name]);

	} else if (event === 'edit-view') {
		this._routineEditor.edit({view: name, from: context.from});

	} else if (event === 'edit-routine' && type === 'procedure') {
		this._routineEditor.edit({procedure: name, from: context.from});

	}  else if (event === 'drop-routine' && type === 'procedure') {
		this.drop('routines', {procedure: [name]}, context.from);

	} else if (event === 'edit-routine' && type === 'function') {
		this._routineEditor.edit({'function': name, from: context.from});

	} else if (event === 'drop-routine' && type === 'function') {
		this.drop('routines', {'function': [name]}, context.from);

	} else if (event === 'edit-trigger') {
		this._routineEditor.edit({trigger: name, from: context.from});

	} else if (event === 'drop-trigger') {
		this.drop('triggers', [name], context.from);
	}
};


/**
 * Response for getting database or table properties request
 *
 * @param {Object} response
 */
Juxta.Explorer.prototype._showPropertiesCallback = function(templateName, response) {
	//
	var template = $('#' + templateName);

	if (templateName === 'database-properties' && template.is('[type=text/html]')) {
		this.trigger('alert', $.template(template.html(), response.properties), {title: 'Database {name}', name: response.properties.name});

	} else if (templateName === 'table-properties' && template.is('[type=text/html]')) {
		this.trigger('alert', $.template(template.html(), response.properties), {title: 'Table {name}', name: response.properties.name});
	}

};


/**
 * Drop items
 *
 * @param {String} drop
 * @param {Array} items
 * @param {String} from
 * @return {jqXHR}
 */
Juxta.Explorer.prototype.drop = function(drop, items, from) {
	//
	var action = {drop: drop},
		message = 'Drop ',
		data = {},
		text = {
			databases: ['database', 'databases'],
			tables: ['table', 'tables'],
			views: ['view', 'views'],
			routines: ['routine', 'stored routines'],
			triggers: ['trigger', 'triggers']
		},
		dropItemsCount = 0,
		dropItemName = null;

	if (from) {
		action.from = from;
	}

	data[drop] = items;

	if ($.isArray(items)) {
		dropItemsCount = items.length;
		dropItemName = items[0];

	} else if ($.isPlainObject(items)) {
		$.each(items, function(i, items) {
			dropItemsCount += items.length;
			dropItemName = items[0];
		});
	}

	if (dropItemsCount === 1) {
		message += text[drop][0] + ' '  + dropItemName;

	} else if (text[drop]) {
		message += dropItemsCount + ' ' + text[drop][1];
	}

	message += '?';

	if (confirm(message)) {
		return this._request.send({
			action: action,
			data: data,
			success: this._dropCallback.bind(this, drop),
			error: this._dropCallback.bind(this, drop)
		});
	}
};


/**
 * Response for drop request
 *
 * @param {Object} response
 */
Juxta.Explorer.prototype._dropCallback = function(entity, response) {
	//
	//this._grid.deselect();

	this._grid.remove(response.dropped);

	// Flush last cached response
	this._request.cache.flush(this._cacheKey);
};


/**
 * Kill processes
 *
 * @param {Array} pids
 * @return jqXHR
 */
Juxta.Explorer.prototype.kill = function(pids) {
	//
	var message;

	if (pids.length === 1) {
		message = 'Kill process ' + pids;
	} else {
		message = 'Kill ' + pids.length;
	}

	if (confirm(message + '?')) {
		return this._request.send({
			action: 'kill',
			data: {processes: pids},
			success: (function(response) { this._grid.remove(response.killed); }).bind(this),
			context: this
		});
	}
};
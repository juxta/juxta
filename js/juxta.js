/*
 * Juxta 0.0.1 http://juxta.ru
 *
 * Copyright (c) 2010-2011 Alexey Golovnya
 * Licensed under the MIT license
 *
 */

$(document).ready(function() {
	Juxta = new Juxta();
});

Juxta = $.Class();
Juxta.prototype = {
	init: function() {
		var that = this;

		this.notification = new Juxta.Notification();
		this.sidebar = new Juxta.Sidebar();
		this.sidebar.path({'connection': '127.0.0.1'});

		this.explorer = new Juxta.Explorer('#explorer');
		this.exchange = new Juxta.BackupRestore('#backup-restore');
		this.browser = new Juxta.Browser('#data-browser');
		this.tableEditor = new Juxta.TableEditor('#table-editor');
		this.dummy = new Juxta.Dummy('#dummy');
		this.serverInfo = new Juxta.ServerInformation('#server-info');

		this.auth = new Juxta.Auth('#login');
		this.codeEditor = new Juxta.RoutineEditor($('#edit-routine'));

		this.about = new Juxta.FloatBox('#about');
		$('#header a[name=about]').click(function(){ that.about.show(); return false; });

		this.cache = new Juxta.Cache();

		$.ajaxSetup(this.ajaxSetup);

		if (location.hash == '') {
			location.hash = 'databases';
		}
		this.state = 'default';
		setInterval(this.checkLocation, 200);

		$('.float-box').draggable({scroll: false, handle: 'h3'});
		$(document.body).bind('click', function(event) {
			$('.context:visible').trigger('hide').hide();
		});
	},
	/*	Ajax options
	 */
	ajaxSetup: {
		url: 'juxta.php',
		dataType: 'json',
		type: 'POST',
		beforeSend: function() {
			Juxta.loading();
		},
		complete: function() {
			Juxta.loading(false);
		},
		error: function(xhr, status) {
			if (status == 'parsererror') {
				Juxta.error('Answer parsing error');
			} else {
				Juxta.error(xhr.status + ' ' + xhr.statusText);
			}
		}
	},
	queryString: function(action) {
		var query = action;
		if (query && $.isPlainObject(query) && !$.isEmptyObject(query)) {
			query = $.param(query);
		}
		return query;
	},
	/*	Common Ajax request/response interface
	 */
	request: function(params) {
		// URL
		var queryString = Juxta.queryString(params.action);
		params.url = this.ajaxSetup.url + '?' + queryString;

		// Set message for loading notification
		if (params.loading) {
			params.beforeSend = function () {
				Juxta.loading(params.loading);
			}
		}

		// Cache options
		var cache = {};
		if (params.cache !== undefined && params.cache !== false) {
			cache = {key: queryString, time: params.cache};
		}

		// Collect response callbacks
		var callbacks = {};
		if ($.isFunction(params.success)) {
			callbacks.ok = params.context ? $.proxy(params.success, params.context) : params.success;
			delete(params.success);
		}
		if ($.isFunction(params.error)) {
			callbacks.error = params.error ? $.proxy(params.error, params.context) : params.error;
			delete(params.error);
		}

		// Response
		params.success = function (data) {
			Juxta.response(data, callbacks, cache);
		}

		// Response from cache or make request
		var fromCache = null;
		if (params.refresh !== true) {
			fromCache = this.cache.get(queryString);
		}
		if (fromCache) {
			params.success(fromCache);
			return;
		} else {
			$.ajax(params);
		}
	},
	response: function(response, callbacks, cache) {
		switch (response.status) {
			case 'ok':
				if (cache.key) {
					Juxta.cache.set(cache.key, response, cache.time);
				}
				if ($.isFunction(callbacks.ok)) {
					callbacks.ok(response)
				}
				break;
			case 'session_not_found':
				document.location.hash = '#login';
				break;
			case 'error':
				if ($.isFunction(callbacks.error)) {
					callbacks.error(response)
				}
				Juxta.error(response.error);
				break;
			case 'connect_error':
				Juxta.error(response.error);
				Juxta.auth.show();
				break;
			default:
				Juxta.error('Fuck..');
		}
	},
	//
	checkLocation: function() {
		var hash = location.hash.replace(/#/g, '');
		params = hash.split('/');
		action = params.pop();
		if (hash != Juxta.state) {
			switch (action) {
				case 'databases':
					Juxta.sidebar.highlight('databases');
					Juxta.explorer.show({header: 'Databases', menu: {'Create database': {href: '#databases/create', click: "Juxta.explorer.createDatabase.show(); return false;"}}});
					Juxta.explore({show: 'databases'});
					break;
				case 'processlist':
					Juxta.sidebar.highlight('processlist');
					Juxta.explorer.show({header: 'Processlist', menu: {'Refresh': {href: '#processlist', click: 'return false;'}}});
					Juxta.explore({show: 'processlist', cache: false});
					break;
				case 'users':
					Juxta.sidebar.highlight('users');
					Juxta.explorer.show({header: 'Users', menu: {'Add a user': {href: '#users/add', click: 'Juxta.explorer.createUser.show(); return false;'}, 'Flush privileges': {href: '#users/flush', click: 'return false;'}}});
					Juxta.explore({show: 'users'});
					break;
				case 'status':
				case 'status-full':
					Juxta.sidebar.highlight('status');
					Juxta.serverInfo.show({header: 'Server status'});
					Juxta.info({show: action});
					break;
				case 'variables':
					Juxta.sidebar.highlight('status');
					Juxta.serverInfo.show({header: 'System variables', menu: {'Server status': '#status', 'System variables': null, 'Charsets': '#charsets', 'Engines': '#engines'}});
					Juxta.info({show: 'variables'});
					break;
				case 'charsets':
					Juxta.sidebar.highlight('status');
					Juxta.serverInfo.show({header: 'Charsets', menu: {'Server status': '#status', 'System variables': '#variables', 'Charsets': null, 'Engines': '#engines'}});
					Juxta.info({show: 'charsets', cache: Infinity});
					break;
				case 'engines':
					Juxta.sidebar.highlight('status');
					Juxta.serverInfo.show({header: 'Engines', menu: {'Server status': '#status', 'System variables': '#variables', 'Charsets': '#charsets', 'Engines': null}});
					Juxta.info({show: 'engines', cache: Infinity});
					break;
				case 'backup':
					Juxta.sidebar.highlight('backup');
					Juxta.exchange.show();
					break;
				case 'restore':
					Juxta.sidebar.highlight('restore');
					Juxta.dummy.show({header: 'Restore'});
					break;
				case 'login':
					Juxta.auth.show();
					break;
					
				case 'tables':
					Juxta.sidebar.path({'database': params[0]});
					Juxta.sidebar.highlight('tables');
					Juxta.explorer.show({header: {title: 'Tables', from: params[0]}, menu: {'Create table': {click: 'return false;'}}});
					Juxta.explore({show: 'tables', from: params[0]});
					break;
				case 'views':
					Juxta.sidebar.path({'database': params[0]});
					Juxta.sidebar.highlight('views');
					Juxta.explorer.show({header: {title: 'Views', from: params[0]}, menu: {'Create view': {click: 'return false;'}}});
					Juxta.explore({show: 'views', from: params[0]});
					break;
				case 'routines':
					Juxta.sidebar.path({'database': params[0]});
					Juxta.sidebar.highlight('routines');
					Juxta.explorer.show({header: {title: 'Procedures & Functions', from: params[0]}});
					Juxta.explore({show: 'routines', from: params[0]});
					break;
				case 'triggers':
					Juxta.sidebar.path({'database': params[0]});
					Juxta.sidebar.highlight('triggers');
					Juxta.explorer.show({header: {title: 'Triggers', from: params[0]}, menu: {'Create trigger': {click: 'return false;'}}});
					Juxta.explore({show: 'triggers', from: params[0]});
					break;

				case 'browse':
					Juxta.sidebar.path({'database': params[0], 'table': params[1]});
					Juxta.browse({browse: params[1], from: params[0]});
					break;
				case 'columns':
					Juxta.sidebar.path({'database': params[0], 'table': params[1]});
					Juxta.sidebar.highlight('columns');
					Juxta.edit({table: params[1], from: params[0]});
					break;
				case 'foreign':
					Juxta.sidebar.path({'database': params[0], 'table': params[1]});
					Juxta.sidebar.highlight('foreign');
					Juxta.dummy.show();
					break;
				case 'options':
					Juxta.sidebar.path({'database': params[0], 'table': params[1]});
					Juxta.sidebar.highlight('options');
					Juxta.dummy.show({header: 'Options'});
					break;
				case 'maintenance':
					Juxta.sidebar.path({'database': params[0], 'table': params[1]});
					Juxta.sidebar.highlight('maintenance');
					Juxta.dummy.show({header: {title: 'Maintenance table', name: params[1]}});
					break;
				case 'flush':
					Juxta.cache.flush();
				default:
					document.location = '#databases';
			}
			Juxta.state = hash;
		}
	},
	show: function() {
		$('#sidebar').slideDown(250);
		$('.float-box').hide();
		if ($('#applications').not(':visible')) {
			$('#applications').fadeIn(250);
			$('#header h1, #header ul').fadeIn(250);
		}
	},
	hide: function() {
		$('#header h1, #header ul, #sidebar, #applications').hide();
	},
	explore: function(params) {
		// Move options values from query to options variable
		var query = $.extend({}, params), options = {};
		$.each(['cache', 'refresh'], function(index, value) {
			delete query[value];
			if (params[value] !== undefined) {
				options[value] = params[value];
			}
		});
		//
		this.explorer.request(query, options);
	},
	drop: function(params) {
		this.explorer.drop(params);
	},
	confirm: function(message) {
		return confirm(message);
	},
	info: function(params) {
		// Move options values from query to options variable
		var query = $.extend({}, params), options = {};
		$.each(['cache', 'refresh'], function(index, value) {
			delete query[value];
			if (params[value] !== undefined) {
				options[value] = params[value];
			}
		});
		//
		this.serverInfo.request(query, options);
	},
	browse: function(params) {
		this.browser.show();
	},
	edit: function(params) {
		if (params) {
			if (params.table) {
				this.tableEditor.show({header: {title: 'Table', name: params.table}});
			} else if (params.view) {
				this.codeEditor.edit('View ' + params.view + ' from ' + params.from);
				this.codeEditor.show({title: 'Edit view', name: params.view});
			} else if (params.routine) {
				this.codeEditor.edit('Routine' + params.routine + ' from ' + params.from);
				this.codeEditor.show();
			} else if (params.trigger) {
				this.codeEditor.edit('Trigger ' + params.trigger + ' from ' + params.from);
				this.codeEditor.show();
			}
		}
	},
	/**
	 * Notifications shortcuts
	 */
	notify: function(message, options) {
		return this.notification.show(message, options);
	},
	loading: function(message, options) {
		return this.notification.loading(message, options);
	},
	error: function(message, options) {
		return this.notification.show(message, $.extend({}, {type: 'error', hide: false, fast: true}, options));
	}
};

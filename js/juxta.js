/**
 * Juxta 0.0.1 http://juxta.ru
 *
 * Copyright (c) 2010-2011 Alexey Golovnya
 * Licensed under the MIT license
 *
 */

$(document).ready(function() {
	Juxta = new Juxta();
});

var Juxta = $.Class();
Juxta.prototype = {
	init: function() {
		var that = this;

		this.cache = new Juxta.Cache();
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
		this.messageBox = new Juxta.FloatBox('#message');

		$('#header a[name=about]').bind('click', function() { that.about(); return false; });

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
	/**
	 * Ajax options
	 */
	ajaxSetup: {
		url: 'juxta.php',
		dataType: 'json',
		type: 'POST',
		beforeSend: function() {
			Juxta.loading();
		},
		data: {
			debug: true
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
	/**
	 * Common Ajax request/response interface
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
			if (params.index) {
				cache.index = params.index;
			}
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
					Juxta.cache.set(cache.key, response, cache.time, cache.index);
				}
				if ($.isFunction(callbacks.ok)) {
					callbacks.ok(response);
				}
				break;
			case 'session_not_found':
				document.location.hash = '#login';
				break;
			case 'error':
				if ($.isFunction(callbacks.error)) {
					callbacks.error(response);
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
		var hash = location.hash.replace(/#/g, ''),
			params = hash.split('/'),
			action = params.pop();
		if (hash != Juxta.state) {
			switch (action) {
				case 'databases':
				case 'processlist':
				case 'users':
					Juxta.explore({show: action});
					break;
				case 'status':
				case 'status-full':
				case 'variables':
				case 'charsets':
				case 'engines':
					Juxta.info({show: action});
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
				//
				case 'tables':
				case 'views':
				case 'routines':
				case 'triggers':
					Juxta.explore({show: action, from: params[0]});
					break;
				//
				case 'browse':
					Juxta.browse({browse: params[1], from: params[0]});
					break;
				case 'columns':
					Juxta.sidebar.highlight('columns', {'database': params[0], 'table': params[1]});
					Juxta.edit({table: params[1], from: params[0]});
					break;
				case 'foreign':
					Juxta.sidebar.highlight('foreign', {'database': params[0], 'table': params[1]});
					Juxta.dummy.show();
					break;
				case 'options':
					Juxta.sidebar.highlight('options', {'database': params[0], 'table': params[1]});
					Juxta.dummy.show({header: 'Options'});
					break;
				case 'maintenance':
					Juxta.sidebar.highlight('maintenance', {'database': params[0], 'table': params[1]});
					Juxta.dummy.show({header: {title: 'Maintenance Table', name: params[1]}});
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
		$('#sidebar:not(.minimized)').slideDown(250);
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
		if (params.from) {
			Juxta.sidebar.highlight(params.show, {'database': params.from});
			Juxta.explorer.request(params);
		} else {
			Juxta.sidebar.highlight(params.show);
			Juxta.explorer.request(params);
		}
	},
	drop: function(params) {
		this.explorer.drop(params);
	},
	kill: function(params) {
		this.explorer.kill(params);
	},
	confirm: function(message) {
		return confirm(message);
	},
	info: function(params) {
		Juxta.sidebar.highlight('status');
		Juxta.serverInfo.request(params);
	},
	browse: function(params) {
		Juxta.sidebar.path({'database': params.from, 'table': params.browse});
		this.browser.request(params);
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
	},
	/**
	 *
	 */
	message: function(message, options) {
		this.messageBox.show(options, message);
	},
	about: function() {
		this.message($('#about').html(), {title: 'About Juxta'});
	}
};

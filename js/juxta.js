/**
 * Juxta 0.0.1
 *
 * Copyright (c) 2010-2011 Alexey Golovnya
 * Licensed under the MIT license
 * http://juxta.ru
 */

/**
 * @class Juxta base application
 */
Juxta = function() {

	var that = this;

	/**
	 * Cache
	 * @type Juxta.Cache
	 */
	this.cache = new Juxta.Cache();


	/**
	 * @type {Juxta.Connection}
	 */
	this.connection = new Juxta.Connection();


	/**
	 * @type {Juxta.Sidebar}
	 */
	this.sidebar = new Juxta.Sidebar();

	this.connection.on('change', function() {
		that.sidebar.path(that.connection.get());
	});

	/**
	 * Request/response
	 * @type Juxta.Request
	 */
	this.request = new Juxta.Request(this.connection, this.cache, {
		request: {
			beforeSend: function() {
				that.loading();
			},
			complete: function() {
				that.loading(false);
			},
			error: function(xhr, status) {
				if (status == 'parsererror') {
					that.error('Answer parsing error');
				} else {
					that.error(xhr.status + ' ' + xhr.statusText);
				}
			}
		},
		response: {
			connectionError: function(response) {
				that.error(response.error);
				that.auth.show();
			},
			sessionNotFound: function() {
				document.location.hash = '#login';
			},
			error: function(response) {
				that.error(response.error);
			},
			unknowStatus: function() {
				that.error('Response with unknow status recived');
			}
		}
	});


	this.notification = new Juxta.Notification();

	this.explorer = new Juxta.Explorer('#explorer', this.request);
	this.exchange = new Juxta.BackupRestore('#backup-restore');
	this.browser = new Juxta.Browser('#data-browser', this.request);
	this.table = new Juxta.TableEditor('#table', this.request);
	this.dummy = new Juxta.Dummy('#dummy');
	this.server = new Juxta.Server('#server-info', this.request);
	this.auth = new Juxta.Auth('#login', this.request);
	this.messageBox = new Juxta.FloatBox('#message');

	// Show Juxta when application ready to show
	$.each([this.explorer, this.server, this.browser, this.table], function(i, application) {
		application.on('ready', $.proxy(that.show, that));
	});

	$('#header a[name=about]').bind('click', function() { that.about(); return false; });

	if (location.hash == '') {
		location.hash = 'databases';
	}
	this.state = 'default';
	setInterval($.proxy(this.checkLocation, this), 200);

	$('.float-box').draggable({scroll: false, handle: 'h3'});
	$(document.body).bind('click', function(event) {
		$('.context:visible').trigger('hide').hide();
	});
};

Juxta.prototype = {

	/**
	 *
	 */
	checkLocation: function() {
		var hash = window.location.hash.replace(/#/g, ''),
			params = hash.split('/'),
			action = params.pop();
		if (hash != this.state) {
			switch (action) {
				case 'databases':
				case 'processlist':
				case 'users':
					this.explore({show: action});
					break;
				case 'status':
				case 'status-full':
				case 'variables':
				case 'charsets':
				case 'engines':
					this.info({show: action});
					break;
				case 'backup':
					this.sidebar.highlight('backup');
					this.exchange.show();
					break;
				case 'restore':
					this.sidebar.highlight('restore');
					this.dummy.show({header: 'Restore'});
					break;
				case 'login':
					this.auth.show();
					break;
				//
				case 'tables':
				case 'views':
				case 'routines':
				case 'triggers':
					this.explore({show: action, from: params[0]});
					break;
				//
				case 'browse':
					this.browse({browse: params[1], from: params[0]});
					break;
				case 'columns':
					this.sidebar.highlight('columns', {'database': params[0], 'table': params[1]});
					this.table.edit({table: params[1], from: params[0]});
					break;
				case 'foreign':
					this.sidebar.highlight('foreign', {'database': params[0], 'table': params[1]});
					this.dummy.show();
					break;
				case 'options':
					this.sidebar.highlight('options', {'database': params[0], 'table': params[1]});
					this.dummy.show({header: 'Options'});
					break;
				case 'maintenance':
					this.sidebar.highlight('maintenance', {'database': params[0], 'table': params[1]});
					this.dummy.show({header: {title: 'Maintenance Table', name: params[1]}});
					break;
				case 'flush':
					this.cache.flush();
				default:
					window.location = '#databases';
			}
			this.state = hash;
		}
	},


	/**
	 *
	 */
	show: function() {
		$('#sidebar:not(.minimized)').slideDown(250);
		$('.float-box').hide();
		if ($('#applications').not(':visible')) {
			$('#applications').fadeIn(250);
			$('#header h1, #header ul').fadeIn(250);
		}
	},


	/**
	 *
	 */
	hide: function() {
		$('#header h1, #header ul, #sidebar, #applications, .float-box').hide();
	},


	/**
	 *
	 */
	explore: function(params) {
		if (params.from) {
			this.sidebar.highlight(params.show, {'database': params.from});
			this.explorer.explore(params);
		} else {
			this.sidebar.highlight(params.show);
			this.explorer.explore(params);
		}
	},


	/**
	 *
	 */
	drop: function(params) {
		this.explorer.drop(params);
	},


	/**
	 *
	 */
	kill: function(params) {
		this.explorer.kill(params);
	},


	/**
	 *
	 */
	confirm: function(message) {
		return confirm(message);
	},


	/**
	 *
	 */
	info: function(params) {
		this.sidebar.highlight('status');
		this.server.info(params);
	},


	/**
	 *
	 */
	browse: function(params) {
		this.sidebar.path({'database': params.from, 'table': params.browse});
		this.browser.browse(params);
	},


	/**
	 * Notifications shortcuts
	 */
	notify: function(message, options) {
		return this.notification.show(message, options);
	},


	/**
	 *
	 */
	loading: function(message, options) {
		return this.notification.loading(message, options);
	},


	/**
	 *
	 */
	error: function(message, options) {
		return this.notification.show(message, $.extend({}, {type: 'error', hide: false, fast: true}, options));
	},


	/**
	 *
	 */
	message: function(message, options) {
		this.messageBox.show(options, message);
	},


	/**
	 *
	 */
	about: function() {
		this.message($('#about').html(), {title: ''});
	}

};

$(document).ready(function() {
	window.Jux = new Juxta();
});

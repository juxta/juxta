/*global document, window, setInterval */

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
var Juxta = function() {

	var that = this;

	/**
	 * Appliaction state
	 * @type {String}
	 */
	this._state = null;


	/**
	 * Cache
	 * @type Juxta.Cache
	 */
	this._cache = new Juxta.Cache();


	/**
	 * @type {Juxta.Connection}
	 */
	this._connection = new Juxta.Connection();


	/**
	 * @type {Juxta.Sidebar}
	 */
	this._sidebar = new Juxta.Sidebar(this._connection);


	/**
	 * Request/response
	 * @type Juxta.Request
	 */
	this._request = new Juxta.Request(this._connection, this._cache, {
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
				that._auth.show();
			},
			sessionNotFound: function() {
				that.redirect('login');
			},
			error: function(response) {
				that.error(response.error);
			},
			unknowStatus: function() {
				that.error('Response with unknow status recived');
			}
		}
	});


	/**
	 * Notification messages
	 * @type {Juxta.Notification}
	 */
	this._notification = new Juxta.Notification();


	/**
	 * Server explorer
	 * @type {Juxta.Explorer}
	 */
	this._explorer = new Juxta.Explorer('#explorer', this._request);


	/**
	 * Table data browser
	 * @type {Juxta.Browser}
	 */
	this.browser = new Juxta.Browser('#data-browser', this._request);


	/**
	 * Table editor
	 * @type {Juxta.Table}
	 */
	this.table = new Juxta.Table('#table', this._request);


	/**
	 * Server inofrmation
	 * @type {Juxta.Server}
	 */
	this.server = new Juxta.Server('#server-info', this._request);


	/**
	 * Backup and restore
	 * @type {Juxta.BackupRestore}
	 */
	this.exchange = new Juxta.BackupRestore('#backup-restore');


	/**
	 * Connect to server form
	 * @type {Juxta.Auth}
	 */
	this._auth = new Juxta.Auth('#login', this._request);


	/**
	 * Float box
	 * @type {Juxta.Modal}
	 */
	this.messageBox = new Juxta.Modal('#message');


	/**
	 * Dummy appliaction
	 * @type {Juxta.Dummy}
	 */
	this.dummy = new Juxta.Dummy('#dummy');


	// Change window title on connection
	this._connection.on('change', function() {
		//
		that.setTitle(that._connection.get())
			._repairHeaderLinks(that._connection.get());

		$('.header-link.connection a')
			.text(that._connection.get('user') + '@' + that._connection.get('host'))
			.attr('href', '#/login');
	});

	// Show Juxta when application ready to show
	$.each([this._explorer, this.server, this.browser, this.table], function(i, application) {
		application.on('ready', $.proxy(that.show, that));
	});

	//
	this._auth
		.on('before-show', $.proxy(this.hide, this))
		.on('login', function(connection) {
			that._connection.set(connection.cid, connection);
			that.redirect('databases', connection.cid);
		})
		.on('logout', function() {
			that._cache.flush();
			that.setTitle('').redirect('login');
		})
		.on('change', function(cid) {
			that.redirect('', cid);
		});

	// Notifications
	this._auth.on('notify', function(message, type, options) {
		if (type === 'error') {
			that.error(message, options);
		} else if (type === 'loading') {
			that.loading(message, options);
		} else {
			that.notify(message, options);
		}
	});

	//
	$('#header a[name=about]').bind('click', function() {
		that.about();
		return false;
	});

	//
	$('#header .sql a').bind('click', function() {
		if (that.browser.is(':visible') && that.browser.mode == 'browse') {
			that.browser.toggleEditor();
			return false;
		}
	});

	$('#header a[href=#logout]').click(function() {
		that._auth.logout();
		return false;
	});

	// @todo Remove this from here
	$('.float-box').draggable({scroll: false, handle: 'h3'});

	// @todo Remove this from here
	$(document.body).bind('click', function() {
		$('.context:visible').trigger('hide').hide();
	});

	this.run();

};


/**
 * Default MySQL port
 * @type {Number}
 */
Juxta.defaultPort = 3306;


/**
 * Run application
 * @return {Juxta}
 */
Juxta.prototype.run = function() {
	//
	setInterval($.proxy(this.route, this), 200);

	return this;
};


/**
 *
 */
Juxta.prototype.route = function() {
	//
	var hash = window.location.hash.replace(/#\/?/g, ''),
		query = hash.split('/'),
		cid,
		action,
		params = [];

	if (/^\d+$/.test(query[0])) {
		cid = Number(query.shift());
	}

	if (query.length > 0) {
		action = query.pop();
		params = query;
	}

	if (cid === undefined && action !== 'login') {
		this.redirect('login');
		return;
	}

	if (hash != this._state) {
		switch (action) {
			case 'databases':
			case 'processlist':
			case 'users':
				this.explore({cid: cid, show: action});
				break;
			case 'status':
			case 'status-full':
			case 'variables':
			case 'charsets':
			case 'engines':
				this.info({cid: cid, show: action});
				break;
			case 'backup':
				this._sidebar.highlight('backup');
				this.exchange.show();
				break;
			case 'restore':
				this._sidebar.highlight('restore');
				this.dummy.show({header: 'Restore'});
				break;
			case 'login':
				this._auth.show();
				break;
			//
			case 'tables':
			case 'views':
			case 'routines':
			case 'triggers':
				this.explore({cid: cid, show: action, from: params[0]});
				break;
			//
			case 'browse':
				this.browser.browse({cid: cid, browse: params[1], from: params[0]});
				break;
			case 'sql':
				this.browser.sql({cid: cid, db: params[0]});
				break;
			case 'columns':
				this._sidebar.highlight('columns', {'database': params[0], 'table': params[1]});
				this.table.edit({cid: cid, table: params[1], from: params[0]});
				break;
			case 'foreign':
				this._sidebar.highlight('foreign', {'database': params[0], 'table': params[1]});
				this.dummy.show();
				break;
			case 'options':
				this._sidebar.highlight('options', {'database': params[0], 'table': params[1]});
				this.dummy.show({header: 'Options'});
				break;
			case 'maintenance':
				this._sidebar.highlight('maintenance', {'database': params[0], 'table': params[1]});
				this.dummy.show({header: {title: 'Maintenance Table', name: params[1]}});
				break;
			case 'flush':
				this._cache.flush();
				this.redirect('databases', cid);
				return;
			default:
				this.redirect('databases', cid);
				return;
		}

		this._state = hash;
	}
};


/**
 * Change window title
 * @param {Object} connection
 * @return {Juxta}
 */
Juxta.prototype.setTitle = function(connection) {
	//
	var title = '';

	if (connection) {
		title = connection.user + '@' +  connection.host;

		if (Number(connection.port) != 3306) {
			title += ':' + connection.port;
		}
	}

	window.document.title = (title ? title + ' - '  : '')  + 'Juxta';

	return this;
};


/**
 * Fix header links href attr
 *
 * @param {Object} connection
 * @return {Juxta}
 */
Juxta.prototype._repairHeaderLinks = function(connection) {
	//
	$('.header-link a[href][name]').each(function(i, link) {
		$(link).attr('href', '#/' + connection.cid + '/' + $(link).attr('name'));
	});

	return this;
};


/**
 *
 */
Juxta.prototype.show = function() {
	$('#sidebar:not(.minimized)').slideDown(250);
	$('.float-box').hide();
	if ($('#applications').not(':visible')) {
		$('#applications').fadeIn(250);
		$('#header h1, #header ul').fadeIn(250);
	}
};


/**
 *
 */
Juxta.prototype.hide = function() {
	$('#header h1, #header ul, #sidebar, #applications, .float-box').hide();
};


/**
 *
 */
Juxta.prototype.explore = function(params) {
	if (params.from) {
		this._sidebar.highlight(params.show, {'database': params.from});
		return this._explorer.explore(params);

	} else {
		this._sidebar.highlight(params.show);
		return this._explorer.explore(params);
	}
};


/**
 *
 */
Juxta.prototype.drop = function(params) {
	this._explorer.drop(params);
};


/**
 *
 */
Juxta.prototype.kill = function(params) {
	this._explorer.kill(params);
};


/**
 *
 */
Juxta.prototype.info = function(params) {
	this._sidebar.highlight('status');
	this.server.info(params);
};


/**
 * Notifications shortcuts
 */
Juxta.prototype.notify = function(message, options) {
	return this._notification.show(message, options);
};


/**
 *
 */
Juxta.prototype.loading = function(message, options) {
	return this._notification.loading(message, options);
};


/**
 *
 */
Juxta.prototype.error = function(message, options) {
	return this._notification.show(message, $.extend({}, {type: 'error', hide: false, fast: true}, options));
};


/**
 *
 */
Juxta.prototype.message = function(message, options) {
	this.messageBox.show(options, message);
};


/**
 *
 */
Juxta.prototype.about = function() {
	this.message($('#about').html(), {title: ''});
};


/**
 * Redirect
 *
 * @param {String} action
 * @param {Number} [cid] Connection ID
 * @return {Juxta}
 */
Juxta.prototype.redirect = function(action, cid) {
	//
	this._state = null;
	window.document.location.hash = '#/' + (typeof cid !== 'undefined' ? cid + '/' : '') + action;

	return this;
};


$(document).ready(function() {
	window.Jux = new Juxta();
});

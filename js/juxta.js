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
	 * @type {String}
	 */
	this._state = null;


	/**
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


	//
	$('.header-change-connection-link').on('click', function() {
		//
		var container = $('.header-connections-container'),
			list = container.find('.header-connections');

		container.css({right: ''}).toggle();

		if (container.is(':visible') && $('body').width() - container.offset().left < container.width()) {
			container.css({right: 7})
		}

		list.toggleClass('scroll', list.prop('scrollHeight') > list.prop('offsetHeight'));

		return false;
	});

	//
	this._connection.on('change', $.proxy(this._changeConnectionCallback, this));

	// Show Juxta when application ready to show
	$.each([this._explorer, this.server, this.browser, this.table], function(i, application) {
		application.on('ready', $.proxy(that.show, that));
	});

	//
	this._auth
		.on('before-show', $.proxy(function() {
			//
			this.hide()._updateWindowTitle();
			this._connection.reset();

		}, this))
		.on('login', function(connection) {
			that._connection.set(connection.cid, connection);
			that.redirect('databases', connection.cid);
		})
		.on('logout', function() {
			that._cache.flush();
			that._updateWindowTitle().redirect('login');
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

	$('#header a[name=logout]').click(function() {
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
	var hash = window.location.hash.replace(/#\/?/g, '').split('?'),
		query = hash[0].split('/'),
		paramsString = hash[1],
		params = [],
		pathParams = [],
		cid,
		action;
	//console.log(paramsString);

	function parseParamsString(str) {
		//
		var ret = {},
			seg = str.replace(/^\?/,'').split('&'),
			len = seg.length, i = 0, s;

		for (; i<len; i++) {
			if (!seg[i]) {
				continue;
			}
			s = seg[i].split('=');
			ret[decodeURIComponent(s[0])] = decodeURIComponent(s[1]);
		}

		return ret;
	}

	if (paramsString) {
		params = parseParamsString(paramsString);
	}

	if (/^\d+$/.test(query[0])) {
		cid = Number(query.shift());
	}

	if (query.length > 0) {
		action = query.pop();
		pathParams = query;
	}

	if (cid === undefined && action !== 'login') {
		this.redirect('login');
		return;
	}

	if (hash[0] != this._state) {
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
				this._auth.show(params.id);
				break;
			//
			case 'tables':
			case 'views':
			case 'routines':
			case 'triggers':
				this.explore({cid: cid, show: action, from: pathParams[0]});
				break;
			//
			case 'browse':
				this.browser.browse({cid: cid, browse: pathParams[1], from: pathParams[0]});
				break;
			case 'sql':
				this.browser.sql({cid: cid, db: pathParams[0]});
				break;
			case 'columns':
				this._sidebar.highlight('columns', {'database': pathParams[0], 'table': pathParams[1]});
				this.table.edit({cid: cid, table: pathParams[1], from: pathParams[0]});
				break;
			case 'foreign':
				this._sidebar.highlight('foreign', {'database': pathParams[0], 'table': pathParams[1]});
				this.dummy.show();
				break;
			case 'options':
				this._sidebar.highlight('options', {'database': pathParams[0], 'table': pathParams[1]});
				this.dummy.show({header: 'Options'});
				break;
			case 'maintenance':
				this._sidebar.highlight('maintenance', {'database': pathParams[0], 'table': pathParams[1]});
				this.dummy.show({header: {title: 'Maintenance Table', name: pathParams[1]}});
				break;
			case 'flush':
				this._cache.flush();
				this.redirect('databases', cid);
				return;
			default:
				this.redirect('databases', cid);
				return;
		}

		this._state = hash[0];
	}
};


/**
 * Change window title
 *
 * @param {Object} connection
 * @return {Juxta}
 */
Juxta.prototype._updateWindowTitle = function(connection) {
	//
	var title = '';

	if (connection) {
		//
		title = this._connection.get('name');

		if (!title) {
			title = connection.user + '@' +  connection.host;

			if (Number(connection.port) != Juxta.defaultPort) {
				title += ':' + connection.port;
			}
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
	$('.header a[name]').each(function(i, link) {
		$(link).attr('href', '#/' + connection.cid + '/' + $(link).attr('name'));
	});

	return this;
};


/**
 * Show the appliaction
 *
 * @return {Juxta}
 */
Juxta.prototype.show = function() {
	$('#sidebar:not(.minimized)').slideDown(250);
	$('.float-box').hide();
	if ($('#applications').not(':visible')) {
		$('#applications').fadeIn(250);
		$('#header h1, #header .header-links').fadeIn(250);
	}

	return this;
};


/**
 * Hide
 *
 * @return {Juxta}
 */
Juxta.prototype.hide = function() {
	//
	$('#header h1, #header .header-links, #sidebar, #applications, .float-box, .context').hide();

	return this;
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


/**
 *
 * @param {Number} cid
 */
Juxta.prototype._changeConnectionCallback = function(cid) {
	//
	if (cid === undefined) {
		return;
	}

	var text = this._connection.get('name'),
		hide = this.hide,
		connectionsList = $('.header-connections');

	if (!text) {
		text = this._connection.get('user') + '@' + this._connection.get('host');

		if (Number(this._connection.get('port')) !== Juxta.defaultPort) {
			text += ':' + this._connection.get('port');
		}
	}

	$('.header-change-connection-link').text(text);

	this._updateWindowTitle(this._connection.get())
		._repairHeaderLinks(this._connection.get());

	connectionsList.empty();

	this._request.send({action: {get: 'connections'}, context: this, success: function(response) {
		$.each(response.connections, $.proxy(function(i, connection) {
			//
			var li = $('<li>').addClass('header-connection'),
				a = $('<a>');

			if (connection.cid == undefined) {
				a.attr('href', '#/login?id=' + connection.id);

			} else if (!this._connection.isCurrent(connection.cid)) {
				li.addClass('established');
				a.attr('href', '#/' + connection.cid + '/');

			} else {
				li.addClass('current');
			}

			if (a.attr('href')) {
				a.on('click', function() { hide(); } );
			}

			connectionsList.append(li.append(a.text(connection.name)));

		}, this));
	}});
};

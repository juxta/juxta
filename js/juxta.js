/*global document, window, setInterval */

/**
 * Juxta 0.0.1
 *
 * Copyright (c) 2010-2011 Alexey Golovnya
 * Licensed under the MIT license
 * http://juxta.ru
 */

/**
 * @class Juxta
 */
var Juxta = function() {

	/**
	 * @type {String}
	 */
	this._state = null;


	/**
	 * @type {Juxta.Cache}
	 */
	this._cache = new Juxta.Cache();


	/**
	 * @type {Juxta.Connection}
	 */
	this._connection = new Juxta.Connection();


	/**
	 * @type {Juxta.Sidebar}
	 */
	this._sidebar = new Juxta.Sidebar('#sidebar', this._connection);


	/**
	 * Request/response
	 * @type Juxta.Request
	 */
	this._request = new Juxta.Request(this._connection, this._cache, {
		request: {
			beforeSend: this.loading.bind(this, null),
			complete: this.loading.bind(this, false),
			error: (function(xhr, status) {
				if (status == 'parsererror') {
					this.error('Answer parsing error');
				} else {
					this.error(xhr.status + ' ' + xhr.statusText);
				}
			}).bind(this)
		},
		response: {
			connectionError: (function(response) {
				this.error(response.error);
				this._auth.show();
			}).bind(this),
			sessionNotFound: this.redirect.bind(this, 'login'),
			error: (function(response) { this.error(response.error); }).bind(this),
			unknowStatus: this.error.bind(this, 'Response with unknow status recived')
		}
	});


	/**
	 * Notification messages
	 * @type {Juxta.Notification}
	 */
	this._notification = new Juxta.Notification();


	/**
	 * @type {Juxta.Explorer}
	 */
	this._explorer = new Juxta.Explorer('.application.explorer', this._request);

	this._explorerOld = new Juxta.ExplorerOld('#explorer', this._request);


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
	 * Connect to server form
	 * @type {Juxta.Auth}
	 */
	this._auth = new Juxta.Auth('#login', this._request);


	/**
	 * Float box
	 * @type {Juxta.Modal}
	 */
	this.messageBox = new Juxta.Modal('#message');


	//
	$('.header-change-connection-link').on('click', function() {
		//
		var container = $('.header-connections-container'),
			list = container.find('.header-connections');

		container.css({right: ''}).toggle();

		if (container.is(':visible') && $('body').width() - container.offset().left < container.width()) {
			container.css({right: 7});
		}

		list.toggleClass('scroll', list.prop('scrollHeight') > list.prop('offsetHeight'));

		return false;
	});

	//
	this._connection.on('change', $.proxy(this._changeConnectionCallback, this));

	// Show Juxta when application ready to show
	$.each([this._explorer, this._explorerOld, this.server, this.browser, this.table], (function(i, application) {
		application.on('ready', this.show.bind(this));
	}).bind(this));

	//
	this._explorer.on('alert', this.message.bind(this))
		.on('modal-hide', this._notification.hide.bind(this._notification));

	//
	this._auth
		.on('before-show', (function() {
			//
			this.hide()._updateWindowTitle();
			this._connection.reset();

		}).bind(this))
		.on('login', (function(connection) {
			this._connection.set(connection.cid, connection);
			this.redirect('databases', connection.cid);

		}).bind(this))
		.on('logout', (function() {

			this._cache.flush();
			this._updateWindowTitle().redirect('login');
		}).bind(this))
		.on('change', (function(cid) { this.redirect('', cid); }).bind(this));

	// Notifications
	this._auth.on('notify', (function(message, type, options) {
		if (type === 'error') {
			this.error(message, options);
		} else if (type === 'loading') {
			this.loading(message, options);
		} else {
			this.notify(message, options);
		}
	}).bind(this));

	//
	$('#header a[name=about]').on('click', (function() { this.message($('#about').html(), {title: ''}); return false; }).bind(this));

	//
	$('#header .sql a').on('click', (function() {
		//
		if (this.browser.is(':visible') && this.browser.mode == 'browse') {
			this.browser.toggleEditor();
		}

		return false;

	}).bind(this));

	$('#header a[name=logout]').on('click', (function() { this._auth.logout(); return false; }).bind(this));

	// @todo Remove this from here
	$('.float-box').draggable({scroll: false, handle: 'h3'});

	// @todo Remove this from here
	$(document.body).on('click', function() {
		$('.context:visible').trigger('hide').hide();
	});

	this.run();

};


/**
 * Default MySQL port
 *
 * @constant {Number}
 */
Juxta.DEFAULT_PORT = 3306;


/**
 * Run application
 *
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
				this.explore({cid: cid, show: action});
				break;
			case 'processlist':
			case 'users':
				this.exploreOld({cid: cid, show: action});
				break;
			case 'status':
			case 'status-full':
			case 'variables':
			case 'charsets':
			case 'engines':
				this.info({cid: cid, show: action});
				break;
			case 'login':
				this._auth.show(params.id);
				break;
			//
			case 'tables':
			case 'views':
			case 'routines':
			case 'triggers':
				this.exploreOld({cid: cid, show: action, from: pathParams[0]});
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

			if (Number(connection.port) != Juxta.DEFAULT_PORT) {
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
	$('#sidebar:not(._minimized)').slideDown(250);
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
 * @param {Object} params
 * @return {jqXHR}
 */
Juxta.prototype.explore = function(params) {
	//
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
Juxta.prototype.exploreOld = function(params) {
	if (params.from) {
		this._sidebar.highlight(params.show, {'database': params.from});
		return this._explorerOld.explore(params);

	} else {
		this._sidebar.highlight(params.show);
		return this._explorerOld.explore(params);
	}
};


/**
 *
 */
Juxta.prototype.drop = function(params) {
	this._explorerOld.drop(params);
};


/**
 *
 */
Juxta.prototype.kill = function(params) {
	this._explorerOld.kill(params);
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
 * Show the notification on loading
 *
 * @param {String} message
 * @param {Object} options
 */
Juxta.prototype.loading = function(message, options) {
	return this._notification.loading(message, options);
};


/**
 * Show error notification
 *
 * @param {String} message
 * @param {Object} options
 * @return {jQuery}
 */
Juxta.prototype.error = function(message, options) {
	return this._notification.show(message, $.extend({}, {type: 'error', hide: false, fast: true}, options));
};


/**
 * Show dialog box with message
 *
 * @param {String} message
 * @param {Object} options
 * @return {Juxta.Modal}
 */
Juxta.prototype.message = function(message, options) {
	return this.messageBox.show(options, message);
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

		if (Number(this._connection.get('port')) !== Juxta.DEFAULT_PORT) {
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

			if (connection.cid === undefined) {
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

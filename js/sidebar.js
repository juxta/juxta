/*global setTimeout, clearTimeout */

/**
 * @class Sidebar
 */
Juxta.Sidebar = function(connection) {

	var that = this;

	/**
	 * @type {Juxta.Connection}
	 * @private
	 */
	this._connection = connection;


	/**
	 * @type {Object}
	 */
	this.tree = {};


	/**
	 * @type {jQuery}
	 */
	this._container = $('#sidebar');


	/**
	 * @type {Object}
	 */
	this.heads = this._container.find('ul:first-child > li');


	/**
	 * @type {Object}
	 */
	this.values = {
		'host': this._container.find('li.host span.value'),
		'database': this._container.find('li.database span.value'),
		'table': this._container.find('li.table span.value')
	};

	this._container.find('.buttons li').each(function() {
		$(this).html('<span>' + $(this).html() + '</span>')
			.find('a').each(function() {
				$(this).addClass($(this).attr('href').replace(/#/g, ''));
			});
		that.tree[this.className] = $(this).parent().parent().attr('class');
	});

	this._container.find('ul:first-child > li h2').click(function() {
		var head = $(this).parent('li');
		if (head.is(':not(.fold):not(.last):visible')) {
			head.addClass('fold').find('.buttons').slideUp(250);
			that._container.find('.last .buttons').slideDown('250');
		} else if (head.is('.fold')) {
			that._container.find('ul:first-child > li:not(.fold):not(.last):visible').addClass('fold')
				.find('.buttons').slideUp(250);
			that._container.
				find('ul:first-child > li.last').
				find('.buttons').slideUp(250);
			head.removeClass('fold').find('.buttons').slideDown(250);
		} else if (head.is('.last') && head.find('.buttons').not(':visible')) {
			head.find('.buttons').slideDown(250);
			that._container.find('ul:first-child > li:not(.fold):not(.last):visible').addClass('fold')
				.find('.buttons').slideUp(250);
		}
	});

	// Restore on mouse out
	this._container.hover(
		function() {
			clearTimeout(this.timer);
		},
		function() {
			this.timer = setTimeout(function() { that.restore(); }, 2000);
		}
	);

	//
	this._connection.on('change', function() {
		//
		that.path(that._connection.get());
	});

};


/**
 * Expand last visible level, close previous
 */
Juxta.Sidebar.prototype.restore = function() {
	this._container
		.find('ul:first-child > li:not(.fold):not(.last):visible').addClass('fold').find('.buttons').slideUp(250);
	this._container
		.find('.last .buttons').slideDown(250);
};


/**
 * @param {String} link
 * @param {Object} path
 */
Juxta.Sidebar.prototype.highlight = function(link, path) {
	clearTimeout(this._container.get(0).timer);

	if (path) {
		this.path(path);
	}

	if (this.tree[link]) {
		var level = this._container.find('ul:first-child > li.' + this.tree[link]);
		if (level.is('.host')) {
			this.heads.filter('.host').addClass('last').show().removeClass('fold').find('.buttons').show();
			this.heads.not('.host').removeClass('last').hide();
		} else if (level.is('.database')) {
			this.heads.filter('.host').removeClass('last').show().addClass('fold').find('.buttons').hide();
			this.heads.filter('.database').addClass('last').show().removeClass('fold').find('.buttons').show();
			this.heads.filter('.table').removeClass('last').hide();
		} else if (level.is('.table')) {
			this.heads.filter('.host').removeClass('last').show().addClass('fold').find('.buttons').hide();
			this.heads.filter('.database').removeClass('last').show().addClass('fold').find('.buttons').hide();
			this.heads.filter('.table').addClass('last').show().removeClass('fold').find('.buttons').show();
		}
	}

	this._container.find('.buttons li').removeClass('active');
	this._container.find('li.' + link).addClass('active');
};


/**
 * @param {Object} path
 */
Juxta.Sidebar.prototype.path = function(path) {
	var that = this;
	$.extend(that.path, path);
	$.each(that.values, function(item) {
		$(this).text(that.path[item]);
	});

	this.repairLinks();
};


/**
 * Fix links
 */
Juxta.Sidebar.prototype.repairLinks = function() {

	var that = this;

	this._container.find('li.host a').each(function() {
		this.href = '#/' + that.path.cid + '/' + this.className;
	});

	this._container.find('li.database a').each(function() {
		this.href = '#/' + that.path.cid + '/' + that.path.database + '/' + this.className;
	});

	this._container.find('li.table a').each(function() {
		this.href = '#/' + that.path.cid + '/' + that.path.database + '/' + that.path.table + '/' + this.className;
	});
};
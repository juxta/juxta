/*global setTimeout, clearTimeout */

/**
 * @class Sidebar
 */
Juxta.Sidebar = function(element, connection) {

	/**
	 * @type {jQuery}
	 */
	this._container = $(element);


	/**
	 * @type {Juxta.Connection}
	 */
	this._connection = connection;


	/**
	 * Links by category
	 * @type {Object}
	 */
	this._tree = {};


	/**
	 * @type {Object}
	 */
	this._heads = this._container.find('ul:first-child > li');


	/**
	 * @type {Object}
	 */
	this._path = {};


	/**
	 * @type {Object}
	 */
	this._values = {
		'host': this._container.find('.sidebar-level[level=host] .sidebar-level-value'),
		'database': this._container.find('.sidebar-level[level=database] .sidebar-level-value'),
		'table': this._container.find('.sidebar-level[level=table] .sidebar-level-value')
	};


	/**
	 * @type {Number}
	 */
	this.FOLD_DURATION = 250;


	this._container.find('.sidebar-link a').each((function(i, link) {
		//
		link = $(link).wrap($('<span>'));

		var href = link.attr('href').replace(/#/g, '');

		if (!link.attr('disabled')) {
			link.attr('link', href);
		} else {
			link.removeAttr('href');
		}

		this._tree[href] = link.closest('.sidebar-level').attr('level');

	}).bind(this));

	this._container.find('.sidebar-level h2').click((function(event) {
		//
		var head = $(event.target).closest('li');

		if (head.is(':not(._fold):not(._last):visible')) {
			head.addClass('_fold').find('.sidebar-links').slideUp(this.FOLD_DURATION);
			this._container.find('.sidebar-level._last .sidebar-links').slideDown(this.FOLD_DURATION);

		} else if (head.is('._fold')) {
			this._container.find('.sidebar-level:not(._fold):not(.last):visible').addClass('_fold')
				.find('.sidebar-links').slideUp(this.FOLD_DURATION);
			this._container.
				find('.sidebar-level._last').
				find('.sidebar-links').slideUp(this.FOLD_DURATION);
			head.removeClass('_fold').find('.sidebar-links').slideDown(this.FOLD_DURATION);

		} else if (head.is('._last') && head.find('.sidebar-links').not(':visible')) {
			head.find('.sidebar-links').slideDown(this.FOLD_DURATION);
			this._container.find('.sidebar-level:not(._fold):not(._last):visible').addClass('_fold')
				.find('.sidebar-links').slideUp(this.FOLD_DURATION);
		}
	}).bind(this));

	// Restore on mouse out
	this._container.hover(
		(function() { clearTimeout(this._timer); }).bind(this),
		(function() { this._timer = setTimeout((function() { this.restore(); }).bind(this), 2000); }).bind(this)
	);

	//
	this._connection.on('change', (function() { this.setPath(this._connection.get()); }).bind(this));

};


/**
 * Expand last visible level, close previous
 */
Juxta.Sidebar.prototype.restore = function() {
	this._container
		.find('.sidebar-level:not(._fold):not(._last):visible').addClass('_fold').find('.sidebar-links').slideUp(this.FOLD_DURATION);
	this._container
		.find('.sidebar-level._last .sidebar-links').slideDown(this.FOLD_DURATION);
};


/**
 * @param {String} link
 * @param {Object} path
 */
Juxta.Sidebar.prototype.highlight = function(link, path) {
	//
	clearTimeout(this._timer);

	if (path) {
		this.setPath(path);
	}

	if (this._tree[link]) {
		var level = this._container.find('.sidebar-level[level=' + this._tree[link] + ']');

		if (level.is('[level=host]')) {

			this._heads.filter('[level=host]').addClass('_last').show().removeClass('_fold').find('.sidebar-links').show();
			this._heads.not('[level=host]').removeClass('_last').hide();

		} else if (level.is('[level=database]')) {
			this._heads.filter('[level=host]').removeClass('_last').show().addClass('_fold').find('.sidebar-links').hide();
			this._heads.filter('[level=database]').addClass('_last').show().removeClass('_fold').find('.sidebar-links').show();
			this._heads.filter('[level=table]').removeClass('_last').hide();

		} else if (level.is('[level=table]')) {
			this._heads.filter('[level=host]').removeClass('_last').show().addClass('_fold').find('.sidebar-links').hide();
			this._heads.filter('[level=database]').removeClass('_last').show().addClass('_fold').find('.sidebar-links').hide();
			this._heads.filter('[level=table]').addClass('_last').show().removeClass('_fold').find('.sidebar-links').show();
		}
	}

	this._container.find('.sidebar-link').removeClass('_active');
	this._container.find('a[link=' + link + ']').closest('.sidebar-link').addClass('_active');
};


/**
 * @param {Object}
 */
Juxta.Sidebar.prototype.setPath = function(path) {
	//
	$.extend(this._path, path);

	$.each(this._values, (function(item, element) {
		$(element).text(this._path[item]);
	}.bind(this)));

	this.repairLinks();
};


/**
 * Fix links
 */
Juxta.Sidebar.prototype.repairLinks = function() {
	//
	var path = this._path;

	this._container.find('.sidebar-level[level=host] a[href]').each(function(i, link) {
		link.href = '#/' + path.cid + '/' + $(link).attr('link');
	});

	this._container.find('.sidebar-level[level=database] a[href]').each(function(i, link) {
		link.href = '#/' + path.cid + '/' + path.database + '/' + $(link).attr('link');
	});

	this._container.find('.sidebar-level[level=table] a[href]').each(function(i, link) {
		link.href = '#/' + path.cid + '/' + path.database + '/' + path.table + '/' + $(link).attr('link');
	});
};
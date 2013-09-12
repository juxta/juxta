/*global document */

/**
 * @class Grid2 context menu
 * @param {Juxta.Grid2} Page
 */
Juxta.Grid2.ContextMenu = function(grid) {


	/**
	 * @type {Juxta.Grid2}
	 * @private
	 */
	this._grid = grid;


	/**
	 * @type {jQuery}
	 */
	this._container = $('<ul>').addClass('grid2-context-menu').appendTo(this._grid._container);

	/**
	 * @type {Object}
	 */
	this._menu = null;


	/**
	 * @type {Object}
	 */
	this._values = {};


	this._grid._bodyContainer.on('contextmenu', (function(event) {
		//
		var row = $(event.target).parents('.grid2-body-row');

		if (row.is('.grid2-body-row')) {
			this.show($(event.target).parents('.grid2-body-row'), {top: event.clientY, left: event.clientX});
			return false;
		}
	}).bind(this));

	//
	$(document.body).on('click', (function() {
		if (this._container.is(':visible')) {
			this.hide();
		}
	}).bind(this));

	//
	this._container.on('click', 'a', (function(event) {
		this.trigger('click', $(event.target).attr('name'), this._target.find('.grid2-body-column:first [type=checkbox]').attr('name'));
	}).bind(this));

};

Juxta.Lib.extend(Juxta.Grid2.ContextMenu, Juxta.Events);


/**
 * Show menu
 * @param {jQuery} Table row
 * @param {Object} Position
 */
Juxta.Grid2.ContextMenu.prototype.show = function(row, position) {
	//
	this._target = row;

	this._container.find('.grid2-context-menu-item a').each((function(i, link) {
		//
		link = $(link);

		var item = this._menu[link.attr('name')],
			values = {};

		if (item && typeof item === 'object' && item.href) {
			$.extend(values, this._values, {name: row.find('.grid2-body-column:first-child [type=checkbox]').attr('name')});
			link.attr('href', $.template(item.href, values));
		}

	}).bind(this));

	this._grid._bodyContainer.find('.grid2-body-column:first-child input[type=checkbox]:checked').attr('checked', false).trigger('change');
	this._target.find('.grid2-body-column:first-child input[type=checkbox]').attr('checked', true).trigger('change');
	this._container.show().offset(position);

};

/**
 * Hide menu
 */
Juxta.Grid2.ContextMenu.prototype.hide = function() {
	//
	this._container.hide();
	this._target.find('.grid2-body-column:first-child input[type=checkbox]').attr('checked', false).trigger('change');
};


/**
 * Loads menu
 *
 * @param menu
 * @param values
 */
Juxta.Grid2.ContextMenu.prototype.load = function(menu, values) {
	//
	var container = this._container,
		link;

	this._menu = menu;
	this._values = values;

	this.clear();

	$.each(this._menu, function(name, item) {
		//
		link = $('<a>').attr('name', name);

		if (typeof item === 'string') {
			link.html(item);
		} else if (typeof item === 'object') {
			link.html(item.title);
		}

		if (link.html()) {
			$('<li>').addClass('grid2-context-menu-item')
				.addClass('_' + name)
				.append(link)
				.appendTo(container);
		}
	});

};


/**
 * Clear menu container
 */
Juxta.Grid2.ContextMenu.prototype.clear = function() {
	this._container.empty();
};
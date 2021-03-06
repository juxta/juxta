define(['events', 'template'], function (Events, render) {

    /**
     * @class Juxta.Grid2.ContextMenu
     *
     * @param {Juxta.Grid2} grid Grid
     */
    function ContextMenu(grid) {

        /**
         * @type {Juxta.Grid2}
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


        this._grid._bodyContainer.on('contextmenu', (function (event) {
            //
            var row = $(event.target).parents('.grid2-body-row');

            if (row.is('.grid2-body-row')) {
                this.show($(event.target).parents('.grid2-body-row'), {top: event.clientY, left: event.clientX});
                return false;
            }
        }).bind(this));

        //
        $(document.body).on('click', (function () {
            if (this._container.is(':visible')) {
                this.hide();
            }
        }).bind(this));

        //
        this._container.on('click', 'a', (function (event) {
            //
            var checkbox = this._target.find('.grid2-body-column:first [type=checkbox]'),
                row;

            if (checkbox.attr('item-type')) {
                row = {};
                row[checkbox.attr('item-type')] = checkbox.attr('name');
            } else {
                row = checkbox.attr('name');
            }

            this.trigger('click', $(event.target).attr('name'), row, this._values);

        }).bind(this));

    }

    ContextMenu.prototype = Object.create(Events.prototype);
    ContextMenu.prototype.constructor = ContextMenu;


    /**
     * Show a menu
     *
     * @param {jQuery} row Table row
     * @param {Object} position Position
     */
    ContextMenu.prototype.show = function (row, position) {
        //
        this._target = row;

        var values = {},
            item;

        $.extend(values, this._values, {name: row.find('.grid2-body-column:first-child [type=checkbox]').attr('name')});

        this._container.find('.grid2-context-menu-item a').each((function (i, link) {
            //
            link = $(link);
            item = this._menu[link.attr('name')];

            if (item && typeof item === 'object' && item.href) {
                link.attr('href', render(item.href, values));
            }

        }).bind(this));

        this._grid._bodyContainer.find('.grid2-body-column:first-child input[type=checkbox]:checked').prop('checked', false).trigger('change');
        this._target.find('.grid2-body-column:first-child input[type=checkbox]').prop('checked', true).trigger('change');

        this._container.show().offset(position);
    };

    /**
     * Hide menu
     */
    ContextMenu.prototype.hide = function () {
        //
        this._container.hide();
        this._target.find('.grid2-body-column:first-child input[type=checkbox]').prop('checked', false).trigger('change');
    };

    /**
     * Loads menu
     *
     * @param menu
     * @param values
     */
    ContextMenu.prototype.load = function (menu, values) {
        //
        var container = this._container,
            link;

        this._menu = menu;
        this._values = values;

        this.clear();

        $.each(this._menu, function (name, item) {
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
    ContextMenu.prototype.clear = function () {
        this._container.empty();
    };

    return ContextMenu;

});

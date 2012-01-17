/**
 * @class Grid context menu
 * @constructor
 * @param {jQuery, String} Page
 * @param {jQuery, String} Menu container
 */
Juxta.ContextMenu = function(page, menu) {

	/**
	 * Grid body
	 * @field
	 */
	this.$page = $(page);

	/**
	 * Container
	 * @field
	 */
	this.$container = $(menu);

	/**
	 * Target (row)
	 * @field
	 */
	this.target = null;

	/**
	 * Value
	 * @field
	 */
	this.value = null;

	var that = this;
	this.$page.bind('contextmenu', function(event) {
		that.show($(event.target).parents('tr'), {top: event.clientY, left: event.clientX});
		return false;
	});

	this.$container.bind('hide', $.proxy(this.hide, this));
}

/**
 * Hide menu
 */
Juxta.ContextMenu.prototype.hide = function() {
	this.target.find(':checkbox').attr('checked', false);
	this.target.find('td:nth-child(2)').find('a').removeClass('checked');

	this.target = null;
	this.value = null;

	this.$page.trigger('change');
}

/**
 * Show menu
 * @param {jQuery} Table row
 * @param {Object} Position
 */
Juxta.ContextMenu.prototype.show = function(row, position) {
	this.target = row;
	this.value = this.target.find('[type=checkbox]');

	this.$container.show().offset(position);

	this.$page.find('a.checked').removeClass('checked');
	this.$page.find('[type=checkbox]:checked').removeAttr('checked');

	this.target.find(':checkbox').attr('checked', true);
	this.target.find('td:nth-child(2)').find('a').addClass('checked');

	this.$page.trigger('change');

	return false;
}

/**
 * Load menu
 * @param {String, Array} Menu template or items 
 */
Juxta.ContextMenu.prototype.load = function(menu) {
	if (typeof menu === 'string') {
		this.$container.find('ul').html(menu);
	} else {
		var $menu = this.$container.find('ul').empty();
		$.each(menu, function(i, item) {
			var $item = $('<li>').text(item.title);
			if (item.class) {
				$item.addClass(item.class);
			}
			if (item.action && typeof item.action === 'function') {
				$item.bind('click', item.action);
			}
			$item.appendTo($menu);
		});
	}
 }

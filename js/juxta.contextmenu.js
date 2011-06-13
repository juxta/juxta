/**
 * @class ContextMenu
 */

Juxta.ContextMenu = function(page, menu) {
	//
	this.target = null;
	this.value = null;
	this.$page = $(page);
	this.$container = $(menu);

	var that = this;

	this.$page.bind('contextmenu', function(event) {
		that.show($(event.target).parents('tr'), {top: event.clientY, left: event.clientX});
		return false;
	});

	this.$container.bind('hide', function() {
		that.hide();
	});
}

Juxta.ContextMenu.prototype.hide = function() {
	this.target.find(':checkbox').attr('checked', false);
	this.target.find('td:nth-child(2)').find('a').removeClass('checked');

	this.target = null;
	this.value = null;

	this.$page.trigger('change');
}

Juxta.ContextMenu.prototype.show = function(row, position) {
	this.target = row;
	this.value = this.target.find('[type=checkbox]');

	this.$container.show().offset(position);

	this.$page.find('a.checked').removeClass('checked');
	this.$page.find('[type=checkbox]:checked').removeAttr('checked');

	this.target.find(':checkbox').attr('checked', true);
	this.target.find('td:nth-child(2)').find('a').addClass('checked');

	this.$page.trigger('change');
}

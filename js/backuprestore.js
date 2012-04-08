/**
 * @class Backup and Restore application
 * @extends Juxta.Application
 * @param {jQuery|String} element
 * @param {Juxta.Request} request
 */
Juxta.BackupRestore = function(element) {

	Juxta.Application.prototype.constructor.call(this, element,  {header: 'Backup', menu: {'Options': {href: '#backup/options', click: 'return false;'}}});

	/**
	 * @type {Juxta.TreeGrid}
	 */
	this.grid = new Juxta.TreeGrid(this.$application.find('.grid'));

	$(window).bind('resize', {that: this}, this.stretch);
}

Juxta.Lib.extend(Juxta.BackupRestore, Juxta.Application);

/**
 * Show application
 * @param {Object} options
 * @return {Juxta.BackupRestore}
 */
Juxta.BackupRestore.prototype.show = function(options) {

	Juxta.Application.prototype.show.apply(this, arguments);
	this.stretch();

	var params = {
			head: {'database': 'Items for backup'},
			row: '<tr><td class="expand"></td><td class="check"><input type="checkbox"></td><td class="database"><a>{database}</a></td></tr>',
			context: ['database']
		},
		data = ['information_schema', 'mysql', 'sampdb', 'test'];

	this.grid.fill(data, params);

	return this;
}


/**
 * Stretch grid to window height
 * @param {Event} event
 */
Juxta.BackupRestore.prototype.stretch = function(event) {
	var that = event && event.data.that || this;
	if (that.$application.is(':visible')) {
		that.$application.find('.grid .body').height($('#applications').height() - that.$application.find('.grid .body').position().top - that.$statusBar.height() - 24);
	}
}

Juxta.TableEditor = function(element) {

	Juxta.Application.prototype.constructor.call(this, element, {closable: false, mazimized: false, menu: {'Browse table' : {click: "Jux.browse({browse: '123', from: 'Qq'}); return false;"}}});

	$(window).bind('resize', {that: this}, this.stretch);
}

Juxta.Lib.extend(Juxta.TableEditor, Juxta.Application);

/**
 * 
 */
Juxta.TableEditor.prototype.show = function(options) {
	Juxta.Application.prototype.show.apply(this, arguments);
	this.stretch();

	return this;
}


/**
 * 
 */
Juxta.TableEditor.prototype.stretch = function(event) {
	var that = event && event.data.that || this;
	if (that.$application.is(':visible')) {
		if ($('#applications').height() < 500) {
			that.$application.find('.grid.indexes .body').height(72);
		} else{
			that.$application.find('.grid.indexes .body').height($('#applications').height() * 0.225);
		}
		that.$application.find('.grid.columns .body').height($('#applications').height() - that.$application.find('.grid.columns .body').position().top - that.$statusBar.height() - 24 - that.$application.find('.grid.indexes')[0].offsetHeight - 54 /* H2 height with margins */);
	}
}

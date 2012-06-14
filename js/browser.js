/**
 * @class Data browser
 * @extends Juxta.Application
 * @param {jQuery|String} element
 * @param {Juxta.Request} request
 */
Juxta.Browser = function(element, request) {

	var that = this;

	Juxta.Application.prototype.constructor.call(this, element, {header: 'Browse', closable: true, maximized: true});

	/**
	 * @type {Juxta.Request}
	 */
	this.request = request;


	/**
	 * @type {Juxta.TreeGrid}
	 */
	this.grid = new Juxta.Grid2(this.$application.find('.grid2'));


	$(this.grid).bind('change', function () {
		if (typeof that.grid.count == 'undefined') {
			that.$statusBar.empty();
		} else {
			that.$statusBar.text(that.grid.count + (that.grid.count == 1 ? ' row' : ' rows'));
		}
	});

	$(window).bind('resize', {that: this}, this.stretch);

}

Juxta.Lib.extend(Juxta.Browser, Juxta.Application);

/**
 * Show explorer
 * @param {Object} options
 * @retrun {Juxta.Browser}
 */
Juxta.Browser.prototype.show = function(options) {
	Juxta.Application.prototype.show.apply(this, arguments);
	this.stretch();

	return this;
}


/**
 * Stretch grid to window height
 * @param {Event} event
 */
Juxta.Browser.prototype.stretch = function(event) {
	var that = event && event.data.that || this;
	if (that.$application.is(':visible')) {
		that.grid.setHeight($('#applications').height() - that.$application.find('.grid2-body').position().top - that.$statusBar.height() - 24);
	}
}


/**
 * Browse a table
 * @param {Object} params
 */
Juxta.Browser.prototype.browse = function(params) {
	return this.requestBrowse(params);
}


/**
 * Request data
 * @param {Object} params
 */
Juxta.Browser.prototype.requestBrowse = function(params) {
	var query = $.extend({}, params),
		options = {};

	this.grid.empty();

	this.show({
		header: {title: 'Browse', name: params.browse, from: params.from}/*,
		menu: {'Create Trigger': {click: 'return false;'}}*/
	});

	this.request.send($.extend(
		{},
		{action: query, context: this, success: this.responseBrowse},
		this.settings,
		options
	));
}


/**
 * Response
 * @param {Object} response
 */
Juxta.Browser.prototype.responseBrowse = function(response) {

	var params = {
		columns: [],
		contextMenu: [
			{title: 'Delete', action: function() { console.log('Drop'); }},
			{title: 'Edit', action: function() { console.log('Edit');  }}
		],
		head: {}
	};

	$.each(response.columns, function(i, column) {
		params.columns.push({title: column[0], style: 'test'});
	});

	//params.columns = ['country_id', 'country', 'last_update'];

	this.grid.fill(response.data, params);

	this.show();
}

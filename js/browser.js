/**
 * @class Data browser
 * @extends Juxta.Application
 * @param {jQuery|String} element
 * @param {Juxta.Request} request
 */
Juxta.Browser = function(element, request) {

	Juxta.Application.prototype.constructor.call(this, element, {header: 'Browse', closable: true, maximized: true});

	/**
	 * @type {Juxta.TreeGrid}
	 */
	this.grid = new Juxta.TreeGrid(this.$application.find('.grid'));


	/**
	 * @type {Juxta.Request}
	 */
	this.request = request;

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
		that.$application.find('.grid .body').height($('#applications').height() - that.$application.find('.grid .body').position().top - that.$statusBar.height() - 24);
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
	var params = $.extend(
		{},
		response,
		{
			head: {},
			row: null,
			context: [],
			contextMenu: [
				{title: 'Delete', action: function() { console.log('Drop'); }},
				{title: 'Edit', action: function() { console.log('Edit');  }}
			]
		}
	);

	if (response.columns) {
		params.row = '<tr>';
		$.each(response.columns, function(i, column) {
			params.head[(
				'column' +
				(column[1] ? ' ' + column[1] : '') +
				' ' + column[0]
			).toLowerCase()] = column[0];
			//
			params.row += '<td class="column ' + column[0] + '"><div>{' + column[0] + '}</div></td>';
			//params.row += '<td>{' + column[0] + '}</td>';
			//
			params.context.push(column[0]);
		});
		params.row += '</tr>';
	}
	delete params.data;

	this.grid.prepare(params);
	this.grid.fill(response.data, params);

	this.show();
}

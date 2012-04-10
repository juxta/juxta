/**
 * @class Editor for views, stored procedures and triggers
 * @param {jQuery} element
 * @param {Juxta.Request} request
 */
Juxta.RoutineEditor = function(element, request) {

	Juxta.FloatBox.prototype.constructor.call(this, element);

	/**
	 * @type {Juxta.Request}
	 */
	this.request = request;

	/**
	 * @type {Juxta.SqlEditor}
	 */
	this.editor = new Juxta.SqlEditor(this.$floatBox.find('textarea'));

	/**
	 * @param {Object} [arams
	 */
	this.edit = function(params) {
		var query;

		if (params.view) {
			query = {show: 'view', view: params.view, from: params.from};
		} else if (params['function']) {
			query = {show: 'function', 'function': params['function'], from: params.from};
		} else if (params.procedure) {
			query = {show: 'procedure', procedure: params.procedure, from: params.from};
		} else if (params.trigger) {
			query = {show: 'trigger', trigger: params.trigger, from: params.from};
		}

		if (query) {
			this.requestCreateRoutine(query);
		}
	}

	/**
	 * @param {Object} query
	 */
	this.requestCreateRoutine = function(query) {
		this.request.send({
			action: query,
			success: this.responseEditRoutine,
			context: this
		});
	}

	/**
	 * @param {Object} response
	 */
	this.responseEditRoutine = function(response) {
		if (response.view) {
			this.show({title: 'View {name}', name: response.view, from: response.from});
		} else if (response['function']) {
			this.show({title: 'Function {name}', name: response['function'], from: response.from});
		} else if (response.procedure) {
			this.show({title: 'Procedure {name}', name: response.procedure, from: response.from});
		} else if (response.trigger) {
			this.show({title: 'Trigger {name}', name: response.trigger, from: response.from});
		}

		this.editor.edit(response.statement);
	}

}

Juxta.Lib.extend(Juxta.RoutineEditor, Juxta.FloatBox);

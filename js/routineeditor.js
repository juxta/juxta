/**
 * @class Editor for views, stored procedures and triggers
 * @extends Juxta.Modal
 * @param {jQuery} element
 * @param {Juxta.Request} request
 */
Juxta.RoutineEditor = function(element, request) {

	Juxta.Modal.prototype.constructor.call(this, element);

	/**
	 * @type {Juxta.Request}
	 */
	this._request = request;

	/**
	 * @type {Juxta.SqlEditor}
	 */
	this._editor = new Juxta.SqlEditor(this.container.find('textarea'));

}

Juxta.Lib.extend(Juxta.RoutineEditor, Juxta.Modal);

/**
 * Show editor
 * @param {Object} params
 */
Juxta.RoutineEditor.prototype.edit = function(params) {
	//
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
		this._requestCreateRoutine(query);
	}
}


/**
 * @param {Object} query
 */
Juxta.RoutineEditor.prototype._requestCreateRoutine = function(query) {
	this._request.send({
		action: query,
		success: this._responseEditRoutine,
		context: this
	});
}


/**
 * @param {Object} response
 */
Juxta.RoutineEditor.prototype._responseEditRoutine = function(response) {
	if (response.view) {
		this.show({title: 'View {name}', name: response.view, from: response.from});
	} else if (response['function']) {
		this.show({title: 'Function {name}', name: response['function'], from: response.from});
	} else if (response.procedure) {
		this.show({title: 'Procedure {name}', name: response.procedure, from: response.from});
	} else if (response.trigger) {
		this.show({title: 'Trigger {name}', name: response.trigger, from: response.from});
	}

	this._editor.edit(response.statement);
}
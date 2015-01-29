define(['modal', 'editor'], function (Modal, Editor) {

    /**
     * @class Editor for views, stored procedures and triggers
     * @extends Modal
     *
     * @param {jQuery} element
     * @param {Request} request
     */
    function RoutineEditor(element, request) {

        Modal.prototype.constructor.call(this, element);

        /**
         * @type {Request}
         */
        this._request = request;


        /**
         * @type {Editor}
         */
        this._editor = new Editor(this._container.find('textarea'));

    }

    RoutineEditor.prototype = Object.create(Modal.prototype);
    RoutineEditor.prototype.constructor = RoutineEditor

    /**
     * Show editor
     * @param {Object} params
     */
    RoutineEditor.prototype.edit = function (params) {
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
    };

    /**
     * @param {Object} query
     */
    RoutineEditor.prototype._requestCreateRoutine = function (query) {
        this._request.send({
            action: query,
            success: this._responseEditRoutine,
            context: this
        });
    };

    /**
     * @param {Object} response
     */
    RoutineEditor.prototype._responseEditRoutine = function (response) {
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
    };

    return RoutineEditor;

});

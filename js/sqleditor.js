define(['modal', 'editor'], function (Modal, Editor) {

    /**
     * @class SQL editor
     * @extends Juxta.Modal
     *
     * @param {jQuery} element
     */
    function SqlEditor(element) {

        Modal.prototype.constructor.call(this, element);

        /**
         * @type {Editor}
         */
        this._editor = new Editor(this._container.find('textarea'));

    }

    SqlEditor.prototype = Object.create(Modal.prototype);
    SqlEditor.prototype.constructor = SqlEditor;

    /**
     * View SQL (read only)
     *
     * @param {Object} params
     */
    SqlEditor.prototype.view = function (query, params) {

        this._container.find('.modal-buttons').hide();

        this.show(params);

        this._editor.edit(query);

        return this;
    };

    /**
     * Edit SQL
     *
     * @param {Object} params
     */
    SqlEditor.prototype.edit = function (query, params) {

        this._editor.edit(query);

        this.show(params);

        return this;
    };

    return SqlEditor;

});

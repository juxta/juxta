/**
 * @class SQL editor
 * @extends Juxta.Modal
 *
 * @param {jQuery} element
 */
Juxta.SqlEditor = function(element) {

    Juxta.Modal.prototype.constructor.call(this, element);

    /**
     * @type {Juxta.Editor}
     */
    this._editor = new Juxta.Editor(this._container.find('textarea'));

};

Juxta.Lib.extend(Juxta.SqlEditor, Juxta.Modal);

/**
 * View SQL (read only)
 *
 * @param {Object} params
 */
Juxta.SqlEditor.prototype.view = function(query, params) {

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
Juxta.SqlEditor.prototype.edit = function(query, params) {

    this._editor.edit(query);

    this.show(params);

    return this;
};

define(['modal'], function (Modal) {

    /**
     * @class Create Database
     * @extends Juxta.Modal
     *
     * @param {jQuery} element
     * @param {Juxta.Request} request
     */
    function CreateDatabase(element, request) {

        Modal.prototype.constructor.call(this, element);

        /**
         * @type {Juxta.Request}
         */
        this._request = request;

        /**
         * @type {jQuery}
         */
        this._form = this._container.find('form[name=create-database]');

        /**
         * @type {jQuery}
         */
        this._submit = this._form.find('input[type=submit]');


        this._form.on('submit', (function () {
            this._createDatabaseRequest();
            return false;
        }).bind(this));

    }

    CreateDatabase.prototype = Object.create(Modal.prototype);
    CreateDatabase.prototype.constructor = CreateDatabase;

    /**
     * Show dialog window
     *
     * @see {Juxta.Modal.prototype.show}
     * @return {Juxta.CreateDatabase}
     */
    CreateDatabase.prototype.show = function () {
        //
        Modal.prototype.show.apply(this, arguments);

        this._submit.attr('disabled', false);
        this._container.find('input[type=text]').focus().val(null);

        return this;
    };

    /**
     * Request to create database
     *
     * @return {jqXHR}
     */
    CreateDatabase.prototype._createDatabaseRequest = function () {
        //
        this._submit.attr('disabled', true);

        return this._request.send({
            action: {create: 'database'},
            data: this._form.serialize(),
            success: this._createDatabaseCallback,
            error: function () {
                this._submit.attr('disabled', false);
            },
            context: this
        });
    };

    /**
     * Callback on database create
     *
     * @return {Juxta.CreateDatabase}
     */
    CreateDatabase.prototype._createDatabaseCallback = function () {
        //
        this._container.hide();
        this.trigger('created');

        return this;
    };

    return CreateDatabase;

});

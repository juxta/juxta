/*global document */

/**
 * @class Modal dialog
 *
 * @param element
 * @param options
 */
Juxta.Modal = function(element, options) {

    /**
     * @type {Object}
     */
    this._settings = {
        title: 'New window',
        closable: true,
        center: true
    };

    $.extend(this._settings, options);


    /**
     * @type {jQuery}
     */
    this._container = $(element);


    /**
     * @type {jQuery}
     */
    this._header =  this._container.find('.modal-header');

    if (!this._header.is('.modal-header')) {
        this._header = this._container.prepend('<h3>').find('h3').addClass('modal-header').html(this._settings.title);
    }


    /**
     * Close button
     *
     * @type {jQuery}
     */
    this._close = this._container.find('input[type=button].modal-close');

    if (!this._close.is('input')) {
        this._close = $('<input>').attr('type', 'button').addClass('modal-close close').insertAfter(this._header).attr('disabled', !this._settings.closable);
    }


    this._settings.title = this._header.html();

    this._close.on('click', this.hide.bind(this));

    this._container.draggable({scroll: false, handle: '.modal-header'});

    this.center();

};

Juxta.Lib.extend(Juxta.Modal, Juxta.Events);


/**
 * Show a window
 *
 * @param {Object} options
 * @param {String} content
 * @return {Juxta.Modal}
 */
Juxta.Modal.prototype.show = function(options, content) {
    //
    this.trigger('before-show');

    options = $.extend({}, this._settings, options);
    if (options.name) {
        options.name = '<a class="modal-header-link">' + options.name + '</a>';
    }

    this._header.html($.template(options.title, options));

    // Append content
    if (content) {
        this.clear();
        $(content).insertAfter(this._close);
    }

    this._container.show();

    if (options.center) {
        this.center();
    }

    this.trigger('show');

    return this;
};


/**
 * Hide a window
 *
 * @return {Juxta.Modal}
 */
Juxta.Modal.prototype.hide = function() {
    //
    this._container.hide();
    this.trigger('hide');

    return this;
};


/**
 * Center a window
 *
 * @return {Juxta.Modal}
 */
Juxta.Modal.prototype.center = function() {
    //
    var height = $(document.body).height(),
        width = $(document.body).width(),
        left = (width - this._container.width()) / 2,
        top = parseInt(0.75 * (height - this._container.height()) / 2, 10);

    if (top <= 5) {
        top = 5;
    }

    this._container.css({left: left, top: top});

    return this;
};


/**
 * Clear
 *
 * @return {Juxta.Modal}
 */
Juxta.Modal.prototype.clear = function() {
    //
    this._container.find('> *:not(.modal-header):not(.modal-close)').remove();

    return this;
};

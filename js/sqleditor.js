/*global CodeMirror */

/**
 * @class SQL Editor
 * @param {jQuery} textarea
 * @param {Object} options
 */
Juxta.SqlEditor = function(textarea, options) {

	/**
	 * @type {Object}
	 */
	this._settings = {
		mode: 'text/x-mysql',
		tabMode: 'indent',
		tabSize: 4,
		matchBrackets: true,
		lineNumbers: true,
		fixedGutter: true,
		autoFormatLineBreaks: true
	};

	$.extend(this._settings, options);


	/**
	 * @type {jQuery}
	 */
	this._textarea = $(textarea);


	/**
	 * @type {CodeMirror}
	 * @private
	 */
	this._editor = CodeMirror.fromTextArea(this._textarea.get(0), this._settings);


	/**
	 * Set the editor content
	 * @param {String} text
	 * @return {Juxta.SqlEditor}
	 */
	this.edit = function(text) {
		//
		this._editor.setValue(text);

		return this;
	};


	/**
	 * Redraw the editor
	 * @return {Juxta.SqlEditor}
	 */
	this.refresh = function() {
		this._editor.refresh();

		return this;
	};


	this.setHeight = function(height) {
		this._editor.setSize(null, height);

		return this;
	};


	this.is = function() {
		return $.fn.is.apply($(this._editor.getWrapperElement()), arguments);
	};

};



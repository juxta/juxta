/**
 * Juxta 0.0.1
 *
 * Copyright (c) 2010-2011 Alexey Golovnya
 * Licensed under the MIT license
 * http://juxta.ru
 */

/**
 * @class SQL Editor
 * @param {jQuery} textarea
 * @param {Object} options
 */
Juxta.SqlEditor = function(textarea, options) {

	/**
	 * @type {jQuery}
	 */
	this.textarea = $(textarea);

	/**
	 * @type {jQuery}
	 */
	this.numbers = this.textarea.before('<ul class="line-numbers"><li>1</li></ul>').prev('ul');

	/**
	 * @type {Number}
	 */
	this.lines = 1;

	this.numbers.css('height', this.textarea.attr('clientHeight'));

	var that = this;
	this.textarea.resize(function() {	// Resize line numbers container on text area resize
		that.numbers.css('height', this.clientHeight);
	}).scroll(function() {	// Scroll line numbers with text area
		that.numbers.find('li:first-child').css({'margin-top': -this.scrollTop + 'px'});
	});

	this.textarea.keydown(function(event) {
		if (event.which == 13) {	// Scroll to the left when new line starts
			this.scrollLeft = 0; 
		} else if (event.keyCode == 9 && !event.shiftKey && !event.altKey) {
			var start = this.selectionStart;
			var end = this.selectionEnd;

			this.value = this.value.substring(0,start) + "\t" + this.value.substring(end, this.value.length);

			this.selectionStart = start+1;
			this.selectionEnd = start+1;

			return false;
		}

	});

	var textAreaHeight = this.textarea.attr('clientHeight');

	// Calculating line numbers
	var t = setInterval(function() {
		rows = that.textarea.attr('value').replace(/\r\n/g, '\n').replace(/\n\r/g, '\n').split('\n').length;
		if (rows != that.lines) {
			if (rows > that.lines) {
				for (row = that.lines + 1; row <= rows; row++) {
					that.numbers.append('<li>' + row + '</li>');
					that.lines++;
				}
			} else if (rows < that.lines) {
				that.numbers.find('li').slice(rows - that.lines).remove();
				that.lines = rows;
			}
		}

		if (that.textarea.attr('clientHeight') != textAreaHeight) {
			that.textarea.trigger('resize');
			textAreaHeight = that.textarea.attr('clientHeight');
		}
	}, 100);

	/**
	 * @param {String} text
	 */
	this.edit = function(text) {
		this.textarea.text(text);
	}

};

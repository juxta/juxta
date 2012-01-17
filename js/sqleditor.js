Juxta.SqlEditor = $.Class();
Juxta.SqlEditor.prototype = {
	init: function(textarea, options) {
		this.textarea = $(textarea);
		this.numbers = this.textarea.before('<ul class="line-numbers"><li>1</li></ul>').prev('ul');
		this.lines = 1;

		var self = this;
		this.numbers.css('height', this.textarea.attr('clientHeight'));
		this.textarea.resize(function() {	// Resize line numbers container on text area resize
			self.numbers.css('height', this.clientHeight);
		}).scroll(function() {	// Scroll line numbers with text area
			self.numbers.find('li:first-child').css({'margin-top': -this.scrollTop + 'px'});
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
			rows = self.textarea.attr('value').replace(/\r\n/g, '\n').replace(/\n\r/g, '\n').split('\n').length;
			if (rows != self.lines) {
				if (rows > self.lines) {
					for (row = self.lines + 1; row <= rows; row++) {
						self.numbers.append('<li>' + row + '</li>');
						self.lines++;
					}
				} else if (rows < self.lines) {
					self.numbers.find('li').slice(rows - self.lines).remove();
					self.lines = rows;
				}
			}

			if (self.textarea.attr('clientHeight') != textAreaHeight) {
				self.textarea.trigger('resize');
				textAreaHeight = self.textarea.attr('clientHeight');
			}
		}, 100);
	},
	edit: function(text) {
		this.textarea.text(text);
	}
};

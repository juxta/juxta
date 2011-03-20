Juxta.Notification = $.Class();
Juxta.Notification.prototype = {
	init: function() {
		this.container = $('#notify ul');
	},
	settings: {
		hide: true,
		delay: 3000,
		hideSpeed: 300
	},
	loadingSettings: {
		hide: false,
		delay: 250,
		hideSpeed: 100,
		type: 'loading'
	},
	load: null,
	loads: 0,
	show: function(message, options) {
		var self = this;
		options = $.extend({}, self.settings, options);
		if (options.fast) {
			this.container.empty();
		}
		if (options.element) {
			var notify = options.element;
		} else {
			var notify = $('<li><span></span></li>').appendTo(this.container);
		}
		notify.show().find('span').text(message);
		if (options.hide) {
			this.hide(notify, options);
		}
		notify.find('span').addClass(options.type);
		return notify;
	},
	hide: function(element, options) {
		element.delay(options.delay).slideUp(options.hideSpeed, function() { $(this).remove(); });
		this.load = null;
	},
	loading: function(message, options) {
		var self = this;
		options = $.extend({}, self.loadingSettings, options);
		if (message === false && this.load) {
			if (--this.loads == 0) {
				this.hide(this.load, options);
			}
		} else if(message !== false) {
			if (this.loads++ == 0) {
				this.container.empty();
				message = message || 'Loading..'; 
				if (this.load) {
					options.element = this.load;
				}
				this.load = this.show(message, options);
			}
		}
	}
};

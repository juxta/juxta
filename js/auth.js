Juxta.Auth = $.Class(Juxta.FloatBox, {
	storedConnections: undefined,
	init: function(element, request) {
		this._super(element, {title: 'Connect to MySQL Server', closable: false});
		this.$form = this.$floatBox.find('form[name=login]');
		this.form = this.$form.get(0);
		this.$connections = $('select[name=connection]');
		this.$password = this.$form.find('input[type=password]');
		this.$submit = this.$form.find('input[type=submit]');
		this.request = request;

		var self = this;
		$('#header a[href=#logout]').click(function() {
			self.logout();
			return false;
		});
		this.$form.bind('submit', function() {
			self.$submit.focus();
			self.login();
			return false;
		});
		this.$connections.bind('change', function() {
			self.fillForm(self.storedConnections[this.value]);
			self.$connections.find('option[value=0]').remove();
			self.$password.focus().val(null);
		});
		$('input[name=host],input[name=user]', this.$form).bind('keyup', function() {
			if (self.$connections.val() > 0) {
				var curConnection = self.storedConnections[self.$connections.val()];
				if (curConnection['host'] != self.form['host'].value ||
					curConnection['user'] != self.form['user'].value
				) {
					self.$connections.prepend('<option value="0"></option>').val(0);
				}
			}
		});
	},
	show: function() {
		if (!this.storedConnections) {
			this.request.send({action: {get: 'connections'}, context: this, success: this.getConnectionsResponse});
		}
		//
		Jux.hide();
		this.$submit.attr('disabled', false);
		this.$password.val(null);
		this._show();
		if (this.$form[0]['host'].value && this.$form[0]['user'].value) {
			this.$password.focus();
		}
	},
	login : function() {
		if (jQuery.trim($('input[name=host]', this.$form).val()) == '') {
			$('input[name=host]', this.$form).val('localhost');
		}
		if (jQuery.trim($('input[name=port]', this.$form).val()) == '') {
			$('input[name=port]', this.$form).val('3306');
		}
		//
		this.$submit.attr('disabled', true);
		this.request.send({
			action: 'login',
			data: this.$form.serialize(),
			beforeSend: function() { Jux.loading('Connecting to ' + $('input[name=host]', this.$form).val()) },
			success: this.loginResponse,
			context: this
		});
	},
	loginResponse: function(response) {
		if (response.result == 'connected') {
			Jux.state = null;
			document.location.hash = '#databases';
		} else {
			Jux.error(response.message);
			//
			this.$submit.attr('disabled', false);
			this.$password.focus();
		}
	},
	logout: function() {
		this.request.send({
			action: 'logout',
			success: function() {
				Jux.cache.flush();
				Jux.connection = null;
				document.location.hash = '#login';
			}
		});
	},
	getConnectionsResponse: function(response) {
		if (!$.isEmptyObject(response.data)) {
			var self = this, connections = {};
			$.each(response.data, function(i) {
				if (this.name == undefined) {
					this.name = this.user + '@' + this.host;
				}
				$('<option>', {val: i + 1, selected: this['default']}).html(this.name).appendTo(self.$connections);
				connections[i + 1] = this;
			});
			this.$connections.attr('disabled', false);
			//
			this.storedConnections = connections;
			if (this.form['host'].value == '' && this.form['user'].value == '') {
				this.fillForm(this.storedConnections[this.$connections.val()]);
				this.$password.focus();
			} else {
				this.$connections.prepend('<option value="0"></option>');
			}
		}
	},
	fillForm: function(values) {
		if (values) {
			this.form['host'].value = values['host'];
			this.form['port'].value = values['port'];
			this.form['user'].value = values['user'];
		}
	}
});

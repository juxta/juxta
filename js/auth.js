/**
 * @class Connect to.. window
 */
Juxta.Auth = function(element, request) {

	/**
	 * @type {Object}
	 */
	this.storedConnections = undefined;

	Juxta.Auth.prototype.constructor.call(this, element, {title: 'Connect to MySQL Server', closable: false});

	this.$form = this.$floatBox.find('form[name=login]');
	this.form = this.$form.get(0);
	this.$connections = $('select[name=connection]');
	this.$password = this.$form.find('input[type=password]');
	this.$submit = this.$form.find('input[type=submit]');
	this.request = request;

	var that = this;
	$('#header a[href=#logout]').click(function() {
		that.logout();
		return false;
	});
	this.$form.bind('submit', function() {
		that.$submit.focus();
		that.login();
		return false;
	});
	this.$connections.bind('change', function() {
		that.fillForm(that.storedConnections[this.value]);
		that.$connections.find('option[value=0]').remove();
		that.$password.focus().val(null);
	});
	$('input[name=host],input[name=user]', this.$form).bind('keyup', function() {
		if (that.$connections.val() > 0) {
			var curConnection = that.storedConnections[that.$connections.val()];
			if (curConnection['host'] != that.form['host'].value ||
				curConnection['user'] != that.form['user'].value
			) {
				that.$connections.prepend('<option value="0"></option>').val(0);
			}
		}
	});

}

Juxta.Lib.extend(Juxta.Auth, Juxta.FloatBox);

/**
 * Show window
 */
Juxta.Auth.prototype.show = function() {
	if (!this.storedConnections) {
		this.request.send({action: {get: 'connections'}, context: this, success: this.getConnectionsResponse});
	}
	// @todo Remove global
	Jux.hide();
	this.$submit.attr('disabled', false);
	this.$password.val(null);

	Juxta.FloatBox.prototype.show.apply(this, arguments);

	if (this.$form[0]['host'].value && this.$form[0]['user'].value) {
		this.$password.focus();
	}
}


/**
 * Login
 */
Juxta.Auth.prototype.login = function() {
	if (jQuery.trim($('input[name=host]', this.$form).val()) == '') {
		$('input[name=host]', this.$form).val('localhost');
	}
	if (jQuery.trim($('input[name=port]', this.$form).val()) == '') {
		$('input[name=port]', this.$form).val('3306');
	}
	//
	this.$submit.attr('disabled', true);
	// @todo Remove Window.Jux
	this.request.send({
		action: 'login',
		data: this.$form.serialize(),
		beforeSend: function() { Jux.loading('Connecting to ' + $('input[name=host]', this.$form).val()) },
		success: this.loginResponse,
		context: this
	});
}


/**
 * @param {Object} response
 * @todo Remove globals
 */
Juxta.Auth.prototype.loginResponse = function(response) {
	if (response.result == 'connected') {
		Jux.state = null;
		document.location.hash = '#databases';
	} else {
		Jux.error(response.message);
		//
		this.$submit.attr('disabled', false);
		this.$password.focus();
	}
}


/**
 * Logout
 * @todo Remove globals
 */
Juxta.Auth.prototype.logout = function() {
	this.request.send({
		action: 'logout',
		success: function() {
			Jux.cache.flush();
			Jux.connection = null;
			document.location.hash = '#login';
		}
	});
}


/**
 * Response for getting connections request
 * @param {Object} response
 */
Juxta.Auth.prototype.getConnectionsResponse = function(response) {
	if (!$.isEmptyObject(response.data)) {
		var that = this,
			connections = {};
		$.each(response.data, function(i) {
			if (this.name == undefined) {
				this.name = this.user + '@' + this.host;
			}
			$('<option>', {val: i + 1, selected: this['default']}).html(this.name).appendTo(that.$connections);
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
}


/**
 * Fill login form
 * @param {Object} values
 */
Juxta.Auth.prototype.fillForm = function(values) {
	if (values) {
		this.form['host'].value = values['host'];
		this.form['port'].value = values['port'];
		this.form['user'].value = values['user'];
	}
}

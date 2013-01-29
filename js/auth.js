/**
 * @class Connect to..
 * @extends Juxta.Modal
 * @param {jQuery} element
 * @param {Object} options
 */
Juxta.Auth = function(element, request) {

	Juxta.Modal.prototype.constructor.call(this, element, {title: 'Connect to MySQL Server', closable: false});

	/**
	 * @type {Object}
	 */
	this.storedConnections = undefined;


	/**
	 * @type {jQuery}
	 */
	this.form = this.container.find('form[name=login]');


	/**
	 * @type {jQuery}
	 */
	this.connections = $('select[name=connection]');


	/**
	 * @type {jQuery}
	 */
	this.password = this.form.find('input[type=password]');


	/**
	 * @type {jQuery}
	 */
	this.submit = this.form.find('input[type=submit]');


	/**
	 * @type {Juxta.Request}
	 */
	this.request = request;


	/**
	 * Default port
	 * @type {Number}
	 * @private
	 */
	this._defaultPort = 3306;


	var that = this;

	$('#header a[href=#logout]').click(function() {
		that.logout();
		return false;
	});

	this.form.bind('submit', function() {
		that.submit.focus();
		that.login();
		return false;
	});

	this.connections.bind('change', function() {
		that.fillForm(that.storedConnections[this.value]);
		that.connections.find('option[value=0]').remove();
		that.password.focus().val(null);
	});

	$('input[name=host],input[name=user]', this.form).bind('keyup', function() {
		if (that.connections.val() > 0) {
			var curConnection = that.storedConnections[that.connections.val()];
			if (curConnection.host != that.form.find('[name=host]').val() ||
				curConnection.user != that.form.find('[name=user]').val()
			) {
				that.connections.prepend('<option value="0"></option>').val(0);
			}
		}
	});
};

Juxta.Lib.extend(Juxta.Auth, Juxta.Modal);

/**
 * Show window
 * @return {Juxta.Auth}
 */
Juxta.Auth.prototype.show = function() {
	//
	if (!this.storedConnections) {
		this.request.send({action: {get: 'connections'}, context: this, success: this.getConnectionsResponse});
	}

	this.submit.attr('disabled', false);
	this.password.val(null);

	Juxta.Modal.prototype.show.apply(this, arguments);

	if (this.form.find('[name=host]').val() && this.form.find('[name=user]').val()) {
		this.password.focus();
	}

	return this;
};


/**
 * Login
 * @return {jqXHR}
 */
Juxta.Auth.prototype.login = function() {
	if ($.trim(this.form.find('[name=host]').val()) === '') {
		this.form.find('[name=host]').val('localhost');
	}
	if ($.trim(this.form.find('[name=port]').val()) === '') {
		this.form.find('[name=port]').val(this._defaultPort);
	}

	this.submit.attr('disabled', true);

	return this.request.send({
		action: 'login',
		data: this.form.serialize(),
		beforeSend: function() { this.trigger('notify', 'Connecting to ' + this.form.find('[name=host]').val(), 'loading'); },
		success: this.loginResponse,
		context: this
	});
};


/**
 * Response for action login
 * @param {Object} response
 */
Juxta.Auth.prototype.loginResponse = function(response) {
	//
	if (response.to) {
		this.trigger('login', response.to);
	} else {
		this.trigger('notify', response.message, 'error');
		this.submit.attr('disabled', false);
		this.password.focus();
	}
};


/**
 * Logout
 */
Juxta.Auth.prototype.logout = function() {

	var that = this;

	this.request.send({
		action: 'logout',
		success: function() { that.trigger('logout'); }
	});
};


/**
 * Response for getting connections request
 * @param {Object} response
 */
Juxta.Auth.prototype.getConnectionsResponse = function(response) {
	//
	if (!$.isEmptyObject(response.data)) {
		var that = this,
			connections = {};

		$.each(response.data, function(i) {
			if (this.name === undefined) {
				this.name = this.user + '@' + this.host;
			}
			$('<option>', {val: i + 1, selected: this['default']}).html(this.name).appendTo(that.connections);
			connections[i + 1] = this;
		});
		this.connections.attr('disabled', false);
		//
		this.storedConnections = connections;

		if (this.form.find('[name=host]').val() === '' && this.form.find('[name=user]').val() === '') {
			this.fillForm(this.storedConnections[this.connections.val()]);
			this.password.focus();
		} else {
			this.connections.prepend('<option value="0"></option>');
		}
	}
};


/**
 * Fill login form
 * @param {Object} values
 */
Juxta.Auth.prototype.fillForm = function(connection) {
	if (connection) {
		this.form.find('[name=host]').val(connection.host);
		this.form.find('[name=port]').val(connection.port);
		this.form.find('[name=user]').val(connection.user);
	}
};
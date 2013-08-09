/**
 * @class Connect to Server
 * @extends {Juxta.Modal}
 * @param {jQuery} element
 * @param {Object} options
 */
Juxta.Auth = function(element, request) {

	Juxta.Modal.prototype.constructor.call(this, element, {closable: false});

	/**
	 * @type {Juxta.Request}
	 */
	this._request = request;


	/**
	 * @type {Object}
	 */
	this._storedConnections = [];


	/**
	 * @type {jQuery}
	 */
	this._form = this._container.find('form[name=login]');


	/**
	 * @type {jQuery}
	 */
	this._connections = this._form.find('[name=connection]');


	/**
	 * @type {jQuery}
	 */
	this._submit = this._form.find(':submit');


	//
	this._form.on('submit', $.proxy(function() {
		//
		this._submit.focus();
		this.login();

		return false;
	}, this));

	//
	this._connections.on('change', $.proxy(function(event) {
		//
		var id = event.target.value,
			connection = this._storedConnections[id];

		if (connection && connection.cid !== undefined) {
			this.trigger('change', connection.cid);

		} else if (connection) {
			this.fill(connection);
			this._form.find('[name=password]').focus().val('');

		} else {
			this._form.find('[name=id]').val('').attr('disabled', true);
		}
	}, this));

	//
	this._form.find('[name=host],[name=user],[name=port]').on('keyup', $.proxy(function(event) {
		//
		var input = $(event.target),
			name = input.attr('name'),
			id = this._connections.val(),
			connection;

		if (id !== '') {
			connection = this._storedConnections[id];
		}

		if (connection && connection[name] && connection[name] != input.val()) {
			this._connections.val('').trigger('change');
		}
	}, this));

	this._form.find('[name=host]').attr('placeholder', 'localhost');
	this._form.find('[name=port]').attr('placeholder', Juxta.defaultPort);

};

Juxta.Lib.extend(Juxta.Auth, Juxta.Modal);


/**
 * Show window
 *
 * @return {Juxta.Auth}
 */
Juxta.Auth.prototype.show = function(id) {
	//
	this._form.find(':input').not(':submit').val('');
	this._connections.prop('disabled', true);
	this._submit.prop('disabled', false);

	this._request.send({action: {get: 'connections'}, context: this, success: function(response) { this._getConnectionsCallback(response, id); } });

	Juxta.Modal.prototype.show.apply(this, arguments);

	return this;
};


/**
 * Login
 *
 * @return {jqXHR}
 */
Juxta.Auth.prototype.login = function() {
	//
	if ($.trim(this._form.find('[name=host]').val()) === '') {
		this._form.find('[name=host]').val('localhost');
	}
	if ($.trim(this._form.find('[name=port]').val()) === '') {
		this._form.find('[name=port]').val(Juxta.defaultPort);
	}

	this._submit.attr('disabled', true);

	return this._request.send({
		action: 'login',
		data: this._form.serialize(),
		beforeSend: function() {
			this.trigger('notify', 'Connecting to ' + this._form.find('[name=host]').val(), 'loading');
		},
		success: this._loginCallback,
		context: this
	});
};


/**
 * Response callback that will be called when login request completes
 *
 * @param {Object} response
 */
Juxta.Auth.prototype._loginCallback = function(response) {
	//
	if (response.to) {
		this.trigger('login', response.to);

	} else {
		this.trigger('notify', response.message, 'error');
		this._submit.attr('disabled', false);
		this._form.find('[name=password]').focus();
	}
};


/**
 * Logout
 *
 * @return {jqXHR}
 */
Juxta.Auth.prototype.logout = function() {
	//
	return this._request.send({
		action: 'logout',
		success: $.proxy(function() { this.trigger('logout'); }, this)
	});
};


/**
 * Response callback after request for connections has completed
 *
 * @param {Object} connections
 * @param {Number} id
 */
Juxta.Auth.prototype._getConnectionsCallback = function(response, id) {
	//
	this._connections.empty().prepend($('<option>').text(''));

	if (!$.isEmptyObject(response.connections)) {
		$.each(response.connections, $.proxy(function(i, connection) {
			//
			if (connection.name === undefined) {
				connection.name = connection.user + '@' + connection.host;

				if (connection.port !== Juxta.defaultPort) {
					connection.name += ':' + connection.port;
				}
			}

			this._storedConnections[connection.id] = connection;

			$('<option>', {val: connection.id}).html(connection.name).appendTo(this._connections);

		}, this));

		if (id !== undefined) {
			this._connections.val(id).trigger('change');
		}

		this._connections.attr('disabled', false);
	}
};


/**
 * Populate login form
 *
 * @param {Object} values
 * @return {Juxta.Auth}
 */
Juxta.Auth.prototype.fill = function(connection) {
	//
	if (connection) {
		this._form.find('[name=host]').val(connection.host);
		this._form.find('[name=port]').val(connection.port);
		this._form.find('[name=user]').val(connection.user);

		if (connection.id !== undefined) {
			this._form.find('[name=id]').attr('disabled', false).val(connection.id);
		} else {
			this._form.find('[name=id]').attr('disabled', true);
		}
	}

	return this;
};

/**
 * @namespace Juxta
 */
var Juxta = {};

/**
 * Default MySQL port
 *
 * @constant {Number}
 */
Juxta.DEFAULT_PORT = 3306;

/**
 * Compose name string from connection params
 *
 * @param {Object} connection
 * @return {String}
 */
Juxta.composeConnectionName = function(connection)
{
	var name = '';

	if (connection.user) {
		name += connection.user + '@';
	}

	name += connection.host;

	if (!connection.port) {
		connection.port = Juxta.DEFAULT_PORT;
	}

	if (connection.port != Juxta.DEFAULT_PORT) {
		name += ':' + connection.port;
	}

	return name;
};

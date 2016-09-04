var DEBUG = require('debug');
var debug = {
	debug: DEBUG('keystone-live'),
	sockets: DEBUG('keystone-live:apiSocket'),
}
var _ = require('lodash');

module.exports = function checkAuth(auth, socket, callback) {
	if(_.isFunction(auth)) {
		debug.sockets('runAction RUN AUTH');
		auth.call(this, socket, function(err) {
			if(err) {
				return callback(err.name + ': ' + err.message);
			}
			callback();
		});
	} else {
		callback();
	}				
}

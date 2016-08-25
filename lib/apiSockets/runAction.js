var checkAuth = require('./checkAuth.js');
var runMiddleware = require('./runMiddleware.js');

var DEBUG = require('debug');
var debug = {
	debug: DEBUG('keystone-live'),
	sockets: DEBUG('keystone-live:apiSocket'),
}

/** REQUEST ROUTINE **/
module.exports = function runAction(req, list, socket, callback) {
	debug.sockets('runAction checkAuth');
	checkAuth(req.auth, socket, function(err) {
		if(!err) {
			runMiddleware(list, socket, req.middleware, function(err) {
				callback();
			});
		} else {
			callback(err);
		}
	});
	
}

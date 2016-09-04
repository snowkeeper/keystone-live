var DEBUG = require('debug');
var debug = {
	debug: DEBUG('keystone-live'),
	sockets: DEBUG('keystone-live:apiSocket'),
}
var _ = require('lodash');

var defaultAuth = module.exports.defaultAuth = function(socket, next) {
	var live = this;
	if (socket.handshake.session) {
		debug.sockets('live socket session', socket.handshake.session)
		var session = socket.handshake.session;
		if(!session.userId) {
			debug.sockets('request without userId session');
			return next(new Error('Authentication error'));
		} else {
			var User = live.keystone.list(live.keystone.get('user model'));
			User.model.findById(session.userId).exec(function(err, user) {

				if (err) {
					return next(new Error(err));
				}
				if(!user.isAdmin) {
					return next(new Error('User is not authorized'))
				}
				session.user = user;
				next();

			});
		
		}
	} else {
		debug.sockets('session error');
		next(new Error('Authentication session error'));
	}

} // end default auth function

module.exports.pickAuth = function(opts) {
	
	var globalAuthFunction = function(socket, next) {
		next();
	}
	
	if(_.isFunction(opts.auth)) {
		// user function
		globalAuthFunction = opts.auth;
	
	} else if(opts.auth) {
		// check for a session and see if the user can
		globalAuthFunction = defaultAuth;
	} // end auth function setup
	
	return globalAuthFunction;
	
}

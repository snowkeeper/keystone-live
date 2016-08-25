var _ = require('lodash');
var requireUser = require('./requireUser.js');

module.exports = function setMiddleware(options, middle, auth) {
	
	// auth
	if(auth) {
		if(_.isFunction(options.auth)) {
			 middle.push(options.auth);
		} else if(options.auth) {
			middle.push(requireUser);
		}
	}
	
	if(_.isFunction(options.middleware) || _.isArray(options.middleware)) {
		if(_.isArray(options.middleware)) {
			 var middle = _.union(middle, options.middleware);
		} else {
			middle.push(options.middleware);
		}
	} 
	
}

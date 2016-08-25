var DEBUG = require('debug');
var debug = {
	debug: DEBUG('keystone-live'),
	sockets: DEBUG('keystone-live:apiSocket'),
}
var async = require('async');
var _ = require('lodash');

module.exports = function runMiddleware(data, socket, middleware, callback) {
	debug.sockets('runAction check for middleware');
	if(_.isArray(middleware) && middleware.length > 0) {
		debug.sockets('runAction RUN MIDDLEWARE');
		async.applyEachSeries(middleware, data, socket, callback);
	} else {
		callback();
	}
}

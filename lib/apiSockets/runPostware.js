var DEBUG = require('debug');
var debug = {
	debug: DEBUG('keystone-live'),
	sockets: DEBUG('keystone-live:apiSocket'),
}
var async = require('async');
var _ = require('lodash');

module.exports = function runPostware(list, docs, socket, postware, callback) {
	debug.sockets('runAction check for postware');
	if(_.isArray(postware) && postware.length > 0) {
		debug.sockets('runAction RUN POSTWARE');
		var seq = async.seq.apply(this, postware);
		seq(list, docs, socket, callback)
	} else {
		callback();
	}
}

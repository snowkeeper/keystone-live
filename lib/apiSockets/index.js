var _ = require('lodash');
var sock = require('socket.io')();
var sharedsession = require("express-socket.io-session");
var connection = require('./connection');
var auth = require('./auth');
var DEBUG = require('debug');

var debug = {
	debug: DEBUG('keystone-live'),
	sockets: DEBUG('keystone-live:apiSocket'),
}

module.exports = function(opts, callback) {
	
	// quit if no keystone
	this.checkForKeystone();
	
	var live = this;
	var keystone = this.keystone;
	
	if(!_.isFunction(callback)) {
		if(_.isFunction(opts)) {
			callback = opts;
			opts = {};          
		}
		callback = function() { return live };         
	}
	
	if(!_.isObject(opts)) opts = {};
	if(!_.isObject(opts.routes)) opts.routes = {};
	if(!_.isObject(opts.listConfig)) opts.listConfig = {};
	if(!_.isObject(opts.lists)) opts.lists = {};
	if(_.isFunction(opts.middleware)) opts.middleware = [opts.middleware];
	if(!_.isArray(opts.middleware)) opts.middleware = [];
	if(_.isFunction(opts.postware)) opts.postware = [opts.postware];
	if(!_.isArray(opts.postware)) opts.postware = [];
	
	sock.serveClient(false);
	
	var io = this.io = sock.attach(keystone.httpServer);
	
	// keystone moved the session to a property in 0.4.x 
	var expressSession = keystone.expressSession || keystone.get('express session');
	
	/* set up session middleware */
	io.use(sharedsession(expressSession, keystone.get('session options').cookieParser));
	
	/* create namespace */
	var listNamespace = live._live.namespace.lists =  io.of('/lists');
	
	/* session management */
	listNamespace.use(sharedsession(expressSession, keystone.get('session options').cookieParser));
	
	/* add global auth*/
	listNamespace.use(function(socket, next){
		if(!keystone.get('auth')) {
			next();
		} else {
			auth.pickAuth(opts)(socket, next);
		}
	});		
	
	/** socket connections **/
	listNamespace.on("connection", connection.call(live, opts));
	
	return callback();
	
}

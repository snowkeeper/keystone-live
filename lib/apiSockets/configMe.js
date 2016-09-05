var DEBUG = require('debug');
var debug = {
	debug: DEBUG('keystone-live'),
	sockets: DEBUG('keystone-live:apiSocket'),
}
var _ = require('lodash');
var restSock = require('../restful/restful-sock');
var auth = require('./auth');

/*
 * return an object with the correct route and middleware and postware
 * */
module.exports = function configMe(options, list, path, alias, live) {
	// check in order, first wins
	// options[list[path]]
	// options[path]
	// restSock[path]
	
	var globalMiddleware = options.middleware;
	var globalPostware = options.postware;	
	
	var listConfig = options.lists[list] || {};
	debug.sockets('consfigMe listConfig?', path, listConfig, options.routes[path]);
	debug.sockets('consfigMe route config?', options.routes[path]);
	
	if(_.isArray(listConfig.middleware)) {
		var listMiddleware = _.union(globalMiddleware, listConfig.middleware);
	} else if(listConfig.middleware) {
		var listMiddleware = _.union(globalMiddleware, [listConfig.middleware]);
	} else {
		var listMiddleware = _.clone(globalMiddleware);
	}
	
	if(_.isArray(listConfig.postware)) {
		var listPostware = _.union(globalPostware, listConfig.postware);
	} else if(listConfig.postware) {
		var listPostware = _.union(globalPostware, [listConfig.postware]);
	} else {
		var listPostware = _.clone(globalPostware);
	}
	
	if(_.isFunction(listConfig.auth)) {
		var listAuth = listConfig.auth;
	} else if(listConfig.auth) {
		var listAuth = auth.defaultAuth;
	} else {
		var listAuth = auth.pickAuth(options);
	}
				
	var me =  convertToObject(listConfig[path] || options.routes[path] || restSock[path], options, path);
	
	debug.sockets('configMe me');
			
	return me;
	
	function convertToObject(checkme, opts, path) {
		debug.sockets('## convertToObject ## checkme', checkme );		
		var alias = 'list';
		if(_.isFunction(checkme)) {
			// we have a function route so wrap with defaults
			return {
				auth: listAuth,
				live: live,
				middleware: listMiddleware,
				postware: listPostware,
				route: checkme,
			}
		} else if(_.isObject(checkme)) {
			var me = Object.assign({
				auth: listAuth,
				live: live,
				middleware: listMiddleware,
				postware: listPostware,
				route: restSock[path] || restSock[alias],
				
			}, checkme);
			// append middleware to global
			if(checkme.middleware && _.isArray(listMiddleware)) {
				debug.sockets('## Append  ' + path + '  middleware to global');
				if(_.isFunction(checkme.middleware)) {
					checkme.middleware = [checkme.middleware];
				}
				me.middleware = _.union(listMiddleware, checkme.middleware);
			}
			
			// check for route postware
			if(checkme.postware && _.isArray(listPostware)) {
				debug.sockets('## Append ' + path + ' postware to global', listPostware, checkme.postware);
				if(_.isFunction(checkme.postware)) {
					checkme.postware = [checkme.postware];
				}
				me.postware = _.union(listPostware, checkme.postware);
			}
			
			/* double check auth
			 * A list can add auth for all routes or per route
			 * We are meant a true true here, but we just check for existence
			 * */
			if(checkme.auth && !_.isFunction(checkme.auth)) {
				me.auth = auth.defaultAuth;
			}
			/* double check route
			 * just make sure for the hell of it
			 * */
			if(!_.isFunction(me.route)) {
				console.log('LOST ROUTE');
				me.route = restSock[alias];
			}
			return me
		} else {
			
			return {
				auth: listAuth,
				live: live,
				middleware: listMiddleware,
				postware: listPostware,
				route: restSock[path] || restSock[alias],
			}
		}
	}
	
}

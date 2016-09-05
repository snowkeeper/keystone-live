var DEBUG = require('debug');
var debug = {
	debug: DEBUG('keystone-live'),
	sockets: DEBUG('keystone-live:apiSocket'),
}
var configMe = require('./configMe.js');
var runPostware = require('./runPostware.js');
var runAction = require('./runAction.js');
var _ = require('lodash');

module.exports = function buildRoutes(socket, routes, opts, req) {
	
	var live = this;
	// set inclusion / exclusion
	var globalExcludeRoutes = opts.listConfig.skip ? opts.listConfig.skip.split(/[\s,]+/) : [];
	var globalOnlyRoutes = opts.listConfig.only ? opts.listConfig.only.split(/[\s,]+/) : false;
	var globalMiddleware = opts.middleware;
	var globalPostware = opts.postware;
	
	routes.forEach(function(route) {
		
		var alias = route;
		if(alias === 'find') alias = 'list';	
		/* *
		 * listener
		 * */
		socket.on(route, function(request) {
								
			/* set route from config and run middleware */
			debug.sockets('run ', route);
			
			var list = _.clone(request);
			
			list.list = live.keystone.lists[list.list];
			
			
			if(!list.list) {
				// fail
				return live.emit('doc:' + socket.id, {
					type: route, 
					path: request.list,  
					success: false, 
					error: 'No List provided', 
					iden: request.iden,
					req: request
				});
			}
			// add opts
			list.list.apiOptions = opts;
			
			if(globalOnlyRoutes && globalOnlyRoutes.indexOf(request.list) < 0) {
				return live.emit('doc:' + socket.id, {
					path: list.list.path, 
					route: route,
					success: false, 
					error: 'Not Allowed',
					req: request
				});
			}
			
			if(globalExcludeRoutes && globalExcludeRoutes.indexOf(request.list) > -1) {
				return live.emit('doc:' + socket.id, {
					path: list.list.path,
					route: route, 
					success: false, 
					error: 'Not Allowed',
					req: request
				});
			}
			
			var listConfig = opts.lists[request.list];
			
			if(_.isObject(listConfig)) {
				var excludes = listConfig.skip ? listConfig.skip.split(/[\s,]+/) : [];
				if(excludes.indexOf('list') > -1) {
					return live.emit('doc:' + socket.id, {
						path: list.list.path,
						route: route, 
						success: false, 
						error: 'Not Allowed',
						req: request
					});
				}
			}
			
			var me = configMe(opts, request.list, route, alias, live);
			
			debug.sockets('buildRoutes runAction for me');
																	
			runAction(me, list, socket, function(err) {
				debug.sockets('buildRoutes runAction callback for ' + list.list.key);
				if(err) {
					debug.sockets('buildRoutes Error: ' + err.message);
					live.emit('doc:' + socket.id, {
						path: list.list.path, 
						route: route,
						success: false, 
						error: err.message,
						req: request
					});
				} else {
					me.route(list, req, socket, function(err, docs) {
						debug.sockets('buildRoutes got docs from ', list.list.key, 'error:', err);
						if(docs) {
							runPostware(list.list.path, docs, socket, me.postware, function(err, a, manipulatedDocs, b) {
								// send data to listeners
								live.emit('doc:' + socket.id, {
									path: list.list.path, 
									route: route,
									data: manipulatedDocs || docs, 
									success: true,
									req: request
								});
							})
						} else {
							// fail
							live.emit('doc:' + socket.id, {
								path: list.list.path,
								route: route, 
								success: false, 
								error: err,
								req: request
							});
						}
					});
				}
			});
			
		});
	});
}

/*!
 * Module dependencies.
 */

var _ = require('lodash');
var keystone = false;
var	async = require('async');
var	utils;
var events = require('events');
var util = require('util');
var sock = require('socket.io')();
var restSock = require('./lib/restful-sock');
var restApi = require('./lib/restful-api');
var sharedsession = require("express-socket.io-session");
var DEBUG = require('debug');

var debug = {
	debug: DEBUG('keystone-live'),
	list: DEBUG('keystone-live:list'),
	get: DEBUG('keystone-live:get'),
	create: DEBUG('keystone-live:create'),
	remove: DEBUG('keystone-live:remove'),
	update: DEBUG('keystone-live:update'),
	sockets: DEBUG('keystone-live:apiSocket'),
	routes: DEBUG('keystone-live:apiRoutes'),
	events: DEBUG('keystone-live:listEvents'),
}


/**
 * Live Constructor
 * =================
 *
 * attach live events to models and routes
 *
 * @api public
 */

function Live() {

	this._options = {};
	this._live = {
		namespace: {}
	};
	
}

// Extend from EventEmitter
util.inherits(Live, events.EventEmitter);

var live = module.exports = exports = new Live();

/**
 * init sockets
 * 
 * */
Live.prototype.init = function(Keystone) {
	
	if(Keystone) keystone = Keystone;
	
	checkForKeystone();
	
	utils = keystone.utils;
	
	debug.debug('keystone-live init');
	
	return this;

}

/**
 * mock route return response and events
 * 
 * */
Live.prototype.router = function(path, callback) {
	
	var live = this;
	var app = this.app;
	this.MockRes = require('mock-res');
	this.MockReq = require('mock-req');
	
}

/**
 * list api routes
 * 
 * */
Live.prototype.apiRoutes = function(list, options) {
	
	var app = keystone.app;
	
	var live = this;	
	
	if(!_.isObject(options)) options = {};
	
	// add the route without trailing slash
	var route = options.route;
	if(route === false) {
		route = '';
	} else if(!route) {
		route = '/api';
	} else if(route.charAt(0) != '/') {
		route = '/' + route;
	}
	
	// add the method path names
	if(!_.isObject(options.paths)) options.paths = {};
	var createPath = options.paths.create || 'create';
	var updatePath = options.paths.update || 'update';
	var updateFieldPath = options.paths.updateField || 'updateField';
	var listPath = options.paths.list || 'list';
	var removePath = options.paths.remove || 'remove';
	
	if(list && _.isObject(keystone.lists[list])) {
		// add api routes to list method
		return add(keystone.lists[list], true);
	
	} else if(list) {
		// nothing happening
		return this;
	
	} else {
		// loop through keystone.lists
		_.each(keystone.lists,function(alist, key) {
			if(!_.isObject(alist.schema.methods.api)) {
				add(alist);
			}
			
		},this);
		
		return this;
	}
	
	function add(list, SINGLE) {
		
		if(!_.isObject(list.schema.methods.api)) {
			list.schema.methods.api = {};
		}
		
		if(!_.isObject(options.routes)) {
			options.routes = {};
		}
		
		list.apiOptions = options;
		
		// we will save our routes and attach them to keystone for use throughout your application
		var apiRoutes = {};
		
		// create a container for each routes own stack
		var routeOptions = {
			middleware: {},
		};
		
		var excludeRoutes = options.skip ? options.skip.split(/[\s,]+/) : [];
		
		var PATH = options.path && SINGLE ? options.path : list.path;
		
		_.each(restApi, function(fn, method) {
			/* *
			 * create the api route handlers 
			 * *
			 * 
			 * exclude routes in options.routeExcludes
			 * 
			 * use route overrides from options.routes	
			 * options.routes.get = function(list) { 
			 * 		return function(req, res) { 
			 * 			list.model.findById(req.params.id).exec(function(err, doc) {
			 * 				if (err) return res.apiError('database error', err, null, 200);
			 * 				if (!item) return res.apiError('not found', null, 200);
			 * 				
			 * 				var ret = {}
			 * 				ret[list.path] = item;
			 * 
			 * 				res.apiResponse(ret );
			 *			});
			 * 		} 
			 * 	}
			 * */
			
			var routeConfig = options.routes[method];
			if(excludeRoutes.indexOf(method) >= 0) {
				
				apiRoutes[method] = false;
			
			} else if (_.isFunction(routeConfig)) {
				
				apiRoutes[method] = routeConfig(list);	
			
			} else if(_.isObject(routeConfig)) {
				
				routeOptions.middleware[method] = []
				setMiddleware(routeConfig, routeOptions.middleware[method]);
				if(_.isFunction(routeConfig.route)) {
					apiRoutes[method] = routeConfig.route(list);
				} else {
					apiRoutes[method] = fn(list);
				}		
			
			} else {
				
				apiRoutes[method] = fn(list);	
			
			}
			
		});
		
		apiRoutes.find = apiRoutes.list;
		
		/* attach methods to the list */
		var api = list.schema.methods.api = apiRoutes;

		// global middleware
		var middle = [keystone.middleware.api];
		
		setMiddleware(options, middle);
		
		// custom routes
		var defaultRoutes = ['list', 'find', 'get','create','remove','update','updateField'];
		_.each(options.routes, function(options, theRoute) {
			var mid = [];
			if(_.isFunction(options)) {
				
				options = {
					route: options
				}	
			
			} else if(_.isObject(options) && _.isFunction(options.route)) {
				
				setMiddleware(options, mid);		
			
			} else {
				return;
			}
			
			if(!_.includes(defaultRoutes, theRoute)) {
				
				api[theRoute] = options.route(list);
				addRoute('get', route +'/' + PATH + '/' + theRoute, api[theRoute], middle, mid);
				addRoute('get', route +'/' + PATH + '/:id/' + theRoute, api[theRoute], middle, mid);
				addRoute('get', route +'/' + PATH + '/' + theRoute + '/:id', api[theRoute], middle, mid);
			
			}
		});
		
		// add routes to express
		if(api.list) {
			addRoute('get', route +'/' + PATH + '/' + listPath, api.list, middle, routeOptions.middleware.list);
		}
		if(api.find) {
			addRoute('get', route +'/' + PATH + '/find', api.list, middle, routeOptions.middleware.list);
		}
		if(api.create) {
			addRoute('all', route +'/' + PATH + '/' + createPath, api.create, middle, routeOptions.middleware.create);
		}
		if(api['get']) {
			addRoute('get', route +'/' + PATH + '/:id', api['get'], middle, routeOptions.middleware['get']);
		}
		if(api.update) {
			addRoute('all', route +'/' + PATH + '/:id/' + updatePath, api.update, middle, routeOptions.middleware.update);
		}
		if(api.updateField) {
			addRoute('all', route +'/' + PATH + '/:id/' + updateFieldPath, api.updateField, middle, routeOptions.middleware.updateField);
		}
		if(api.remove) {
			addRoute('get', route +'/' + PATH + '/:id/' + removePath, api.remove, middle, routeOptions.middleware.remove);
		}
		
		app.get(route +'/' + PATH + '/*', middle, function(req, res){
			res.apiError('Bad Request', 'The path you requested does not exist', null, 200);
		});
	
		
		return live;
	}
	
	function addRoute(method, path, route, globalMiddleware, middleware) {
		
		globalMiddleware = _.isArray(globalMiddleware) ? globalMiddleware : globalMiddleware ? [globalMiddleware] : [];
		middleware = _.isArray(middleware) ? middleware : middleware ? [middleware] : [];
		var middle = _.union(globalMiddleware, middleware);
		app[method](path, middle, route);
	}
	
	// middleware require user
	function requireUser(req, res, next) {
	
		if (!req.user) {
			
			return res.apiError('not authorized', 'Please login to use the service', null, 401);
			
		} else {
			
			next();
		}
		
	}
	
	function setMiddleware(options, middle) {
		
		// auth
		if(keystone.get('auth')) {
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
	
}

/**
 * attach live events to a keystone List
 * 
 * */
Live.prototype.listEvents = function(list) {
	
	checkForKeystone();
	
	var live = this;	
	
	if(list && _.isObject(keystone.lists[list])) {
		// add the list events and post save
		return add(keystone.lists[list]);
	
	} else if(list) {
		// nothing to do here
		return this;
	
	} else {
		//no list so loop through all keystone.lists
		_.each(keystone.lists,function(list, key) {
			add(list);
		},this);
		return this;
	
	}
	
	function add(list) {
		/**
		 * changeEvent emits the result to any selected rooms including the lists room
		 * live.emit emits to the root level sockets and any other listeners
		 * 
		 * changeEvent is at bottom page
		 * */
		
		/* pre events */
		list.schema.pre('init', function (next) {
			// emit init event 
			var doc = this;
			changeEvent({type:'init:pre', path:list.path, data:doc, success: true}, live._live.namespace.lists);
			live.emit('doc:Pre',{type:'init', path:list.path,  data:doc, success: true});
			next();
		});
		list.schema.pre('validate', function (next) {
			// emit validate event 
			var doc = this;
			changeEvent({type:'validate:pre', path:list.path, data:doc, success: true}, live._live.namespace.lists);
			live.emit('doc:Pre',{type:'validate', path:list.path,  data:doc, success: true});
			next();
		});
		list.schema.pre('save',function(next) {
			var doc = this;
			// emit saved event 
			live.emit('doc:Pre',{type:'save', path:list.path, id:doc._id.toString(), data:doc, success: true});			
			changeEvent({type:'save:pre', path:list.path, id:doc._id.toString(), data:doc, success: true}, live._live.namespace.lists);
			next();
		});
		list.schema.pre('remove', function (next) {
			// emit remove event 
			var doc = this;
			changeEvent({type:'remove:pre', path:list.path, id:doc._id.toString(), data:doc, success: true}, live._live.namespace.lists);
			live.emit('doc:Pre',{type:'remove', path:list.path, id:doc._id.toString(), data:doc, success: true});
			next();
		});
		
		/* post events */
		list.schema.post('init', function (doc) {
			// emit init event 
			changeEvent({type:'init:post', path:list.path, data:doc, success: true}, live._live.namespace.lists);
			live.emit('doc:Post',{type:'init', path:list.path, data:doc, success: true});
		});
		list.schema.post('validate', function (doc) {
			// emit validate event 
			changeEvent({type:'validate:post', path:list.path, data:doc, success: true}, live._live.namespace.lists);
			live.emit('doc:Post',{type:'validate', path:list.path, data:doc, success: true});
		});
		list.schema.post('save',function(doc) {
			// emit save event 
			changeEvent({type:'save', path:list.path, id:doc._id.toString(), data:doc, success: true}, live._live.namespace.lists);
			changeEvent({type:'save:post', path:list.path, id:doc._id.toString(), data:doc, success: true}, live._live.namespace.lists);
			live.emit('doc:Post',{type:'save', path:list.path, id:doc._id.toString(), data:doc, success: true});			
		});
		list.schema.post('remove', function (doc) {
			// emit remove event 
			changeEvent({type:'remove:post', path:list.path, id:doc._id.toString(), data:doc, success: true}, live._live.namespace.lists);
			live.emit('doc:Post',{type:'remove', path:list.path, id:doc._id.toString(), data:doc, success: true});
		});
		
	}
}
// alias apiSockets
Live.prototype.list = Live.prototype.listEvents;

/**
 * socket events on List actions
 * 
 * */
Live.prototype.apiSockets = function(opts, callback) {
	
	// quit if no keystone
	checkForKeystone();
	
	var live = this;
	
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
	
	// set inclusion / exclusion
	var globalExcludeRoutes = opts.listConfig.exclude ? opts.listConfig.exclude.split(/[\s,]+/) : [];
	var globalOnlyRoutes = opts.listConfig.only ? opts.listConfig.only.split(/[\s,]+/) : false;
	var globalMiddleware = opts.middleware;
	
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
	
	/* auth middleware */
	/** 
	 * check for global auth function
	 * opts.auth = true || function(socket, next) { next();}
	 * should add user credentials to socket.handshake.session.user
	 * must call next to proceed
	 * call next with argument to error out
	 * set auth empty or false to skip global auth
	 * */
	
	var defaultAuth = function(socket, next) {
		if (socket.handshake.session) {
			debug.sockets('live socket session', socket.handshake.session)
			var session = socket.handshake.session;
			if(!session.userId) {
				debug.sockets('request without userId session');
				return next(new Error('Authentication error'));
			} else {
				var User = keystone.list(keystone.get('user model'));
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
	
	/* add global auth*/
	listNamespace.use(function(socket, next){
		
		/* unlike http routes, we can not let sockets handle the middleware for each path
		 * so we inject a custom middleware stack in each receiver later
		 * 
		 * For now we set a global auth
		 * auth is always first and is global
		 * 
		 * */
		if(!keystone.get('auth')) {
			next();
		} else {
			globalAuthFunction(socket, next);
		}
	});
	
	/* list events */
	listNamespace.on("connection", function(socket) {
			
			// mock the express req object with user.
			var req = {
				user: socket.handshake.session.user
			}
			
			socket.on("disconnect", function(s) {
				// delete the socket
				delete live._live.namespace.lists;
				// remove the events
				live.removeListener('doc:' + socket.id, docEventFunction);
				live.removeListener('list:' + socket.id, listEventFunction);
				live.removeListener('doc:Post', docPostEventFunction);
				live.removeListener('doc:Pre', docPreEventFunction);
			});
			socket.on("join", function(room) {
				socket.join(room.room);
			});
			socket.on("leave", function(room) {
				socket.leave(room.room);
			}); 
			
			/* add live doc events */
			live.on('doc:' + socket.id, docEventFunction);
			/* add live doc pre events */
			live.on('doc:Pre', docPreEventFunction);
			/* add live doc post events */
			live.on('doc:Post', docPostEventFunction);
			/* add live list event */
			live.on('list:' + socket.id, listEventFunction);
			
			// event functions
			function listEventFunction(event) { 
				var send = {
					
					success: event.res.success,
					error: event.res.error,
					request: event.req,
					data: event.res.data,
					result: event.res,
					to: 'emit',
				}	
				//debug.sockets('sending list', event.req)			
				if(event.req.iden) {
					debug.sockets('sending list to iden',event.req.iden)
					socket.emit(event.req.iden , send);
					//listNamespace.to(socket.id)socket.emit(event.req.iden , send);	
				}
				socket.emit('list', send);
			}
			function docPreEventFunction(event) {
				// send update info to global log 
				live.emit('log:doc', event);			
				/* send the users change events */
				socket.emit('doc:pre', event);
				socket.emit('doc:pre:' + event.type, event);
			}
			function docPostEventFunction(event) {
				live.emit('log:doc', event);
				/* send the users change events */
				socket.emit('doc:post', event);
				socket.emit('doc:post:' + event.type, event);
			}
			function docEventFunction(event) { 
				live.emit('log:doc', event);
				// emit to requesting user
				debug.sockets('sending doc',event)
				socket.emit('doc', event);
				socket.emit('doc:' + event.type, event);		
				/* send the users change event */
				var cmpUpdate = ['removed', 'updated', 'created', 'saved'];
				if((_.contains(cmpUpdate, event.type) || event.req.iden)) {
					debug.sockets('sending doc to iden', event.req.iden)
					changeEvent(event, socket); // bottom page
				}
			}
			
			/** ****
			 * add live rest 
			 * 
			 * each method can execute a custom route
			 * routes are added in the opts object
			 * opts.routes.list = function(data, req, socket, callback)
			 * 
			 * You can also set custom auth and middleware
			 * opts.routes.list = { route, auth, middleware }
			 * 
			 * callback would contain the return object
			 * 
			 * replace each method with its own arguments.  
			 * the socket instance is passed before the callback
			 * callback is mandatory
			 * 
			 * */
			
			var defaultRoutes = ['list','find','get','create','remove','update','updateField'];
			
			_.each(opts.routes, function(fn, k) {
				if(!_.includes(defaultRoutes, k)) {
					buildRoutes([k], opts);
				}
			});
			
						
			/**
			 * list listener
			 * expects an obj with min of { list: 'ListKey' }
			 * can include:
			 *   sort obj -  sort: { title: 1 } ( default:  sort: {} )
			 *   limit number -  limit: 10 (default)
			 *   skip number -  skip: 0 (default)
			 *   find - {name:'fred'} alias query
			 * */
			socket.on('list',function(list) {
				debug.list(list)
				
				var req = _.clone(list);
				
				if(!_.isObject(list) || !list.list ) {
					/* no list given so grab all lists */
					var p = [];
					var keys = _.keys(keystone.lists);
					
					async.each(keys,function(key, next) {
							
						getList(keystone.lists[key], list || {}, function(obj){
							p.push(obj);
							next();	
						});
						
					},function(err) {
						// send all lists
						debug.list('got data... send to client');
						live.emit('list:' + socket.id, {req: req, res: { data: p } });
					});
					
				} else if(_.isObject(keystone.lists[list.list])) {
					// send the requested list
					getList(keystone.lists[list.list], list || {}, function(obj){
						live.emit('list:' + socket.id, {req: req, res: obj});	
					});
				} else {
					// send error
					live.emit('list:' + socket.id,{req: req, res: {success:false}});
				}
				
				/* retrieve the results */
				function getList(getList, list, cb) {
					
					/* set route from config and run middleware */
					debug.list('run list', getList.key);
					
					if(globalOnlyRoutes && globalOnlyRoutes.indexOf(getList.key) < 0) {
						return cb({path:getList.path, success:false, error:'Not Allowed'});
					}
					
					if(globalExcludeRoutes && globalExcludeRoutes.indexOf(getList.key) > -1) {
						return cb({path:getList.path, success:false, error:'Not Allowed'});
					}
					
					var listConfig = opts.lists[getList.key];
					
					if(_.isObject(listConfig)) {
						var excludes = listConfig.exclude ? listConfig.exclude.split(/[\s,]+/) : [];
						if(excludes.indexOf('list') > -1) {
							return cb({path:getList.path, success:false, error:'Not Allowed'});
						}
					}
					
					var me = configMe(opts, getList.key, 'list');
					
					debug.sockets('runAction for me', me);
													
					list.list = getList;
					// add opts
					list.list.apiOptions = opts;
					
					runAction(me, list, socket, function(err) {
						debug.sockets('runAction callback for ' + list.list.key, 'Error: ' + err);
						if(err) {
							cb({path:getList.path, success:false, error:err});
						} else {
							me.route(list, req, socket, function(err, docs) {
								debug.list('got docs from list',list.list.key, err);
								if(docs) {
									// send data to listeners
									cb({path:getList.path, data:docs, success:true});
								} else {
									// fail
									cb({path:getList.path, success:false, error:err.message});
								}
							});
						}
					});
				}
			});
			
			/** Build the rest of our routes **/
			buildRoutes(['get','create','remove','find','update','updateField'], opts)
			
			function buildRoutes(routes, opts) {
			
				routes.forEach(function(route) {
					
					var alias = route;
					if(alias === 'find') alias = 'list';	
					/* *
					 * listener
					 * */
					socket.on(route, function(request) {
											
						/* set route from config and run middleware */
						debug.list('run ', route);
						
						var list = _.clone(request);
						
						list.list = keystone.lists[list.list];
						
						
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
							var excludes = listConfig.exclude ? listConfig.exclude.split(/[\s,]+/) : [];
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
						
						var me = configMe(opts, request.list, alias);
						
						debug.sockets('runAction for me', me);
																				
						runAction(me, list, socket, function(err) {
							debug.sockets('runAction callback for ' + list.list.key, 'Error: ' + err);
							if(err) {
								live.emit('doc:' + socket.id, {
									path: list.list.path, 
									route: route,
									success: false, 
									error: err.message,
									req: request
								});
							} else {
								me.route(list, req, socket, function(err, docs) {
									debug.list('got docs from ', list.list.key, err);
									if(docs) {
										// send data to listeners
										live.emit('doc:' + socket.id, {
											path: list.list.path, 
											route: route,
											data: docs, 
											success: true,
											req: request
										});
									} else {
										// fail
										live.emit('doc:' + socket.id, {
											path: list.list.path,
											route: route, 
											success: false, 
											error: err.message,
											req: request
										});
									}
								});
							}
						});
						
					});
				});
			}
			
	});
	
	return callback();           
	
	
	/** REQUEST ROUTINE **/
	function runAction(req, list, socket, callback) {
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
	function checkAuth(auth, socket, callback) {
		if(_.isFunction(auth)) {
			debug.sockets('runAction RUN AUTH');
			auth(socket, function(err) {
				if(err) {
					return callback(err.name + ': ' + err.message);
				}
				callback();
			});
		} else {
			callback();
		}				
	}
	function runMiddleware(data, socket, middleware, callback) {
		debug.sockets('runAction check for middleware');
		if(_.isArray(middleware) && middleware.length > 0) {
			debug.sockets('runAction RUN MIDDLEWARE');
			async.applyEachSeries(middleware, data, socket, callback);
		} else {
			callback();
		}
	}
	/** END REQUEST ROUTINE **/
	
	/*
	 * return an object with the correct route and middleware
	 * */
	function configMe(options, list, path) {
		// check in order, first wins
		// options[list[path]]
		// options[path]
		// restSock[path]
		
		var listConfig = options.lists[list] || {};
		debug.sockets('consfigMe listConfig?', listConfig, options.routes[path]);
		debug.sockets('consfigMe route config?', options.routes[path]);
		
		if(_.isArray(listConfig.middleware)) {
			var listMiddleware = _.union(globalMiddleware, listConfig.middleware);
		} else if(listConfig.middleware) {
			var listMiddleware = _.union(globalMiddleware, [listConfig.middleware]);
		} else {
			var listMiddleware = _.clone(globalMiddleware);
		}
		
		if(_.isFunction(listConfig.auth)) {
			var listAuth = listConfig.auth;
		} else if(listConfig.auth) {
			var listAuth = defaultAuth;
		} else {
			var listAuth = globalAuthFunction;
		}
					
		var me =  convertToObject(listConfig[path] || options.routes[path] || restSock[path], options);
		
		debug.sockets('configMe me', me);
				
		return me;
		
		function convertToObject(checkme, opts) {
						
			if(_.isFunction(checkme)) {
				// we have a function route so wrap with defaults
				return {
					route: checkme,
					auth: listAuth,
					middleware: listMiddleware
				}
			} else if(_.isObject(checkme)) {
				var me = Object.assign({
					auth: listAuth,
					route: restSock[path]
				}, checkme);
				// append middleware to global
				if(checkme.middleware && _.isArray(listMiddleware)) {
					if(_.isFunction(checkme.middleware)) {
						checkme.middleware = [checkme.middleware];
					}
					me.middleware = _.union(listMiddleware, checkme.middleware);
				}
				/* double check auth
				 * A list can add auth for all routes or per route
				 * We are meant a true true here, but we just check for existence
				 * */
				if(checkme.auth && !_.isFunction(checkme.auth)) {
					me.auth = defaultAuth;
				}
				/* double check route
				 * just make sure for the hell of it
				 * */
				if(!_.isFunction(me.route)) {
					me.route = restSock[path];
				}
				return me
			} else {
				
				return {
					auth: listAuth,
					middleware: listMiddleware,
					route: restSock[path]
				}
			}
		}
		
	}
	
}
// alias apiSockets
Live.prototype.live = Live.prototype.apiSockets;


Live.prototype.set = function(key, value) {
	
	
	if (arguments.length === 1) {
		return this._options[key];
	}
			
	switch(key) {
		default:
			
			break;
	}
	//push if _option[key] is an array else rewrite
	if(_.isArray(this._options[key])) {
		this._options[key].push(value);
	} else {
		this._options[key] = value;
	}
	
	return this;
	
}

Live.prototype.get = Live.prototype.set;

/**
 * Sets multiple Live options.
 *
 * ####Example:
 *
 *     Live.set({test: value}) // sets the 'test' option to `value`
 *
 * @param {Object} options
 * @api public
 */

Live.prototype.options = function(options) {
	if (!arguments.length)
		return this._options;
	if (typeof options === 'object') {
		var keys = Object.keys(options),
			i = keys.length,
			k;
		while (i--) {
			k = keys[i];
			this.set(k, options[k]);
		}
	}
	return this._options;
};

/**
 * send data to sockets
 * event should contain at least a type, path and some data
 * emitter depends on who calls
 * 
 * */
function changeEvent(event, emitter) {
	if(!_.isObject(emitter)) return false;
	/* *
	 * send changed data items to registered rooms
	 * 
	 * listNamespace.to for everyone in a room  ( io.of('/lists').to )
	 * socket.to for everyone except the current socket
	 * */
	// unique identifier sent by user - doc:iden
	if(event.req && event.req.iden) {
		emitter.to(event.req.iden).emit('doc' , event);
		emitter.emit(event.req.iden , event);
		emitter.to(event.req.iden).emit('doc:' + event.type , event);
	}
	// unique identifier sent by user - doc:iden
	if(event.iden) {
		emitter.to(event.iden).emit('doc' , event);
		emitter.emit(event.iden , event);
		emitter.to(event.iden).emit('doc:' + event.type , event);
	}
	// the doc id - doc:_id
	if(event.id) {
		emitter.to(event.id).emit('doc', event);
		emitter.emit(event.id, event);
		emitter.to(event.id).emit('doc:' + event.type, event);
	}
	// the doc slug - doc:slug
	if(event.data && event.data.slug) {
		emitter.to(event.data.slug).emit('doc', event);
		emitter.to(event.data.slug).emit('doc:' + event.type, event);
		emitter.emit(event.iden , event);
	}
	// the list path - doc:path
	if(event.path) {
		emitter.to(event.path).emit('doc', event);
		emitter.to(event.path).emit('doc:' + event.type, event);
		emitter.emit(event.path , event);
	}
	// individual field listening - 
	if(event.field && event.id) {
		// room event.id:event.field     emit doc
		emitter.to(event.id + ':' + event.field).emit('doc', event);
		emitter.to(event.id + ':' + event.field).emit('doc:' + event.type, event);
		emitter.emit(event.id + ':' + event.field , event);
		emitter.emit(event.field , event);
		// room path    emit field:event.id:event.field
		emitter.to(event.path).emit('field:' + event.id + ':' + event.field, event);
		emitter.to(event.path + ':field').emit('field:' + event.id + ':' + event.field, event);
		
	}
	
}

function checkForKeystone() {
	if (!keystone) {
		console.log('Failed to start keystone-live.  You must include a keystone object with .init(keystone)');
		process.exit();
	}
}


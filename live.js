/*!
 * Module dependencies.
 */

var _ = require('lodash');
var	keystone = require('keystone');
var	async = require('async');
var	utils = keystone.utils;
var events = require('events');
var util = require('util');
var sock = require('socket.io')();
var restSock = require('./lib/restful-sock');
var restApi = require('./lib/restful-api');
var sharedsession = require("express-socket.io-session");
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
	//keystone = require('keystone');
	return this;

}

/**
 * mock route return response and events
 * 
 * */
Live.prototype.router = function(path, callback) {
	
	var live = this;
	var app = this.app;
	var MockRes = require('mock-res');
	var MockReq = require('mock-req');
	
}


/**
 * list api routes
 * 
 * */
Live.prototype.apiRoutes = function(list, options) {
	
	var app = keystone.app;
	
	var live = this;	
	
	if(!_.isObject(options)) options = {};
	
	// add the route without pre and trailing slash
	var route = options.route || 'api';
	
	// add the method path names
	if(!_.isObject(options.paths)) options.paths = {};
	var createPath = options.paths.create || 'create';
	var updatePath = options.paths.update || 'update';
	var updateFieldPath = options.paths.updateField || 'updateField';
	var listPath = options.paths.list || 'list';
	var removePath = options.paths.remove || 'remove';
	
	if(list && _.isObject(keystone.lists[list])) {
		// add api routes to list method
		return add(keystone.lists[list]);
	
	} else if(list) {
		// nothing happening
		return this;
	
	} else {
		// loop through keystone.lists
		_.each(keystone.lists,function(list, key) {
			add(list);
		},this);
		
		return this;
	}
	
	function add(list) {
		
		if(!_.isObject(list.schema.methods.api)) {
			list.schema.methods.api = {};
		}	
		
		if(!_.isObject(options.routes)) options.routes = {};
		
		var apiRoutes = {};
		_.each(restApi,function(fn,method) {
			/* *
			 * create the api route handlers 
			 * *
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
			if(_.isFunction(options.routes[method])) {
				apiRoutes[method] = options.routes[method](list);	
			} else {
				apiRoutes[method] = fn(list);	
			}
			
		});
		
		/* attach methods to the list */
		var api = list.schema.methods.api = apiRoutes;
		
		// middleware
		var middle = [keystone.middleware.api];
		if(_.isFunction(options.middleware) || _.isArray(options.middleware)) {
			if(_.isArray(options.middleware)) {
				 var middle = _.union(middle, options.middleware);
			} else {
				middle.push(options.middleware);
			}
		} 
		// auth
		if(keystone.get('auth')) {
			if(_.isFunction(options.auth)) {
				 middle.push(options.auth);
			} else {
				middle.push(requireUser);
			}
		}
		// add routes to express
		app.get('/' + route +'/' + list.path + '/' + listPath, middle, api.list);
		app.all('/' + route +'/' + list.path + '/' + createPath, middle, api.create);
		app.get('/' + route +'/' + list.path + '/:id', middle, api.get);
		app.all('/' + route +'/' + list.path + '/:id/' + updatePath, middle, api.update);
		app.all('/' + route +'/' + list.path + '/:id/' + updateFieldPath, middle, api.updateField);
		app.get('/' + route +'/' + list.path + '/:id/' + removePath, middle, api.remove);
		
		return live;
	}
	// middleware require user
	function requireUser(req, res, next) {
	
		if (!req.user) {
			
			return res.apiError('not authorized', 'Please login to use the service', null, 401);
			
		} else {
			
			next();
		}
		
	}
	
	
}

/**
 * attach live events to a keystone List
 * 
 * */
Live.prototype.list = function(list) {
	
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

/**
 * socket events on List actions
 * 
 * */
Live.prototype.live = function(opts, callback) {
	
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
	
	sock.serveClient(false);
	
	var io = this.io = sock.attach(keystone.httpServer);
	
	/* set up session middleware */
	io.use(sharedsession(keystone.get('express session'), keystone.get('session options').cookieParser));
	
	/* create namespace */
	var listNamespace = live._live.namespace.lists =  io.of('/lists');
	
	/* session management */
	listNamespace.use(sharedsession(keystone.get('express session'), keystone.get('session options').cookieParser));
	
	/* auth middleware */
	/** 
	 * check for custom auth function
	 * opts.auth = function(socket, next) { next();}
	 * should add user credentials to socket.handshake.session.user
	 * must call next to proceed
	 * call next with argument to error out
	 * */
	if(_.isFunction(opts.auth)) {
		// user function
		var authFunction = opts.auth;
	
	} else {
		// check for a session and see if the user can
		var authFunction = function(socket, next) {
			if (socket.handshake.session) {
				//console.log(socket.handshake.session)
				var session = socket.handshake.session;
				if(!session.userId) {
					//console.log('request without userId session');
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
				//console.log('session error');
				next(new Error('Authentication session error'));
			}
		
		} // end auth function
	} // end auth seletion
	
	/* add auth middleware */
	listNamespace.use(function(socket, next){
		if(!keystone.get('auth')) {
			next();
		} else {
			authFunction(socket, next);
		}
	});
	
	/* list events */
	listNamespace.on("connection", function(socket) {
			
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
				event.to = 'emit';
				socket.emit('list', event);
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
				socket.emit('doc', event);
				socket.emit('doc:' + event.type, event);		
				/* send the users change event */
				var cmpUpdate = ['removed', 'updated', 'created', 'saved'];
				if(_.contains(cmpUpdate, event.type) && event.success === true) {
					changeEvent(event, socket); // bottom page
				}
			}
			
			/* ****
			 * add live rest 
			 * 
			 * each method can execute a custom route
			 * routes are added in the opts object
			 * opts.routes.list = function(List, options, socket, callback)
			 * callback would contain the return object
			 * 
			 * replace each method with its own arguments.  
			 * the socket instance is passed before the callback
			 * callback is mandatory
			 * 
			 * */
			/**
			 * list listener
			 * expects an obj with min of { list: 'ListKey' }
			 * can include:
			 *   sort obj -  sort: { title: 1 } ( default:  sort: {} )
			 *   limit number -  limit: 10 (default)
			 *   skip number -  skip: 0 (default)
			 * */
			socket.on('list',function(list) {
				
				if(!_.isObject(list) || !list.list ) {
					/* no list given so grab all lists */
					var p = [];
					var keys = _.keys(keystone.lists);
					async.each(keys,function(key,next) {
							
						getList(keystone.lists[key], list.options || {}, function(obj){
							p.push(obj);
							next();	
						});
						
					},function(err) {
						// send all lists
						live.emit('list:' + socket.id,p);
					});
					
				} else if(_.isObject(keystone.lists[list.list])) {
					// send the requested list
					getList(keystone.lists[list.list], list.options || {}, function(obj){
						live.emit('list:' + socket.id,obj);	
					});
				} else {
					// send error
					live.emit('list:' + socket.id,{list:list, success:false});
				}
				
				/* retrieve the results */
				function getList(getList, options, cb) {
					
					var fn = _.isFunction(opts.routes.list) ? opts.routes.list : restSock.list;
									
					fn(getList, options, socket, function(err, docs) {
						if(docs) {
							// send data to listeners
							cb({path:getList.path, data:docs, success:true});
						} else {
							// fail
							cb({path:getList.path, success:false, error:err});
						}
					});
					
				}
			});
			/* *
			 * get listener
			 * opts.routes.get = function(List, docID, socket, callback)
			 * */
			socket.on('get',function(list) {
				
				var getList = keystone.lists[list.list];
				var getDoc = list.id;
				
				var fn = _.isFunction(opts.routes.get) ? opts.routes.get : restSock.get;
				
				fn(getList, getDoc, socket, function(err, doc) {
					if(doc) {
						// send data to any listeners
						live.emit('doc:' + socket.id,{type:'get', path:getList.path, id:getDoc, data:doc, success:true, iden: list.iden});
					} else {
						// fail
						live.emit('doc:' + socket.id,{type:'get', path:getList.path,  success:false, error:err, iden: list.iden});
					}
				});
			});
			/* *
			 * create listener
			 * opts.routes.create = function(List, data, req, socket, callback)
			 * */
			socket.on('create',function(list) {
				
				var getList = keystone.lists[list.list];
				var getDoc = list.doc;
				
				var fn = _.isFunction(opts.routes.create) ? opts.routes.create : restSock.create;
				
				fn(getList, getDoc, req,  socket, function(err, doc) {
					if(doc) {
						// send data to listeners
						live.emit('doc:' + socket.id,{type:'created', path:getList.path, id:doc._id, data:doc, success:true, iden: list.iden});
					} else {
						// fail
						live.emit('doc:' + socket.id,{type:'created', path:getList.path,  success:false, error:err, iden: list.iden});
					}
				});
			});
			/* *
			 * update listener
			 * opts.routes.update = function(List, docID, data, req, socket, callback)
			 * */
			socket.on('update',function(list) {
				
				var getList = keystone.lists[list.list];
				var getId = list.id;
				var getDoc = list.doc;
				
				var fn = _.isFunction(opts.routes.update) ? opts.routes.update : restSock.update;
				
				fn(getList, getId, getDoc, req,  socket, function(err, doc) {
					if(doc) {
						// send data to listeners
						live.emit('doc:' + socket.id,{type:'updated', path:getList.path, id:getId, data:doc, success:true, iden: list.iden});
					} else {
						// fail
						live.emit('doc:' + socket.id,{type:'updated', path:getList.path, success:false, error:err, iden: list.iden});
					}
				});
			});
			/* *
			 * updateField listener
			 * opts.routes.updateField = function(List, docID, field, value, req, socket, callback)
			 * */
			socket.on('updateField',function(list) {
				
				var getList = keystone.lists[list.list];
				var getId = list.id;
				var getField = list.field;
				var getValue = list.value;
				
				var fn = _.isFunction(opts.routes.updateField) ? opts.routes.updateField : restSock.updateField;
				
				fn(getList, getId, getField, getValue, req,  socket, function(err, doc) {
					if(doc) {
						// send data to listeners
						live.emit('doc:' + socket.id,{type:'updatedField', path:getList.path, id:getId, data:doc, field:getField, value:getValue, success:true, iden: list.iden});
					} else {
						// fail
						live.emit('doc:' + socket.id,{type:'updatedField', path:getList.path, success:false, error:err, iden: list.iden});
					}
				});
			});
			/* *
			 * remove listener
			 * opts.routes.remove = function(List, docID, socket, callback)
			 * */
			socket.on('remove',function(list) {
				
				var getList = keystone.lists[list.list];
				var getId = list.id;
				
				var fn = _.isFunction(opts.routes.remove) ? opts.routes.remove : restSock.remove;
				
				fn(getList, getId, socket, function(err, doc) {
					if(doc) {
						// send data to listeners
						live.emit('doc:' + socket.id,{type:'removed', path:getList.path, id:getId, success:true, iden: list.iden});
					} else {
						// fail
						live.emit('doc:' + socket.id,{type:'removed', path:getList.path,  success:false, error:err, iden: list.iden});
					}
				});
			});
	});
	
	return callback();           
	
	
}

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
	if(event.iden) {
		emitter.to(event.iden).emit('doc' , event);
		emitter.to(event.iden).emit('doc:' + event.type , event);
	}
	// the doc id - doc:_id
	if(event.id) {
		emitter.to(event.id).emit('doc', event);
		emitter.to(event.id).emit('doc:' + event.type, event);
	}
	// the doc slug - doc:slug
	if(event.data && event.data.slug) {
		emitter.to(event.data.slug).emit('doc', event);
		emitter.to(event.data.slug).emit('doc:' + event.type, event);
	}
	// the list path - doc:path
	if(event.path) {
		emitter.to(event.path).emit('doc', event);
		emitter.to(event.path).emit('doc:' + event.type, event);
	}
	// individual field listening - 
	if(event.field && event.id) {
		// room event.id:event.field     emit doc
		emitter.to(event.id + ':' + event.field).emit('doc', event);
		emitter.to(event.id + ':' + event.field).emit('doc:' + event.type, event);
		// room path    emit field:event.id:event.field
		emitter.to(event.path).emit('field:' + event.id + ':' + event.field, event);
		emitter.to(event.path + ':field').emit('field:' + event.id + ':' + event.field, event);
	}
	
}




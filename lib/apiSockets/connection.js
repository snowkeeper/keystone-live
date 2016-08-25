var DEBUG = require('debug');
var debug = {
	debug: DEBUG('keystone-live'),
	sockets: DEBUG('keystone-live:apiSocket'),
}
var _ = require('lodash');
var buildRoutes = require('./buildRoutes');
var changeEvent = require('../listEvents/changeEvent');

module.exports = function(opts) {
	var live = this;
	
	return function(socket) {
			
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
				live.removeListener('doc:Post:' + socket.id, docPostEventFunction);
				live.removeListener('doc:Pre:' + socket.id, docPreEventFunction);
			});
			socket.on("join", function(room) {
				socket.join(room.room);
			});
			socket.on("leave", function(room) {
				socket.leave(room.room);
			});
			
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
					buildRoutes.call(live, socket, [k], opts, req);
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
			socket.on('list', require('./routes/list').call(live, socket, opts));
			
			/** Build the rest of our routes **/
			buildRoutes.call(live, socket, ['get','create','remove','find','update','updateField'], opts, req)
			
			/** add live doc events **/
			live.removeListener('doc:' + socket.id, docEventFunction);
			live.on('doc:' + socket.id, docEventFunction);
			/* add live list event */
			live.removeListener('list:' + socket.id, listEventFunction);
			live.on('list:' + socket.id, listEventFunction);
			/* add live doc pre events */
			//live.on('doc:Pre', docPreEventFunction);
			/* add live doc post events */
			//live.on('doc:Post', docPostEventFunction);
			
			// event functions
			function docPreEventFunction(event, socket) {
				// send update info to global log 
				live.emit('log:doc', event);			
				/* send the users change events */
				socket.emit('doc:pre', event);
				socket.emit('doc:pre:' + event.type, event);
			}
			function docPostEventFunction(event, socket) {
				live.emit('log:doc', event);
				/* send the users change events */
				socket.emit('doc:post', event);
				socket.emit('doc:post:' + event.type, event);
			}
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
			
			
	}
}

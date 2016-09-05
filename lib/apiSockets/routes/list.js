var DEBUG = require('debug');
var debug = {
	debug: DEBUG('keystone-live'),
	sockets: DEBUG('keystone-live:apiSocket'),
}
var _ = require('lodash');
var configMe = require('../configMe');
var runAction = require('../runAction');
var runPostware = require('../runPostware');
var async = require('async');

module.exports = function(socket, opts) {
	var live = this;
	
	return function(list) {

		//debug.sockets(list)
		
		var req = _.clone(list);
		var globalExcludeRoutes = opts.listConfig.skip ? opts.listConfig.skip.split(/[\s,]+/) : [];
		var globalOnlyRoutes = opts.listConfig.only ? opts.listConfig.only.split(/[\s,]+/) : false;
		
		if(!_.isObject(list) || !list.list ) {
			/* no list given so grab all lists */
			var p = [];
			var keys = _.keys(live.keystone.lists);
			
			async.each(keys,function(key, next) {
					
				getList(live.keystone.lists[key], list || {}, function(obj){
					p.push(obj);
					next();	
				});
				
			},function(err) {
				// send all lists
				debug.sockets('got data... send to client');
				live.emit('list:' + socket.id, { req: req, res: { data: p } });
			});
			
		} else if(_.isObject(live.keystone.lists[list.list])) {
			// send the requested list
			getList(live.keystone.lists[list.list], list || {}, function(obj){
				debug.sockets('## Got result from request ', obj);
				live.emit('list:' + socket.id, { req: req, res: obj });	
			});
		} else {
			// send error
			live.emit('list:' + socket.id,{ req: req, res: { success: false } });
		}
		
		/* retrieve the results */
		function getList(getList, list, cb) {
			
			/* set route from config and run middleware */
			debug.sockets('run list', getList.key);
			
			if(globalOnlyRoutes && globalOnlyRoutes.indexOf(getList.key) < 0) {
				return cb({
					path: getList.path, 
					success: false, 
					error: 'Not Allowed'
				});
			}
			
			if(globalExcludeRoutes && globalExcludeRoutes.indexOf(getList.key) > -1) {
				return cb({
					path: getList.path, 
					success: false, 
					error: 'Not Allowed'
				});
			}
			
			var listConfig = opts.lists[getList.key];
			
			if(_.isObject(listConfig)) {
				var excludes = listConfig.exclude ? listConfig.exclude.split(/[\s,]+/) : [];
				if(excludes.indexOf('list') > -1) {
					return cb({
						path: getList.path, 
						success: false, 
						error: 'Not Allowed'
					});
				}
			}
			
			var me = configMe(opts, getList.key, 'list', false,  live);
			
			debug.sockets('runAction for me', me);
											
			list.list = getList;
			// add opts
			list.list.apiOptions = opts;
			
			runAction.call(live, me, list, socket, function(err) {
				debug.sockets('## runAction callback for ' + list.list.key);
				if(err) {
					debug.sockets( '#### Err  ', err);
					cb({
						path: getList.path, 
						success: false, 
						error: err.message
					});
				} else {
					me.route.call(live, list, req, socket, function(err, docs) {
						debug.sockets('got docs from list... run postware',list.list.key, err);
						if(docs) {
							runPostware.call(live, list.list.path, docs, socket, me.postware, function(err, a, manipulatedDocs, b) {
								debug.sockets('done.. send docs',list.list.key, err);
								// send data to listeners
								cb({
									path: getList.path, 
									data: manipulatedDocs || docs, 
									success: true
								});
							});
						} else {
							// fail
							debug.sockets('## FAIL ## in route call');
							cb({
								path: getList.path, 
								success: false, 
								error: err.message
							});
						}
					});
				}
			});
		}
	}
}

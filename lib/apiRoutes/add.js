var _ = require('lodash');
var restApi = require('../restful/restful-api');
var addRoute = require('./addRoute.js');
var setMiddleware = require('./setMiddleware.js');
var keystone;

module.exports = function add(options, list, SINGLE) {
	
	var live = this;
	keystone = this.keystone;
	var app = this.keystone.app;
	
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
			setMiddleware(routeConfig, routeOptions.middleware[method], keystone.get('auth'));
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
	
	setMiddleware(options, middle, keystone.get('auth'));
	
	// custom routes
	var defaultRoutes = ['list', 'find', 'get','create','remove','update','updateField'];
	_.each(options.routes, function(options, theRoute) {
		var mid = [];
		if(_.isFunction(options)) {
			
			options = {
				route: options
			}	
		
		} else if(_.isObject(options) && _.isFunction(options.route)) {
			
			setMiddleware(options, mid, keystone.get('auth'));		
		
		} else {
			return;
		}
		
		if(!_.includes(defaultRoutes, theRoute)) {
			
			api[theRoute] = options.route(list);
			addRoute(app, 'get', route +'/' + PATH + '/' + theRoute, api[theRoute], middle, mid);
			addRoute(app, 'get', route +'/' + PATH + '/:id/' + theRoute, api[theRoute], middle, mid);
			addRoute(app, 'get', route +'/' + PATH + '/' + theRoute + '/:id', api[theRoute], middle, mid);
		
		}
	});
	
	// add routes to express
	if(api.list) {
		addRoute(app, 'get', route +'/' + PATH + '/' + listPath, api.list, middle, routeOptions.middleware.list);
	}
	if(api.find) {
		addRoute(app, 'get', route +'/' + PATH + '/find', api.list, middle, routeOptions.middleware.list);
	}
	if(api.create) {
		addRoute(app, 'all', route +'/' + PATH + '/' + createPath, api.create, middle, routeOptions.middleware.create);
	}
	if(api['get']) {
		addRoute(app, 'get', route +'/' + PATH + '/:id', api['get'], middle, routeOptions.middleware['get']);
	}
	if(api.update) {
		addRoute(app, 'all', route +'/' + PATH + '/:id/' + updatePath, api.update, middle, routeOptions.middleware.update);
	}
	if(api.updateField) {
		addRoute(app, 'all', route +'/' + PATH + '/:id/' + updateFieldPath, api.updateField, middle, routeOptions.middleware.updateField);
	}
	if(api.remove) {
		addRoute(app, 'get', route +'/' + PATH + '/:id/' + removePath, api.remove, middle, routeOptions.middleware.remove);
	}
	
	app.get(route +'/' + PATH + '/*', middle, function(req, res){
		res.apiError('Bad Request', 'The path you requested does not exist', null, 200);
	});

	
	return live;
}

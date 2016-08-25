var _ = require('lodash');

module.exports = function addRoute(app, method, path, route, globalMiddleware, middleware) {
		
	globalMiddleware = _.isArray(globalMiddleware) ? globalMiddleware : globalMiddleware ? [globalMiddleware] : [];
	middleware = _.isArray(middleware) ? middleware : middleware ? [middleware] : [];
	var middle = _.union(globalMiddleware, middleware);
	app[method](path, middle, route);
}

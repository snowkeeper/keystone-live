var _ = require('lodash');

module.exports = function requireUser(req, res, next) {
	
	if (!req.user) {
		
		return res.apiError('not authorized', 'Please login to use the service', null, 401);
		
	} else {
		
		next();
	}
	
}

var _ = require('lodash');

/**
 * List Posts
 */
exports.list = function(list) {
	return function(req, res) {
		
		var options = req.query;
		
		if(!options.query) options.query = {};
		if(_.isNaN(parseFloat(options.limit))) options.limit = 10;
		if(_.isNaN(parseFloat(options.skip))) options.skip = 0;
		if(!_.isObject(options.sort)) options.sort = {};
			
		var q = list.model.find(options.query);
			q.limit(options.limit);
			q.skip(options.skip);
			q.sort(options.sort);
			q.exec(function(err, items) {
		
			if (err) return res.apiError('database error', err, null, 200);
			
			var data2 = {};
			data2[list.path] = items;
		
			res.apiResponse(data2);
			
		});
	}
}

/**
 * Get Post by ID
 */
exports.get = function(list) {
	
	return function(req, res) {
		list.model.findById(req.params.id).exec(function(err, item) {
		
			if (err) return res.apiError('database error', err, null, 200);
			if (!item) return res.apiError('not found', null, null, 200);
			
			var data2 = {}
			data2[list.path] = item;
		
			res.apiResponse(data2);
			
		});
	}
}


/**
 * Create a Post
 */
exports.create = function(list) {
	
	return function(req, res) {
		var item = new list.model(),
			data = (req.method == 'POST') ? req.body : req.query;
		
		item.getUpdateHandler(req).process(data, function(err) {
			
			if (err) return res.apiError('error', err, null, 200);
			
			var data2 = {}
			data2[list.path] = item;
		
			res.apiResponse(data2);
			
		});
	}
}

/**
 * Get Post by ID
 */
exports.update = function(list) {
	
	return function(req, res) {
		list.model.findById(req.params.id).exec(function(err, item) {
		
			if (err) return res.apiError('database error', err, null, 200);
			if (!item) return res.apiError('not found', null, null, 200);
			
			var fill = (req.method == 'POST') ? req.body : req.query;
			
			//var data = _.merge(item,data);
			
			item.getUpdateHandler(req).process(fill, function(err) {
				
				if (err) return res.apiError('create error', err, null, 200);
				
				var data2 = {}
				data2[list.path] = item;
			
				res.apiResponse(data2);
				
			});
			
		});
	}
}

/**
 * Update Post Field
 */
exports.updateField = function(list) {
	
	return function(req, res) {
		
		if(!req.params.id) return res.apiError('validation error', 'ID required', null, 200);
		if(!req.query.field) return res.apiError('validation error', 'field required', null, 200);

		list.model.findById(req.params.id).exec(function(err, item) {
		
			if (err) return res.apiError('database error', err, null, 200);
			if (!item) return res.apiError('not found', null, null, 200);
			
			var data = {}
			data[req.query.field] = req.query.value;
			
			item.getUpdateHandler(req).process(data, function(err) {
				
				if (err) return res.apiError('create error', err, null, 200);
				
				var data2 = {}
				data2[list.path] = item;
			
				res.apiResponse(data2);
				
			});
			
		});
	}
}

/**
 * Delete Post by ID
 */
exports.remove = function(list) {
	
	return function(req, res) {
		list.model.findById(req.params.id).exec(function (err, item) {
		
			if (err) return res.apiError('database error', err, null, 200);
			if (!item) return res.apiError('not found', null, null, 200);
			
			item.remove(function (err) {
				if (err) return res.apiError('database error', err, null, 200);
				
				return res.apiResponse({
					success: true
				});
			});
			
		});
	}
}

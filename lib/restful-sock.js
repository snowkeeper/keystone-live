var _ = require('lodash');

function selectFields(user, main) {
	
	function inex(str, val) {
		var obj = {};
		_.each(str.split(','), function(v) {
			obj[v] = val;
		});
		return obj;
	}
	if(_.isString(user.exclude)) {
		var select = inex(user.exclude, 0);
	} else if(_.isString(user.include)) {
		var select = inex(user.include, 1);			
	} else if(_.isString(main.exclude)) {
		var select = inex(main.exclude, 0);
	} else if(_.isString(main.include)) {
		var select = inex(main.include, 1);			
	}
	
	return select;
}

/**
 * List Posts
 */
exports.list = function(list, options, socket, callback) {
	
	if(!_.isFunction(callback)) callback = function(err,data){ 
		console.log('callback not specified for list',err,data);
	};
	if(!list) return callback('list required');
	if(!options) options = {};
	if(!options.query) options.query = {};
	if(_.isNaN(parseFloat(options.limit))) options.limit = 10;
	if(_.isNaN(parseFloat(options.skip))) options.skip = 0;
	if(!_.isObject(options.sort)) options.sort = {};
			
	var q = list.model.find(options.query);
	q.limit(options.limit);
	q.skip(options.skip);
	q.sort(options.sort);
	
	var select = selectFields(options,list.apiOptions);
	if(select) q.select(select);
	
	q.exec(function(err, items) {
		
		if (err) return callback(err);
		
		var data = {};
		data[list.path] = items;
		callback(null, data);
		
	});
}
 
/**
 * Get doc by ID
 */
exports.get = function(list, id, socket, callback) {
	
	if(!_.isFunction(callback)) callback = function(err,data){ 
		console.log('callback not specified for get',err,data);
	};
	if(!list) return callback('list required');
	if(!id) return callback('id required');
	
	var q = list.model.findById(id);
	var select = selectFields({},list.apiOptions);
	if(select) q.select(select);
	q.exec(function(err, item) {
		
		if (err) return callback(err);
		if (!item) return callback('not found');
		
		var data = {}
		data[list.path] = item;
		
		callback(null, data);
		
	});
}
 
 
/**
 * Create a Post
 */
exports.create = function(list, data, req, socket, callback) {
	
	if(!_.isFunction(callback)) callback = function(err,data){ 
		console.log('callback not specified for create',err,data);
	};
	var item = new list.model();
	if(!list) return callback('list required');
	if(!_.isObject(data)) return callback('data required');
	if(!_.isObject(req)) req = {};
	
	item.getUpdateHandler(req).process(data, function(err) {
		
		if (err) {
			return callback(err);
		}
		var data2 = {}
		data2[list.path] = item;
		
		callback(null, data2);
		
	});
}
 
/**
 * Update Post by ID
 */
exports.update = function(list, id, data, req, socket, callback) {
	
	if(!_.isFunction(callback)) callback = function(err,data){ 
		console.log('callback not specified for update',err,data);
	};
	if(!list) return callback('list required');
	if(!id) return callback('id required');
	if(!_.isObject(data)) return callback('data required');
	if(!_.isObject(req)) req = {};
	
	list.model.findById(id).exec(function(err, item) {
		
		if (err) return callback(err);
		if (!item) return callback('not found');
		
		item.getUpdateHandler(req).process(data, function(err) {
			
			if (err) return callback(err);
			
			var data2 = {}
			data2[list.path] = item;
		
			callback(null, data2);
			
		});
		
	});
}
 
/**
 * Update Post Field
 */
exports.updateField = function(list, id, field, value, req, socket, callback) {
	
	if(!_.isFunction(callback)) callback = function(err,data){ 
		console.log('callback not specified for updateFIeld',err,data);
	};
	if(!list) return callback('list required');
	if(!id) return callback('id required');
	if(!field) return callback('field path required');
	//if(!value) callback('value required');
	if(!_.isObject(req)) req = {};
	
	list.model.findById(id).exec(function(err, item) {
		
		if (err) return callback(err);
		if (!item) return callback('not found');
		
		var data = {}
		data[field] = value;
		
		item.getUpdateHandler(req).process(data, function(err) {
			
			if (err) return callback(err);
			
			callback(null, data);
			
		});
		
	});
}
 
/**
 * Delete Post by ID
 */
exports.remove = function(list, id, socket, callback) {
	
	if(!_.isFunction(callback)) callback = function(err,data){ 
		console.log('callback not specified for remove',err,data);
	};
	if(!list) return callback('list required');
	if(!id) return callback('id required');

	list.model.findById(id).exec(function (err, item) {
		
		if (err) return callback(err);
		if (!item) return callback('not found');
		
		item.remove(function (err) {
			if (err) return callback(err);
			
			return callback(null,{
				success: true
			});
		});
		
	});
}

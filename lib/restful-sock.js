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
exports.list = function(data, socket, callback) {
	
	if(!_.isFunction(callback)) callback = function(err,data){ 
		console.log('callback not specified for list',err,data);
	};
	var list = data.list;
	var options = data;
	if(!data.list) return callback('list required');
	if(!options) options = {};
	var find = options.find || options.query;
	if(!_.isObject(find)) find = {};
	if(_.isNaN(parseFloat(options.limit))) options.limit = 10;
	if(_.isNaN(parseFloat(options.skip))) options.skip = 0;
	if(!_.isObject(options.sort)) options.sort = {};
	
	var q = list.model.find(find);
	q.limit(options.limit);
	q.skip(options.skip);
	q.sort(options.sort);

	if(options.populate) {
		q.populate(options.populate);
	} else {
		q.populate('createdBy updatedBy');
	}
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
exports.get = function(data, socket, callback) {
	
	if(!_.isFunction(callback)) callback = function(err,data){ 
		console.log('callback not specified for get',err,data);
	};
	
	if(!data.list) return callback('list required');
	
	var id = data.id  || data._id;
	var find = data.find || data.query;
	
	if(!id && !find) return callback('id or find required');
	
	if(_.isObject(find)) {
		var q = data.list.model.findOne(find);
	} else {
		var q = data.list.model.findById(id);
	}
	
	var select = selectFields(data,data.list.apiOptions);
	if(select) q.select(select);
	if(data.populate) {
		q.populate(data.populate);
	} else {
		q.populate('createdBy updatedBy');
	}
	q.exec(function(err, item) {
		
		if (err) return callback(err);
		if (!item) return callback('not found');
		
		var send = {}
		send[data.list.path] = item;
		
		callback(null, send);
		
	});
}
 
 
/**
 * Create a Post
 */
exports.create = function(data, req, socket, callback) {
	
	if(!_.isFunction(callback)) callback = function(err,data){ 
		console.log('callback not specified for create',err,data);
	};
	var list = data.list;
	var doc = data.doc;
	var item = new list.model();
	
	if(!list) return callback('list required');
	if(!_.isObject(doc)) return callback('doc required');
	if(!_.isObject(req)) req = {};
	
	item.getUpdateHandler(req).process(doc, function(err) {
		
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
exports.update = function(data, req, socket, callback) {
	
	if(!_.isFunction(callback)) callback = function(err,data){ 
		console.log('callback not specified for update',err,data);
	};
	
	var list = data.list;
	var id = data.id || data._id;
	var doc = data.doc;
	var find = data.find || data.query;
	
	if(!list) return callback('list required');
	if(!id && !find) return callback('id required');
	if(!_.isObject(doc)) return callback('data required');
	if(!_.isObject(req)) req = {};
	
	if(_.isObject(find)) {
		var lookup = list.model.findOne(find);
	} else {
		var lookup = list.model.findById(id);
	}
	
	lookup.exec(function(err, item) {
		
		if (err) return callback(err);
		if (!item) return callback('not found');
		
		item.getUpdateHandler(req).process(doc, function(err) {
			
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
exports.updateField = function(data, req, socket, callback) {
	
	if(!_.isFunction(callback)) callback = function(err,data){ 
		console.log('callback not specified for updateFIeld',err,data);
	};
	
	var list = data.list;
	var id = data.id  || data._id;
	var field = data.field;
	var value = data.value;
	var find = data.find || data.query;
	
	if(!list) return callback('list required');
	if(!id && !find) return callback('find required');
	if(!field) return callback('field path required');
	//if(!value) callback('value required');
	if(!_.isObject(req)) req = {};
	
	if(_.isObject(find)) {
		var lookup = list.model.findOne(find);
	} else {
		var lookup = list.model.findById(id);
	}
	lookup.exec(function(err, item) {
		
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
exports.remove = function(data, socket, callback) {
	
	if(!_.isFunction(callback)) callback = function(err,data){ 
		console.log('callback not specified for remove',err,data);
	};
	
	var list = data.list;
	var id = data.id  || data._id;
	var find = data.find || data.query;
	
	if(!list) return callback('list required');
	if(!id && !find) return callback('id required');
	
	if(_.isObject(find)) {
		var lookup = list.model.findOne(find);
	} else {
		var lookup = list.model.findById(id);
	}
	lookup.exec(function (err, item) {
		
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

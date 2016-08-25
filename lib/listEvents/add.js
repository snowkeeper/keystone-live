var _ = require('lodash');
var changeEvent = require('./changeEvent');

module.exports = function add(list) {
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


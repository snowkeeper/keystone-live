var _ = require('lodash');
var add = require('./add.js');

module.exports = function(list, options) {
	
	var app = this.keystone.app;
	
	var live = this;	
	
	if(!_.isObject(options)) options = {};
	
	if(list && _.isObject(this.keystone.lists[list])) {
		// add api routes to list method
		return add.call(this, options, this.keystone.lists[list], true);
	
	} else if(list) {
		// nothing happening
		return this;
	
	} else {
		// loop through keystone.lists
		_.each(this.keystone.lists,function(alist, key) {
			if(!_.isObject(alist.schema.methods.api)) {
				add.call(this, options, alist);
			}
			
		},this);
		
		return this;
	}
	
}

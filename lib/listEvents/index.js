var _ = require('lodash');
var add = require('./add.js');

module.exports = function(list) {
	
	this.checkForKeystone();
		
	if(list && _.isObject(this.keystone.lists[list])) {
		// add the list events and post save
		return add.call(this, this.keystone.lists[list]);
	
	} else if(list) {
		// nothing to do here
		return this;
	
	} else {
		//no list so loop through all keystone.lists
		_.each(this.keystone.lists, function(list, key) {
			add.call(this, list);
		},this);
		return this;
	
	}
	
}

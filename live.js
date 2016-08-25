/*!
 * Module dependencies.
 */

var _ = require('lodash');
var keystone = false;
var	async = require('async');
var	utils;
var events = require('events');
var util = require('util');
var DEBUG = require('debug');

var debug = {
	debug: DEBUG('keystone-live'),
	list: DEBUG('keystone-live:list'),
	get: DEBUG('keystone-live:get'),
	create: DEBUG('keystone-live:create'),
	remove: DEBUG('keystone-live:remove'),
	update: DEBUG('keystone-live:update'),
	sockets: DEBUG('keystone-live:apiSocket'),
	routes: DEBUG('keystone-live:apiRoutes'),
	events: DEBUG('keystone-live:listEvents'),
}


/**
 * Live Constructor
 * =================
 *
 * attach live events to models and routes
 *
 * @api public
 */

function Live() {

	this._options = {};
	this._live = {
		namespace: {}
	};
	
	this.checkForKeystone = function() {
		if (!this.keystone) {
			console.log('Failed to start keystone-live.  You must include a keystone object with .init(keystone)');
			process.exit();
		}
	}
	
}

// Extend from EventEmitter
util.inherits(Live, events.EventEmitter);

var live = module.exports = exports = new Live();

/**
 * init sockets
 * 
 * */
Live.prototype.init = function(Keystone) {
	
	if(Keystone) keystone = Keystone;
	
	this.keystone = keystone;
	
	this.checkForKeystone();
	
	utils = keystone.utils;
	
	debug.debug('keystone-live init');
	
	return this;

}

/**
 * mock route return response and events
 * 
 * */
Live.prototype.router = function(path, callback) {
	
	var live = this;
	var app = this.app;
	this.MockRes = require('mock-res');
	this.MockReq = require('mock-req');
	
}

/**
 * list api routes
 * */
Live.prototype.apiRoutes = require('./lib/apiRoutes/index');

/**
 * attach live events to a keystone List
 * */
Live.prototype.listEvents = require('./lib/listEvents/index');
Live.prototype.list = Live.prototype.listEvents;

/**
 * socket events on List actions
 * */
Live.prototype.apiSockets = require('./lib/apiSockets/index');
Live.prototype.live = Live.prototype.apiSockets;

Live.prototype.set = function(key, value) {
	
	if (arguments.length === 1) {
		return this._options[key];
	}
			
	//push if _option[key] is an array else rewrite
	if(_.isArray(this._options[key])) {
		this._options[key].push(value);
	} else {
		this._options[key] = value;
	}
	
	return this;
	
}

Live.prototype.get = Live.prototype.set;

/**
 * Sets multiple Live options.
 *
 * ####Example:
 *
 *     Live.set({test: value}) // sets the 'test' option to `value`
 *
 * @param {Object} options
 * @api public
 */

Live.prototype.options = function(options) {
	if (!arguments.length)
		return this._options;
	if (typeof options === 'object') {
		var keys = Object.keys(options),
			i = keys.length,
			k;
		while (i--) {
			k = keys[i];
			this.set(k, options[k]);
		}
	}
	return this._options;
};






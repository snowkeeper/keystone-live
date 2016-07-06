// Simulate config options from your production environment by
// customising the .env file in your project's root folder.
require('dotenv').load();

// Require keystone
var keystone = require('keystone');
var live = require('../live');
var _ = require('lodash');

// Initialise Keystone with your project's configuration.
// See http://keystonejs.com/guide/config for available options
// and documentation.

keystone.init({

	'name': 'My Site',
	'brand': 'My Site',
	
	'less': 'public',
	'static': 'public',
	'favicon': 'public/favicon.ico',
	'views': 'templates/views',
	'view engine': 'jade',
	
	'emails': 'templates/emails',
	'port': 11000,
	'auto update': true,
	'auth': false,
	'user model': 'User',
	'cookie secret': '`l(tz:tNeX4=U.BHtJBBlx9-{Me^mOe,2xlr#])Cd',
});

// Load your project's Models

keystone.import('models');

// Setup common locals for your templates. The following are required for the
// bundled templates and layouts. Any runtime locals (that should be set uniquely
// for each request) should be added to ./routes/middleware.js

keystone.set('locals', {
	_: _,
	env: keystone.get('env'),
	utils: keystone.utils,
	editable: keystone.content.editable
});

// Load your project's Routes
live.init(keystone);
keystone.live = live;
keystone.set('routes', require('./routes'));

// Start Keystone to connect to your database and initialise the web server
keystone.start({
	onMount: function() {
		
		
	},
	onStart: function(){
		var opts = {
			routes: {
				get1 : function(list, id, callback) {
					console.log('custom get');
					if(!_.isFunction(callback)) callback = function(err,data){ 
						console.log('callback not specified for get',err,data);
					};
					if(!list) return callback('list required');
					if(!id) return callback('id required');

					list.model.findById(id).exec(function(err, item) {
						
						if (err) return callback(err);
						if (!item) return callback('not found');
						
						var data = {}
						data[list.path] = item;
						
						callback(null, data);
						
					});
				}
			}
		}
		live.live(opts).listEvents('Post');
	}
});

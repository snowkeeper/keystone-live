// Simulate config options from your production environment by
// customising the .env file in your project's root folder.
require('dotenv').load();

// Require keystone
var keystone = require('keystone');
var live = require('keystone-live');
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
	_: require('underscore'),
	env: keystone.get('env'),
	utils: keystone.utils,
	editable: keystone.content.editable
});

// Load your project's Routes

keystone.set('routes', require('./routes'));

// Setup common locals for your emails. The following are required by Keystone's
// default email templates, you may remove them if you're using your own.

keystone.set('email locals', {
	logo_src: '/images/logo-email.gif',
	logo_width: 194,
	logo_height: 76,
	theme: {
		email_bg: '#f9f9f9',
		link_color: '#2697de',
		buttons: {
			color: '#fff',
			background_color: '#2697de',
			border_color: '#1a7cb7'
		}
	}
});

// Setup replacement rules for emails, to automate the handling of differences
// between development a production.

// Be sure to update this rule to include your site's actual domain, and add
// other rules your email templates require.

keystone.set('email rules', [{
	find: '/images/',
	replace: (keystone.get('env') == 'production') ? 'http://www.your-server.com/images/' : 'http://localhost:3000/images/'
}, {
	find: '/keystone/',
	replace: (keystone.get('env') == 'production') ? 'http://www.your-server.com/keystone/' : 'http://localhost:3000/keystone/'
}]);

// Load your project's email test routes

keystone.set('email tests', require('./routes/emails'));

// Configure the navigation bar in Keystone's Admin UI

keystone.set('nav', {
	'posts': ['posts', 'post-categories'],
	'galleries': 'galleries',
	'enquiries': 'enquiries',
	'users': 'users'
});

// Start Keystone to connect to your database and initialise the web server

keystone.start({
	onMount: function() {
		
		var opts = {
			routes: {
				get1: function(list) {
					return function(req, res) {
						console.log('custom get');
						list.model.findById(req.params.id).exec(function(err, item) {
						
							if (err) return res.apiError('database error', err);
							if (!item) return res.apiError('not found');
							
							var data2 = {}
							data2[list.path] = item;
						
							res.apiResponse(data2);
							
						});
					}
				}
			}
		}
		live.apiRoutes(false, opts);
	},
	onStart: function(){
		var opts = {
			routes: {
				get1 : function(list,id,callback) {
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
		live.live(opts).list('Post');
	}
});

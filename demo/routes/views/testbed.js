var keystone = require('keystone'),
	path = require('path'),
	fs = require('fs');

exports = module.exports = function(req, res) {
	
	var view = new keystone.View(req, res),
		locals = res.locals,
		imported=[];
	locals.section = 'testbed';
	locals.data = {
		wallets: [],
		accounts: []
	};
	view.on('init', function(next) {
		
		//console.log(req.params.apikey);
		
		/*User.model.findOne().where('resetPasswordKey', req.params.key).exec(function(err, user) {
			if (err) return next(err);
			if (!user) {
				req.flash('error', "Sorry, that reset password key isn't valid.");
				return res.redirect('/forgot-password');
			}
			locals.found = user;
			next();
		});
		* */
		next();
		
	});
	view.render('testbed');
	
}

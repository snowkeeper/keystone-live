var keystone = require('keystone'),
	Types = keystone.Field.Types;

/**
 * User Model
 * ==========
 */

var Test = new keystone.List('Test');

Test.add({
	name: { type: Types.Name, required: true, index: true, initial: true },
	email: { type: Types.Email, initial: true, required: true, index: true },
	password: { type: Types.Password, initial: true, required: true }
}, 'Permissions', {
	isAdmin: { type: Boolean, label: 'Can access Keystone', index: true }
},
 {heading:"User Generated Content Requirements", dependsOn:{type:'ugc'}},
 {type: {type:Types.Select, options:['ugc', 'uga']}}
);

// Provide access to Keystone
Test.schema.virtual('canAccessKeystone').get(function() {
	return this.isAdmin;
});


/**
 * Relationships
 */

Test.relationship({ ref: 'Post', path: 'author' });


/**
 * Registration
 */

Test.defaultColumns = 'name, email, isAdmin';
Test.register();

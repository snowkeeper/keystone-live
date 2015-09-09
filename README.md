### Live data events for KeystoneJS
Attach events to Lists and create simple restful routes.

```
npm install keystone-live
```
```javascript
var Live = require('keystone-live');

keystone.start({
  onMount: function() {
  	Live.apiRoutes();
  },
  onStart: function() {
  	Live.
		apiSockets().
		listEvents();
  }
});

```

### API
* [Demo](#demo)
* [Methods](#method-reference)
    * [.apiRoutes](#apiRoutes) 
    * [.apiSockets](#apiSockets) 
    * [.init](#init)  
    * [.listEvents](#listEvents)
    * [.router](#router) 
* [Events](#events)
    * [List Broadcast Events](#list-broadcast-events)
    * [Websocket Broadcast Events](#websocket-broadcast-events)
		* [CRUD Listeners](#crud-listeners)
			* [create](#create)
			* [get](#get)
			* [list](#list)
			* [remove](#remove)
			* [update](#update)
			* [updateField](#updatefield)
			* [custom](#custom)
		* [Broadcast Results](#broadcast-results)
			* [ROOM: list path](#list)
			* [ROOM: doc id](#id)
			* [ROOM: doc slug](#slug)
			* [ROOM: id:field](#idfield)
			* [ROOM: iden](#iden)
* [Additional io namespaces](#additional-io-namespaces)
* [Client](#client)

## Demo
A complete demo with live testbed is included in the git repo (not npm).  
View the [README](https://github.com/snowkeeper/keystone-live/blob/master/demo) for installation.

## Method Reference
The following is a list of methods available.

#### <a name="apiRoutes"></a>.apiRoutes ( [ list ], [ options ] )
> *@param* **list** _{String}_ - _Optional_ Keystone List key  
> *@param* **options** _{Object}_ - _Optional_ Options  
> _@return_ **this** 
  
Set `list`  =  `false` to attach routes to all lists. Call multiple times to attach to chosen Lists.  

```javascript
keystone.start({
	onMount: function() {
    	var opts = {
			exclude: '_id,__v',
			route: 'galleries',
            paths: {
				get: 'find',
                create: 'new'
			}
		}
        live.
        	apiRoutes('Post').
            apiRoutes('Gallery',opts);
        
    }
});
```
**`options`** is an object that may contain: 
> __exclude__ - {_String_}  - Fields to exclude from requests (takes precedence over include)    
> __include__ - {_String_}  - Fields to include in requests   
> __auth__ -   {_Function_} - require user   
> __middleware__ - {_...Array|Function_} -  Array of middleware routes  
> __route__ - {_String_}  - Root path without pre and trailing slash  
> __paths__  - {_Object_}  rename the default action uri path
>> create  - {_String_}  
>> get  - {_String_}  
>> list  - {_String_}  
>> remove  - {_String_}  
>> update  - {_String_}  
>> updateField  - {_String_}  

> __routes__ - {_Object_} override the default routes
>> create   -   {_Function_}  
>> get   -   {_Function_}   
>> list  -   {_Function_}   
>> remove  -   {_Function_}   
>> update   -   {_Function_}   
>> updateField   -   {_Function_}   
>> *custom*   -   {_Function_} - add your own routes  

**NOTE:** `include` and `exclude` can be set for each list individually, before applying to all other lists with `Live.apiRoute(null, options)`.  `exclude` takes precedent over `include` and only one is used per request.  You can override the global setting per request.  

```javascript
	var opts = {
		route: 'api2',
		exclude: '_id,__v',
		auth: function requireUser(req, res, next) {
			if (!req.user) {
				return res.apiError('not authorized', 'Please login to use the service', null, 401);
			} else {
				next();
			}
		},
		paths: {
			remove: 'delete'
		},
		routes: {
			get: function(list) {
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
			},
			yourCustomFunction: function(list) {
				return function(req, res) {
					console.log('my custom function');
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
	// add rest routes to all lists
	Live.apiRoutes(false, opts);
	
	// add rest routes to Post
	// Live.apiRoutes('Post', opts);
```
**Created Routes**  
Each registered list gets a set of routes created and attached to the schema.  You can control the uri of the routes with the `options` object as explained above.  

| action   	| route  	|
|---	|---	|
| list  	| /api/posts/list   	|
| create 	| /api/posts/create   	|
| get  	| /api/posts/__:id__  	|
| update  	| /api/posts/__:id__/update   	|
| updateField 	| /api/posts/__:id__/updateField   	|
| remove  	| /api/posts/__:id__/remove  	|  
| *yourRoute*  	| /api/posts/__:id__/*yourRoute*  	|  
| *yourRoute*  	| /api/posts/*yourRoute*  	|  

**Modifiers:** each request can have relevant modifiers added to filter the results.   
> include: 'name, slug'  - *fields to include in result*  
> exclude: '__v'  - *fields to exclude from result*  
> populate: 'createdBy updatedBy'  - *fields to populate*  
> populate: 0  - *do not populate - createdBy and updatedBy are defaults*  
> limit: 10  - *limit results*  
> skip: 10  - *skip results*  
> sort: {}  - *sort results*  

**route** requests look like  
```
/api/posts/55dbe981a0699a5f76354707/?list=Post&path=posts&emit=get&id=55dbe981a0699a5f76354707&exclude=__v&populate=0
```
 

**Source Code Snippet:**  
```javascript
// add the route without pre and trailing slash
var route = options.route || 'api';

// add the method path names
if(!_.isObject(options.paths)) options.paths = {};
var createPath = options.paths.create || 'create';
var updatePath = options.paths.update || 'update';
var updateFieldPath = options.paths.updateField || 'updateField';
var listPath = options.paths.list || 'list';
var removePath = options.paths.remove || 'remove';

if(!_.isObject(list.schema.methods.api)) {
	list.schema.methods.api = {};
}	
		
if(!_.isObject(options.routes)) options.routes = {};

var restApi = require('./lib/restful-api');
var apiRoutes = {};

_.each(restApi,function(fn,method) {
	if(_.isFunction(options.routes[method])) {
		apiRoutes[method] = options.routes[method](list);	
	} else {
		apiRoutes[method] = fn(list);	
	}
});

/* attach methods to the list */
var api = list.schema.methods.api = apiRoutes;

// middleware
var middle = [keystone.middleware.api];

if(_.isFunction(options.middleware) || _.isArray(options.middleware)) {

	if(_.isArray(options.middleware)) {
		var middle = _.union(middle, options.middleware);
	} else {
		middle.push(options.middleware);
	}
    
} 
// auth
if(keystone.get('auth')) {
    if(_.isFunction(options.auth)) {
		middle.push(options.auth);
	} else {
		middle.push(requireUser);
	}
}

// custom routes
var defaultRoutes = ['list','get','create','remove','update','updateField'];
_.each(options.routes, function(v,k) {
	if(!_.includes(defaultRoutes,k)) {
		api[k] = v(list);
		app.get('/' + route +'/' + list.path + '/' + k, middle, api[k]);
		app.get('/' + route +'/' + list.path + '/:id/' + k , middle, api[k]);
	}
});

// add routes to express
app.all('/' + route +'/' + list.path + '/' + createPath, middle, api.create);
app.get('/' + route +'/' + list.path + '/:id', middle, api.get)
app.get('/' + route +'/' + list.path + '/' + listPath, middle, api.list);
app.get('/' + route +'/' + list.path + '/:id/' + removePath, middle, api.remove);
app.all('/' + route +'/' + list.path + '/:id/' + updatePath, middle, api.update);
app.all('/' + route +'/' + list.path + '/:id/' + updateFieldPath, middle, api.updateField);


// middleware require user
function requireUser(req, res, next) {
	if (!req.user) {
		return res.apiError('not authorized', 'Please login to use the service', null, 401);
	} else {
		next();
	}
}
```
___

#### <a name="apiSockets"></a>.apiSockets ( [ options ], callback )
> alias `.live`   
> *@param* **options** _{Object}_  - Options for creating events   
> _@return_ **callback** _{Function}_

Create the socket server and attach to events   
Returns `this` if no **`callback`** provided.  

**`options`** is an object that may contain: 
> __exclude__ - {_String_}  - Fields to exclude from requests (takes precedence over include)  
> __include__ - {_String_}  - Fields to include in requests   
> __auth__ -   {_Function_} - require user   
> __find__ - {_Object_} - `model.find(options.find)` all except `create`  
> __query__ - {_Object_} - alias of find  
> __routes__ - {_Object_} - override the default routes  
>> create   -   {_Function_}   
>> get   -   {_Function_}   returns `Object`
>> find   -   {_Function_} *alias of*  **list**   
>> list   -   {_Function_}  returns `Array` of `Objects` 
>> remove   -   {_Function_}   
>> update   -   {_Function_}   
>> updateField   -   {_Function_}   

```javascript
	var opts = {
		include: 'name,slug,_id,createdAt',
		auth: function(socket, next) {
			if (socket.handshake.session) {
				console.log(socket.handshake.session)
				var session = socket.handshake.session;
				if(!session.userId) {
					console.log('request without userId session');
					return next(new Error('Authentication error'));
				} else {
					var User = keystone.list(keystone.get('user model'));
					User.model.findById(session.userId).exec(function(err, user) {

						if (err) {
							return next(new Error(err));
						}
						if(!user.isAdmin) {
							return next(new Error('User is not authorized'))
						}
						session.user = user;
						next();

					});
				
				}
			} else {
				console.log('session error');
				next(new Error('Authentication session error'));
			}
		},
		routes: {
			// all functions except create and update follow this argument structure
			get: function(data, socket, callback) {
				console.log('custom get');
				if(!_.isFunction(callback)) callback = function(err,data){ 
					console.log('callback not specified for get',err,data);
				};
				var list = data.list;
				var id = data.id;
				if(!list) return callback('list required');
				if(!id) return callback('id required');

				list.model.findById(id).exec(function(err, item) {
					
					if (err) return callback(err);
					if (!item) return callback('not found');
					
					var data = {}
					data[list.path] = item;
					
					callback(null, data);
					
				});
			},
			yourCustomRoute: function(data, req, socket, callback) {
				// req contains a user field with the session id
				
				console.log('this is my custom room listener function');
				if(!_.isFunction(callback)) callback = function(err,data){ 
					console.log('callback not specified for get',err,data);
				};
				var list = data.list;
				var id = data.id;
				if(!list) return callback('list required');
				if(!id) return callback('id required');

				list.model.findById(id).exec(function(err, item) {
					
					if (err) return callback(err);
					if (!item) return callback('not found');
					
					var data = {}
					data[list.path] = item;
					
					callback(null, data);
					
				});
			},
			// create and update follow the same argument structure
			update: function(data, req, socket, callback) {
	
				if(!_.isFunction(callback)) callback = function(err,data){ 
					console.log('callback not specified for update',err,data);
				};
				
				var list = data.list;
				var id = data.id;
				var doc = data.doc;
				
				if(!list) return callback('list required');
				if(!id) return callback('id required');
				if(!_.isObject(doc)) return callback('data required');
				if(!_.isObject(req)) req = {};
				
				list.model.findById(id).exec(function(err, item) {
					
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
		}
	}
	// start live events and add emitters to Post
	Live.apiSockets(opts).listEvents('Post');
```

**Modifiers:** each request can have relevant modifiers added to filter the results.   
> include: 'name, slug'  - *fields to include in result*  
> exclude: '__v'  - *fields to exclude from result*  
> populate: 'createdBy updatedBy'  - *fields to populate*  
> populate: 0  - *do not populate - createdBy and updatedBy are defaults*  
> limit: 10  - *limit results*  
> skip: 10  - *skip results*  
> sort: {}  - *sort results*  


socket requests look like - see [socket requests](#crud-listeners) and [client](#client) 
```
var data = {
	list: 'Post',
	limit: 10,
	skip: 10,
	sort: {}
}
live.io.emit('list', data);
```  

Listens to emitter events
```javascript
/* add Live doc events */
Live.on('doc:' + socket.id, docEventFunction);

/* add Live doc pre events */
Live.on('doc:Pre', docPreEventFunction);
			
/* add Live doc post events */
Live.on('doc:Post', docPostEventFunction);

/* add Live list event */
Live.on('list:' + socket.id, listEventFunction);
```

##### Socket emitters  
**user emitters**
sent to individual sockets
```javascript
// list emit
socket.emit('list', event);

// document pre events
socket.emit('doc:pre', event);
socket.emit('doc:pre:' + event.type, event);

// document post events
socket.emit('doc:post', event);
socket.emit('doc:post:' + event.type, event);
                
// document event
socket.emit('doc', event);
socket.emit('doc:' + event.type, event);

```
**global emitters**  
global events sent to rooms on change events only.
```javascript

// room unique identifier sent by user - emit doc
if(event.iden) {
  emitter.to(event.iden).emit('doc' , event);
  emitter.to(event.iden).emit('doc:' + event.type , event);
}
// room doc id - emit doc
if(event.id) {
  emitter.to(event.id).emit('doc', event);
  emitter.to(event.id).emit('doc:' + event.type, event);
}
// room doc slug - emit doc
if(event.data && event.data.slug) {
  emitter.to(event.data.slug).emit('doc', event);
  emitter.to(event.data.slug).emit('doc:' + event.type, event);
}
// room path - emit doc
if(event.path) {
  emitter.to(event.path).emit('doc', event);
  emitter.to(event.path).emit('doc:' + event.type, event);
}
// individual field listening - 
if(event.field && event.id) {
  // room event.id:event.field     emit doc
  emitter.to(event.id + ':' + event.field).emit('doc', event);
  emitter.to(event.id + ':' + event.field).emit('doc:' + event.type, event);
  // room path    emit field:event.id:event.field
  emitter.to(event.path).emit('field:' + event.id + ':' + event.field, event);
  emitter.to(event.path + ':field').emit('field:' + event.id + ':' + event.field, event);
}


```
___

#### <a name="init"></a>.init ( [ keystone ] )
> *@param* **keystone** _{Instance}_  - Pass keystone in as a dependency  
> _@return_ **this** 

Useful for development if you want to pass Keystone in
___


#### <a name="listEvents"></a>.listEvents ( [ list ] )
> alias `.list`  
> *@param* **list** _{String}_  - Keystone List Key  
> _@return_ **this** 

Leave blank to attach live events to all Lists.   
Should be called after `Live.apiSockets()`    
Learn about attached events    
[List Broadcast Events](#list-broadcast-events) 
&nbsp; &nbsp; [Websocket Broadcast Events](#websocket-broadcast-events)

```javascript
keystone.start({
	onStart: function() {
        Live.
			apiSockets().
			listEvents('Post').
			listEvents('PostCategory');
    }
});
```

___

#### <a name="router"></a>.router ()
> _@return_ **this** 

```javascript
	this.MockRes = require('mock-res');
	this.MockReq = require('mock-req');
```
___

## Events
### Overview
Live uses the event system to broadcast changes made to registered lists.   
Each registered list will broadcast change events.  
Socket based events have a finer grain of control and you can listen for specific change events.

### List Broadcast Events
A registered list has events attached to the **pre** and **post** routines.  These are global events that fire anytime a change request happens.  You can also listen to the global `doc:pre` and `doc:post` on the user broadcast (explained below).  For greater interactivity and control use the websocket broadcast events. 
  
|pre|post|*post|
|---|---|---|
| init:pre| init:post|   |
| validate:pre  | validate:post    |   |
| save:pre    | save:post  | **save**  |
| remove:pre   | remove:post   | &nbsp;  |  
*Note that post save has an extra event `save:post` and `save`. 
```javascript
list.schema.pre('validate', function (next) {
 
	var doc = this;
	
    // emit validate event to rooms
    changeEvent({
    	type:'validate:pre', 
        path:list.path, 
        data:doc, 
        success: true
    }, Live._live.namespace.lists);
    
    // emit validate input locally
	live.emit('doc:Pre',{
    	type:'validate', 
        path:list.path,  
        data:doc, 
        success: true
    });
	next();
});
```  

Each method will trigger a local event and a broadcast event.  
Each event will send a data object similiar to:   
```javascript
{ 
	type:'save:pre', 
    path:list.path,
    id:doc._id.toString(),
    data:doc, 
    success: true
}
```  

The broadcast event is sent when each action occurs.  
```javascript
changeEvent({
	type:'remove:post', 
    path:list.path, 
    data:doc, 
    success: true
}, Live._live.namespace.lists);
```  
 

**changeEvent** will send a broadcast to any of the following rooms that are available for listening:  
> **doc._id**   
> **list.path**  
> **doc.slug**   
> 
> Each room emits `doc` and `doc:event.type`
```javascript
// the doc id - event.id
if(event.id) {
	emitter.to(event.id).emit('doc', event);
	emitter.to(event.id).emit('doc:' + event.type, event);
}
// the doc slug - event.data.slug
if(event.data && event.data.slug) {
	emitter.to(event.data.slug).emit('doc', event);
	emitter.to(event.data.slug).emit('doc:' + event.type, event);
}
// the list path - event.path
if(event.path) {
	emitter.to(event.path).emit('doc', event);
	emitter.to(event.path).emit('doc:' + event.type, event);
}
```  

The following are valid `event.type` values for List global broadcasts:
> init:pre    
> init:post  
> validate:pre   
> validate:post   
> save:pre   
> save:post   
> save    
> remove:pre   
> remove:post   
>  



The local event will emit `doc:Pre`   or  `doc:Post` for the appropriate events
```javascript
// pre
Live.emit('doc:Pre',{
	type:'save', 
    path:list.path, 
    id:doc._id.toString(), 
    data:doc, 
    success: true
});
// post
Live.emit('doc:Post',{
	type:'save', 
    path:list.path, 
    id:doc._id.toString(), 
    data:doc, 
    success: true
 });
```
We use `Live.on` in app to respond and broadcast to the current user.  
```javascript
/* add live doc pre events */
Live.on('doc:Pre', docPreEventFunction);

/* add live doc post events */
Live.on('doc:Post', docPostEventFunction);
            
function docPreEventFunction(event) {
    // send update info to global log 
    Live.emit('log:doc', event);			
    /* send the users change events */
    socket.emit('doc:pre', event);
    socket.emit('doc:pre:' + event.type, event);
}
function docPostEventFunction(event) {
    Live.emit('log:doc', event);
    /* send the users change events */
    socket.emit('doc:post', event);
    socket.emit('doc:post:' + event.type, event);
}
```
### Websocket Broadcast Events
Live uses **socket.io v~1.3.2** to handle live event transportation.  A set of CRUD routes are available and there are several rooms you can subscribe to that emit results.  

**io** is exposed via `Live.io`.  Our list namespace is `Live.io.of('/lists')`.  
You will connect to the `/lists` namespace in the client to listen to emit events.

#### CRUD Listeners
There is a generic set of CRUD listeners available to control the database.  You do not receive callback results with Websocket CRUD listeners.  You will need to pick the best strategy to use to listen for result events from the rooms available.  Each listener emits its result to `Live.on`.  `Live.on` will catch each submission and decide who should be notified.  View the `changeEvent()` behaviour below.
###### create 
```javascript
socket.emit('create',{
	list: 'Post',
    doc: {
    	title: 'Hello',
    },
    iden: _uniqueKey_
});

socket.on('create', function(obj) {
	live.emit('doc:' + socket.id,{type:'created', path:getList.path, id:doc._id, data:doc, success:true, iden: list.iden});
});
```
###### *custom* 
```javascript
socket.emit(yourCustomRoom,{
	list: 'Post', //if available
    id: '54c9b9888802680b37003af1', //if available
    iden: _uniqueKey_
});

socket.on(*custom*, function(obj) {
	live.emit('doc:' + socket.id,{type:'get', path:list.path,  data:doc, success:true, iden: list.iden});
});
```

###### get 
```javascript
socket.emit('get',{
	list: 'Post',
    id: '54c9b9888802680b37003af1',
    iden: _uniqueKey_
});

socket.on('get', function(obj) {
	live.emit('doc:' + socket.id,{type:'get', path:list.path, id:list.id, data:doc, success:true, iden: list.iden});
});
```

###### list 
```javascript
socket.emit('list',{
	list: 'Post',
    iden: _uniqueKey_
});

socket.on('list', function(obj) {
	live.emit('doc:' + socket.id,{path:list.path, data:docs, success:true});
});

```

###### remove 
```javascript
socket.emit('remove',{
	list: 'Post',
    id: '54c9b9888802680b37003af1',
    iden: _uniqueKey_
});

socket.on('remove', function(obj) {
	live.emit('doc:' + socket.id,{type:'removed', path:list.path, id:list.id, success:true, iden: list.iden});
});

```

###### update 
```javascript
socket.emit('update',{
	list: 'Post',
    id: '54c9b9888802680b37003af1',
    doc: {
    	title: 'Bye!',
    },
    iden: _uniqueKey_
});

socket.on('update', function(obj) {
	live.emit('doc:' + socket.id,{type:'updated', path:list.path, id:list.id, data:list.doc, success:true, iden: list.iden});
});

```

###### updateField 
```javascript
socket.emit('updateField',{
	list: 'Post',
    id: '54c9b9888802680b37003af1',
    field: 'content.brief',
    value: 'Help!',
    iden: _uniqueKey_
});
// Hello
socket.on('updateField', function(obj) {
	live.emit('doc:' + socket.id,{type:'updatedField', path:getList.path, id:list.id, data:list.doc, field:list.field, value:list.value, success:true, iden: list.iden});
});

```

##### Broadcast Results
Instead of returning a http response, each listener emits a local event that the app is waiting for.  This event is processed and the correct rooms are chosen to broadcast the result.    

There are two emitter namespaces  
> **doc**   
> `emitter.to(event.path).emit('doc', event);`  
> `emitter.to(event.path).emit('doc:TYPE', event);`      
>  
> **list**  
> `socket.emit('list', event);`   
> list is only sent to the requesting user        


The following are valid `event.type` values:
> created  
> get  
> save  
> updated   
> updatedField  
> *custom* 

Each broadcast is sent to the global **doc** as well as a computed **doc:event.type** channel.  
**changeEvent** will send the broadcast to the following rooms that are available for listening: 
###### path
```javascript
emitter.to(event.path).emit('doc', event);
emitter.to(event.path).emit('doc:' + event.type, event);
```
###### id
the `doc._id` value if available
```javascript
emitter.to(event.id).emit('doc', event);
emitter.to(event.id).emit('doc:' + event.type, event);
```

###### slug
document slug if available
```javascript
emitter.to(event.data.slug).emit('doc', event);
emitter.to(event.data.slug).emit('doc:' + event.type, event);
```
###### id:field
field broadcasts to the **list.path** room and a **doc._id:fieldName** room
```javascript
// room event.id:event.field     emit doc
emitter.to(event.id + ':' + event.field).emit('doc', event);
emitter.to(event.id + ':' + event.field).emit('doc:' + event.type, event);

// room path    emit field:event.id:event.field
emitter.to(event.path).emit('field:' + event.id + ':' + event.field, event);
emitter.to(event.path + ':field').emit('field:' + event.id + ':' + event.field, event);

```
###### iden
Dynamic room.  Send a unique `iden` with each request and the app emits back to a room named after `iden`
```javascript
emitter.to(event.iden).emit('doc' , event);
emitter.to(event.iden).emit('doc:' + event.type , event);
```
To use `iden` make sure to kill your event listeners.  Here is a simple response trap function:
```javascript
var trapResponse = function(callback) {
	
    var unique = keystone.utils.randomString();
    
    var cb = function(data) {
    	socket.removeListener(unique, cb);
        callback(data);
    }
    
    socket.on(unique, cb);
    
    return unique;
}

var myFn = function(data) {
	// do someting
}

socket.emit('create',{ 
	list:'Post', 
    doc: data, 
    iden: trapResponse(myFn) 
});

```

## Additional io namespaces
The socket instance is exposed at `Live.io`.   
The `/lists` and `/` namespaces are reserved.  You can create any others of your own.

```javascript
var sharedsession = require("express-socket.io-session");

/* create namespace */
var myNamespace =  Live.io.of('/namespace');
	
/* session management */
myNamespace.use(sharedsession(keystone.get('express session'), keystone.get('session options').cookieParser));

/* add auth middleware */
myNamespace.use(function(socket, next){
	if(!keystone.get('auth')) {
		next();
	} else {
		authFunction(socket, next);
	}
});
	
/* list events */
myNamespace.on("connection", function(socket) {
			
    var req = {
        user: socket.handshake.session.user
    }
                
    socket.on("disconnect", function(s) {
        // delete the socket
        delete live._live.namespace.lists;
        // remove the events
        live.removeListener('doc:' + socket.id, docEventFunction);
        live.removeListener('list:' + socket.id, listEventFunction);
        live.removeListener('doc:Post', docPostEventFunction);
        live.removeListener('doc:Pre', docPreEventFunction);
    });
    socket.on("join", function(room) {
        socket.join(room.room);
    });
    socket.on("leave", function(room) {
        socket.leave(room.room);
    }); 


});
	
```

## Client
Your client should match up with our server version.  Make sure you are using 1.x.x and not 0.x.x versions.

```javascript
var socketLists = io('/lists');
	
	socketLists.on('connect',function(data) {
		console.log('connected');
	});
	socketLists.on('error',function(err) {
		console.log('error',err);
	});
	
	socketLists.on('doc:save',function(data) {
		console.log('doc:save',data);
	});
	
	socketLists.on('doc',function(data) {
		console.log('doc',data);
		
	});
	socketLists.on('list',function(data) {
		console.log('list data',data);
		
	});

```





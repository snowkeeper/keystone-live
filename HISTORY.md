# Keystone-Live Changelog

## v0.3.6 / 2016-08-27

* fixed; refactored errors

## v0.3.5 / 2016-08-25

* improved; refactored lib

## v0.3.4 / 2016-07-15

* fixed; socket middleware was ignored in some cases    

## v0.3.2 / 2016-07-15

* updated; stock api routes now respect select. `select: '_id, name',`  
* fixed; send result to `iden` on error.  Previously only on success   
* updated; apiRoutes now includes a **find** route that is an alias to **list**  
* improved; Error message handling.  
* fixed: Removed socket emitters on `doc:Pre` and `doc:Post` events.   
* added; socket routes now support postware for list results.  Postware can be defined globally, per route or per List route.      

```
let options = {
	lists: {
		'Posts': {
			find: {
				postware: [
					function(listPath, docs, socket, next) {
						debug('## POSTWARE ## image check');
						var manip = _.cloneDeep(docs[listPath]);
						docs[listPath].forEach(function(v, k) {
							manip[k] = v.toObject();
							if(v.images) {
								v.images.forEach(function(vv, kk) {
									
									manip[k].images[kk].thumbnail = vv.thumbnail(250, 150);
									manip[k].images[kk].original = vv.fit(1920, 1280);
									debug('thumb', manip[k].images[kk].thumb);
								});
							}
						});
						debug('## done images find', manip[0].images);
						var send = {};
						send[listPath] = manip;
						next(null, listPath, send, socket);
					}
				]
			}
		},
	}  
}  
```  
* updated; Improved. `list` & `find` routes now accept an array of objects to be applied in order. `model.find.apply(model, find)`    

```
this.io.emit('find', Object.assign({ 
	list: 'Posts',
    limit: 20,
	skip: 0,
    find: [
		{ $text : { $search : 'pink' } }, 
        { score : { $meta: "textScore" } }
    ],
	iden: this.trap(this.io, talk)
}, additionalSearchValues));
    
```

## v0.3.1 / 2016-07-05  
  
* **breaking change**; socket routes normalized to `function(data, req, socket, callback)`   
* added; `skip` string option to exclude any of the default routes. 
* added; Additional express route to custom routes. `**/route`, `**/:id/route`, `**/route/:id`    
* updated; `routes` properties can now be a route __Function__ or an __Object__.  
* added; Each route can now specify its own auth and middleware stack.    
  
> __Each route can be a single route function or an object that contains:__  
>> __route__  -  {_Function_}  -  your route function   
>> __auth__  -  {_...Boolean|Function_} - auth for the route.  use `true` for the built in `req.user` check.  
>> __middleware__  -  {_...Array|Function_}  -  middleware for the route.  
>> __excludeFields__  -   {_String_}  -  comma seperated string of fields to exclude. `'_id, __v'`  (takes precedence over include)       
>> __includeFields__  -   {_String_}  -  comma seperated string of fields to exclude. `'name, address, city'`  
 
* updated; Major imporvements to socket route handling.   
* added; **Sockets** - Middleware additions globally, per route, and/or per List.  
* added; **Sockets** - exclude/include Lists via `listConfig.exclude` `listConfig.only`   
* added; **Sockets** - per List route config with **auth**, **middleware**, **routes and route exclusions**.     
* updated; **Sockets** - enhanced route configuration for global routes and per List routes.  (backwards compatible).    
* added; **Sockets** - enhanced auth handling per route and/or per List.   


## v0.2.0 / 2016-04-11  

* changed; Must include a Keystone instance with `.init`  


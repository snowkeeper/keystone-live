# Keystone-Live Changelog

## v0.3.2 / 2016-07-08

* updated; stock api routes now respect select. `select: '_id, name',`
* fixed; send result to `iden` on error.  Previously only on success
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


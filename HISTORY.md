# Keystone-Live Changelog

## v0.2.1 / 2016-07-05  
  
* added; `skip` string option to exclude any of the default routes. 
* added; Additional express route to custom routes. `**/route`, `**/:id/route`, `**/route/:id`    
* changed; `routes` properties can now be a route __Function__ or an __Object__.  
* added; Each route can now specify its own auth and middleware stack.    
  
> __Each route can be a single route function or an object that contains:__  
>> route  -  {_Function_}  -  your route function   
>> auth  -  {_...Boolean|Function_} - auth for the route.  use `true` for the built in `req.user` check.  
>> middleware  -  {_...Array|Function_}  -  middleware for the route.  

* changed; Major imporvements to socket route handling.   
* added; **Sockets** - Middleware additions globally, per route, and/or per List.  
* added; **Sockets** - exclude/include Lists via `listConfig.exclude` `listConfig.only`   
* added; **Sockets** - per List route config with **auth**, **middleware**, **routes and route exclusions**.     
* changed; **Sockets** - enhanced route configuration for global routes and per List routes.  (backwards compatible).    
* added; **Sockets** - enhanced auth handling per route and/or per List.  


## v0.2.0 / 2016-04-11  

* changed; Must include a Keystone instance with `.init`  


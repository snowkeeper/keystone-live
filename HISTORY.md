# Keystone-Live Changelog

## v0.2.1 / 2016-07-05  
  
* added; `skip` string option to exclude any of the default routes.  
* changed; `routes` properties can now be a route __Function__ or an __Object__.  
* added; Each route can now specify its own auth and middleware stack.    
  
> __Each route can be a single route function or an object that contains:__  
>> route  -  {_Function_}  -  your route function   
>> auth  -  {_...Boolean|Function_} - auth for the route.  use `true` for the built in `req.user` check.  
>> middleware  -  {_...Array|Function_}  -  middleware for the route.  


## v0.2.0 / 2016-04-11  

* changed; Must include a Keystone instance with `.init`  


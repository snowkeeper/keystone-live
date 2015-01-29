###Live data events for KeystoneJS 
####DEMO
Attach events to models and create simple restful routes.

```
git clone git@github.com:snowkeeper/keystone-live.git

cd keystone-live/demo

npm install

node keystone
```
http://localhost:4000/keystone/  

If auto update does not run there will not be a user.  

Therefore `auth: false` at first.  Create your user and set isAdmin(can Access Keystone) to `true`.  

Then open `keystone.js` and set `auth: true`  

Login in and click on Testbed.  

If updates do run you will have a new user  
default user: admin@keystonejs.com  
default pass: admin  

Open `keystone.js` and set `auth: true`


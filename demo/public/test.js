$(function() {
	
	$('#myAffix').affix({
		offset: {
			top: 450
		}
	})
	$('#myAffix').on('affixed.bs.affix',function() {
		$('#myAffixHelper').show();
	});
	$('#myAffix').on('affixed-top.bs.affix',function() {
		$('#myAffixHelper').hide();
	});
	var testDoc;
	var $console = $('#console');
	var $commands = $('#commands');
	function updateConsole(msg) {
		var args = $.makeArray(arguments)
		
		var _cmd = $commands.html();
		var _time = new Date().getTime();
		if(args.length > 1) {
			_cmd =  '<a href="#' + _time + '">' + args[0]  + "</a>\n---------\n"  + _cmd;
		} else {
			_cmd =   args[0]  + "\n---------\n"  + _cmd;
		}
		$commands.html(_cmd);
		
		//args.shift();
		
		if(args.length > 1) {
			if('object' !== args[0])args.reverse();
			for(var i=0; i < args.length; i++) {
				var v = args[i];
				if('function' !== typeof v) {
					var _msg = $console.html();
					if('object' === typeof v) {
						try {
							v = JSON.stringify(v, null, 4);
						} catch(e) {
						
						}
					}
					if(i === 0) {
						_msg = '<a name="' + _time + '"></a>' + v  + "\n----------------------------------\n" + _msg;
					} else {
						_msg =  v  + "\n-- --\n" + _msg;
					}
					
					$console.html(_msg);
					//console.log(v,_msg)
				}
			}
		}
	}
	
	var socketLists = io('//snowx:4000/lists');
	
	socketLists.on('connect',function(data) {
		console.log('connected');
		updateConsole('connected')
	});
	socketLists.on('connect-error',function(err) {
		console.log('connect-error',err);
		updateConsole('connect-error',err)
	});
	socketLists.on('error',function(err) {
		console.log('error',err);
		updateConsole('error',err)
	});
	/*
	socketLists.on('doc',function(data) {
		console.log('doc',data);
		updateConsole('doc',data)
	});
	* */
	socketLists.on('doc',function(data) {
		console.log('doc',data);
		
	});
	socketLists.on('doc:get',function(data) {
		console.log('doc:get',data);
		updateConsole('doc:get',data)
	});
	socketLists.on('doc:save',function(data) {
		console.log('doc:save',data);
		updateConsole('doc:save',data)
	});
	socketLists.on('doc:created',function(data) {
		console.log('doc:created',data);
		updateConsole('doc:created',data)
	});
	socketLists.on('doc:updated',function(data) {
		console.log('doc:updated',data);
		updateConsole('doc:updated',data)
	});
	socketLists.on('doc:updatedField',function(data) {
		console.log('doc:updatedField',data);
		updateConsole('doc:updatedField',data)
	});
	socketLists.on('field:54c87f95cdaa43333c09fac3:title',function(data) {
		console.log('doc:id:title',data);
		updateConsole('field:54c87f95cdaa43333c09fac3:title',data)
	});
	socketLists.on('list',function(data) {
		console.log('list',data);
		if(data && data.data && data.data.posts)testDoc = data.data.posts[0];
		updateConsole('list',data)
	});
	
	socketLists.emit('list',{list:'Post'});
	socketLists.emit('join',{room:'posts'});
	
	$('#runapi').click(function(){
		
		var emit = $('#emit').val();
		
		var $path = $('#path').val();
		var url = '/api/' + $path;
		var $id = $('#id').val();
		var $title = $('#title').val();
		var $content = $('#content').val();
		
		if(emit === 'list') {
			url += '/list/';
		}
		if(emit === 'create') {
			url += '/create/';
		}
		if(emit === 'update') {
			url += '/' + $id + '/update/';
		}
		if(emit === 'get') {
			url += '/' + $id + '/';
		}
		if(emit === 'updateField') {
			url += '/' + $id + '/updateField/';
		}
		if(emit === 'remove') {
			url += '/' + $id + '/remove/';
		}
		var finish = '';
		if($title)finish += '&title=' + $title;
		if($content)finish += '&content.brief=' + $content;
		url = url + '?' + $('#q').val() + finish;
		$.ajax({
			url: url
		})
		.done(function( resp,status,xhr ) {
			updateConsole('API: ' + emit, url, resp);	
		});
		
	});	
	
	$('#runsock').click(function(){
		
		var emit = $('#emit').val();
		var $id = $('#id').val();
		var $title = $('#title').val();
		var $content = $('#content').val();
		
		updateConsole('emit: ' + emit)
		
		if(emit === 'list') {
			socketLists.emit('list',{list:$('#list').val()});
		}
		if(emit === 'create') {
			var data = {
				title:$('#title').val(),
				'content.brief':$('#content').val()
			}
			socketLists.emit('create',{list:'Post',doc:data});
		}
		if(emit === 'update') {
			var data = {};
			if($title)data.title = $title;
			if($content)data['content.brief'] = $content;
			var id = $id || testDoc._id;
			socketLists.emit('update',{list:'Post',id:id,doc:data});
		}
		if(emit === 'get') {
			var data = {
				id: $('#id').val() || testDoc._id,
				list: 'Post'
			}
			socketLists.emit('get',data);
		}
		if(emit === 'updateField') {
			var data = {
				id: $('#id').val() || testDoc._id,
				list: 'Post',
				field: 'content.brief',
				value: $('#content').val()
			}
			socketLists.emit('updateField',data);
		}
		if(emit === 'remove') {
			var data = {
				id: $('#id').val() || testDoc._id,
				list: 'Post'
			}
			socketLists.emit('remove',data);
		}
		
	});	
});

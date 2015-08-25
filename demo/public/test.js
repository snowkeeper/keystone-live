$(function() {
	
	var socketPort = $('#socketPort').val()
	var host = $('#host').val()
	
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
	
	var socketLists = io('//' + host + ':' + socketPort + '/lists');
	
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
		updateConsole('doc:'+data.path,data)
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
	
	socketLists.emit('list',{list:'Sources'});
	socketLists.emit('join',{room:'sources'});
	socketLists.emit('join',{room:'streams'});
	$('#runapi').click(function(e){
		e.preventDefault();
		var emit = $('#emit').val();
		
		var $path = $('#path').val();
		var url = '/ipa/' + $path;
		var $id = $('#id').val();
		
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
		if(emit === 'stop' || emit === 'start') {
			url += '/' + $id +  '/' + emit + '/';
		}
		var finish = $('#testbedform').serialize();
		url = url + '?' + finish;
		$.ajax({
			url: url
		})
		.done(function( resp,status,xhr ) {
			updateConsole('API: ' + emit, url, resp);	
		});
		
	});	
	
	$('#runsock').click(function(e){
		e.preventDefault();
		var emit = $('#emit').val();
		var data = $('#testbedform').serializeFormJSON();
		data.doc = $('#testbedform').serializeFormJSON();
		updateConsole('emit: ' + emit)
		console.log('send:',data)
		socketLists.emit(emit,data);
		
	});	
	
	$(document).on('change','.changeme',function(e) {
		var next = $(':input:eq(' + ($(':input').index(this) + 1) + ')')
		//console.log('changeme', e.target.value, next.attr('name'), next);
		next.attr('name', e.target.value);
		var aa = $(this).parent().parent().next().find('span');
		console.log(aa)
		aa.html(e.target.value);
	});
	
	$(document).on('click','.deleteRow',function(e) {
		var parent = $(this).parent().parent().remove();
	});
	
	$('.addinputs').click(function(click) {
			var div = '<div class="row"><div class="col-xs-4"><div class="form-group input-group"><span class="input-group-addon input-group-sm coinstamp">key</span><input type="text"  name="key[]"  class="changeme form-control coinstamp"></div></div><div class="col-xs-7"><div class="form-group input-group"><span class="input-group-addon input-group-sm coinstamp"></span><input type="text"  name="val[]" class="form-control coinstamp" placeholder="value"></div></div><div class="col-xs-1"><span class="glyphicon glyphicon-trash text-danger deleteRow"></span></div></div>';
			$('#addRowHere').before(div)
	})
	$.fn.serializeFormJSON = function () {

        var o = {};
        var a = this.serializeArray();
        $.each(a, function () {
            if (o[this.name]) {
                if (!o[this.name].push) {
                    o[this.name] = [o[this.name]];
                }
                o[this.name].push(this.value || '');
            } else {
                o[this.name] = this.value || '';
            }
        });
        return o;
    };
});

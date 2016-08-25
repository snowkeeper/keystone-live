/**
 * send data to sockets
 * event should contain at least a type, path and some data
 * emitter depends on who calls
 * 
 * */
module.exports = function changeEvent(event, emitter) {
	if(!_.isObject(emitter)) return false;
	/* *
	 * send changed data items to registered rooms
	 * 
	 * listNamespace.to for everyone in a room  ( io.of('/lists').to )
	 * socket.to for everyone except the current socket
	 * */
	// unique identifier sent by user - doc:iden
	if(event.req && event.req.iden) {
		emitter.to(event.req.iden).emit('doc' , event);
		emitter.emit(event.req.iden , event);
		emitter.to(event.req.iden).emit('doc:' + event.type , event);
	}
	// unique identifier sent by user - doc:iden
	if(event.iden) {
		emitter.to(event.iden).emit('doc' , event);
		emitter.emit(event.iden , event);
		emitter.to(event.iden).emit('doc:' + event.type , event);
	}
	// the doc id - doc:_id
	if(event.id) {
		emitter.to(event.id).emit('doc', event);
		emitter.emit(event.id, event);
		emitter.to(event.id).emit('doc:' + event.type, event);
	}
	// the doc slug - doc:slug
	if(event.data && event.data.slug) {
		emitter.to(event.data.slug).emit('doc', event);
		emitter.to(event.data.slug).emit('doc:' + event.type, event);
		emitter.emit(event.iden , event);
	}
	// the list path - doc:path
	if(event.path) {
		emitter.to(event.path).emit('doc', event);
		emitter.to(event.path).emit('doc:' + event.type, event);
		emitter.emit(event.path , event);
	}
	// individual field listening - 
	if(event.field && event.id) {
		// room event.id:event.field     emit doc
		emitter.to(event.id + ':' + event.field).emit('doc', event);
		emitter.to(event.id + ':' + event.field).emit('doc:' + event.type, event);
		emitter.emit(event.id + ':' + event.field , event);
		emitter.emit(event.field , event);
		// room path    emit field:event.id:event.field
		emitter.to(event.path).emit('field:' + event.id + ':' + event.field, event);
		emitter.to(event.path + ':field').emit('field:' + event.id + ':' + event.field, event);
		
	}
	
}

'use strict';

const IPC = require('liqd-ipc');

console.log('Thread');

/*const http = require('http');

const server = http.createServer( ( req, res ) => res.end( process.pid ) );
server.listen( 8080 );*/

let ipc = new IPC( process );

ipc.reply( '__liqd_worker_init', init =>
{
	console.log( 'Init', init.data );
	init.reply( true );
});

/*try
{

}
catch(e){}

console.log( process );*/

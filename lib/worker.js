'use strict';

const path = require('path');
const IPC = require('liqd-ipc');

module.exports = class Worker
{
	constructor( filename, options )
	{
		if( filename.startsWith('.') )
		{
			filename = path.resolve( path.dirname( new Error().stack.split(/\s*\n\s*/)[2].match(/\(([^():]+)[:0-9]*\)$/)[1] ), filename );
		}
		else if( !filename.startsWith('/') )
		{
			//TODO check how node does it
		}

		let worker_type = 'worker_thread';

		if( worker_type === 'cluster' )
		{
			let master_argv = process.argv;
			process.argv = [ process.argv[0], __dirname+'/thread.js' ];
			this._port = require('cluster').fork();
			process.argv = master_argv;
		}
		else if( worker_type === 'child_process' )
		{
			this._port = require('child_process').fork( __dirname+'/thread.js', process.argv, { execArgv : process.execArgv, env: process.env, cwd: process.cwd() });
		}
		else if( worker_type === 'worker_thread' )
		{
			this._port = new (require('worker_threads').Worker)( __dirname+'/thread.js' );
		}

		this._ipc = new IPC( this._port );
		this._ipc.call( '__liqd_worker_init', { worker_type });
	}
}

//internal/cluster/worker

'use strict';

const IPC = require('liqd-ipc');

const WORKER_TYPES = [ 'worker_thread', 'cluster', 'child_process' ];
const Workers = new Map();

module.exports = class Worker
{
	static spawn( script, options = {} )
	{
		return new Promise(( resolve, reject ) =>
		{
			if( script.startsWith('.') )
			{
				script = require('path').resolve( require('path').dirname( new Error().stack.split(/\s*\n\s*/)[4].match(/\(([^():]+)[:0-9]*\)$/)[1] ), script );
			}
			else if( !script.startsWith('/') )
			{
				script = require('path').resolve( script );
			}

			const worker =
			{
				type: options.type && WORKER_TYPES.includes( options.type ) ? options.type : 'child_process',
				port: undefined,
				ipc: undefined,
				proxy: undefined,
				properties: {}
			}

			if( worker.type === 'cluster' )
			{
				let master_argv = process.argv;
				process.argv = [ process.argv[0], __dirname+'/workers/cluster.js' ];
				worker.port = require('cluster').fork();
				process.argv = master_argv;
			}
			else if( worker.type === 'worker_thread' )
			{
				worker.port = new (require('worker_threads').Worker)( __dirname+'/workers/worker_thread.js' );
			}
			else// if( worker.type === 'child_process' )
			{
				worker.port = require('child_process').fork( __dirname+'/workers/child_process.js', process.argv, { execArgv : process.execArgv, env: process.env, cwd: process.cwd() });
			}

			worker.port.on( 'exit', ( code ) =>
			{
				if( options.onExit )
				{
					options.onExit( code, worker.proxy );
				}
			});

			worker.ipc = new IPC( worker.port );
			worker.ipc.call( '__liqd_worker_init', { script }).then( init =>
			{
				for( let property in init.properties )
				{
					if( init.properties[property] === 'function' )
					{
						Object.defineProperty( worker.properties, property,
						{
							value: ( ...args ) => worker.ipc.call( '__liqd_worker_call', { method: property, args: args }),
							writable: false
						});
					}
					else
					{
						Object.defineProperty( worker.properties, property,
						{
							get: () => worker.ipc.call( '__liqd_worker_get', { property })
						});
					}
				}

				resolve( worker.proxy );
			});

			worker.proxy = new Proxy( worker.properties,
			{
				get: ( properties, property ) => properties[property]
			});

			Workers.set( worker.proxy, worker );
		});
	}

	static destroy( proxy, code = 0 )
	{
		return new Promise(( resolve, reject ) =>
		{
			const worker = Workers.get( proxy );

			if( worker && worker.ipc )
			{
				Workers.delete( proxy );

				worker.ipc.call( '__liqd_worker_exit', { code }).then( resolve );
			}
			else{ reject( 'WORKER_ALREADY_DESTROYED' ); }
		});
	}
}

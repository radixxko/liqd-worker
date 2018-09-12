'use strict';

const IPC = require('liqd-ipc');

const getProperties = ( proto, properties = new Set() ) =>
{
	for( let property of Object.getOwnPropertyNames( proto ))
	{
		properties.add( property )
	}

	proto = Object.getPrototypeOf( proto );

	if( proto && proto.constructor.name !== 'Object' )
	{
		getProperties( proto, properties );
	}

	return [ ...properties ];
}

module.exports = class Thread
{
	constructor( port )
	{
		this._port = port;
		this._ipc = new IPC( port );

		this._ipc.reply( '__liqd_worker_init', init =>
		{
			this._main = require( init.data.script );

			let properties = getProperties( Object.getPrototypeOf( this._main ) === Object.prototype ? this._main : Object.getPrototypeOf( this._main ));

			init.reply(
			{
				properties: properties.filter( p => !p.startsWith('_') ).reduce(( properties, property ) =>
				{
					properties[property] = typeof this._main[property];

					return properties;
				},{})
			});
		});

		this._ipc.reply( '__liqd_worker_call', async( call ) =>
		{
			//TODO: TimedPromise
			try
			{
				let result = await this._main[ call.data.method ]( ...call.data.args );

				call.reply( result );
			}
			catch(e){ call.reject( e.toString() ); }
		});

		this._ipc.reply( '__liqd_worker_get', async( call ) =>
		{
			//TODO: TimedPromise
			try
			{
				let value = this._main[ call.data.property ];

				call.reply( value );
			}
			catch(e){ call.reject( e.toString() ); }
		});

		this._ipc.reply( '__liqd_worker_exit', ( exit ) =>
		{
			exit.reply( true );

			process.exit( exit.data.code );
		})
	}
}

'use strict';

const assert = require('assert');

const Worker = require('../lib/worker');

let experimental = false; try{ require('worker_threads'); experimental = true; }catch(e){}

describe( 'Tests', async( done ) =>
{
	const thread1 = await Worker.spawn( './workers/func.js', { type: 'cluster', onExit: ( code, thread ) => assert.ok( code === 13 && thread1 === thread ) });
	const thread2 = await Worker.spawn( __dirname + '/workers/instance.js' );
	const thread3 = await Worker.spawn( 'test/workers/func.js', { type: experimental || true  ? 'worker_thread' : 'child_process' });

	thread1.hello( 'foo' ).then( v => assert.fail() ).catch( e => assert.ok( e === 'ReferenceError: b is not defined' ));
	thread1.world( 'bar' ).then( v => assert.ok( v === 'World bar' ) ).catch( e => assert.fail() );
	thread1.test.then( v => assert.ok( v === 3.14 ) ).catch( e => assert.fail() );
	thread1.obj.then( v => assert.deepStrictEqual( v, { foo: 'bar' } ) ).catch( e => assert.fail() );

	thread2.foo( 'foo' ).then( v => assert.ok( v === 'foobar' ) ).catch( e => assert.fail() );
	thread2.bar( 'bar' ).then( v => assert.ok( v === 'barfoo' ) ).catch( e => assert.fail() );
	thread2.foobar( 'foo' ).then( v => assert.ok( v === 'basefoobar' ) ).catch( e => assert.fail() );
	thread2.crash.then( v => assert.fail() ).catch( e => assert.ok( e === 'Crash' ) );

	thread3.hello( 'foo' ).then( v => assert.fail() ).catch( e => assert.ok( e === 'ReferenceError: b is not defined' ));
	thread3.world( 'bar' ).then( v => assert.ok( v === 'World bar' ) ).catch( e => assert.fail() );
	thread3.test.then( v => assert.ok( v === 3.14 ) ).catch( e => assert.fail() );
	thread3.obj.then( v => assert.deepStrictEqual( v, { foo: 'bar' } ) ).catch( e => assert.fail() );

	setTimeout( () =>
	{
		Worker.destroy( thread1, 13 ).then( v => assert.ok( v === true ) ).catch( e => assert.fail() );
		Worker.destroy( thread2 ).then( v => assert.ok( v === true ) ).catch( e => assert.fail() );
		Worker.destroy( thread3 ).then( v => assert.ok( v === true ) ).catch( e => assert.fail() );
		Worker.destroy( thread3 ).then( v => assert.fail() ).catch( e => assert.ok( e === 'WORKER_ALREADY_DESTROYED' ) );

		setTimeout( () =>
		{
			done();
		},
		1000 );
	},
	1000);
});

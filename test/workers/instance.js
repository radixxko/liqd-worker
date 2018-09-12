class Base
{
	constructor()
	{

	}

	foo()
	{
		return 'basefoo';
	}

	foobar()
	{
		return 'basefoobar';
	}
}

let crash_called = false;

module.exports = new (class Test extends Base
{
	constructor()
	{
		super();
	}

	foo()
	{
		return 'foobar';
	}

	bar()
	{
		return 'barfoo';
	}

	get crash()
	{
		if( crash_called )
		{
			throw 'Crash';
		}
		else
		{
			crash_called = true;
			return 'crash';
		}
	}
})();

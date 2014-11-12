# Js.Edgar

Lightweight Spy/Mock Library for JavaScript

## Why choose this name?

This library is meant to create, manage, and direct spies for testing JavaScript.  As such, it only seemed natural to name it after one of the most infamous intelligence directors in history, [J. Edgar Hoover](http://en.wikipedia.org/wiki/J._Edgar_Hoover).

## Using Js.Edgar

Install with npm:
```
npm install js.edgar
```

Install with bower:
```
bower install js.edgar
```

Install with jam:
```
jam install js.edgar
```

Add the edgar.js script to your html:
```html
<script src="{file path}/edgar.js"></script>
```

You can now reference "Edgar" anywhere within your tests!

## Supported Testing Frameworks

Js.Edgar is built to be lightweight and flexible; it should work with any testing framework.  Specifically, the tests for this library are written in QUnit, so integration with that framework has been well-documented.  As such, all major examples will show how to utilize Js.Edgar within QUnit.

Some major frameworks, such as Jasmine, come with their own Spy solution, so no testing has been done around that integration.  For other frameworks, though, we've tried to make things easy by utilizing their testing hooks to provide automatic cleanup for Js.Edgar.  QUnit's testDone and Mocha's afterEach hooks will be called if those frameworks are in use, and every Spy managed by Js.Edgar will be released and removed.

## Creating Spies

Creating a Spy is easy, and our API attempts to intelligently configure the Spy to your needs with as little configuration as possible.  A basic Spy will track all calls to the spied method, including arguments and return values, and it will prevent the actual method from being executed.

```javascript
var obj;
module('QUnit Spies', {
	setup: function() {
		obj = {
			foo: function () {
				return 'bar';
			}
		};
	}
});

test('Basic Spy', function(assert) {
	var spy = Edgar.createSpy(obj, 'foo'),
		result = obj.foo();

	assert.ok(spy.called(), 'foo was called');
	assert.equal(result, undefined, 'spy returned undefined by default');
});
```

You'll note two things happened here:
1) Js.Edgar tracked that foo was called (called() actually returns the number of calls, as you'll see later, but ok is a perfectly fine assertion if you only want to make sure it was called)
2) The method foo() was mocked and the return value was undefined

## Mocking Return Values

So far, this is pretty basic, but we can easily expand our capabilities to provide a mocked return value:

```javascript
test('Return Value', function(assert) {
	var value = 'stuff',
		spy = Edgar.createSpy(obj, 'foo', value),
		result = obj.foo();

	assert.equal(spy.called(), 1, 'foo was called');
	assert.equal(result, value, 'spy returned value that was passed');
});
```

In the above example, we added a third parameter to createSpy(), which Js.Edgar used to mock a return value when foo() was called.  This parameter can be any valid javascript object or primitive, including functions!

If you need to change the Spy's return value for subsequent assertions or to setup mocking after executing the live method previously (see below), you can call startMocking() (or its alias andMock()).

```javascript
test('Return value set with startMocking', function(assert) {
	var value = 'stuff',
		spy = Edgar.createSpy(obj, 'foo').andExecute(), // setup spy with no mocking
		result;

	spy.startMocking(value);
	result = obj.foo();

	assert.equal(spy.called(), 1, 'foo was called');
	assert.equal(result, value, 'spy returned value that was passed');
});
```

startMocking takes an optional parameter that allows you to set the return value or invoke method (see below) for the Spy if you have not yet done so.

## Invoking Mock Methods

Now, let's say that you have a more complicated scenario, and you want your mocked return value to be different depending on what it gets passed.  Well, that's easy, too!

```javascript
test('Invoked Function', function(assert) {
	var value = 'stuff',
		func = function(param) { return value + param; },
		spy = Edgar.createSpy(obj, 'foo', func).andInvoke(),
		param = 'it',
		result = obj.foo(param);

	assert.equal(spy.called(), 1, 'foo was called');
	assert.equal(result, value + param, 'spy invoked function that was passed');
});
```

The key here was chaining the andInvoke() method onto your spy creation, telling Js.Edgar that the function you passed was to be invoked, rather than simply returned intact.  You can also set this up after creating the spy, if you'd like.

```javascript
test('Non-chained Invoke', function(assert) {
	var value = 'stuff',
		func = function(param) { return value + param; },
		spy = Edgar.createSpy(obj, 'foo', func),
		param = 'it',
		result;

	spy.startInvoking();
	result = obj.foo(param);

	assert.equal(spy.called(), 1, 'foo was called');
	assert.equal(result, value + param, 'spy invoked function that was passed');
});
```

startInvoking() is interchangeable with andInvoke, we just provided both method names so that your code is more readable regardless of which pattern you choose.

## Executing Original Functionality

Now you might be asking yourself, what if I actually want the method I'm spying on to execute?  Well, don't worry, we've thought of that!

```javascript
test('No Mocking', function(assert) {
	var value = obj.foo(),
		spy = Edgar.createSpy(obj, 'foo').andExecute(),
		result = obj.foo();

	assert.equal(spy.called(), 1, 'foo was called');
	assert.equal(result, value, 'spy executed the original function');
});
```

By calling andExecute() or its alias startExecuting(), you can tell Js.Edgar to let the original method be executed within the appropriate scope while still tracking all calls made to the method!

## Tracking Arguments

Js.Edgar can easily tell you what arguments were passed to each individual call.  Spy.calledWith() will return the arguments array of the most recent call made to the method, regardless of whether you are using the mock, invoke, or execute strategies.

```javascript
test('Tracking Arguments', function(assert) {
	var spy = Edgar.createSpy(obj, 'foo'),
		value = 'stuff',
		value2 = {thing: 'rawr'};

	obj.foo(value, value2);
	var args = spy.calledWith();
	assert.equal(args.length, 2, 'foo was called with 2 arguments');
	assert.equal(args[0], value, 'foo was called with value');
	assert.equal(args[1], value2, 'foo was called with value2');
});
```

Of course, you can also track multiple calls and obtain the arguments by passing the id of call you want (in order):

```javascript
test('Multiple calls', function(assert) {
	var spy = Edgar.createSpy(obj, 'foo'),
		value = 'stuff',
		value2 = {thing: 'rawr'},
		value3 = [1, 2, 3],
		value4 = function() { return 'foobar';},
		value5 = 'moo';

	obj.foo(value, value2);
	obj.foo(value3, value4, value5);

	var args = spy.calledWith(0); // first call's arguments
	assert.equal(args.length, 2, 'foo was called with 2 arguments');
	assert.equal(args[0], value, 'foo was called with value');
	assert.equal(args[1], value2, 'foo was called with value2');

	var args2 = spy.calledWith(1); // second call's arguments
	assert.equal(args2.length, 3, 'foo was called with 3 arguments');
	assert.equal(args2[0], value3, 'foo was called with value3');
	assert.equal(args2[1], value4, 'foo was called with value4');
	assert.equal(args2[2], value5, 'foo was called with value5');

	var args3 = spy.calledWith();
	assert.equal(args2, args3, 'calledWith returns most recent call if no id is provided');
});
```

## Tracking Return Values

The exact same api exists for tracking values returned from each method call; just call returnedWith()!

```javascript
test('Mocked return value - multiple calls', function(assert) {
	var value = 'stuff',
		value2 = 'things',
		spy = Edgar.createSpy(obj, 'foo', value);

	obj.foo();

	Edgar.createSpy(obj, 'foo', value2); // Does not create a separate spy, will intelligently return the pre-existing one

	obj.foo();

	assert.equal(spy.returnedWith(0), value, 'foo was called with value');
	assert.equal(spy.returnedWith(1), value2, 'foo was called with value2');
	assert.equal(spy.returnedWith(), value2, 'returnedWith returns most recent call if no id is provided');
});

test('Invoked function - multiple calls', function(assert) {
	var value = 'stuff',
		func = function() {return value;},
		spy = Edgar.createSpy(obj, 'foo', func).andInvoke();

	obj.foo();

	var value2 = value;
	value = 'things';

	obj.foo();

	assert.equal(spy.returnedWith(0), value2, 'func was invoked');
	assert.equal(spy.returnedWith(1), value, 'new value was returned');
	assert.equal(spy.returnedWith(), value, 'returnedWith returns most recent call if no id is provided');
});

test('No mocking - multiple calls', function(assert) {
	var value = 'stuff';
	obj.foo = function() { return value; };
	var spy = Edgar.createSpy(obj, 'foo').andExecute();

	obj.foo();

	var value2 = value;
	value = 'things';

	obj.foo();

	assert.equal(spy.returnedWith(0), value2, 'func was executed');
	assert.equal(spy.returnedWith(1), value, 'new value was returned');
	assert.equal(spy.returnedWith(), value, 'returnedWith returns most recent call if no id is provided');
});
```

## Tracking Call Context

Spies also track and pass the context of ```this``` when the spied method is called:
 
 ```javascript
test('Context passing with call() - Invoke', function (assert) {
	var self,
		spy = Edgar.createSpy(obj, 'foo', function() { self = this; }).andInvoke(),
		obj2 = {};

	obj.foo.call(obj2);

	assert.equal(self, obj2, 'obj2 passed to invoked method');
});

test('Context passing with apply() - Execute', function (assert) {
	var self;
	obj.foo = function() {
		self = this;
	};
	var spy = Edgar.createSpy(obj, 'foo').andExecute(),
		obj2 = {};

	obj.foo.apply(obj2);

	assert.equal(self, obj2, 'obj2 passed to executed method');
});
```

The above examples show that the context is passed to both executed and invoked methods, regardless of whether call() or apply() (or neither) were used.

For the purposes of testing, you can use Spy.getContext() to assert that the method was called with the proper value of ```this```, which can be helpful if you are using call() or apply() yourself.

```javascript
test('Single call', function (assert) {
	var spy = Edgar.createSpy(obj, 'foo');

	obj.foo();

	assert.equal(spy.getContext(0), obj, 'obj used as default context');
});

test('Single call using call()', function (assert) {
	var spy = Edgar.createSpy(obj, 'foo'),
		obj2 = {};

	obj.foo.call(obj2);

	assert.equal(spy.getContext(0), obj2, 'obj2 used as context passed from call()');
});
```

As with the previous APIs, passing a call id to getContext is optional; it will return the most recent call by default.

## Releasing Spies

As mentioned previously, Js.Edgar will proactively release all spies between QUnit or Mocha tests.  However, if you are using another framework or run into any other scenario where you need to make sure original functionality is restored, just call Spy.release()!

```javascript
test('Release - stops spying on method and returns original functionality', function(assert) {
	var value = 'stuff',
		spy = Edgar.createSpy(obj, 'foo', value),
		result = obj.foo();

	assert.equal(result, value, 'spy is working');
	assert.equal(spy.called(), 1, 'spy had one call');

	spy.release();

	result = obj.foo();
	assert.notEqual(result, value, 'original method executes');
	assert.equal(spy.called(), 1, 'spy still has one call, because the method was released');
});
```

After release() is called, no further calls to the method will be tracked and it will execute normally, as if the Spy had never been created.  The Spy will still have any data it collected up to that point, in case you should need it.

## Resetting Spies

You can reset a Spy and wipe out its tracked calls by calling reset().  Once reset has been called, any further calls to the spies method will still be tracked, but previous calls will have been lost.

```javascript
test('Reset - resets call array and returns existing calls', function(assert) {
	var spy = Edgar.createSpy(obj, 'foo');

	obj.foo();

	var calls = spy.reset();

	assert.equal(calls.length, 1, 'returns existing calls from reset');
	assert.ok(!spy.called(), 'no calls left after reset');
});
```

## Resuming Spies

If you have released a Spy, you can resume spying on the method by simply calling resume().

```javascript
test('Restore - resumes spying on method', function(assert) {
	var value = 'stuff',
		spy = Edgar.createSpy(obj, 'foo', value),
		result = obj.foo();

	spy.resume();

	result = obj.foo();
	assert.notEqual(result, value, 'original method executes');
	assert.equal(spy.called(), 1, 'spy only has one call, because the method was released');

	spy.resume();
	result = obj.foo();
	assert.equal(result, value, 'spy mock was restored');
	assert.equal(spy.called(), 2, 'spy registered a second call after restore');
});
```

## Running Js.Edgar's Unit Tests

We are still working on configuring a command-line testing setup, but for now you can run our QUnit tests by pulling up the tests/index.html file.

## License

* Copyright © 2014 Jordan Hawker
* MIT License (see LICENSE.txt or http://opensource.org/licenses/MIT)

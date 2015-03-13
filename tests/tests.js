// If tests are not running in the browser, these will be undefined
if (typeof QUnit == 'undefined')
    QUnit = require('qunit-cli');
if (typeof Edgar == 'undefined')
    Edgar = require('./../src/edgar');

var module = QUnit.module,
	test = QUnit.test,
	obj;

function setup() {
	obj = {
		foo: function () {
			return 'bar';
		}
	};
}

module('Call Tracking', { setup: setup });

test('Basic Spy', function(assert) {
	var spy = Edgar.createSpy(obj, 'foo'),
		result = obj.foo();

	assert.equal(spy.called(), 1, 'foo was called');
	assert.equal(result, undefined, 'spy returned undefined by default');
});

test('Return value', function(assert) {
	var value = 'stuff',
		spy = Edgar.createSpy(obj, 'foo', value),
		result = obj.foo();

	assert.equal(spy.called(), 1, 'foo was called');
	assert.equal(result, value, 'spy returned value that was passed');
});

test('Return value set with startMocking', function(assert) {
	var value = 'stuff',
		spy = Edgar.createSpy(obj, 'foo').andExecute(),
		result;

	spy.startMocking(value);
	result = obj.foo();

	assert.equal(spy.called(), 1, 'foo was called');
	assert.equal(result, value, 'spy returned value that was passed');
});

test('Return function', function(assert) {
	var value = 'stuff',
		func = function() { return value; },
		spy = Edgar.createSpy(obj, 'foo', func),
		result = obj.foo();

	assert.equal(spy.called(), 1, 'foo was called');
	assert.equal(result, func, 'spy returned function that was passed');
	assert.equal(result(), value, 'returned function is unaltered');
});

test('Invoked function', function(assert) {
	var value = 'stuff',
		func = function() { return value; },
		spy = Edgar.createSpy(obj, 'foo', func).andInvoke(),
		result = obj.foo();

	assert.equal(spy.called(), 1, 'foo was called');
	assert.equal(result, value, 'spy invoked function that was passed');
});

test('No mocking', function(assert) {
	var value = obj.foo(),
		spy = Edgar.createSpy(obj, 'foo').andExecute(),
		result = obj.foo();

	assert.equal(spy.called(), 1, 'foo was called');
	assert.equal(result, value, 'spy executed the original function');
});

test('Multiple calls', function(assert) {
	var spy = Edgar.createSpy(obj, 'foo');

	obj.foo();
	assert.equal(spy.called(), 1, 'foo was called once');

	obj.foo();
	assert.equal(spy.called(), 2, 'foo was called twice');
});

test('Multiple spies', function(assert) {
	obj.bar = function () { return 'foo'; };

	var fooSpy = Edgar.createSpy(obj, 'foo'),
		barSpy = Edgar.createSpy(obj, 'bar'),
		val1 = 'thing',
		val2 = 'stuff';

	obj.foo(val1);
	obj.bar(val2);

	assert.equal(fooSpy.called(), 1, 'foo was called once');
	assert.equal(barSpy.called(), 1, 'bar was called once');
	assert.equal(fooSpy.calledWith()[0], val1, 'foo was called with val1');
	assert.equal(barSpy.calledWith()[0], val2, 'bar was called with val2');
});

module('Argument Tracking', { setup: setup });

test('Single argument', function(assert) {
	var spy = Edgar.createSpy(obj, 'foo'),
		value = 'stuff';

	obj.foo(value);
	assert.equal(spy.calledWith()[0], value, 'foo was called with value');
});

test('Multiple arguments', function(assert) {
	var spy = Edgar.createSpy(obj, 'foo'),
		value = 'stuff',
		value2 = {thing: 'rawr'};

	obj.foo(value, value2);
	var args = spy.calledWith();
	assert.equal(args.length, 2, 'foo was called with 2 arguments');
	assert.equal(args[0], value, 'foo was called with value');
	assert.equal(args[1], value2, 'foo was called with value2');
});

test('Multiple calls', function(assert) {
	var spy = Edgar.createSpy(obj, 'foo'),
		value = 'stuff',
		value2 = {thing: 'rawr'},
		value3 = [1, 2, 3],
		value4 = function() { return 'foobar';},
		value5 = 'moo';

	obj.foo(value, value2);
	obj.foo(value3, value4, value5);

	var args = spy.calledWith(0);
	assert.equal(args.length, 2, 'foo was called with 2 arguments');
	assert.equal(args[0], value, 'foo was called with value');
	assert.equal(args[1], value2, 'foo was called with value2');

	var args2 = spy.calledWith(1);
	assert.equal(args2.length, 3, 'foo was called with 3 arguments');
	assert.equal(args2[0], value3, 'foo was called with value3');
	assert.equal(args2[1], value4, 'foo was called with value4');
	assert.equal(args2[2], value5, 'foo was called with value5');

	var args3 = spy.calledWith();
	assert.equal(args2, args3, 'calledWith returns most recent call if no id is provided');
});

test('Multiple recursive calls', function(assert) {
	var barVal = 'bar',
		stuffVal = 'stuff';
	obj.foo = function (bar) {
		if (bar === barVal) {
			obj.foo(stuffVal);
		}
	};

	var spy = Edgar.createSpy(obj, 'foo').andExecute();

	obj.foo(barVal);

	assert.equal(spy.called(), 2, 'foo was called twice');

	var args1 = spy.calledWith(0),
		args2 = spy.calledWith(1);
	assert.equal(args1[0], barVal, 'foo was called with barVal first');
	assert.equal(args2[0], stuffVal, 'foo was called with stuffVal second');
});

module('Return Value Tracking', { setup: setup });

test('Mocked return value', function(assert) {
	var value = 'stuff',
		spy = Edgar.createSpy(obj, 'foo', value);

	obj.foo();
	assert.equal(spy.returnedWith(), value, 'foo was called with value');
});

test('Mocked return value - multiple calls', function(assert) {
	var value = 'stuff',
		value2 = 'things',
		spy = Edgar.createSpy(obj, 'foo', value);

	obj.foo();

	Edgar.createSpy(obj, 'foo', value2);

	obj.foo();

	assert.equal(spy.returnedWith(0), value, 'foo was called with value');
	assert.equal(spy.returnedWith(1), value2, 'foo was called with value2');
	assert.equal(spy.returnedWith(), value2, 'returnedWith returns most recent call if no id is provided');
});

test('Invoked function', function(assert) {
	var value = 'stuff',
		func = function() {return value;},
		spy = Edgar.createSpy(obj, 'foo', func).andInvoke();

	obj.foo();
	assert.equal(spy.returnedWith(), value, 'function was invoked');
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

test('No mocking', function(assert) {
	var value = 'stuff',
		func = function() {return value;},
		spy = Edgar.createSpy(obj, 'foo', func).andInvoke();

	obj.foo();
	assert.equal(spy.returnedWith(), value, 'function was invoked');
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

module('Context Tracking', { setup: setup });

test('Single call', function (assert) {
	var spy = Edgar.createSpy(obj, 'foo');

	obj.foo();

	assert.equal(spy.getContext(), obj, 'obj used as default context');
});

test('Single call using call()', function (assert) {
	var spy = Edgar.createSpy(obj, 'foo'),
		obj2 = {};

	obj.foo.call(obj2);

	assert.equal(spy.getContext(), obj2, 'obj2 used as context passed from call()');
});

test('Single call using apply()', function (assert) {
	var spy = Edgar.createSpy(obj, 'foo'),
		obj2 = {};

	obj.foo.apply(obj2);

	assert.equal(spy.getContext(), obj2, 'obj2 used as context passed from apply()');
});

test('Multiple calls - one basic, one apply', function (assert) {
	var spy = Edgar.createSpy(obj, 'foo'),
		obj2 = {};

	obj.foo();
	obj.foo.apply(obj2);

	assert.equal(spy.getContext(0), obj, 'obj used as context for first call');
	assert.equal(spy.getContext(), obj2, 'obj2 used as context for second call');
});

test('Multiple calls - one call, one apply', function (assert) {
	var spy = Edgar.createSpy(obj, 'foo'),
		obj2 = {},
		obj3 = {bar: function() {}};

	obj.foo.call(obj2);
	obj.foo.apply(obj3);

	assert.equal(spy.getContext(0), obj2, 'obj2 used as context for first call');
	assert.equal(spy.getContext(), obj3, 'obj3 used as context for second call');
});

test('Context passing - Invoke', function (assert) {
	var self,
		spy = Edgar.createSpy(obj, 'foo', function() { self = this; }).andInvoke();

	obj.foo();

	assert.equal(self, obj, 'obj passed to invoked method');
});

test('Context passing with call() - Invoke', function (assert) {
	var self,
		spy = Edgar.createSpy(obj, 'foo', function() { self = this; }).andInvoke(),
		obj2 = {};

	obj.foo.call(obj2);

	assert.equal(self, obj2, 'obj2 passed to invoked method');
});

test('Context passing with apply() - Invoke', function (assert) {
	var self,
		spy = Edgar.createSpy(obj, 'foo', function() { self = this; }).andInvoke(),
		obj2 = {};

	obj.foo.apply(obj2);

	assert.equal(self, obj2, 'obj2 passed to invoked method');
});

test('Context passing - Execute', function (assert) {
	var self;
	obj.foo = function() {
		self = this;
	};
	var spy = Edgar.createSpy(obj, 'foo').andExecute();

	obj.foo();

	assert.equal(self, obj, 'obj passed to executed method');
});

test('Context passing with call() - Execute', function (assert) {
	var self;
	obj.foo = function() {
		self = this;
	};
	var spy = Edgar.createSpy(obj, 'foo').andExecute(),
		obj2 = {};

	obj.foo.call(obj2);

	assert.equal(self, obj2, 'obj2 passed to executed method');
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

module('Utility Methods', { setup: setup });

test('Reset - resets call arrays', function(assert) {
	var spy = Edgar.createSpy(obj, 'foo');

	obj.foo();

	var self = spy.reset();

	assert.equal(self, spy, 'returns itself from reset');
	assert.ok(!spy.called(), 'no calls left after reset');
});

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

test('Resume - resumes spying on method', function(assert) {
	var value = 'stuff',
		spy = Edgar.createSpy(obj, 'foo', value),
		result = obj.foo();

	spy.release();

	result = obj.foo();
	assert.notEqual(result, value, 'original method executes');
	assert.equal(spy.called(), 1, 'spy only has one call, because the method was released');

	spy.resume();
	result = obj.foo();
	assert.equal(result, value, 'spy mock was restored');
	assert.equal(spy.called(), 2, 'spy registered a second call after restore');
});

//test('', function(assert) {
//
//});

//test('', function(assert) {
//
//});

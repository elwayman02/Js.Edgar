/**
 * Js.Edgar is a lightweight Spy/Mock library for testing JavaScript.
 *
 * @package Js.Edgar
 * @author  Jordan Hawker <hawker.jordan@gmail.com>
 */

(function () {
	Edgar = {
		spies: {},
		mocks: {},

		/**
		 *
		 * @param spy
		 * @param method
		 */
		addSpy: function(spy, method) {
			var spies = this.spies[method];

			if (!spies) {
				this.spies[method] = spies = [];
			}

			spies.push(spy);
		},

		/**
		 *
		 * @param obj
		 * @param method
		 * @returns {Edgar.Spy}
		 */
		getSpy: function(obj, method) {
			if (typeof method !== 'string') {
				throw 'Failed to find spy: method name was invalid.';
			}
			var spies = this.spies[method];

			if (spies && spies.length) {
				return spies.filter(function(spy) {
					return spy.obj === obj;
				})[0];
			}
		},

		/**
		 * External API to create a spy
		 *
		 * @param obj
		 * @param method
		 * @param value
		 * @returns {Edgar.Spy}
		 */
		createSpy: function(obj, method, value) {
			var type = typeof obj,
				spy;

			if (type === 'undefined' || type === 'function') { // Create a callback spy
				return this.createMock(obj);
			} else if (type === 'object' && obj !== null) {
				if (typeof method === 'string') { // Create a normal spy
					spy = this.getSpy(obj, method);
					if (!spy) { // Don't create a new spy if one already exists for this method
						spy = new this.Spy(obj, method, value);
						this.addSpy(spy, method);
					} else if (value !== undefined) {
						spy.value = value; // Update the value if a new one was passed in
					}
					return spy;
				}
				throw 'Spy Creation Failed: Method name must be a string.';
			} else {
				throw 'Spy Creation Failed: Object was not a valid type.';
			}
		},

		/**
		 *
		 */
		createMock: function(method) {
			if (typeof method === 'function') {
				var mock = new this.Mock(method);
				this.mocks.push(mock);
				return mock;
			}
			throw 'Mock Creation Failed: Input must be a function.'
		},

		releaseAll: function() {
			var spies = this.spies,
				spyList,
				i;
			for (var key in spies) {
				if (spies.hasOwnProperty(key)) {
					spyList = spies[key];
					for (i = 0; i < spyList.length; i++) {
						spyList[i].release();
					}
				}
			}
		},

		removeSpies: function() {
			this.spies = {};
		}
	};

	/**
	 * Spy constructor
	 *
	 * @param obj
	 * @param method
	 * @param value
	 * @param invoke
	 * @constructor
	 */
	Edgar.Spy = (function() {
		var self;

		function Spy(obj, method, value) {
			self = this;
			self.obj = obj;
			self.name = method;
			self.method = obj[method];
			self.value = value;
			self.execute = false;
			self.invoke = null;

			self.calls = [];

			obj[method] = self.mock;
		}

		/**
		 *
		 * @returns {*}
		 */
		Spy.prototype.mock = function() {
			var args = arguments,
				call = {
					args: args
				};

			if (self.execute) {
				call.returned = self.method.apply(self.obj, args);
			} else if (self.invoke) {
				call.returned = self.value.apply(self.obj, args);
			} else {
				call.returned = self.value;
			}

			self.calls.push(call);

			return call.returned;
		};

		Spy.prototype.andInvoke = function() {
			self.invoke = true;
			return self;
		};

		/**
		 *
		 * @type {Function}
		 */
		Spy.prototype.andExecute = Spy.prototype.startExecuting = function() {
			self.execute = true;
			return self;
		};

		/**
		 *
		 * @type {Function}
		 */
		Spy.prototype.andMock = Spy.prototype.startMocking = function() {
			self.execute = false;
			return self;
		};

		/**
		 *
		 * @returns {Number}
		 */
		Spy.prototype.called = function() {
			return self.calls.length;
		};

		/**
		 *
		 * @param id
		 * @returns {*}
		 */
		Spy.prototype.calledWith = function(id) {
			if (id !== undefined && id !== null) {
				if (id >= 0 && id < self.calls.length) {
					return self.calls[id].args;
				}
				throw 'Cannot get arguments for invalid call index.';
			} else if (self.calls.length) {
				return self.calls[self.calls.length - 1].args;
			}
			throw 'Cannot get arguments, spy has not been called.';
		};

		/**
		 *
		 * @param id
		 * @returns {*}
		 */
		Spy.prototype.returnedWith = function(id) {
			if (id !== undefined && id !== null) {
				if (id >= 0 && id < self.calls.length) {
					return self.calls[id].returned;
				}
				throw 'Cannot get return value for invalid call index.';
			} else {
				return self.calls[self.calls.length - 1].returned;
			}
		};

		/**
		 *
		 * @returns {Array}
		 */
		Spy.prototype.reset = function() {
			var calls = self.calls;
			self.calls = [];

			return calls;
		};

		/**
		 *
		 */
		Spy.prototype.release = function() {
			self.obj[self.name] = self.method;
		};

		/**
		 *
		 */
		Spy.prototype.restore = function() {
			self.obj[self.name] = self.mock;
		};

		return Spy;
	})();

	/**
	 *
	 * @param method
	 * @constructor
	 */
	Edgar.Mock = function(method) {
		var spy = new Edgar.Spy({}, 'mock', method, true),
			mock = spy.mock;

		mock.prototype = spy.prototype;

		return mock;
	};

	if (typeof QUnit !== 'undefined') {
		QUnit.testDone(function () {
			Edgar.releaseAll();
			Edgar.removeSpies();
		});
	}

	if (typeof mocha !== 'undefined') {
		mocha.afterEach(function () {
			Edgar.releaseAll();
			Edgar.removeSpies();
		});
	}
}).call(this);

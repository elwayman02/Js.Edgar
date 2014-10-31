/**
 * Js.Edgar is a lightweight Spy/Mock library for testing JavaScript.
 *
 * @package Js.Edgar
 * @author  Jordan Hawker <hawker.jordan@gmail.com>
 */

(function () {
	var Edgar = {
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
		 * @param invoke
		 * @returns {Edgar.Spy}
		 */
		createSpy: function(obj, method, value, invoke) {
			var type = typeof obj,
				spy;

			if (type === 'undefined' || type === 'function') { // Create a callback spy
				return this.createMock(obj);
			} else if (type === 'object' && obj !== null) {
				if (typeof method === 'string') { // Create a normal spy
					spy = this.getSpy(obj, method);
					if (!spy) { // Don't create a new spy if one already exists for this method
						spy = new this.Spy(obj, method, value, invoke);
						this.addSpy(spy, method);
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
	Edgar.Spy = function(obj, method, value, invoke) {
		this.obj = obj;
		this.name = method;
		this.method = obj[method];
		this.execute = false;

		if (typeof value === 'function' && invoke) {
			this.invoke = value;
		} else {
			this.value = value;
		}

		this.calls = [];

		obj[method] = this.mock;
	};

	/**
	 *
	 * @returns {*}
	 */
	Edgar.Spy.prototype.mock = function() {
		var args = arguments,
			call = {
				args: args
			};

		if (this.execute) {
			call.returned = this.method.apply(this.obj, args);
		} else if (this.invoke) {
			call.returned = this.invoke.apply(this.obj, args);
		} else {
			call.returned = this.value;
		}

		this.calls.push(call);

		return call.returned;
	};

	/**
	 *
	 * @type {Function}
	 */
	Edgar.Spy.prototype.andExecute = Edgar.Spy.prototype.startExecuting = function() {
		this.execute = true;
	};

	/**
	 *
	 * @type {Function}
	 */
	Edgar.Spy.prototype.andMock = Edgar.Spy.prototype.startMocking = function() {
		this.execute = false;
	};

	/**
	 *
	 * @returns {Number}
	 */
	Edgar.Spy.prototype.called = function() {
		return this.calls.length;
	};

	/**
	 *
	 * @param id
	 * @returns {*}
	 */
	Edgar.Spy.prototype.calledWith = function(id) {
		if (id) {
			if (id >= 0 && id < this.calls.length) {
				return this.calls[id].args;
			}
			throw 'Cannot get arguments for invalid call index.';
		} else {
			return this.calls[this.calls.length - 1].args;
		}
	};

	/**
	 *
	 * @param id
	 * @returns {*}
	 */
	Edgar.Spy.prototype.returnedWith = function(id) {
		if (id) {
			if (id >= 0 && id < this.calls.length) {
				return this.calls[id].returned;
			}
			throw 'Cannot get return value for invalid call index.';
		} else {
			return this.calls[this.calls.length - 1].returned;
		}
	};

	/**
	 *
	 * @returns {Array}
	 */
	Edgar.Spy.prototype.reset = function() {
		var calls = this.calls;
		this.calls = [];

		return calls;
	};

	/**
	 *
	 */
	Edgar.Spy.prototype.release = function() {
		this.obj[this.name] = this.method;
	};

	/**
	 *
	 */
	Edgar.Spy.prototype.restore = function() {
		this.obj[this.name] = this.mock;
	};

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
}).call(this);
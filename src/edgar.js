/**
* Js.Edgar is a lightweight Spy/Mock library for testing JavaScript.
*
* @package Js.Edgar
* @version 0.0.4
* @author  Jordan Hawker <hawker.jordan@gmail.com>
* @license MIT
*/
(function (root, factory) {
    if (typeof define === 'function' && define.amd) { // AMD module
        define([], factory);
    } else if (typeof exports === 'object') {
			if (typeof module === 'object' && module.exports) {
        module.exports = factory();
			}
			exports.Edgar = factory();
    } else { // Browser globals (root is window)
        root.Edgar = factory();
  }
}(this, function () {
	var Edgar = {
		spies: {},
		mocks: {},

		/**
		* Adds the Spy to a hash so it is accessible later when needed
		*
		* @param {Spy} spy The Spy to be tracked
		* @param {String} method The name of the method the Spy is watching
		*/
		addSpy: function(spy, method) {
			var spies = this.spies[method];

			if (!spies) {
				this.spies[method] = spies = [];
			}

			spies.push(spy);
		},

		/**
		* Retrieves a Spy from the hash lookup
		*
		* @param {Object} obj The object being watched
		* @param {String} method The name of the method being watched
		* @returns {Spy} The Spy that corresponds to the given object/method
		*/
		getSpy: function(obj, method) {
			if (typeof method !== 'string') {
				throw 'Failed to find spy: method name was invalid.';
			}
			if (this.spies.hasOwnProperty(method)) {
				var spies = this.spies[method];

				if (spies && spies.length) {
					return spies.filter(function(spy) {
						return spy.obj === obj;
					})[0];
				}
			}
		},

		/**
		* External API to create a Spy
		*
		* @param {Object} obj The object to watch
		* @param {String} method The name of the method to watch
		* @param {*} [Value] A mock value to return or method to invoke
		* @returns {Spy} A Spy watching the given object/method
		*/
		createSpy: function(obj, method, value) {
			var type = typeof obj,
				spy;

			if (type === 'undefined' || type === 'function') { // Create a callback
				throw 'Mocking without objects is not yet supported';
				// return this.createMock(obj);
			} else if (type === 'object' && obj !== null) {
				if (typeof method === 'string') { // Create a normal spy
					spy = this.getSpy(obj, method);
					if (!spy) {
						// Don't create a new spy if one already exists for this method
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

		// /**
		//  *
		//  */
		// createMock: function(method) {
		// 	if (typeof method === 'function') {
		// 		var mock = new this.Mock(method);
		// 		this.mocks.push(mock);
		// 		return mock;
		// 	}
		// 	throw 'Mock Creation Failed: Input must be a function.'
		// },

		/**
		* Releases every Spy tracked by Edgar
		*/
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

		/**
		* Resets Edgar's Spy tracking
		*/
		removeSpies: function() {
			this.spies = {};
		}
	};

	/**
	* Spy constructor
	*
	* @param {Object} obj The object to watch
	* @param {String} method The name of the method to watch
	* @param {*} [value] A mock value to return or method to invoke
	* @constructor
	*/
	Edgar.Spy = (function() {

		function Spy(obj, method, value) {
			if (!(this instanceof Spy)) {
				return new Spy(obj, method, value);
			}

			var self = this;

			/**
			* Track a new call to the watched method,
			* mocking or executing it as needed
			*
			* @returns {*} The return value from the mock or real method
			*/
			self.mock = function() {
				var args = arguments,
					id = self.calls.length,
					returned = self.value;

				self.calls.push({ args: args });

				if (self.execute) {
					returned = self.method.apply(self.obj, args);
				} else if (self.invoke) {
					returned = self.value.apply(self.obj, args);
				}

				self.calls[id].returned = returned;

				return returned;
			};

			/**
			* Setup the Spy to invoke its mocked value
			* rather than just returning it
			*
			* @returns {Spy} Itself
			*/
			self.andInvoke = self.startInvoking = function() {
				if (typeof this.value === 'function') {
					self.invoke = true;
					return self;
				}
				throw 'Cannot invoke value that is not a function.';
			};

			/**
			* Setup the Spy to call the live method being watched
			*
			* @returns {Spy} Itself
			*/
			self.andExecute = self.startExecuting = function() {
				self.execute = true;
				return self;
			};

			/**
			* Setup the Spy to mock the method being watched
			*
			* @param {*} [value] The value to return/invoke for the mock
			* @returns {Spy} Itself
			*/
			self.andMock = self.startMocking = function(value) {
				if (value !== undefined) {
					self.value = value;
				}
				self.execute = false;
				return self;
			};

			/**
			* Find out how many calls have been made to the watched method
			*
			* @returns {Number} The number of calls made
			*/
			self.called = function() {
				return self.calls.length;
			};

			/**
			* Get the arguments passed to the watched method,
			* defaulting to the most recent call if no id is passed
			*
			* @param {Number} [id] The id of the call, in case of multiple
			* @returns {Array} The arguments array for that call
			*/
			self.calledWith = function(id) {
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
			* Get the return value passed from Spy.mock(),
			* defaulting to the most recent call if no id is passed
			*
			* @param {Number} [id] The id of the call, in case of multiple
			* @returns {*} The return value for that call
			*/
			self.returnedWith = function(id) {
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
			* Reset the calls tracked by the Spy
			*
			* @returns {Spy} Itself
			*/
			self.reset = function() {
				var calls = self.calls;
				self.calls = [];
				return self;
			};

			/**
			* Release the watched method back
			* to its original functionality
			*
			* @returns {Spy} Itself
			*/
			self.release = function() {
				self.obj[self.name] = self.method;
				return self;
			};

			/**
			* Resumes mocking the watched method
			*
			* @returns {Spy} Itself
			*/
			self.resume = function() {
				self.obj[self.name] = self.mock;
				return self;
			};

			// Defaults and Storage
			self.obj = obj;
			self.name = method;
			self.method = obj[method];
			self.value = value;
			self.execute = false;
			self.invoke = null;
			self.calls = [];

			obj[method] = self.mock;
		}

		return Spy;
	})();

	/**
	 *
	 * @param method
	 * @constructor
	 */
	// Edgar.prototype.Mock = function(method) {
	// 	var spy = new Edgar.Spy({}, 'mock', method, true),
	// 		mock = spy.mock;
	//
	// 	mock.prototype = spy.prototype;
	//
	// 	return mock;
	// };

	if (typeof QUnit !== 'undefined') {
		QUnit.testDone(function() {
			Edgar.releaseAll();
			Edgar.removeSpies();
		});
	}

	if (typeof mocha !== 'undefined') {
		mocha.afterEach(function() {
			Edgar.releaseAll();
			Edgar.removeSpies();
		});
	}

	return Edgar;
}));

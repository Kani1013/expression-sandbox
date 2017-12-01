var expect = require('chai').expect
var compiler = require('../.')
global.foo = 123

describe('An attacker', function () {
	it('cannot receive the global object directly', function () {
		expect(function () {compiler('global.foo')({})}).to.throw(TypeError)
		expect(function () {compiler('foo')({foo: global})}).to.throw(TypeError)
		expect(function () {compiler('foo.foo')({foo: global})}).to.throw(TypeError)
		expect(function () {compiler('this.foo')({foo: global})}).to.throw(TypeError)
		expect(function () {compiler('foo()')({foo: function () {return global}})}).to.throw(TypeError)
	})
	it('cannot use functions to reveal the global object', function () {
		expect(function () {
			compiler('function () {return this.foo}()')({})
		}).to.throw(TypeError)
		expect(function () {
			compiler('}).call(this), function () {return this.foo}(); (function () {')({})
		}).to.throw(SyntaxError)
	})
	it('cannot use eval to reveal the global object', function () {
		expect(function () {
			compiler('2..constructor.constructor("return this.foo")()')({})
		}).to.throw(TypeError)
		expect(function () {
			compiler('(function () {}).constructor("return this.foo")()')({})
		}).to.throw(TypeError)
		expect(function () {
			compiler('eval("this.foo")')({eval})
		}).to.throw(TypeError)
	})		    
	it('cannot use eval to reveal the document object', function () {
		expect(function () {
			compiler('return [].slice.constructor(\"return document.toString()\")();')({})
		}).to.be("[object HTMLDocument]")
	})
	it('cannot use string manipulation to execute unsandboxed code', function () {
		expect(function () {
			compiler('}).call(this)} 123; if (false) {(function () {')({})
		}).to.throw(SyntaxError)
	})
	it('cannot manipulate the sandbox context object', function () {
		expect(function () {
			compiler('this.foo = 2')({})
		}).to.throw(TypeError)
		expect(function () {
			compiler('Object.setPrototypeOf(this, {})')({Object})
		}).to.throw(TypeError)
		expect(function () {
			compiler('Object.preventExtensions(this)')({Object})
		}).to.throw(TypeError)
		expect(function () {
			compiler('Object.defineProperty(this, "foo", {value: 2})')({Object})
		}).to.throw(TypeError)
		expect(function () {
			compiler('delete this.foo')({Object, foo: 2})
		}).to.throw(TypeError)
	})
	it('cannot manipulate objects that are passed into the sandbox', function () {
		var obj = {foo: 2, fn: function () {return {}}}
		expect(function () {
			compiler('obj.bar = 2')({obj})
		}).to.throw(TypeError)
		expect(function () {
			compiler('Object.setPrototypeOf(obj, {})')({Object, obj})
		}).to.throw(TypeError)
		expect(function () {
			compiler('Object.preventExtensions(obj)')({Object, obj})
		}).to.throw(TypeError)
		expect(function () {
			compiler('Object.defineProperty(obj, "bar", {value: 2})')({Object, obj})
		}).to.throw(TypeError)
		expect(function () {
			compiler('delete obj.foo')({Object, obj})
		}).to.throw(TypeError)
		expect(function () {
			compiler('obj.fn().foo = 2')({Object, obj})
		}).to.throw(TypeError)
	})
	it('cannot manipulate accessible prototypes', function () {
		expect(function () {
			compiler('2..constructor.prototype.foo = 2')({})
		}).to.throw(TypeError)
		expect(function () {
			compiler('Object.setPrototypeOf(2..constructor.prototype, {})')({Object})
		}).to.throw(TypeError)
		expect(function () {
			compiler('Object.preventExtensions(2..constructor.prototype)')({Object})
		}).to.throw(TypeError)
		expect(function () {
			compiler('Object.defineProperty(2..constructor.prototype, "foo", {value: 2})')({Object})
		}).to.throw(TypeError)
		expect(function () {
			compiler('delete 2..constructor.prototype.toFixed')({Object})
		}).to.throw(TypeError)
	})
	it('cannot manipulate objects that are available on accessible prototypes', function () {
		expect(function () {
			compiler('2..constructor.prototype.toFixed.foo = 2')({})
		}).to.throw(TypeError)
		expect(function () {
			compiler('Object.setPrototypeOf(2..constructor.prototype.toFixed, {})')({Object})
		}).to.throw(TypeError)
		expect(function () {
			compiler('Object.preventExtensions(2..constructor.prototype.toFixed)')({Object})
		}).to.throw(TypeError)
		expect(function () {
			compiler('Object.defineProperty(2..constructor.prototype.toFixed, "foo", {value: 2})')({Object})
		}).to.throw(TypeError)
		expect(function () {
			compiler('delete 2..constructor.prototype.toFixed.foo')({Object})
		}).to.throw(TypeError)
	})
	it('cannot access outside scope', function () {
		expect(function () {
			var foo = {bar: 2}
			compiler('foo.bar')({})
		}).to.throw(TypeError)
		expect(function () {
			compiler('Math.round(2)')({})
		}).to.throw(TypeError)
		expect(function () {
			compiler('Math.round(2)')({Math})
		}).to.not.throw()
	})
	it('cannot access properties that start with "_', function () {
		expect(compiler('foo.bar')({foo: {bar: 2}})).to.equal(2)
		expect(compiler('foo._bar')({foo: {_bar: 2}})).to.be.undefined
		expect(compiler('_foo')({_foo: 2})).to.be.undefined
	})
})

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
		expect(compiler('}).call(this), function () {return this.foo}(); (function () {')({})).to.not.equal(123)
	})
	it('cannot use eval to reveal the global object', function () {
		expect(compiler('2..constructor.constructor("return this.foo")()')({})).to.not.equal(123)
		expect(compiler('eval("this.foo")')({eval})).to.not.equal(123)
	})
	it('cannot use string manipulation to execute unsandboxed code', function () {
		expect(compiler('}).call(this)} 123; if (false) {(function () {')({})).to.equal(undefined)
	})
	it('cannot manipulation the sandbox context object')
	it('cannot manipulation objects that are passed into the sandbox')
	it('cannot manipulation accessible prototypes')
	it('cannot manipulation objects that are available on accessible prototypes')
	it('cannot access outside scope')
	it('cannot access properties that start with "_')
})

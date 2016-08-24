var expect = require('chai').expect
var compiler = require('../.')


describe('Expression Compiler', function () {
	describe('when compiling', function () {
		it('should only allow strings to be compiled', function () {
			expect(function () {compiler()}).to.throw(TypeError)
			expect(function () {compiler(null)}).to.throw(TypeError)
			expect(function () {compiler(123)}).to.throw(TypeError)
			expect(function () {compiler(true)}).to.throw(TypeError)
			expect(function () {compiler(false)}).to.throw(TypeError)
			expect(function () {compiler(Symbol('foobar'))}).to.throw(TypeError)
			expect(function () {compiler({0: 'a', 1: 'b', 2: 'c'})}).to.throw(TypeError)
			expect(function () {compiler(['a', 'b', 'c'])}).to.throw(TypeError)
			expect(function () {compiler([])}).to.throw(TypeError)
			expect(function () {compiler(function () {return 'foobar'})}).to.throw(TypeError)
			expect(function () {compiler(new String('foobar'))}).to.throw(TypeError)
			expect(function () {compiler('foobar')}).to.not.throw()
		})
		it('should throw on syntax errors and reference errors', function () {
			expect(function () {compiler('foo bar')}).to.throw(SyntaxError)
			expect(function () {compiler('if (true) {')}).to.throw(SyntaxError)
			expect(function () {compiler('3 ++++ 5')}).to.throw(ReferenceError)
		})
	})
	describe('when executing', function () {
		it('should only accept objects and functions as sandboxes', function () {
			var code = compiler('2 + 3')
			expect(function () {code()}).to.throw(TypeError)
			expect(function () {code(null)}).to.throw(TypeError)
			expect(function () {code(123)}).to.throw(TypeError)
			expect(function () {code(true)}).to.throw(TypeError)
			expect(function () {code(false)}).to.throw(TypeError)
			expect(function () {code(Symbol('foobar'))}).to.throw(TypeError)
			expect(function () {code('foobar')}).to.throw(TypeError)
			expect(function () {code({})}).to.not.throw()
			expect(function () {code([])}).to.not.throw()
			expect(function () {code(function () {})}).to.not.throw()
			expect(function () {code(new String('foobar'))}).to.not.throw()
		})
		it('should only allow one sandbox to be running at a time', function () {
			var code = compiler('foo()')
			expect(code({foo: function () {return 2}})).to.equal(2)
			expect(function () {code({foo: code})}).to.throw(Error)
			expect(function () {code({foo: compiler('2 + 3')})}).to.throw(Error)
			expect(code({foo: function () {return 4}})).to.equal(4)
		})
		it('should evaluate basic expressions', function () {
			expect(compiler('2 + 3')({})).to.equal(5)
			expect(compiler('(2 + 10) / 3')({})).to.equal(4)
			expect(compiler('~~2.2;')({})).to.equal(2)
			expect(compiler('"foo" + 2')({})).to.equal('foo2')
			expect(compiler('+"bar"')({})).to.deep.equal(NaN)
			expect(compiler('1, 2, 3, null')({})).to.deep.equal(null)
			expect(compiler('-23 / 0')({})).to.equal(-Infinity)
			expect(compiler('"" + [1, 2, "foo"]')({})).to.equal('1,2,foo')
			expect(compiler('{foo: "bar"}.foo')({})).to.equal('bar')
			expect(compiler('Symbol()')({Symbol})).to.be.a('symbol')
		})
		it('should only be allowed to return primitive values', function () {
			expect(function () {compiler('{foo: 1, bar: 2}')({})}).to.throw(TypeError)
			expect(function () {compiler('[1, 2, 3]')({})}).to.throw(TypeError)
			expect(function () {compiler('function () {}')({})}).to.throw(TypeError)
		})
		it('should recognize correct object identities', function () {
			var obj = {}
			obj.foo = {bar: obj}
			expect(2..constructor === Number).to.be.true
			expect(compiler('2..constructor === Number')({Number})).to.be.true
			expect(compiler('2..constructor.constructor === Function')({Function})).to.be.true
			expect(compiler('this().constructor === this')(Symbol)).to.be.true
			expect(compiler('this === foo.bar')(obj)).to.be.true
		})
		it('should be agnostic to which context object is given', function () {
			var code = compiler('a + b')
			expect(code({a: 2, b: 50})).to.equal(52)
			expect(code({a: 'foo', b: 'bar'})).to.equal('foobar')
			expect(code({})).to.deep.equal(NaN)
		})
	})
})

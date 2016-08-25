var expect = require('chai').expect
var compiler = require('../.')


describe('.equals()', function () {
	it('should be necessary for certain equality tests', function () {
		var obj = {}
		function equals(a) {
			return a === obj
		}
		expect(compiler('equals(obj)')({obj, equals})).to.be.false
	})
	it('should fix certain equality tests', function () {
		var obj = {}
		function equals(a) {
			return compiler.equals(a, obj)
		}
		expect(compiler('equals(obj)')({obj, equals})).to.be.true
	})
	it('should otherwise follow normal equality rules', function () {
		expect(compiler.equals(NaN, NaN)).to.be.false
		expect(compiler.equals({}, {})).to.be.false
		expect(compiler.equals(1, 2)).to.be.false
		expect(compiler.equals(1, 1)).to.be.true
		var obj = {}
		expect(compiler.equals(obj, obj)).to.be.true
		function equals(a) {
			return compiler.equals(a, obj)
		}
		expect(compiler('equals(obj)')({obj: {}, equals})).to.be.false
		
	})
})

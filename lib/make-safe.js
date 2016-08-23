'use strict'

module.exports = function (replaceWithProxy) {
	var proxies = []
	function makeSafe(object) {
		var reachable = Object.getOwnPropertyNames(object)
			.concat(Object.getOwnPropertySymbols(object))
		
		if (object === Function.prototype) {
			reachable = reachable.filter(ignoredKeys)
		}
		
		reachable.forEach(function (key) {
			replaceWithProxy.call(object, key, proxies)
		})
		Object.freeze(object)
	}
	
	function ignoredKeys(key) {
		return key !== 'caller' && key !== 'arguments'
	}
	
	// Freeze prototypes of literals and primitives.
	// This should include any value that you can get from JavaScript syntax itself.
	// For example:
	//     "my string".foobar
	//     try {throw 1} catch (err) {err.foobar}
	// Symbols are included here because they are not protected by our proxying
	// because they are primitives.
	makeSafe(Boolean.prototype)
	makeSafe(Number.prototype)
	makeSafe(String.prototype)
	makeSafe(Symbol.prototype)
	makeSafe(Function.prototype)
	makeSafe(Object.prototype)
	makeSafe(Array.prototype)
	makeSafe(RegExp.prototype)
	makeSafe(Error.prototype)
	makeSafe(EvalError.prototype)
	makeSafe(RangeError.prototype)
	makeSafe(ReferenceError.prototype)
	makeSafe(SyntaxError.prototype)
	makeSafe(TypeError.prototype)
	makeSafe(URIError.prototype)
	makeSafe(Promise.prototype)
}

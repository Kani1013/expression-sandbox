'use strict'

module.exports = function (unsafeObjects, isObject, getProxy, GLOBAL) {
	var proxies = []
	var safeObjects = []
	var returnsSafeValues = [
		Function.prototype[Symbol.hasInstance]
	]
	var globalKeys = Object.getOwnPropertyNames(GLOBAL).filter(function (key) {return key !== 'root' && key !== 'GLOBAL' && key !== 'global' && key !== 'window' && key !== 'self'})
	var globalValues = globalKeys.map(function (key) {return this[key]}, GLOBAL)
	
	while (unsafeObjects.length) {
		makeSafe(unsafeObjects.shift())
	}
	
	function makeSafe(object) {
		if (isSafe(object)) {
			return
		}
		
		var reachable = Object.getOwnPropertyNames(object)
			.concat(Object.getOwnPropertySymbols(object))
		
		if (object === Function.prototype) {
			reachable = reachable.filter(ignoredKeys)
		}
		
		reachable.forEach(replaceWithProxy, object)
		Object.freeze(object)
		safeObjects.push(object)
		
		unsafeObjects.push(Object.getPrototypeOf(object))
	}
	
	function ignoredKeys(key) {
		return key !== 'caller' && key !== 'arguments'
	}
	
	function isSafe(value) {
		return !isObject(value) || proxies.indexOf(value) >= 0 || safeObjects.indexOf(value) >= 0
	}
	
	function replaceWithProxy(key) {
		var d = Object.getOwnPropertyDescriptor(this, key)
		if (!('value' in d)) {
			if (key === '__proto__' && isSafe(this[key])) {
				return
			}
			if (!d.configurable) {
				d.get && unsafeObjects.push(d.get)
				d.set && unsafeObjects.push(d.set)
				// This getter/setter could potentially return a non-proxied object
				console.warn('Potentially vulnerable getter/setter at %s in %s', key, this)
				return
			}
			var getter = d.get && getProxy(d.get, true)
			var setter = d.set && getProxy(d.set, true)
			Object.defineProperty(this, key, {
				get: getter,
				set: setter,
				enumerable: d.enumerable,
				configurable: false
			})
			getter && proxies.push(getter)
			setter && proxies.push(setter)
			return
		}
		
		var value = this[key]
		if (isSafe(value)) {
			return
		}
		
		if (d.writable) {
			var proxy = getProxy(value, true)
			proxies.push(this[key] = proxy)
			replaceInGlobal(value, proxy)
			return
		}
		
		if (d.configurable) {
			var proxy = getProxy(value, true)
			Object.defineProperty(this, key, {
				value: proxy,
				writable: false,
				enumerable: d.enumerable,
				configurable: false
			})
			replaceInGlobal(value, proxy)
			proxies.push(proxy)
			return
		}
		
		unsafeObjects.push(value)
		if (typeof value === 'function' && returnsSafeValues.indexOf(value) === -1) {
			// This function could potentially return a non-proxied object
			console.warn('Potentially vulnerable function at %s in %s', key, this)
		}
	}
	
	function replaceInGlobal(value, proxy) {
		var index = globalValues.indexOf(value)
		if (index >= 0) {
			var key = globalKeys[index]
			var d = Object.getOwnPropertyDescriptor(GLOBAL, key)
			if (d.writable) {
				GLOBAL[key] = proxy
			} else if (d.configurable) {
				Object.defineProperty(GLOBAL, key, {
					value: proxy,
					writable: false,
					enumerable: d.enumerable,
					configurable: false
				})
			} else {
				console.warn('Was not able to replace %s in global object', key)
			}
		}
	}
	
	return safeObjects
}

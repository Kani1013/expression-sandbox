module.exports = function (src) {
	return function (sandbox) {
		with (sandbox) {
			return (function () {
				'use strict'
				return eval(src)
			}).call(this)
		}
	}
}

// =============================================================================
// Plugin	: throttle Event
// Author	: Remy Sharp - http://remysharp.com/2010/07/21/throttling-function-calls/
// =============================================================================

var Throttle = function(fn, thresh, scope) {
	var threshhold = thresh || (thresh = 250),
		last,
		deferTimer;

	return function () {
		var context = scope || this,
			now = +new Date(),
			args = arguments;

		if (last && now < last + threshhold) {
			clearTimeout(deferTimer);
			deferTimer = setTimeout(function () {
				last = now;
				fn.apply(context, args);
			}, threshhold);
		} else {
			last = now;
			fn.apply(context, args);
		}
	};
};

module.exports = Throttle;
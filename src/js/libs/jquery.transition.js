/* global jQuery */

/*
*	Plugin		: $.transition, $.redraw
* 	Resource	: https://github.com/twbs/bootstrap/blob/master/js/transition.js, http://blog.alexmaccaw.com/css-transitions
* 	Author		: Adrien Lo
*	Description	: Add functionality to do jquery css animation and callback.
*				  Redraw forces the browsers so when you apply css properties it sequences the events if you apply them at once.
**/

// function Transition(element, props) {
// 	var pfx = ["webkit", "moz", "MS", "o", ""];

// 	// 'AnimationStart'
// 	// 'AnimationIteration'
// 	// 'AnimationEnd'

// 	this.transitionEnd();
// }

// Transition.prototype.prefixedEvent = function(element, type, callback) {
// 	for (var p = 0; p < this.pfx.length; p++) {
// 		if (!this.pfx[p]) type = type.toLowerCase();
// 		element.addEventListener(this.pfx[p]+type, callback);
// 	}
// };

// Transition.prototype.transitionIn = function() {

// };

// Transition.prototype.transitionEnd = function() {

// };

// var t = new Transition();

// module.exports = Transition;


;(function($) {
	'use strict';
	var defaults = {
		duration: 500,
		easing: '',
		delay: 0
	},
	elm,
	transitionNames = {
		WebkitTransition : 'webkitTransition',
		MozTransition    : 'transition',
		OTransition      : 'oTransition otransition',
		transition       : 'transition'
	},
	transEndEventNames = {
		WebkitTransition : 'webkitTransitionEnd',
		MozTransition    : 'transitionend',
		OTransition      : 'oTransitionEnd otransitionend',
		transition       : 'transitionend'
	};

	$(function() {
		elm = document.querySelector('div');
	});

	function transition() {
		for (var name in transitionNames) {
			if (elm.style[name] !== undefined) {
				return transitionNames[name];
			}
		}

		return false;
	}

	function transitionEnd() {
		for (var name in transEndEventNames) {
			if (elm.style[name] !== undefined) {
				return transEndEventNames[name];
			}
		}

		return false;
	}

	$.fn.transition = function (properties, options) {
		var $el = this,
			transEnd = transitionEnd();
		options = $.extend({}, defaults, options);
		properties[transition()] = 'all ' + options.duration + 'ms ' + options.easing;
		setTimeout(function() {
			if(transEnd) {
				$el
					.redraw()
					.one(transitionEnd(), options.complete)
					.emulateTransitionEnd(options.duration + 50)
					.css(properties);
			} else {
				$el.css(properties);
				options.complete.call(this);
			}
		}, options.delay);
		return this;
	};

	$.fn.emulateTransitionEnd = function(duration) {
		var called = false, $el = this;
		$(this).one(transitionEnd(), function() { called = true; });
		var callback = function() { if (!called) $($el).trigger('webkitTransitionEnd'); };
		setTimeout(callback, duration);
		return this;
	};

	$.fn.redraw = function() {
		var redraw;
		$(this).each(function() {
			redraw = this.offsetHeight;
		});

		return this;
	};
})(jQuery);
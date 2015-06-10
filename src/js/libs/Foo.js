;(function(module) {
	var Foo = function() {
		var foo = ['Go!!!', 'Seahawks!!!', 'Go!!!', 'Sonics!!!'];
		foo.forEach(i => {
			console.log(i);
		});
	};
	module.exports = Foo;
})(module);
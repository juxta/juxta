(function($){
	$.class = function(template, data) {
		function create(){
			if (this.init) {
				this.init.apply(this, arguments);
			}
		}
		return create;
	};
})(jQuery);

Juxta = $.class();
Juxta.prototype = {
	init: function(){
		if (location.hash == '') {
			location.hash = 'databases';
		}
		this.state = 'default';
		setInterval(this.checkLocation, 200);
	},
	checkLocation: function(){
		var hash = location.hash.replace(/#/g, '');
		params = hash.split('/');
		action = params.pop();
		if (hash != Juxta.state) {
			switch (action) {
				case 'databases':
					console.log('Databases');
					break;
				case 'processlist':
					console.log('Processlist');
					break;
			}
			Juxta.state = hash;
		}
	}
};

/* 
 * Simple JavaScript Inheritance
 * 
 * By John Resig http://ejohn.org/
 * MIT Licensed.
 * 
 * Modified
 * by Alexey Golovnya http://alexeygolovnya.ru/
 * 
 */

(function($){
	var initializing = false, fnTest = /xyz/.test(function(){xyz;}) ? /\b_super\b/ : /.*/;
  
	$.Class = function(){
		
		base = typeof arguments[0] == 'function' ? arguments[0] : function(){};
		prop = arguments[typeof arguments[0] == 'function' || arguments[1] ? 1 : 0];
		
		var _super = base.prototype;
		if (!_super.init)
			_super.init = function(){};
		
		initializing = true;
		var prototype = new base();
		initializing = false;

		for (var name in prop){
			
			if (prototype[name])
				prototype['_' + name] = prototype[name]

			prototype[name] =
				typeof prop[name] == "function" && typeof _super[name] == "function" && fnTest.test(prop[name]) ?
				(function(name, fn){
					return function(){
						var tmp = this._super;
						this._super = _super[name];
						var ret = fn.apply(this, arguments);        
						this._super = tmp;
						
						return ret;
					};
				})(name, prop[name]) :
				prop[name];
		}
    
		function Class(){
			if (!initializing && this.init)
				this.init.apply(this, arguments);
		}

		Class.prototype = prototype;
		Class.constructor = Class;
		Class.extend = arguments.callee;

		return Class;
	};
})(jQuery);

/*
 * Juxta 0.1 http://juxta.ru
 * 
 * Copyright (c) 2010 Alexey Golovnya
 * Licensed under the MIT license
 * 
 */

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
		this.sidebar = new Juxta.Sidebar();
		this.sidebar.path({'connection': '127.0.0.1'});
		
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
					Juxta.sidebar.highlight('databases');
					break;
				case 'processlist':
					Juxta.sidebar.highlight('processlist');
					break;
				case 'privileges':
					Juxta.sidebar.highlight('privileges');
					break;
				case 'server-status':
					Juxta.sidebar.highlight('server-status');
					break;
				case 'backup':
					Juxta.sidebar.highlight('backup');
					break;
				case 'restore':
					Juxta.sidebar.highlight('restore');
					break;
					
				case 'tables':
					Juxta.sidebar.path({'database': params[0]});
					Juxta.sidebar.highlight('tables');
					break;
				case 'views':
					Juxta.sidebar.path({'database': params[0]});
					Juxta.sidebar.highlight('views');
					break;
				case 'routines':
					Juxta.sidebar.path({'database': params[0]});
					Juxta.sidebar.highlight('routines');
					break;
				case 'triggers':
					Juxta.sidebar.path({'database': params[0]});
					Juxta.sidebar.highlight('triggers');
					break;
					
				case 'columns':
					Juxta.sidebar.path({'database': params[0], 'table': params[1]});
					Juxta.sidebar.highlight('columns');
					break;
				case 'foreign':
					Juxta.sidebar.path({'database': params[0], 'table': params[1]});
					Juxta.sidebar.highlight('foreign');
					break;
				case 'options':
					Juxta.sidebar.path({'database': params[0], 'table': params[1]});
					Juxta.sidebar.highlight('options');
					break;
				case 'maintance':
					Juxta.sidebar.path({'database': params[0], 'table': params[1]});
					Juxta.sidebar.highlight('maintance');
					break;
			}
			Juxta.state = hash;
		}
	}
};

Juxta.Sidebar = $.class();
Juxta.Sidebar.prototype = {
	tree: {},
	init: function(){
		this.sidebar = $('#sidebar');
		this.heads = this.sidebar.find('ul:first-child > li');
		this.values = {
			'connection': this.sidebar.find('li.connection span.value'),
			'database': this.sidebar.find('li.database span.value'),
			'table': this.sidebar.find('li.table span.value'),
		}
		
		self = this;
		this.sidebar.find('.buttons li').each(function(){
			$(this).html('<span>' + $(this).html() + '</span>')
				.find('a').each(function(){
					$(this).addClass($(this).attr('href').replace(/#/g, ''))
				});
			self.tree[this.className] = $(this).parent().parent().attr('class');
		});
		
		this.sidebar.find('ul:first-child > li h2').click(function(event){
			if ($(this).parent('li').is('.closed')) {
				$(this).parent('li').removeClass('closed');
			} else {
				$(this).parent('li').addClass('closed');
			}
			
		});
	},
	highlight: function(link, options){
		if (!options){
			options = {};
		}
		if (this.tree[link]) {
			var level = this.sidebar.find('ul:first-child > li.' + this.tree[link]);
			if (level.is('.connection')) {
				this.heads.filter('.connection').removeClass('closed').show();
				this.heads.not('.connection').hide();
			} else if(level.is('.database')){
				this.heads.filter('.connection').addClass('closed').show();
				this.heads.filter('.database').removeClass('closed').show();
				this.heads.filter('.table').hide();
			} else if(level.is('.table')){
				this.heads.filter('.connection').addClass('closed').show();
				this.heads.filter('.database').addClass('closed').show();
				this.heads.filter('.table').removeClass('closed').show();
			}
		}
		this.sidebar.find('.buttons li').removeClass('active');
		this.sidebar.find('li.' + link).addClass('active');
		
		if (this.sidebar.find('ul:first-child').css('display') == 'none') {
			 this.sidebar.find('ul:first-child').slideDown();
		}
	},
	path: function(path){
		self = this;
		$.extend(self.path, path)
		$.each(self.values, function(item){
			$(this).text(self.path[item])
		});
		this.repairLinks();
	},
	repairLinks: function(){
		self = this;
		$('#sidebar').find('li.database a').each(function(){
			this.href = '#' + self.path.database + '/' + this.className;
		});
		$('#sidebar').find('li.table a').each(function(){
			this.href = '#' + self.path.database + '/' + self.path.table + '/' + this.className;
		});
	}
};

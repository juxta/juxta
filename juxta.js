/*
 * Juxta 0.1 http://juxta.ru
 * 
 * Copyright (c) 2010 Alexey Golovnya
 * Licensed under the MIT license
 * 
 */

(function($){
	$.template = function(template, data){
		return template.replace(/\{([\w\.]*)\}/g, function (str, key){
			var keys = key.split("."), value = data[keys.shift()];
			$.each(keys, function () { value = value[this]; });
			return (value === null || value === undefined) ? "" : value;
		});
	};
})(jQuery);

jQuery.aop.before(
	{target: jQuery.fn, method: "hide"},
	function(){
		this.trigger("hide");
	}
);

Juxta = $.class();
Juxta.prototype = {
	init: function(){
		this.notification = new Juxta.Notification();
		this.sidebar = new Juxta.Sidebar();
		this.sidebar.path({'connection': '127.0.0.1'});
		
		this.explorer = new Juxta.Explorer();
		this.exchange = new Juxta.BackupRestore();
		this.browser = new Juxta.Browser('#data-browser');
		this.tableEditor = new Juxta.TableEditor('#table-editor');
		this.dummy = new Juxta.Dummy('#dummy');
		
		this.login = new Juxta.Login('#login');
		this.codeEditor = new Juxta.Editor($('#edit-routine'));
		
		$('.float-box').draggable({scroll: false, handle: 'h3'});
		
		if (location.hash == ''){
			location.hash = 'databases';
		}
		this.state = 'default';
		setInterval(this.checkLocation, 200);
		
		$(window).click(function(event){
			$('.context:visible').hide();
		});
	},
	checkLocation: function(){
		var hash = location.hash.replace(/#/g, '');
		params = hash.split('/');
		action = params.pop();
		if (hash != Juxta.state){
			switch (action){
				case 'databases':
					Juxta.sidebar.highlight('databases');
					Juxta.explorer.show({title: 'Databases', toolbar: {'Create database': "$('#create-database').show(); return false;"} });
					Juxta.explore({show: 'databases'});
					break;
				case 'processlist':
					Juxta.sidebar.highlight('processlist');
					Juxta.explorer.show({title: 'Processlist'});
					Juxta.explore({show: 'processlist'});
					break;
				case 'privileges':
					Juxta.sidebar.highlight('privileges');
					Juxta.dummy.show({header: 'Privileges'});
					break;
				case 'server-status':
					Juxta.sidebar.highlight('server-status');
					Juxta.dummy.show({header: 'Server status'});
					break;
				case 'backup':
					Juxta.sidebar.highlight('backup');
					Juxta.exchange.show({title: 'Backup', toolbar: {'Options': null} });
					break;
				case 'restore':
					Juxta.sidebar.highlight('restore');
					Juxta.dummy.show({header: 'Restore'});
					break;
				case 'logout':
					Juxta.login.show();
					break;
					
				case 'tables':
					Juxta.sidebar.path({'database': params[0]});
					Juxta.sidebar.highlight('tables');
					Juxta.explorer.show({title: 'Tables', from: params[0]});
					Juxta.explore({show: 'tables', from: params[0]});
					break;
				case 'views':
					Juxta.sidebar.path({'database': params[0]});
					Juxta.sidebar.highlight('views');
					Juxta.explorer.show({title: 'Views', from: params[0]});
					Juxta.explore({show: 'views', from: params[0]});
					break;
				case 'routines':
					Juxta.sidebar.path({'database': params[0]});
					Juxta.sidebar.highlight('routines');
					Juxta.explorer.show({title: 'Procedures & Functions', from: params[0]});
					Juxta.explore({show: 'routines', from: params[0]});
					break;
				case 'triggers':
					Juxta.sidebar.path({'database': params[0]});
					Juxta.sidebar.highlight('triggers');
					Juxta.explorer.show({title: 'Triggers', from: params[0]});
					Juxta.explore({show: 'triggers', from: params[0]});
					break;

				case 'browse':
					Juxta.sidebar.path({'database': params[0], 'table': params[1]});
					Juxta.browse({browse: params[1], from: params[0]});
					break;
				case 'columns':
					Juxta.sidebar.path({'database': params[0], 'table': params[1]});
					Juxta.sidebar.highlight('columns');
					Juxta.edit({table: params[1], from: params[0]});
					break;
				case 'foreign':
					Juxta.sidebar.path({'database': params[0], 'table': params[1]});
					Juxta.sidebar.highlight('foreign');
					Juxta.dummy.show();
					break;
				case 'options':
					Juxta.sidebar.path({'database': params[0], 'table': params[1]});
					Juxta.sidebar.highlight('options');
					Juxta.dummy.show({header: 'Options'});
					break;
				case 'maintenance':
					Juxta.sidebar.path({'database': params[0], 'table': params[1]});
					Juxta.sidebar.highlight('maintenance');
					Juxta.dummy.show({header: {title: 'Maintenance table', name: params[1]}});
					break;
			}
			Juxta.state = hash;
		}
	},
	hide: function(){
		$('#header, #sidebar, #applications').hide();
	},
	explore: function(params){
		this.explorer.request(params);
	},
	browse: function(params){
		this.browser.show();
	},
	edit: function(params){
		if (params){
			if (params.table) {
				this.tableEditor.show();
			} else if (params.view){
				this.codeEditor.edit('View ' + params.view + ' from ' + params.from);
				this.codeEditor.show({title: 'Edit view', name: params.view});
			} else if (params.routine){
				this.codeEditor.edit('Routine' + params.routine + ' from ' + params.from);
				this.codeEditor.show();
			} else if (params.trigger){
				this.codeEditor.edit('Trigger ' + params.trigger + ' from ' + params.from);
				this.codeEditor.show();
			}
		}
	},
	notify: function(message, options){
		this.notification.show(message, options);
	}
};

Juxta.Notification = $.class();
Juxta.Notification.prototype = {
	init: function(){
		this.container = $('#notify');
	},
	settings: {
		delayTime: 3000,
		hideSpeed: 300
	},
	show: function(message, options){
		var self = this;
		options = $.extend({}, self.settings, options);
		return $('<li><span>' + message + '</span></li>').
			appendTo(this.container.find('ul')).
			delay(options.delayTime).
			slideUp(options.hideSpeed).
			find('span').addClass(options.type);
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
		
		var self = this;
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
		if (this.tree[link]){
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
		
		if (this.sidebar.find('ul:first-child').css('display') == 'none'){
			 this.sidebar.find('ul:first-child').slideDown();
		}
	},
	path: function(path){
		var self = this;
		$.extend(self.path, path)
		$.each(self.values, function(item){
			$(this).text(self.path[item])
		});
		this.repairLinks();
	},
	repairLinks: function(){
		var self = this;
		$('#sidebar').find('li.database a').each(function(){
			this.href = '#' + self.path.database + '/' + this.className;
		});
		$('#sidebar').find('li.table a').each(function(){
			this.href = '#' + self.path.database + '/' + self.path.table + '/' + this.className;
		});
	}
};

Juxta.Explorer = $.class();
Juxta.Explorer.prototype = {
	init: function(){
		this.container = $('#explorer');
		$(window).resize(this.stretch);
		this.grid = new Juxta.Grid('#explorer .grid');
		this.statusBar = this.container.find('.status');
	},
	show: function(options){
		if (!this.container.is(':visible')){
			$('#applications .application').hide();
			this.container.show();
			this.stretch();
		}
		if (options && options.title){
			this.container.find('h1').html(
				options.title + 
				(options.from ? ' <span class="from">from <a>' + options.from + '</a></span>' : '')
			);
		}
		if (options && options.closable){
			this.container.find('div.close').show();
		} else{
			this.container.find('div.close').hide();
		}
		if (options && options.toolbar){
			this.toolbar(options.toolbar);
		} else{
			this.toolbar();
		}
	},
	hide: function(){
		this.container.hide();
	},
	stretch: function(){
		$('#explorer:visible .grid .body').height($('#applications').height() - $('#explorer .grid div.body').get(0).offsetTop - $('#explorer .status').get(0).offsetHeight - 24);
	},
	toolbar: function(tools){
		var toolbar = this.container.find('.tools');
		toolbar.empty();
		if (tools) {
			jQuery.each(tools, function(title, action){
				toolbar.append('<a href="#" onclick="' + action + '">' + title + '</a>');
			});
		}
	},
	request: function(params){
		if (params.show == 'databases') {
			response = ExplorerTestResponses.databases;
		} else if (params.show == 'processlist'){
			response = ExplorerTestResponses.processlist;
		} else if (params.show == 'tables'){
			response = ExplorerTestResponses.tables[params.from];
			if (!response) {
				response = ExplorerTestResponses.tables['notfound'];
			}
		} else if (params.show == 'views'){
			response = ExplorerTestResponses.views[params.from];
			if (!response) {
				response = ExplorerTestResponses.views['notfound'];
			}
		} else if (params.show == 'routines'){
			response = ExplorerTestResponses.routines[params.from];
			if (!response) {
				response = ExplorerTestResponses.routines['notfound'];
			}
		} else if (params.show == 'triggers'){
			response = ExplorerTestResponses.triggers[params.from];
			if (!response) {
				response = ExplorerTestResponses.triggers['notfound'];
			}
		}
		this.response(response);
	},
	response: function(data){
		this.grid.fill(data);
	},
	status: function(text){
		this.statusBar.text(text);
	}
};

Juxta.Grid = $.class();
Juxta.Grid.prototype = {
	statistics: {
		item: 'item',
		items: 'items',
		cardinality: 0,
		selected: 0
	},
	init: function(grid){
		this.container = $(grid);
		this.body = this.container.find('.body table');
		this.head = this.container.find('.head');
		this.actions = this.container.find('.actions');
		
		var self = this;
		this.body.change(function(event){
			if ($(event.target).is('[type=checkbox]')){
				$('.context:visible').hide();
				if ($(event.target).is('[type=checkbox]:checked')){
					// Highlight link
					$(event.target).parent().next('td').find('a').addClass('checked');
					// Check parent row if its child  selected all
					if ($(event.target).parents('tr.content').find('[type=checkbox]').length > 0 &&
						$(event.target).parents('tr.content').find('[type=checkbox]').length == $(event.target).parents('tr.content').find('[type=checkbox]:checked').length)
					{
						$(event.target).parents('tr.content').prev('tr')
							.find('[type=checkbox]').attr('checked', true)
							.parents('tr').find('a').addClass('checked');
					}
					// Check child rows
					$(event.target).parents('tr').next('tr.content')
						.find('[type=checkbox]').attr('checked', true)
						.parents('tr').find('a').addClass('checked');
				} else{
					// Unhighlight link
					$(event.target).parent().next('td').find('a').removeClass('checked');
					// Uncheck parent row if its child slected none
					if ($(event.target).parents('tr.content').find('[type=checkbox]').length > 0 &&
						$(event.target).parents('tr.content').find('[type=checkbox]:checked').length == 0)
					{
						$(event.target).parents('tr.content').prev('tr')
							.find('[type=checkbox]').attr('checked', false)
							.parents('tr').find('a').removeClass('checked');
					}
					// Uncheck child rows
					$(event.target).parents('tr').next('tr.content')
						.find('[type=checkbox]').attr('checked', false)
						.parents('tr').find('a').removeClass('checked');
				}
			}
			self.statistics.selected = self.body.find('tr:not(tr tr):not(.content)').find('[type=checkbox]:checked').length;
			Juxta.explorer.status(
				(self.statistics.cardinality > 1 ? $.template('{cardinality} {items}', self.statistics) : '') + 
				(self.statistics.selected > 0 ? $.template(', {selected} selected', self.statistics) : '') 
			);
			
			if (self.statistics.cardinality == self.statistics.selected){
				self.actions.find('.all').addClass('active');
				self.actions.find('.nothing').removeClass('active');
			} else if(self.statistics.selected == 0){
				self.actions.find('.all').removeClass('active');
				self.actions.find('.nothing').addClass('active');
			} else{
				self.actions.find('.all').removeClass('active');
				self.actions.find('.nothing').removeClass('active');
			}
			
			if (self.statistics.selected < 1) {
				self.actions.find('input[type=button]').attr('disabled', true);
			} else{
				self.actions.find('input[type=button]').attr('disabled', false);
			}
		});

		this.body.find('td.expand, td.collapse').live('click', function(){
			// Temporary
			$target = $(event.target);
			if (!$target.parents('tr').next('tr.content').get(0)){
				$target.parents('tr').after('<tr class="content"><td colspan="99"><table cellspacing="0"><tr><td class="check"><input type="checkbox" /></td><td class="table"><a>test_1</a></td><td></td></tr><tr><td class="check"><input type="checkbox" /></td><td class="table"><a>test_2</a></td><td></td></tr></table></td></tr>');
			}
			//
			if ($target.hasClass('expand')){
				$target.removeClass('expand').addClass('collapse');
				$target.parents('tr').next('.content').show();
				if ($target.parents('tr').find('[type=checkbox]').is(':checked')){
					$target.parents('tr').next('tr.content').find('[type=checkbox]')
						.attr('checked', true)
						.parents('tr').find('a').addClass('checked');
				}
			} else{
				$target.removeClass('collapse').addClass('expand');
				$target.parents('tr').next('.content').hide();
			}
			
			$('.context:visible').hide();
			return false;
		});
		
		this.container.find('.actions .all').live('click', function(){
			self.select('all')
			return false
		});
		
		this.container.find('.actions .nothing').live('click', function(){
			self.select();
			return false;
		});
		
		this.contextMenu = {
			menu: this.container.find('.context'),
			page: this.body,
			target: null,
			value: null,
		};
		
		this.container.find('.context').bind('hide', self.contextMenu, function(event){
			contextMenu = event.data;
			
			contextMenu.target.find('td:nth-child(2)').find('a').removeClass('checked');
			
			contextMenu.target = null;
			contextMenu.value = null;
		})
		
		this.body.bind('contextmenu', self.contextMenu, function(event){
			contextMenu = event.data;
			
			if (!contextMenu.menu.find('ul').is(':empty')){
				contextMenu.menu.show().offset({top: event.clientY, left: event.clientX});
			
				contextMenu.page.find('a.checked').removeClass('checked');
				contextMenu.page.find('[type=checkbox]:checked').removeAttr('checked');
				contextMenu.target = $(event.target).parents('tr');
				contextMenu.target.find('td:nth-child(2)').find('a').addClass('checked');
			
				contextMenu.value = contextMenu.target.find('td:nth-child(2)').find('a').text();
			
				contextMenu.page.trigger('change');
			
				return false;
			}
		});
	},
	fill: function(data){
		
		if ($.isArray(data.context[0])){
			this.statistics.item = data.context[0][0];
			this.statistics.items = data.context[0][1];
		} else{
			this.statistics.item = data.context[0];
			this.statistics.items = 'items';
		}
		
		var self = this;
		if (data['head']){
			this.head.empty();
			this.statistics.cardinality = 0;
			this.body.trigger('change');
			$.each(data['head'], function(i, value){
				self.head.append('<li class="' + i + '">' + value + '</li>');
			});
		}
		
		if (data && data.data){
			this.body.empty();
			this.statistics.cardinality = data.data.length;
			
			// Rewrite
			var template = data['data-template'];
			jQuery.each(data.data, function(i, value) {
				var v = {};
				jQuery.each(data.context, function(ii, vvalue){
					if (data.context.length == 1){
						if ($.isArray(vvalue)) {
							v[vvalue[0]] = value;
						} else{
							v[vvalue] = value;
						}					
					} else{
						if ($.isArray(vvalue)){
							v[vvalue[0]] = value[ii];
						} else{
							v[vvalue] = value[ii];
						}
					}
				});
				$.extend(v, data['with-data']);
				self.body.append($.template(template, v));
			});
			this.body.trigger('change');
			
			this.container.find('.context ul').html(data.contextMenu);
		} else {
			this.body.empty();
		}
	},
	select: function(all){
		if (all){
			$('.context:visible').hide();
			this.body.find('input[type=checkbox]').attr('checked', 'checked').parent().next('td').find('a').addClass('checked');
		} else{
			this.body.find('input[type=checkbox]').removeAttr('checked', '');
			this.body.find('a.checked').removeClass('checked');
		}
		this.body.trigger('change')
	},
	selected: function(){
		return this.body.find('input[type=checkbox]:checked').map(function(){ return $(this).attr('name') });
	}
};

Juxta.BackupRestore = $.class();
Juxta.BackupRestore.prototype = {
	init: function(){
		this.container = $('#backup-restore');
		$(window).resize(this.stretch);
		this.grid = new Juxta.Grid('#backup-restore .grid');
	},
	show: function(options){
		
		if (!this.container.is(':visible')){
			$('#applications .application').hide();
			this.container.show();
			this.stretch();
		}
		if (options && options.title){
			this.container.find('h1').html(
				options.title + 
				(options.from ? ' <span class="from">from <a>' + options.from+ '</a></span>' : '')
			);
		}
		if (options && options.closable){
			this.container.find('div.close').show();
		} else{
			this.container.find('div.close').hide();
		}
		if (options && options.toolbar){
			this.toolbar(options.toolbar);
		} else{
			this.toolbar();
		}
		
		response = {
			'head': {
				'database': 'Items for backup'
			},
			'data-template': '<tr><td class="expand"></td><td class="check"><input type="checkbox"></td><td class="database"><a>{database}</a></td></tr>',
			'context': ['database'],
			'data': ExplorerTestResponses.databases.data,
		};
		
		this.grid.fill(response);
	},
	hide: function(){
		this.container.hide();
	},
	stretch: function(){
		$('#backup-restore:visible .grid .body').height($('#applications').height() - $('#backup-restore .grid div.body').get(0).offsetTop - $('#backup-restore .status').get(0).offsetHeight - 24);
	},
	toolbar: function(tools){
		var toolbar = this.container.find('.tools');
		toolbar.empty();
		if (tools) {
			jQuery.each(tools, function(title, action){
				toolbar.append('<a href="#" onclick="' + action + '">' + title + '</a>');
			});
		}
	}
};

Juxta.CodeEditor = $.class();
Juxta.CodeEditor.prototype = {
	init: function(textarea, options){
		this.textarea = $(textarea);
		this.numbers = this.textarea.before('<ul class="line-numbers"><li>1</li></ul>').prev('ul');
		this.lines = 1;
		
		var self = this;
		this.numbers.css('height', this.textarea.attr('clientHeight'));
		this.textarea.resize(function(){	// Resize line numbers container on text area resize
			self.numbers.css('height', this.clientHeight);
		}).scroll(function(){	// Scroll line numbers with text area
			self.numbers.find('li:first-child').css({'margin-top': -this.scrollTop + 'px'});
		});
		
		this.textarea.keydown(function(event){
			if (event.which == 13) {	// Scroll to the left when new line starts
				this.scrollLeft = 0; 
			} else if (event.keyCode == 9 && !event.shiftKey && !event.altKey) {
				var start = this.selectionStart;
				var end = this.selectionEnd;

				this.value = this.value.substring(0,start) + "\t" + this.value.substring(end, this.value.length);

				this.selectionStart = start+1;
				this.selectionEnd = start+1;
				
				return false;
			}
			
		});
		
		var textAreaHeight = this.textarea.attr('clientHeight');
		
		// Calculating line numbers
		var t = setInterval(function(){
			rows = self.textarea.attr('value').replace(/\r\n/g, '\n').replace(/\n\r/g, '\n').split('\n').length;
			if (rows != self.lines) {
				if (rows > self.lines) {
					for (row = self.lines + 1; row <= rows; row++){
						self.numbers.append('<li>' + row + '</li>');
						self.lines++;
					}
				} else if (rows < self.lines) {
					self.numbers.find('li').slice(rows - self.lines).remove();
					self.lines = rows;
				}
			}
			
			if (self.textarea.attr('clientHeight') != textAreaHeight) {
				self.textarea.trigger('resize');
				textAreaHeight = self.textarea.attr('clientHeight');
			}
		}, 100);
	},
	edit: function(text){
		this.textarea.text(text);
	}
};

Juxta.FloatBox = $.class({
	settings: {
		title: 'New window',
		closable: true
	},
	init: function(element, options){
		var _this = this;
		this.settings = $.extend({}, _this.settings, options);
		
		this.$floatBox = $(element);
		this.$head = this.$floatBox.find('h3').is('h3') ? this.$floatBox.find('h3') : this.$floatBox.prepend('<h3>'+ this.settings.title + '</h3>').find('h3'); 
		this.$terminator = this.$floatBox.find('input[type=button].close').is('input') ? this.$floatBox.find('input[type=button].close') : $('<input type="button" class="close"/>').insertAfter(this.$head);
		
		this.$floatBox.draggable({scroll: false, handle: 'h3'});
		
		var body = {
			height: $(document.body).height(),
			width: $(document.body).width()
		};
		this.$floatBox.css({
			left: (body.width - this.$floatBox.width())/2,
			top:  parseInt(0.75*(body.height - this.$floatBox.height())/2)
		});

		this.$terminator.click(function(){ _this.hide(); });
	},
	show: function(options){
		_this = this;
		options = $.extend({}, _this.settings, options);
		
		this.$head.html(
			options.title +
			(options.name ? ' <a>' + options.name + '</a>' : '') +
			(options.from ? ' <span class="from">from <a>' + options.from + '</a></span>' : '')
		);
		
		this.$floatBox.show();
	},
	hide: function(){
		this.$floatBox.hide();
	}
});

Juxta.Login = $.class(Juxta.FloatBox, {
	init: function(element){
		this._super(element, {title: 'Connect to MySQL Server', closable: false});
		
		this.$floatBox.find('.buttons input[value=Connect]').click(function(){
			alert('Connect');
		});
	},
	show: function(){
		Juxta.hide();
		this._show();
	}
});

Juxta.Editor = $.class(Juxta.FloatBox, {
	init: function(element){
		this._super(element, {title: 'Edit'});
		this.editor = new Juxta.CodeEditor(this.$floatBox.find('textarea'));
	},
	edit: function(text){
		this.editor.edit(text);
	}
});

Juxta.Application = $.class({
	settings: {
		closable: false,
		maximized: false
	},
	init: function(element, options){
		this.settings = $.extend({}, this.settings, options);
		
		this.$application = $(element);
		this.$menu = this.$application.find('.tools');
		
		this.tune(this.settings);
		
		if (this.settings.closable){
			this.$application.find('.close').show();
			this.$application.find('.close').click(function(){ history.back(); });
		} else{
			this.$application.find('.close').hide();
		}
	},
	tune: function(options){
		if ($.isPlainObject(options.header)){
			this.$application.find('h1').html(
				options.header.title + 
				(options.header.name ? ' <a>' + options.header.name + '</a>' : '') +
				(options.header.from ? ' <span class="from">from <a>' + options.header.from + '</a></span>' : '')
			);
		} else{
			this.$application.find('h1').html(options.header);
		}
		this.menu(options.menu);
	},
	show: function(options){
		options = $.extend({}, this.settings, options);
		this.tune(options);
		
		if (!this.$application.is(':visible')){
			$('#applications .application').hide();
			this.$application.show();
		}
		
		if (this.settings.maximized) {
			this.maximize();
		} else{
			this.restore();
		}
		
		return this;
	},
	hide: function(){
		this.$application.hide();
		return this;
	},
	menu: function(menu){
		this.$menu.empty();
		var _this = this;
		if ($.isPlainObject(menu)) {
			jQuery.each(menu, function(title, action){
				_this.$menu.append('<a href="#" onclick="' + action + '">' + title + '</a>');
			});
		}
		return this;
	},
	maximize: function(){
		$('#applications').addClass('maximized');
		return this;
	},
	restore: function(){
		$('#applications').removeClass('maximized');
		return this;
	}
});

Juxta.Browser = $.class(Juxta.Application, {
	init: function(element){
		this._super(element, {header: 'Browse', closable: true, maximized: true});
	}
});

Juxta.TableEditor = $.class(Juxta.Application, {
	init: function(element){
		this._super(element, {closable: false, mazimized: false, menu: {'Browse table' : "alert('Browse');"}});
	}
});


Juxta.Dummy = $.class(Juxta.Application, {
	init: function(element){
		this._super(element, {header: 'Don\'t work'});
	}
});

var ExplorerTestResponses = {
	databases: {
		'head': {
			'database': 'Database'
		},
		'data-template': '<tr><td class="check"><input type="checkbox" name="{database}"></td><td class="database"><a href="#{database}/tables">{database}</a></td></tr>',
		'context': [['database', 'databases']],
		'data': ['information_schema', 'mysql', 'sampdb', 'test'],
		'contextMenu': '<li>Tables</li><li class="drop">Drop</li><li>Properties</li>'
	},
	processlist: {
		'head': {
			'process': 'Process Id',
			'process-user': 'User',
			'process-database': 'Database',
			'process-command': 'Command',
			'process-time': 'Time'
		},
		'data-template': '<tr><td class="check"><input type="checkbox" name="{process}"></td><td class="process"><a>{process}</td><td class="process-user">{user}</td><td class="process-database">{ondatabase}</td><td class="process-command">{command}</td><td class="process-time">{time}</td><td></td></tr>',
		'context': [['process', 'processes'], 'user', 'ondatabase', 'command', 'time'],
		'data': [
			[101, 'avg@192.168.200.1', 'sampdb', 'Sleep', 5],
			[102, 'root@localhost', '', 'Query', 0]
		],
		'contextMenu': '<li>Information</li><li>Kill</li>'
	},
	tables: {
		notfound: {
			'head': {
				'table': 'Table',
				'table-engine': 'Engine',
				'table-rows': 'Rows',
				'table-size': 'Size',
				'table-update-date': 'Update',
			},
			'data-template': '<tr><td class="check"><input type="checkbox" name="{table}"></td><td class="table"><a href="#{database}/{table}/columns">{table}</a></td><td class="table-engine">{engine}</td><td class="table-rows">{rows}</td><td class="table-size">{size}</td><td class="table-update-date">{updateDate}</td><td></td></tr>',
			'context': [['table', 'tables'], 'engine', 'rows', 'size', 'updateDate'],
			'data': null,
			'contextMenu': '<li>Columns & Indices</li><li>Browse</li><li class="drop">Drop</li><li>Properties</li>'
		},
		sampdb: {
			'head': {
				'table': 'Table',
				'table-engine': 'Engine',
				'table-rows': 'Rows',
				'table-size': 'Size',
				'table-update-date': 'Update',
			},
			'data-template': '<tr><td class="check"><input type="checkbox" name="{table}"></td><td class="table"><a href="#{database}/{table}/columns">{table}</a></td><td class="table-engine">{engine}</td><td class="table-rows">{rows}</td><td class="table-size">{size}</td><td class="table-update-date">{updateDate}</td><td></td></tr>',
			'context': [['table', 'tables'], 'engine', 'rows', 'size', 'updateDate'],
			'data': [
				['absence', 'InnoDB', 6, '1 K', '9:22'],
				['federated_student', 'FEDERATED', 0, '0', '9:35'],
				['grade_event', 'InnoDB', 6, '1 K', '18.12.2009 9:53'],
				['member', 'MyISAM', 102, '14 K', '18.01.2010 9:11'],
				['picture', 'MyISAM', 209, '197', '30.05.2010 9:53'],
				['president', 'MyISAM', 42, '3 K', '25.05.2010 12:33'],
				['score', 'InnoDB', 173, '2 K', '18.05.2010 7:56'],
				['student', 'InnoDB', 31, '1 K', '18.05.2010 7:56'],
			],
			'with-data': {'database': 'sampdb'},
			'contextMenu': '<li onclick="location.hash = \'sampdb/\' + Juxta.explorer.grid.contextMenu.value + \'/columns\'">Columns & Indices</li><li onclick="location.hash = \'sampdb/\' + Juxta.explorer.grid.contextMenu.value + \'/browse\'">Browse</li><li class="drop">Drop</li><li>Properties</li>'
		}
	},
	views: {
		notfound: {
			'head': {
				'view': 'View',
				'view-definer': 'Definer',
				'view-updatable': 'Updatable',
			},
			'data-template': '<tr><td class="check"><input type="checkbox" name="{view}"></td><td class="view"><a href="#{database}/{view}/browse">{view}</a></td><td class="view-definer">{definer}</td><td class="view-updatable"><span class="{updatable}">{updatable}</span></td><td></td></tr>',
			'context': [['view', 'views'], 'definer', 'updatable'],
			'data': null,
			'contextMenu': '<li>Browse</li><li>Edit</li><li class="drop">Delete</li><li>Properties</li>'
		},
		sampdb: {
			'head': {
				'view': 'View',
				'view-definer': 'Definer',
				'view-updatable': 'Updatable',
			},
			'data-template': '<tr><td class="check"><input type="checkbox" name="{view}"></td><td class="view"><a href="#{database}/{view}/browse">{view}</a></td><td class="view-definer">{definer}</td><td class="view-updatable"><span class="{updatable}">{updatable}</span></td><td></td></tr>',
			'context': [['view', 'views'], 'definer', 'updatable'],
			'data': [
				['my_students', 'avg@192.168.200.1', 'YES'],
				['selected_memebers', 'avg@129.168.200.1', 'NO'],
			],
			'with-data': {'database': 'sampdb'},
			'contextMenu': '<li>Browse</li><li onclick="Juxta.edit({view: Juxta.explorer.grid.contextMenu.value, from: \'sampdb\'})">Edit</li><li class="drop">Delete</li><li>Properties</li>'
		}
	},
	routines: {
		notfound: {
			'head': {
				'routine': 'Routine',
				'routine-definer': 'Definer',
				'routine-return': 'Returns'
			},
			'data-template': '<tr><td class="check"><input type="checkbox" name="{routine}"></td><td class="routine"><a>{routine}</a></td><td class="routine-definer">{definer}</td><td class="routine-retunr">{return}</td></tr>',
			'context': ['routine', 'definer', 'return'],
			'data': null,
			'contextMenu': '<li>Edit</li><li class="drop">Delete</li><li>Properties</li>'
		},
		sampdb: {
			'head': {
				'routine': 'Routine',
				'routine-definer': 'Definer',
				'routine-return': 'Returns'
			},
			'data-template': '<tr><td class="check"><input type="checkbox" name="{routine}"></td><td class="routine"><a>{routine}</a></td><td class="routine-definer">{definer}</td><td class="routine-retunr">{return}</td></tr>',
			'context': ['routine', 'definer', 'return'],
			'data': [
				['first', 'avg@192.168.200.1', '&ndash;'],
				['second', 'avg@192.168.200.1', 'VARCHAR'],
			],
			'with-data': {'database': 'sampbd'},
			'contextMenu': '<li>Edit</li><li class="drop">Delete</li><li>Properties</li>'
		}
	},
	triggers: {
		notfound: {
			'head': {
				'trigger': 'Trigger',
				'trigger-table': 'Table',
				'trigger-event': 'Event',
				'trigger-definer': 'Definer',
			},
			'data-template': '<tr><td class="check"><input type="checkbox" name="{trigger}"></td><td class="trigger"><a>{trigger}</a></td><td class="trigger-table">{table}</td><td class="trigger-event"><span>{timing}</span>&nbsp;<span>{event}</span></td><td class="trigger-definer">{definer}</td></tr>',
			'context': [['trigger', 'triggers'], 'table', 'event', 'timing', 'definer', 'size'],
			'data': null,
			'contextMenu': '<li>Edit</li><li class="drop">Delete</li><li>Properties</li>'
		},
		sampdb: {
			'head': {
				'trigger': 'Trigger',
				'trigger-table': 'Table',
				'trigger-event': 'Event',
				'trigger-definer': 'Definer',
			},
			'data-template': '<tr><td class="check"><input type="checkbox" name="{trigger}"></td><td class="trigger"><a>{trigger}</a></td><td class="trigger-table">{table}</td><td class="trigger-event"><span>{timing}</span>&nbsp;<span>{event}</span></td><td class="trigger-definer">{definer}</td></tr>',
			'context': [['trigger', 'triggers'], 'table', 'event', 'timing', 'definer', 'size'],
			'data': [
				['ins_sum', 'score', 'INSERT', 'BEFORE', 'avg@192.168.200.1'],
				['ins_avg', 'score', 'INSERT', 'BEFORE', 'avg@192.168.200.1'],
				['delete_rows', 'student', 'DELETE', 'AFTER', 'root@localhost'],
			],
			'with-data': {'database': ''},
			'contextMenu': '<li onclick="Juxta.edit({trigger: Juxta.explorer.grid.contextMenu.value, from: \'sampdb\'})">Edit</li><li class="drop">Delete</li><li>Properties</li>'
		}
	}
};

/*
 * Juxta 0.0.1 http://juxta.ru
 * 
 * Copyright (c) 2010-2011 Alexey Golovnya
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

Juxta = $.Class();
Juxta.prototype = {
	init: function(){
		this.notification = new Juxta.Notification();
		this.sidebar = new Juxta.Sidebar();
		this.sidebar.path({'connection': '127.0.0.1'});

		this.explorer = new Juxta.Explorer('#explorer');
		this.exchange = new Juxta.BackupRestore('#backup-restore');
		this.browser = new Juxta.Browser('#data-browser');
		this.tableEditor = new Juxta.TableEditor('#table-editor');
		this.dummy = new Juxta.Dummy('#dummy');
		this.serverInfo = new Juxta.ServerInformation('#server-info');

		this.auth = new Juxta.Auth('#login');
		this.codeEditor = new Juxta.Editor($('#edit-routine'));

		$.ajaxSetup(this.ajaxSetup);

		if (location.hash == ''){
			location.hash = 'databases';
		}
		this.state = 'default';
		setInterval(this.checkLocation, 200);

		$('.float-box').draggable({scroll: false, handle: 'h3'});
		$(window).click(function(event){
			$('.context:visible').hide();
		});
	},
	/*	Ajax options
	 */
	ajaxSetup: {
		url: 'juxta.php',
		dataType: 'json',
		type: 'POST',
		beforeSend: function(){
			Juxta.loading();
		},
		complete: function(){
			Juxta.loading(false);
		},
		error: function(xhr, status){
			if (status == 'parsererror'){
				Juxta.error('Answer parsing error');
			} else {
				Juxta.error(xhr.status + ' ' + xhr.statusText);
			}
		}
	},
	/*	Common Ajax request/response interface
	 */
	request: function(params) {
		var queryString = params.action;
		if (queryString && $.isPlainObject(queryString) && !$.isEmptyObject(queryString)) {
			params.url = this.ajaxSetup.url + '?' + $.param(queryString);
		} else if (queryString) {
			params.url = params.url = this.ajaxSetup.url + '?' + queryString;
		}
		$.ajax(params);
	},
	response: function(response, bind) {
		switch (response.status) {
			case 'ok':
				$.isFunction(bind) && bind(response);
				break;
			case 'session-not-found':
				document.location.hash = '#login';
				break;
			case 'error':
				Juxta.error(response.error);
				break;
			case 'connect_error':
				Juxta.error(response.error);
				Juxta.auth.show();
				break;
			default:
				Juxta.error('Fuck..');
		}
	},
	//
	checkLocation: function(){
		var hash = location.hash.replace(/#/g, '');
		params = hash.split('/');
		action = params.pop();
		if (hash != Juxta.state){
			switch (action){
				case 'databases':
					Juxta.sidebar.highlight('databases');
					Juxta.explorer.show({header: 'Databases', menu: {'Create database': {href: '#databases/create', click: "Juxta.explorer.createDatabase.show(); return false;"}}});
					Juxta.explore({show: 'databases'});
					break;
				case 'processlist':
					Juxta.sidebar.highlight('processlist');
					Juxta.explorer.show({header: 'Processlist', menu: {'Refresh': {href: '#processlist', click: 'return false;'}}});
					Juxta.explore({show: 'processlist'});
					break;
				case 'users':
					Juxta.sidebar.highlight('users');
					Juxta.explorer.show({header: 'Users', menu: {'Add a user': {href: '#users/add', click: 'Juxta.explorer.createUser.show(); return false;'}, 'Flush privileges': {href: '#users/flush', click: 'return false;'}}});
					Juxta.explore({show: 'users'});
					break;
				case 'status':
				case 'status-full':
					Juxta.sidebar.highlight('status');
					Juxta.serverInfo.show({header: 'Server status'});
					Juxta.info({show: action});
					break;
				case 'variables':
					Juxta.sidebar.highlight('status');
					Juxta.serverInfo.show({header: 'System variables', menu: {'Server status': '#status', 'System variables': null, 'Charsets': '#charsets', 'Engines': '#engines'}});
					Juxta.info({show: 'variables'});
					break;
				case 'charsets':
					Juxta.sidebar.highlight('status');
					Juxta.serverInfo.show({header: 'Charsets', menu: {'Server status': '#status', 'System variables': '#variables', 'Charsets': null, 'Engines': '#engines'}});
					Juxta.info({show: 'charsets'});
					break;
				case 'engines':
					Juxta.sidebar.highlight('status');
					Juxta.serverInfo.show({header: 'Engines', menu: {'Server status': '#status', 'System variables': '#variables', 'Charsets': '#charsets', 'Engines': null}});
					Juxta.info({show: 'engines'});
					break;
				case 'backup':
					Juxta.sidebar.highlight('backup');
					Juxta.exchange.show();
					break;
				case 'restore':
					Juxta.sidebar.highlight('restore');
					Juxta.dummy.show({header: 'Restore'});
					break;
				case 'login':
					Juxta.auth.show();
					break;
					
				case 'tables':
					Juxta.sidebar.path({'database': params[0]});
					Juxta.sidebar.highlight('tables');
					Juxta.explorer.show({header: {title: 'Tables', from: params[0]}, menu: {'Create table': {click: 'return false;'}}});
					Juxta.explore({show: 'tables', from: params[0]});
					break;
				case 'views':
					Juxta.sidebar.path({'database': params[0]});
					Juxta.sidebar.highlight('views');
					Juxta.explorer.show({header: {title: 'Views', from: params[0]}, menu: {'Create view': {click: 'return false;'}}});
					Juxta.explore({show: 'views', from: params[0]});
					break;
				case 'routines':
					Juxta.sidebar.path({'database': params[0]});
					Juxta.sidebar.highlight('routines');
					Juxta.explorer.show({header: {title: 'Procedures & Functions', from: params[0]}});
					Juxta.explore({show: 'routines', from: params[0]});
					break;
				case 'triggers':
					Juxta.sidebar.path({'database': params[0]});
					Juxta.sidebar.highlight('triggers');
					Juxta.explorer.show({header: {title: 'Triggers', from: params[0]}, menu: {'Create trigger': {click: 'return false;'}}});
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
				default:
					document.location = '#databases';
			}
			Juxta.state = hash;
		}
	},
	show: function() {
		$('.float-box').hide();
		$('#sidebar:visible ul:first-child').slideDown(250);
		if ($('#applications').not(':visible')){
			$('#applications').fadeIn(250);
			$('#header h1, #header ul').fadeIn(250);
		}
	},
	hide: function(){
		$('#header h1, #header ul, #sidebar ul:first-child, #applications').hide();
	},
	explore: function(params){
		this.explorer.request(params);
	},
	info: function(params){
		this.serverInfo.request(params);
	},
	browse: function(params){
		this.browser.show();
	},
	edit: function(params){
		if (params){
			if (params.table) {
				this.tableEditor.show({header: {title: 'Table', name: params.table}});
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
	},
	loading: function(message, options){
		this.notification.loading(message, options);
	},
	error: function(message, options){
		options = $.extend({}, {type: 'error', hide: false}, options);
		this.notification.show(message, options);
	}
};

Juxta.Notification = $.Class();
Juxta.Notification.prototype = {
	init: function(){
		this.container = $('#notify ul');
	},
	settings: {
		hide: true,
		delay: 3000,
		hideSpeed: 300,
	},
	loadingSettings: {
		hide: false,
		delay: 250,
		hideSpeed: 100,
		type: 'loading'
	},
	load: null,
	loads: 0,
	show: function(message, options){
		var self = this;
		options = $.extend({}, self.settings, options);
		if (options.element){
			var notify = options.element;
		} else {
			var notify = $('<li><span></span></li>').appendTo(this.container);
		}
		notify.show().find('span').text(message);
		if (options.hide){
			this.hide(notify, options);
		}
		notify.find('span').addClass(options.type);
		return notify;
	},
	hide: function(element, options){
		element.delay(options.delay).slideUp(options.hideSpeed, function(){ $(this).remove(); });
		this.load = null;
	},
	loading: function(message, options){
		var self = this;
		options = $.extend({}, self.loadingSettings, options);
		if (message === false){
			if (--this.loads == 0) {
				this.hide(this.load, options);
			}
		} else {
			if (this.loads++ == 0) {
				this.container.empty();
				message = message || 'Loading..'; 
				if (this.load){
					options.element = this.load;
				}
				this.load = this.show(message, options);
			}
		}
	}
};

Juxta.Sidebar = $.Class();
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
	},
	path: function(path){
		var self = this;
		$.extend(self.path, path);
		$.each(self.values, function(item){
			$(this).text(self.path[item]);
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

Juxta.Application = $.Class({
	settings: {
		closable: false,
		maximized: false
	},
	init: function(element, options){
		this.settings = $.extend({}, this.settings, options);
		
		this.$application = $(element);
		this.$menu = this.$application.find('.menu');
		this.$statusBar = this.$application.find('.status');
		
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
		if (!options) {
			Juxta.show();
		} else {
			options = $.extend({}, this.settings, options);
			this.tune(options);
		}
		
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
				if ($.isPlainObject(action)){
					_this.$menu.append('<a href="' + (action.href ? action.href : '') + (action.click ? '" onclick="' + action.click + '"' : '"') + '>' + title + '</a>');
				} else if (action){
					_this.$menu.append('<a href="' + action + '">' + title + '</a>');
				} else{
					_this.$menu.append('<a>' + title + '</a>');
				}
			});
		}
		return this;
	},
	maximize: function(){
		$('#sidebar').hide();
		$('#applications').addClass('maximized');
		return this;
	},
	restore: function(){
		$('#applications').removeClass('maximized');
		$('#sidebar').show();
		return this;
	},
	status: function(text){
		this.$statusBar.text(text);
	}
});

Juxta.Explorer = $.Class(Juxta.Application, {
	init: function(element){
		this._super(element);
		this.grid = new Juxta.Grid('#explorer .grid');
		
		$(window).bind('resize', {_this: this}, this.stretch);
		
		this.createDatabase = new Juxta.CreateDatabase($('#create-database'));
		this.createUser = new Juxta.CreateUser($('#create-user'));
	},
	show: function(options){
		this._show(options);
		this.stretch();
	},
	stretch: function(event){
		var _this = event && event.data._this || this;
		if (_this.$application.is(':visible')){
			_this.grid.height($('#applications').height() - _this.$application.find('.grid .body').position().top - _this.$statusBar.height() - 24);
		}
	},
	request: function(action, data) {
		if (this.prepare(action.show)) {
			Juxta.request({action: action, data: data, context: this, success: function (xhr) { Juxta.response(xhr, $.proxy(this.response, this)); } });
		} else {
			Juxta.error('Request error');
		}
	},
	response: function(data) {
		this.show();
		if (this.preparedFor == data.contents) {
			$.extend(data, this.templates[data.contents]);
			this.grid.fill(data);
		}
	},
	prepare: function(template) {
		if (this.grid.prepare(this.templates[template])) {
			this.preparedFor = template;
			return true;
		} else {
			return false;
		}
	},
	templates: {
		databases: {
			'head': {
				'database': 'Database'
			},
			'data-template': '<tr><td class="check"><input type="checkbox" name="{database}"></td><td class="database"><a href="#{database}/tables">{database}</a></td></tr>',
			'context': [['database', 'databases']],
			'contextMenu': '<li onclick="location.hash = Juxta.explorer.grid.contextMenu.value + \'/tables\'">Tables</li><li class="drop">Drop</li><li>Properties</li>'
		},
		processlist: {
			'head': {
				'process': 'Process Id',
				'process-user': 'User',
				'process-database': 'Database',
				'process-command': 'Command',
				'process-time': 'Time'
			},
			'data-template': '<tr><td class="check"><input type="checkbox" name="{process}"></td><td class="process"><a>{process}</td><td class="process-user">{user}@{host}</td><td class="process-database">{ondatabase}</td><td class="process-command">{command}</td><td class="process-time">{time}</td><td></td></tr>',
			'context': [['process', 'processes'], 'user', 'host', 'ondatabase', 'command', 'time'],
			'contextMenu': '<li>Information</li><li>Kill</li>'
		},
		users: {
			'head': {
				'user': 'Username',
				'user-host': 'Host',
				'user-password': 'Password',
				'user-global-privileges': 'Gloval privileges',
				'user-grant': 'Grant'
			},
			'data-template': '<tr><td class="check"><input type="checkbox" name="{user}"></td><td class="user"><a>{user}</td><td class="user-host">{host}</td><td class="user-password"><span class="{password}">{password}</span></td><td class="user-global-privileges">{privileges}</td><td class="user-grant">{grant}</td></tr>',
			'context': [['user', 'users'], 'host', 'password', 'privileges', 'grant'],
			'contextMenu': '<li>Edit Privileges</li><li>Change Password</li><li>Rename</li><li>Delete</li>'
		},
		tables: {
			'head': {
				'table': 'Table',
				'table-engine': 'Engine',
				'table-rows': 'Rows',
				'table-size': 'Size',
				'table-update-date': 'Update',
			},
			'data-template': '<tr><td class="check"><input type="checkbox" name="{table}"></td><td class="table"><span class="overflowed"><a href="#{database}/{table}/columns">{table}</a></span></td><td class="table-engine">{engine}</td><td class="table-rows">{rows}</td><td class="table-size">{size}</td><td class="table-update-date">{updateDate}</td></tr>',
			'context': [['table', 'tables'], 'engine', 'rows', 'size', 'updateDate'],
			'contextMenu': '<li onclick="location.hash = \'{database}/\' + Juxta.explorer.grid.contextMenu.value + \'/columns\'">Columns & Indexes</li><li onclick="location.hash = \'{database}/\' + Juxta.explorer.grid.contextMenu.value + \'/browse\'">Browse</li><li class="drop">Drop</li><li>Properties</li>'
		},
		views: {
			'head': {
				'view': 'View',
				'view-definer': 'Definer',
				'view-updatable': 'Updatable',
			},
			'data-template': '<tr><td class="check"><input type="checkbox" name="{view}"></td><td class="view"><a href="#{database}/{view}/browse">{view}</a></td><td class="view-definer">{definer}</td><td class="view-updatable"><span class="{updatable}">{updatable}</span></td></tr>',
			'context': [['view', 'views'], 'definer', 'updatable'],
			'contextMenu': '<li>Browse</li><li onclick="Juxta.edit({view: Juxta.explorer.grid.contextMenu.value, from: \'sampdb\'})">Edit</li><li class="drop">Delete</li><li>Properties</li>'
		},
		routines: {
			'head': {
				'routine': 'Routine',
				'routine-definer': 'Definer',
				'routine-return': 'Returns'
			},
			'data-template': '<tr><td class="check"><input type="checkbox" name="{routine}"></td><td class="routine"><a>{routine}</a></td><td class="routine-definer">{definer}</td><td class="routine-retunr">{return}</td></tr>',
			'context': ['routine', 'definer', 'return'],
			'contextMenu': '<li>Edit</li><li class="drop">Delete</li><li>Properties</li>'
		},
		triggers: {
			'head': {
				'trigger': 'Trigger',
				'trigger-table': 'Table',
				'trigger-event': 'Event',
				'trigger-definer': 'Definer',
			},
			'data-template': '<tr><td class="check"><input type="checkbox" name="{trigger}"></td><td class="trigger"><a>{trigger}</a></td><td class="trigger-table">{table}</td><td class="trigger-event"><span>{timing}</span>&nbsp;<span>{event}</span></td><td class="trigger-definer">{definer}</td></tr>',
			'context': [['trigger', 'triggers'], 'table', 'event', 'timing', 'definer', 'size'],
			'contextMenu': '<li onclick="Juxta.edit({trigger: Juxta.explorer.grid.contextMenu.value, from: \'sampdb\'})">Edit</li><li class="drop">Delete</li><li>Properties</li>'
		}
	}
});

Juxta.Grid = $.Class();
Juxta.Grid.prototype = {
	statistics: {
		item: 'item',
		items: 'items',
		cardinality: 0,
		selected: 0
	},
	init: function(grid){
		this.container = $(grid);
		this.$bodyContainer = this.container.find('.body');
		this.body = this.$bodyContainer.find('table');
		this.$notFound = this.$bodyContainer.find('.not-found')
		this.head = this.container.find('.head');
		this.actions = this.container.find('.actions');
		this.$context = this.container.find('.context');
		
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
			
			if (self.statistics.cardinality > 0 && self.statistics.cardinality == self.statistics.selected){
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

		this.body.find('td.expand, td.collapse').live('click', function(event){
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
		
		if (this.$context.is('.context')) {
			this.contextMenu = {
				menu: this.container.find('.context'),
				page: this.body,
				target: null,
				value: null,
			};
		}
		
		if (self.contextMenu){
			this.$context.bind('hide', self.contextMenu, function(event){
				contextMenu = event.data;
				contextMenu.target.find('td:nth-child(2)').find('a').removeClass('checked');
				
				contextMenu.target = null;
				contextMenu.value = null;
			});
			
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
		}

	},
	height: function(height){
		if (height){
			this.$notFound.css('top', height / 2 - 14 + 'px');
		}
		return this.$bodyContainer.height(height);
	},
	prepare: function(template) {
		if (template) {
			var self = this;
			
			// Empty grid header and body
			if (template['head']) {
				this.empty();
				this.head.empty().show();
				this.$bodyContainer.show();
				this.container.find('.proper').hide();
			} else {
				this.empty();
				this.head.empty().hide();
				this.$bodyContainer.hide();
			}
			
			// Make grid header
			if (template['head']) {
				this.head.empty();
				$.each(template['head'], function(i, value){
					self.head.append('<li class="' + i + '">' + value + '</li>');
				});
			}

			// Define context for status bar
			if ($.isArray(template.context[0])) {
				this.statistics.item = template.context[0][0];
				this.statistics.items = template.context[0][1];
			} else{
				this.statistics.item = template.context[0];
				this.statistics.items = 'items';
			}

			//
			this.statistics.cardinality = 0;
			this.body.trigger('change');
			return true;
		} else {
			return false;
		}
	},
	fill: function(data){
		var self = this;
		
		this.empty();
		if (data && data.data && (data.data.length > 0 || $.isPlainObject(data.data))){
			this.statistics.cardinality = data.data.length;
			
			var template = data['data-template'];
			jQuery.each(data.data, function(i, value){
				if ($.isPlainObject(data.data)) {
					value = [i, value];
				}
				var forTemplate = {};
				jQuery.each(data.context, function(j, valueName){
					if (data.context.length == 1){
						if ($.isArray(valueName)) {
							forTemplate[valueName[0]] = value;
						} else{
							forTemplate[valueName] = value;
						}					
					} else{
						if ($.isArray(valueName)){
							forTemplate[valueName[0]] = value[j];
						} else{
							forTemplate[valueName] = value[j];
						}
					}
				});
				$.extend(forTemplate, {database: data['from']});
				self.body.append($.template(template, forTemplate));
			});
			this.body.trigger('change');
			
			
			// Make context menu
			if (data.contextMenu) {
				this.container.find('.context ul').html($.template(data.contextMenu, {database: data['from']}));
			}
		} else {
			this.$notFound.css('top', this.container.find('.body').height() / 2 - 14 + 'px').show();
		}
	},
	empty: function() {
		this.body.empty();
		this.$notFound.hide();
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

Juxta.ServerInformation = $.Class(Juxta.Application, {
	init: function(element){
		this._super(element, {header: 'Server status', menu: {'Server status': null, 'System variables': {href: '#variables'}, 'Charsets': '#charsets', 'Engines': '#engines'}})
		this.grid = new Juxta.Grid(this.$application.find('.grid'));
		
		$(window).bind('resize', {_this: this}, this.stretch);
		
		var _this = this;
		this.$application.find('.switch').click(function(event){
			if (!$(event.target).hasClass('active')){
				$(this).find('.active').removeClass('active');
				$(event.target).addClass('active');
			}
		});
		this.$application.find('.switch li').eq(0).click(function(){
			if (!$(this).hasClass('active')){
				_this.request({show: 'status-full'});
			}
		});
		this.$application.find('.switch li').eq(1).click(function(){
			if (!$(this).hasClass('active')){
				_this.request({show: 'status'});
			}
		});
		
	},
	stretch: function(event){
		var _this = event && event.data._this || this;
		if (_this.$application.find('.grid .body').is(':visible')){
			_this.$application.find('.grid .body').height($('#applications').height() - _this.$application.find('.grid .body').position().top - _this.$statusBar.height() - 24);
		} else if(_this.$application.find('.proper').is(':visible')){
			$('#server-info .proper').height($('#applications').height() - $('#server-info .proper').get(0).offsetTop - 32);
		}
	},
	show: function(options){
		this._show(options);
		this.stretch();
	},
	request: function(params) {
		if (this.prepare(params.show)) {
			Juxta.request({data: params, context: this, success: function (xhr) { Juxta.response(xhr, $.proxy(this.response, this)); } });
		} else {
			Juxta.error('Request error');
		}
	},
	response: function(response) {
		if (response.contents == 'status') {
			this.properStatus(response.data);
		} else {
			$.extend(response, this.templates[response.contents]);
			this.grid.fill(response);
		}
		this.show();
	},
	prepare: function(template) {
		if (this.grid.prepare(this.templates[template])) {
			this.preparedFor = template;
			this.stretch();
			return true;
		} else {
			return false;
		}
	},
	properStatus: function(data) {
		this.$application.find('.proper.server-status [class^=value_]').each(function(){
			$(this).text(data[this.className.split(' ', 1)[0].substr(6)]);
		});
		this.$application.find('.proper.server-status').show();
	},
	templates: {
		status: {
			'context': ['variable', 'value']
		},
		'status-full': {
			'head': {
					'variable': 'Variable',
					'value': 'Value'
			},
			'data-template': '<tr><td class="variable"><span class="overflowed"><a>{variable}</a></span></td><td class="value">{value}</td></tr>',
			'context': ['variable', 'value']
		},
		variables: {
			'head': {
					'variable': 'Variable',
					'value': 'Value'
				},
			'data-template': '<tr><td class="variable"><span class="overflowed"><a>{variable}</a></span></td><td class="value">{value}</td></tr>',
			'context': ['variable', 'value']
		},
		charsets: {
			'head': {
					'charset': 'Charset',
					'charset-default-collation': 'Default collation',
					'charset-description': 'Description'
				},
			'data-template': '<tr><td class="charset"><a>{charset}</a></td><td class="charset-default-collation">{collation}</td><td class="charset-description">{description}</td></tr>',
			'context': ['charset', 'description', 'collation', 'maxlen']
		},
		engines: {
			'head': {
					'engine': 'Engine',
					'engine-support': 'Support',
					'engine-comment': 'Description'
				},
			'data-template': '<tr><td class="engine"><a>{engine}</a></td><td class="engine-support"><span class="{support}">{support}</span></td><td class="engine-comment">{comment}</td></tr>',
			'context': ['engine', 'support', 'comment']
		}
	}
});

Juxta.BackupRestore = $.Class(Juxta.Application, {
	init: function(element){
		this._super(element, {header: 'Backup', menu: {'Options': {href: '#backup/options', click: 'return false;'}}});
		this.grid = new Juxta.Grid(this.$application.find('.grid'));
		
		$(window).bind('resize', {_this: this}, this.stretch);
	},
	show: function(options){
		this._show(options);
		this.stretch();
		
		response = {
			'head': {
				'database': 'Items for backup'
			},
			'data-template': '<tr><td class="expand"></td><td class="check"><input type="checkbox"></td><td class="database"><a>{database}</a></td></tr>',
			'context': ['database'],
			'data': ['information_schema', 'mysql', 'sampdb', 'test'],
		};
		this.grid.fill(response);
	},
	stretch: function(event){
		var _this = event && event.data._this || this;
		if (_this.$application.is(':visible')){
			_this.$application.find('.grid .body').height($('#applications').height() - _this.$application.find('.grid .body').position().top - _this.$statusBar.height() - 24);
		}
	}
});

Juxta.CodeEditor = $.Class();
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

Juxta.FloatBox = $.Class({
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

Juxta.Auth = $.Class(Juxta.FloatBox, {
	connections: undefined,
	init: function(element) {
		this._super(element, {title: 'Connect to MySQL Server', closable: false});
		this.$form = this.$floatBox.find('form[name=login]');
		this.$password = this.$form.find('input[type=password]');
		this.$submit = this.$form.find('input[type=submit]');

		self = this;
		$('#header a[href=#logout]').click(function() {
			self.logout();
			return false;
		});
		this.$form.bind('submit', function() {
			self.$submit.focus();
			self.login();
			return false;
		});
	},
	show: function() {
		Juxta.hide();
		this.$submit.attr('disabled', false);
		this.$password.val(null);
		this._show();
		if (this.$form[0]['host'].value && this.$form[0]['user'].value) {
			this.$password.focus();
		} else if (this.$form[0]['host'].value) {
			this.$form[0]['user'].focus();
		} else {
			this.$form[0]['host'].focus();
		}
	},
	login : function() {
		this.$submit.attr('disabled', true);
		Juxta.request({
			action: 'login',
			data: this.$form.serialize(),
			context: this,
			success: function(xhr) {
				Juxta.response(xhr, $.proxy(this.loginResponse, this));
			}
		});
	},
	logout: function() {
		Juxta.request({action: 'logout', context: this,
			success: function() {
				document.location.hash = '#login';
			}
		});
	},
	loginResponse: function(response) {
		if (response.result == 'connected') {
			Juxta.state = null;
			document.location.hash = '#databases';
		} else {
			this.$submit.attr('disabled', false);
			this.$password.focus();
			Juxta.error(response.message);
		}
	}
});

Juxta.CreateDatabase = $.Class(Juxta.FloatBox, {
	init: function(element){
		this._super(element, {title: 'Create database'});
		
		var _this = this;
		this.$floatBox.find('.buttons input[value=Create]').click(function(){
			_this.hide();
			Juxta.notify('Database ' + _this.$floatBox.find('input[name=new-database-name]').attr('value') + ' created');
		});
	},
	show: function(options){
		this.$floatBox.find('input[type=text]').attr('value', null);
		this._show(options);
	}
});

Juxta.CreateUser = $.Class(Juxta.FloatBox, {
	init: function(element){
		this._super(element, {title: 'Add a User'});
		
		var _this = this;
		this.$floatBox.find('.buttons input[value=Create]').click(function(){
			_this.hide();
			Juxta.notify('User created');
		});
	},
	show: function(options){
		this.$floatBox.find('input[type=text]').attr('value', null);
		this._show(options);
	}
});

Juxta.Editor = $.Class(Juxta.FloatBox, {
	init: function(element){
		this._super(element, {title: 'Edit'});
		this.editor = new Juxta.CodeEditor(this.$floatBox.find('textarea'));
	},
	edit: function(text){
		this.editor.edit(text);
	}
});

Juxta.Browser = $.Class(Juxta.Application, {
	init: function(element){
		this._super(element, {header: 'Browse', closable: true, maximized: true});
	}
});

Juxta.TableEditor = $.Class(Juxta.Application, {
	init: function(element){
		this._super(element, {closable: false, mazimized: false, menu: {'Browse table' : {click: "alert('Browse'); return false;"}}});
		$(window).bind('resize', {_this: this}, this.stretch);
	},
	show: function(options){
		this._show(options);
		this.stretch();
	},
	stretch: function(event){
		var _this = event && event.data._this || this;
		if (_this.$application.is(':visible')){
			if ($('#applications').height() < 500){
				_this.$application.find('.grid.indexes .body').height(72);
			} else{
				_this.$application.find('.grid.indexes .body').height($('#applications').height() * 0.225);
			}
			_this.$application.find('.grid.columns .body').height($('#applications').height() - _this.$application.find('.grid.columns .body').position().top - _this.$statusBar.height() - 24 - _this.$application.find('.grid.indexes')[0].offsetHeight - 54 /* H2 height with margins */);
		}
	}
});

Juxta.Dummy = $.Class(Juxta.Application, {
	init: function(element){
		this._super(element, {header: 'Don\'t work'});
	}
});

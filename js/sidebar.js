Juxta.Sidebar = $.Class();
Juxta.Sidebar.prototype = {
	tree: {},
	init: function() {
		var self = this;
		this.$sidebar = $('#sidebar');
		this.heads = this.$sidebar.find('ul:first-child > li');
		this.values = {
			'host': this.$sidebar.find('li.host span.value'),
			'database': this.$sidebar.find('li.database span.value'),
			'table': this.$sidebar.find('li.table span.value'),
		}

		this.$sidebar.find('.buttons li').each(function() {
			$(this).html('<span>' + $(this).html() + '</span>')
				.find('a').each(function() {
					$(this).addClass($(this).attr('href').replace(/#/g, ''))
				});
			self.tree[this.className] = $(this).parent().parent().attr('class');
		});

		this.$sidebar.find('ul:first-child > li h2').click(function() {
			$head = $(this).parent('li');
			if ($head.is(':not(.fold):not(.last):visible')) {
				$head.addClass('fold').find('.buttons').slideUp(250);
				self.$sidebar.find('.last .buttons').slideDown('250');
			} else if ($head.is('.fold')) {
				self.$sidebar.find('ul:first-child > li:not(.fold):not(.last):visible').addClass('fold')
					.find('.buttons').slideUp(250);
				self.$sidebar.
					find('ul:first-child > li.last').
					find('.buttons').slideUp(250);
				$head.removeClass('fold').find('.buttons').slideDown(250);
			} else if ($head.is('.last') && $head.find('.buttons').not(':visible')) {
				$head.find('.buttons').slideDown(250);
				self.$sidebar.find('ul:first-child > li:not(.fold):not(.last):visible').addClass('fold')
					.find('.buttons').slideUp(250);
			}
		});
		// Restore on mouse out
		this.$sidebar.hover(
			function() {
				clearTimeout(this.timer);
			},
			function(event) {
				this.timer = setTimeout(function() { self.restore(); }, 2000);
			}
		);
	},
	// Expand last visible level, close previous
	restore: function() {
		this.$sidebar
			.find('ul:first-child > li:not(.fold):not(.last):visible').addClass('fold').find('.buttons').slideUp(250);
		this.$sidebar
			.find('.last .buttons').slideDown(250);
	},
	highlight: function(link, path) {
		clearTimeout(this.$sidebar.get(0).timer);

		if (path) {
			this.path(path);
		}

		if (this.tree[link]) {
			var level = this.$sidebar.find('ul:first-child > li.' + this.tree[link]);
			if (level.is('.host')) {
				this.heads.filter('.host').addClass('last').show().removeClass('fold').find('.buttons').show();
				this.heads.not('.host').removeClass('last').hide();
			} else if (level.is('.database')) {
				this.heads.filter('.host').removeClass('last').show().addClass('fold').find('.buttons').hide();
				this.heads.filter('.database').addClass('last').show().removeClass('fold').find('.buttons').show();
				this.heads.filter('.table').removeClass('last').hide();
			} else if (level.is('.table')) {
				this.heads.filter('.host').removeClass('last').show().addClass('fold').find('.buttons').hide();
				this.heads.filter('.database').removeClass('last').show().addClass('fold').find('.buttons').hide();
				this.heads.filter('.table').addClass('last').show().removeClass('fold').find('.buttons').show();
			}
		}
		this.$sidebar.find('.buttons li').removeClass('active');
		this.$sidebar.find('li.' + link).addClass('active');
	},
	path: function(path) {
		var self = this;
		$.extend(self.path, path);
		$.each(self.values, function(item) {
			$(this).text(self.path[item]);
		});
		this.repairLinks();
	},
	repairLinks: function() {
		var self = this;
		$('#sidebar').find('li.database a').each(function() {
			this.href = '#' + self.path.database + '/' + this.className;
		});
		$('#sidebar').find('li.table a').each(function() {
			this.href = '#' + self.path.database + '/' + self.path.table + '/' + this.className;
		});
	}
};

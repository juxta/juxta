Juxta.TreeGrid = $.Class(Juxta.Grid, {
	init: function(grid) {

		var that = this;

		this._init(grid);

		this.body.find('td.expand, td.collapse').live('click', function(event) {
			// Temporary
			var $target = $(event.target),
				$row = $target.parents('tr');
			if (!$target.parents('tr').next('tr.content').get(0)) {
				$target.parents('tr').after('<tr class="content"><td colspan="99"><table cellspacing="0"><tr><td class="check"><input type="checkbox" /></td><td class="table"><a>test_1</a></td><td></td></tr><tr><td class="check"><input type="checkbox" /></td><td class="table"><a>test_2</a></td><td></td></tr></table></td></tr>');
			}

			// Expand/collapse row
			if ($target.hasClass('expand')) {
				that.collapse($row);
			} else {
				that.expand($row);
			}

			$('.context:visible').hide();

			return false;
		});

		this.body.unbind('chage', this._selectRow);

		this.body.change(function(event) {
			if ($(event.target).is('[type=checkbox]')) {
				var $row = $(event.target).parent().parent();
				if ($(event.target).is('[type=checkbox]:checked')) {
					that.selectRow($row);
				} else{
					that.deselectRow($row);
				}
			}
		});

	},
	/**
	 * Expand row
	 * 
	 */
	expand: function(row) {
		var $row = $(row);

		$row.find('td.collapse').removeClass('collapse').addClass('expand');
		$row.next('.content').hide();
	},
	/**
	 * Collapse row
	 * 
	 */
	collapse: function(row) {
		var $row = $(row);

		$row.find('td.expand').removeClass('expand').addClass('collapse');
		$row.next('.content').show();
		if ($row.find('[type=checkbox]').is(':checked')) {
			$row.next('tr.content').find('[type=checkbox]')
				.attr('checked', true)
				.parents('tr').find('a').addClass('checked');
		}
	},
	/**
	 * Select row
	 * 
	 */
	selectRow: function(row) {
		var $row = $(row);

		// Check parent row if its child selected all
		if ($row.parents('tr.content').find('[type=checkbox]').length > 0 &&
			$row.parents('tr.content').find('[type=checkbox]').length === $row.parents('tr.content').find('[type=checkbox]:checked').length)
		{
			 $row.parents('tr.content').prev('tr')
				.find('[type=checkbox]').attr('checked', true)
				.parents('tr').find('a').addClass('checked');
		}

		// Check child rows
		$row.next('tr.content')
			.find('[type=checkbox]').attr('checked', true)
			.parents('tr').find('a').addClass('checked');
	},
	/**
	 * Deselect row
	 * 
	 */
	deselectRow: function(row) {
		var $row = $(row);

		// Uncheck parent row if its child slected none
		if ($row.parents('tr.content').find('[type=checkbox]').length > 0 &&
			$row.parents('tr.content').find('[type=checkbox]:checked').length == 0)
		{
			$row.parents('tr.content').prev('tr')
				.find('[type=checkbox]').attr('checked', false)
				.parents('tr').find('a').removeClass('checked');
		}

		// Uncheck child rows
		$row.next('tr.content')
			.find('[type=checkbox]').attr('checked', false)
			.parents('tr').find('a').removeClass('checked');
	}
});

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
	}
});

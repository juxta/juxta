/**
 * @class Grid with expande/collapse rows
 * @extends Juxta.Grid
 * @param {String|jQuery} Grid container
 */
Juxta.TreeGrid = function(grid) {

	Juxta.Grid.prototype.constructor.call(this, grid);

	var that = this;

	this.$body.find('td.expand, td.collapse').live('click', function(event) {
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

	this.$body
		.bind('all', function() { that.$body.find('td + td a').removeClass('partial'); })
		.bind('nothing', function() { that.$body.find('td + td a').removeClass('partial'); });

};

Juxta.Lib.extend(Juxta.TreeGrid, Juxta.Grid);


/**
 * Expand row
 * @param {jQuery} row
 */
Juxta.TreeGrid.prototype.expand = function(row) {
	var $row = $(row);

	$row.find('td.collapse').removeClass('collapse').addClass('expand');
	$row.next('.content').hide();
};


/**
 * Collapse row
 * @param {jQuery} row
 */
Juxta.TreeGrid.prototype.collapse = function(row) {
	var $row = $(row);

	$row.find('td.expand').removeClass('expand').addClass('collapse');
	$row.next('.content').show();
	if ($row.find('[type=checkbox]').is(':checked')) {
		$row.next('tr.content').find('[type=checkbox]')
			.attr('checked', true)
			.parents('tr').find('a').addClass('checked');
	}
};


/**
 * Select row
 * @param {jQuery} row
 */
Juxta.TreeGrid.prototype.selectRow = function(row) {
	//
	Juxta.Grid.prototype.selectRow.call(this, row);

	var $row = $(row),
		childs = $row.parents('tr.content').find('[type=checkbox]').length,
		childsChecked = $row.parents('tr.content').find('[type=checkbox]:checked').length;

	$row.find('a').removeClass('partial');

	// Check parent row if its child selected all
	if (childs > 0) {
		if (childs === childsChecked) {
			$row.parents('tr.content').prev('tr')
				.find('[type=checkbox]').attr('checked', true)
				.parents('tr').find('a').removeClass('partial').addClass('checked');
		} else if (childsChecked > 0) {
			$row.parents('tr.content').prev('tr')
				.find('a').addClass('partial');
		}
	}

	// Check child rows
	$row.next('tr.content')
		.find('[type=checkbox]').attr('checked', true)
		.parents('tr').find('a').addClass('checked');
};


/**
 * Deselect row
 * @param {jQuery} row
 */
Juxta.TreeGrid.prototype.deselectRow = function(row) {
	//
	Juxta.Grid.prototype.deselectRow.call(this, row);

	var $row = $(row),
		childs = $row.parents('tr.content').find('[type=checkbox]').length,
		childsChecked = $row.parents('tr.content').find('[type=checkbox]:checked').length;

	// Uncheck parent row if its child slected none
	if (childs > 0) {
		if (childsChecked === 0) {
			$row.parents('tr.content').prev('tr')
				.find('a').removeClass('partial');
		} else if (childs > childsChecked) {
			$row.parents('tr.content').prev('tr')
				.find('[type=checkbox]').attr('checked', false)
				.parents('tr').find('a').removeClass('checked').addClass('partial');
		}
	}

	// Uncheck child rows
	$row.next('tr.content')
		.find('[type=checkbox]').attr('checked', false)
		.parents('tr').find('a').removeClass('checked');
};
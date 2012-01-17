Juxta.RoutineEditor = $.Class(Juxta.FloatBox, {
	init: function(element) {
		this._super(element, {title: 'Edit'});
		this.editor = new Juxta.SqlEditor(this.$floatBox.find('textarea'));
	},
	edit: function(text) {
		this.editor.edit(text);
	}
});

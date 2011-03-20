Juxta.Browser = $.Class(Juxta.Application, {
	init: function(element) {
		this._super(element, {header: 'Browse', closable: true, maximized: true});
	}
});

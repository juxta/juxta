module.exports = function(grunt) {

	grunt.initConfig({
		lint: {
			all: ['js/*.js']
		},
		jshint: {
			globals: {Juxta: true, jQuery: true, $: true},
			options: {
				camelcase: true,
				curly: true,
				latedef: true,
				newcap: true,
				noempty: true,
				quotmark: 'single',
				undef: true,
				unused: true,
				debug: true
			}
		}
	});

	grunt.registerTask('default', 'lint');

}
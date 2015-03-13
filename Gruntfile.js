module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    exec: {
      tests: './node_modules/qunit-cli/bin/qunit-cli ./tests/tests.js'
    }
  });

  grunt.loadNpmTasks('grunt-exec');

  grunt.registerTask('test', 'Run Tests', ['exec:tests']);

};

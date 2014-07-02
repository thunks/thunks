/* jshint node: true */

module.exports = function(grunt) {
  'use strict';

  // Project configuration.
  grunt.initConfig({

    // Metadata.
    pkg: grunt.file.readJSON('package.json'),
    banner: '/**\n' +
            ' * <%= pkg.name %>: v<%= pkg.version %>\n' +
            ' * <%= pkg.homepage %>\n' +
            ' */\n',
    // Task configuration.
    clean: ["thunks.min.js"],

    jshint: {
      options: {
        jshintrc: '.jshintrc'
      },
      build: ['thunks.js', 'Gruntfile.js', 'test/*.js', 'examples/*.js', '!examples/*co.js', '*.json'],
      test: ['benchmark/*.js']
    },

    uglify: {
      options: {
        banner: '<%= banner %>'
      },
      thunks: {
        dest: 'thunks.min.js',
        src: 'thunks.js'
      }
    },

    nodeunit: {
      all: ['test/nodeunit.js']
    }

  });


  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-nodeunit');

  // Default task.
  grunt.registerTask('default', ['jshint:build', 'nodeunit', 'clean', 'uglify']);
  grunt.registerTask('test', ['jshint:build', 'nodeunit']);
  grunt.registerTask('test-all', ['jshint', 'nodeunit']);
};

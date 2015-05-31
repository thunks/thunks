'use strict'

var gulp = require('gulp')
var merge = require('merge2')
var mocha = require('gulp-mocha')
var istanbul = require('gulp-istanbul')

gulp.task('test', function (done) {
  return merge(
      gulp.src('thunks.js')
        .pipe(istanbul()) // Covering files
        .pipe(istanbul.hookRequire()), // Force `require` to return covered files
      gulp.src('test/index.js')
        .pipe(mocha({timeout: 60000}))
        .pipe(istanbul.writeReports()) // Creating the reports after tests runned
        .pipe(istanbul.enforceThresholds({thresholds: {global: 85}})) // Enforce a coverage of at least 85%
    )
})

gulp.task('default', ['test'])

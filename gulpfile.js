'use strict'

var gulp = require('gulp'),
  gulpSequence = require('gulp-sequence'),
  mocha = require('gulp-mocha')

gulp.task('mocha', function () {
  return gulp.src('test/index.js', {read: false})
    .pipe(mocha({timeout: 20000}))
})

gulp.task('default', ['test'])

gulp.task('test', gulpSequence('mocha'))

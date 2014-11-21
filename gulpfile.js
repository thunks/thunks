'use strict';

var gulp = require('gulp'),
  gulpSequence = require('gulp-sequence'),
  jshint = require('gulp-jshint'),
  mocha = require('gulp-mocha');

gulp.task('jshint', function () {
  return gulp.src(['thunks.js', 'gulpfile.js', 'examples/*.js', 'test/*.js', 'benchmark/*.js'])
    .pipe(jshint())
    .pipe(jshint.reporter('default'));
});

gulp.task('mocha', function () {
  return gulp.src('test/index.js', {read: false})
    .pipe(mocha());
});

gulp.task('default', ['test']);

gulp.task('test', gulpSequence('jshint', 'mocha'));

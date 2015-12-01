var gulp = require('gulp');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var browserify = require('browserify');
var watchify = require('watchify');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var del = require('del');
var gutil = require('gulp-util');

var NAME = require('./package.json').name;
var VERSION = require('./package.json').version;
var MAIN = require('./package.json').main;
var OUTPUT = NAME + '.' + VERSION;
var DEST = './build';

var bundler = browserify({
    entries: './' + MAIN,
    standalone: NAME,
    insertGlobals: true,
    cache: {},
    packageCache: {}
});

var watcher = watchify(bundler);

gulp.task('clean', function(cb) {
    del([DEST], cb);
});

gulp.task('copy', ['clean'], function() {
    gulp.src('css/**').pipe(gulp.dest(DEST + '/css'));
    gulp.src('index.html').pipe(gulp.dest(DEST));
    gulp.src('index.yaml').pipe(gulp.dest(DEST));
});

gulp.task('build', ['copy'], function() {
    return bundler
        .bundle()
        .on('error', function(error) {
            gutil.log(gutil.colors.red(error.message));
            this.emit('end');
        })
        .pipe(source(OUTPUT + '.js'))
        .pipe(buffer())
        .pipe(gulp.dest(DEST + '/js'))
        .pipe(rename({extname: '.min.js' }))
        .pipe(uglify())
        .pipe(gulp.dest(DEST + '/js'));
});

gulp.task('watch', function(cb) {
    watcher.on('update', function() {
        gulp.start('build');
    });
    watcher.on('log', gutil.log);
    return gulp.start('build');
});

gulp.task('default', ['build']);

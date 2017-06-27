const EXT_DIR = 'ext';

let gulp = require('gulp');
let path = require('path');
let del = require('del');
let sass = require('gulp-sass');
let jshint = require('gulp-jshint');
let zip = require('gulp-zip');

let manifest = require('./ext/manifest.json');

let vendorFiles = [
    'bower_components/jquery/dist/jquery.min.js',
    'bower_components/tablesorter/jquery.tablesorter.min.js',
    'bower_components/SpinKit/css/spinners/7-three-bounce.css'
];

let distFiles = [
    'manifest.json',
    'icon16.png',
    'icon48.png',
    'icon128.png',
    'options.html',
    'css/**/*',
    'js/**/*',
    'images/**/*',
    'vendor/**/*'
].map(file => path.join(EXT_DIR, file));

gulp.task('sass', function () {
    return gulp.src(path.join(EXT_DIR, 'scss/**/*.scss'))
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest(path.join(EXT_DIR, 'css')))
});

gulp.task('jshint', function () {
    return gulp.src(path.join(EXT_DIR, 'js/**/*.js'))
        .pipe(jshint({esversion: 6}))
        .pipe(jshint.reporter('default'));
});

gulp.task('clean:bin', () => del.sync('bin'));
gulp.task('clean:dist', () => del.sync('dist'));
gulp.task('clean:vendor', () => del.sync(path.join(EXT_DIR, 'vendor/bower')));
gulp.task('clean:css', () => del.sync(path.join(EXT_DIR, 'css')));
gulp.task('clean', ['clean:bin', 'clean:dist', 'clean:css']);

gulp.task('build', ['sass', 'jshint']);

gulp.task('vendor', ['clean:vendor'], () => gulp
    .src(vendorFiles)
    .pipe(gulp.dest(path.join(EXT_DIR, 'vendor/bower')))
);
gulp.task('dist', ['build', 'clean:dist'], () => gulp
    .src(distFiles, {base: EXT_DIR})
    .pipe(gulp.dest('dist'))
);

gulp.task('compress', ['dist'], () => gulp
    .src('dist/**/*')
    .pipe(zip('satori-enhancements-' + manifest.version + '.zip'))
    .pipe(gulp.dest('bin'))
);

gulp.task('watch', ['build'], () => {
    gulp.watch(path.join(EXT_DIR, 'scss/**/*.scss'), ['sass']);
    gulp.watch(path.join(EXT_DIR, 'js/**/*.js'), ['jshint']);
});

gulp.task('default', ['dist']);

const EXT_DIR = 'ext';

let gulp = require('gulp');
let path = require('path');
let del = require('del');
let sass = require('gulp-sass')(require('sass'));
let jshint = require('gulp-jshint');
let zip = require('gulp-zip');
let prefixCss = require('gulp-prefix-css');

let manifest = require('./ext/manifest.json');
let config = require('./ext/js/config');

let vendorFiles = [
    'node_modules/jquery/dist/jquery.min.js',
    'bower_components/SpinKit/css/spinners/7-three-bounce.css',
    'bower_components/highlightjs/highlight.pack.min.js',
    'node_modules/highlightjs-line-numbers.js/dist/' +
    'highlightjs-line-numbers.min.js',
    'bower_components/datatables.net/js/jquery.dataTables.min.js',
    'bower_components/datatables.net-dt/css/jquery.dataTables.min.css',
    'bower_components/datatables.net-plugins/filtering/type-based' +
    '/diacritics-neutralise.js',
    'bower_components/datatables.net-fixedcolumns/js/dataTables.fixedColumns.min.js',
    'bower_components/datatables.net-fixedcolumns-dt/css/fixedColumns.dataTables.min.css',
    'node_modules/datatables.net-plugins/sorting/intl.js',
];

let highlightJsStyles = config.HIGHLIGHT_JS_STYLES.map(
    x => path.join('bower_components/highlightjs/styles', x) + '.css');

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
    return gulp.src(path.join(EXT_DIR, 'scss/**/*.scss'), {
        base: path.join(EXT_DIR, 'scss')
    })
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest(path.join(EXT_DIR, 'css')))
});

gulp.task('jshint', function () {
    return gulp.src(path.join(EXT_DIR, 'js/**/*.js'))
        .pipe(jshint({esversion: 6}))
        .pipe(jshint.reporter('default'));
});

gulp.task('clean:bin', done => {
    del.sync('bin');
    done();
});
gulp.task('clean:dist', done => {
    del.sync('dist')
    done();
});
gulp.task('clean:vendor', done => {
    del.sync(path.join(EXT_DIR, 'vendor/bower'));
    done();
});
gulp.task('clean:vendor:hjsstyles', done => {
    del.sync(path.join(EXT_DIR, 'vendor/bower/hjsstyles'));
    done();
});
gulp.task('clean:css', done => {
    del.sync(path.join(EXT_DIR, 'css'));
    done();
});
gulp.task('clean', gulp.series('clean:bin', 'clean:dist', 'clean:css'));

gulp.task('vendor:hjsstyles', gulp.series('clean:vendor:hjsstyles', () => gulp
    .src(highlightJsStyles)
    .pipe(prefixCss('.mainsphinx'))
    .pipe(gulp.dest(path.join(EXT_DIR, 'vendor/bower/hjsstyles')))
));

gulp.task('vendor', gulp.series('clean:vendor', 'vendor:hjsstyles', () => gulp
    .src(vendorFiles)
    .pipe(gulp.dest(path.join(EXT_DIR, 'vendor/bower')))
));

gulp.task('build', gulp.parallel('sass', 'jshint', 'vendor'));

gulp.task('dist', gulp.series('build', 'clean:dist', () => gulp
    .src(distFiles, {base: EXT_DIR})
    .pipe(gulp.dest('dist'))
));

gulp.task('compress', gulp.series('dist', () => gulp
    .src('dist/**/*')
    .pipe(zip('satori-enhancements-' + manifest.version + '.zip'))
    .pipe(gulp.dest('bin'))
));

gulp.task('watch', gulp.series('build', () => {
    gulp.watch(path.join(EXT_DIR, 'scss/**/*.scss'), ['sass']);
    gulp.watch(path.join(EXT_DIR, 'js/**/*.js'), ['jshint']);
}));

gulp.task('default', gulp.series('dist'));

var gulp = require('gulp'),
    sass = require('gulp-sass'),
    concat = require('gulp-concat'),
    uglify = require('gulp-uglifyjs'),
    rename = require('gulp-rename'),
    imagemin = require('gulp-imagemin'),
    pngquant = require('imagemin-pngquant'),
    cache = require('gulp-cache'),
    extender = require('gulp-html-extend'),
    sourcemaps = require('gulp-sourcemaps'),
    rimraf = require('rimraf'),
    plumber = require('gulp-plumber');

var postcss = require('gulp-postcss'),
    autoprefixer = require('autoprefixer'),
    stylefmt = require('stylefmt'),
    assets  = require('postcss-assets'),
    sorting = require('postcss-sorting'),
    zindex = require('postcss-zindex'),
    fixes = require('postcss-fixes');

gulp.task('sass', function() {
    var processors = [
        assets,
        short,
        zindex,
        fixes,
        autoprefixer(['last 5 versions', '> 5%', 'ie 8', 'ie 7'], {
            cascade: true
        }),
        sorting,
        stylefmt
    ];
    return gulp.src('./src/sass/**/*.scss')
        .pipe(plumber())
        .pipe(sourcemaps.init())
        .pipe(sass().on('error', sass.logError))
        .pipe(postcss(processors))
        .pipe(rename({
            extname: ".css"
        }))
        .pipe(sourcemaps.write('.', { sourceRoot: 'css-source' }))
        .pipe(plumber.stop())
        .pipe(gulp.dest('./dist/css'))
});

gulp.task('scripts', ['clean'], function() {
    return gulp.src('src/js/*.js')
        .pipe(plumber())
        .pipe(concat('script.js'))
        .pipe(rename({
            extname: ".js"
        }))
        .pipe(plumber.stop())
        .pipe(gulp.dest('./dist/js'))

});

gulp.task("clean", function (cb) {
    rimraf('./dist/js/script.js', cb);
});

gulp.task('extend', function () {
    gulp.src('./src/html/**/*.html')
        .pipe(extender({annotations:true,verbose:false}))
        .pipe(gulp.dest('dist/'))
});

gulp.task('img', function() {
    return gulp.src('src/img/**/*')
        .pipe(cache(imagemin({
            interlaced: true,
            progressive: true,
            svgoPlugins: [{
                removeViewBox: false
            }],
            use: [pngquant()]
        })))
        .pipe(gulp.dest('dist/img'))
});

gulp.task('watch', ['scripts', 'extend', 'img'], function() {
    gulp.watch('src/img/**/*', ['img']);
    gulp.watch(['src/html/**/*.html'], ['extend']);
    gulp.watch('src/js/**/*.js', ['scripts']);
});

gulp.task('clear', function(callback) {
    return cache.clearAll();
});

gulp.task('default', ['watch']);

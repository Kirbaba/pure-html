var gulp = require('gulp'), // Подключаем Gulp
    sass = require('gulp-sass'), //Подключаем Sass пакет,
    browserSync = require('browser-sync'), // Подключаем Browser Sync
    concat = require('gulp-concat'), // Подключаем gulp-concat (для конкатенации файлов)
    uglify = require('gulp-uglifyjs'), // Подключаем gulp-uglifyjs (для сжатия JS)
    rename = require('gulp-rename'), // Подключаем библиотеку для переименования файлов
    del = require('del'), // Подключаем библиотеку для удаления файлов и папок
    imagemin = require('gulp-imagemin'), // Подключаем библиотеку для работы с изображениями
    pngquant = require('imagemin-pngquant'), // Подключаем библиотеку для работы с png
    cache = require('gulp-cache'), // Подключаем библиотеку кеширования
    extender = require('gulp-html-extend'),//Подключаем бибилиотеку для склейки html-файлов
    sourcemaps = require('gulp-sourcemaps'),//Подключаем плагин, записывающий карту источника в исходный файл
    rimraf = require('rimraf'),//Очищает указанные исходники
    argv = require('yargs').argv,
    plumber = require('gulp-plumber');//Подключаем плагин, который не останавливает задачи от остановки во время их выполнения при возникновении ошибки

var postcss = require('gulp-postcss'),//Блиотека-парсер стилей для работы с postcss-плагинами
    autoprefixer = require('autoprefixer'),// Подключаем библиотеку для автоматического добавления префиксов
    cssnano = require('cssnano'),//postcss-плагин, для минификации CSS кода, идущего на продакшен.
    pxtorem = require('postcss-pxtorem'),
    short = require('postcss-short'),
    stylefmt = require('stylefmt'),
    assets  = require('postcss-assets'),
    shortspacing = require('postcss-short-spacing'),
    focus = require('postcss-focus'),
    sorting = require('postcss-sorting'),
    fontmagic = require('postcss-font-magician'),
    fixes = require('postcss-fixes');

gulp.task('css-libs', function() { // Создаем таск css-libs
    var processors = [
        cssnano
    ]
    return gulp.src([
        'app/libs/**/*.css'
    ]) // Берем источник
        .pipe(postcss(processors))// сжымаем
        .pipe(concat('libs.min.css'))// объеденяем в файл
        .pipe(gulp.dest('css')) // Выгружаем результата в папку app/css
        .pipe(browserSync.reload({
            stream: true
        })) // Обновляем CSS на странице при изменении
});

/*gulp.task('js-libs', function() {
    return gulp.src([ // Берем все необходимые библиотеки
            'app/libs/jquery/dist/jquery.min.js'
        ])
        .pipe(concat('libs.min.js')) // Собираем их в кучу в новом файле libs.min.js
        .pipe(uglify()) // Сжимаем JS файл
        .pipe(gulp.dest('js')); // Выгружаем в папку app/js
});*/

gulp.task('sass', function() { // Создаем таск Sass
    var processors = [
        assets,
        short,
        fontmagic,
        fixes,
        autoprefixer(['last 5 versions', '> 5%', 'ie 8', 'ie 7'], {
            cascade: true
        }),
        /* pxtorem({
         rootValue: 14,
         replace: false
         }),*/
        focus,
        sorting(),
        stylefmt,
        cssnano
    ];
    return gulp.src('app/sass/**/*.scss')
        .pipe(plumber())
        .pipe(sourcemaps.init())
        .pipe(sass().on('error', sass.logError))
        .pipe(postcss(processors))
        .pipe(rename({
            suffix: ".min",
            extname: ".css"
        }))
        .pipe(sourcemaps.write('.', { sourceRoot: 'css-source' }))
        .pipe(plumber.stop())
        .pipe(gulp.dest('css'))
        .pipe(browserSync.reload({
            stream: true
        }));
});

gulp.task('browser-sync', function() { // Создаем таск browser-sync
    browserSync({ // Выполняем browserSync
        proxy: {
            target: '' // Директория для сервера - app
        },
        ghostMode: {
            clicks: true,
            forms: true,
            scroll: true
        },
        notify: false // Отключаем уведомления
    });
});

gulp.task('compress', ['clean'], function() {// Создаем таск compress
    return gulp.src('app/js/*.js')// Берем все необходимые библиотеки
        .pipe(plumber())
        .pipe(concat('script.js'))// Собираем их в кучу в новом файле script.js
        .pipe(rename({
            suffix: ".min",// Добавляем суффикс .min
            extname: ".js"// Добавляем окончание .js
        }))
        .pipe(uglify()) // Сжимаем JS файл
        /*.pipe(gulpif(argv.production, uglify())) // <- добавляем вот эту строчку (Сжимаем JS файл)*/
        .pipe(plumber.stop())
        .pipe(gulp.dest('js'));// Выгружаем в папку js

});

gulp.task("clean", function (cb) {
    rimraf('./js/script.min.js', cb);
});

gulp.task('extend-pages', function () {
    gulp.src('./app/html/pages/*.html')
        .pipe(extender({annotations:true,verbose:false})) // default options
        .pipe(gulp.dest('./'))
});

gulp.task('extend-blocks', function () {
    gulp.src('./app/html/*.html')
        .pipe(extender({annotations:true,verbose:false})) // default options
        .pipe(gulp.dest('./'))
});

gulp.task('watch', ['compress', 'extend-pages', 'css-libs', 'img', 'sass'], function() {
    gulp.watch('app/libs/**/*', ['css-libs']); // Наблюдение за папкой libs
    gulp.watch('app/img/**/*', ['img']);// Наблюдение за папкой img
    gulp.watch('app/sass/**/*.scss', ['sass']); // Наблюдение за sass файлами в папке sass
    gulp.watch(['app/html/**/*.html'], ['extend-pages']);// Наблюдение за HTML-файлами в папке html/pages
   /* gulp.watch(['app/html/!*.html'], ['extend-blocks']);// Наблюдение за HTML-файлами в папке html*/
    gulp.watch('app/js/**/*.js', ['compress']); // Наблюдение за js-файлами
});


gulp.task('img', function() {
    return gulp.src('app/img/**/*')
        .pipe(cache(imagemin({
            interlaced: true,
            progressive: true,
            svgoPlugins: [{
                removeViewBox: false
            }],
            use: [pngquant()]
        })))
        .pipe(gulp.dest('img'))
        .pipe(browserSync.reload({
            stream: true
        }));
});


/*gulp.task('build', ['img', 'sass', 'scripts'], function() {

    var buildCss = gulp.src([ // Переносим библиотеки в продакшен
            'app/css/main.css',
            'app/css/libs.min.css'
        ])
        .pipe(gulp.dest('css'))

    var buildFonts = gulp.src('app/fonts/!**!/!*') // Переносим шрифты в продакшен
        .pipe(gulp.dest('fonts'))

    var buildJs = gulp.src('app/js/!**!/!*') // Переносим скрипты в продакшен
        .pipe(gulp.dest('js'))

});*/

gulp.task('clear', function(callback) {
    return cache.clearAll();
});

gulp.task('default', ['watch']);

/*
 npm i gulp gulp-sass browser-sync gulp-concat gulp-uglifyjs gulp-rename del gulp-imagemin imagemin-pngquant gulp-cache gulp-html-extend gulp-sourcemaps rimraf yargs gulp-plumber gulp-postcss autoprefixer cssnano postcss-pxtorem postcss-short stylefmt postcss-assets postcss-short-spacing postcss-focus postcss-sorting postcss-font-magician postcss-fixes --save-dev*/

const basePaths = {
    src: 'src/',
    dest: 'dist/',
    bower: 'bower_components/'
};

const paths = {
    scripts: {
        src: basePaths.src + 'js/',
        dest: basePaths.dest + 'js/'
    },
    styles: {
        src: basePaths.src + 'css/',
        dest: basePaths.dest + 'css/'
    },
    fonts: {
        src: basePaths.src + 'fonts/',
        dest: basePaths.dest + 'fonts/'
    }
};

const appFiles = {
    styles: [paths.styles.src + '**/*.scss'],
    script_ec6: [
        paths.scripts.src + 'NativeShare/index.js',
    ],
    scripts: [
        paths.scripts.src + 'jquery.qrcode.min.js',
        paths.scripts.src + 'NativeShare.js',
        paths.scripts.src + 'share.js',
    ],
    fonts: [paths.fonts.src + '**/*']
};

const gulp = require('gulp');
const webpack = require('webpack-stream');
const path = require('path');
const sass = require('gulp-sass');
const minifyCss = require('gulp-minify-css');
const gUtil = require('gulp-util');
const concat = require('gulp-concat');

const plugins = require("gulp-load-plugins")({
    pattern: ['gulp-*', 'gulp.*'],
    replaceString: /\bgulp[\-.]/
});

// Allows gulp --dev to be run for a more verbose output
let isProduction = true;
let sourceMap = false;

if (gUtil.env.dev === true) {
    sourceMap = true;
    isProduction = false;
}

const changeEvent = function (evt) {
    gUtil.log(
        'File',
        gUtil.colors.cyan(evt.path.replace(new RegExp('/.*(?=/' + basePaths.src + ')/'), '')),
        'was',
        gUtil.colors.magenta(evt.type)
    );
};

gulp.task('css', function () {
    return gulp.src(appFiles.styles)
        .pipe(sass())
        .pipe(isProduction ? minifyCss() : gUtil.noop())
        .pipe(plugins.rename({suffix: '.min'}))
        .pipe(gulp.dest(paths.styles.dest));
});

gulp.task('webpack', function () {
    return gulp.src(appFiles.script_ec6)
        .pipe(
            webpack({
                mode: isProduction ? 'production' : 'development',
                entry: {
                    NativeShare: './src/js/NativeShare/index.js',
                },
                output: {
                    path: path.resolve(__dirname, paths.scripts.dest),
                    filename: '[name].js',
                    library: '[name].js',
                    libraryTarget: 'umd',
                },
                module: {
                    rules: [
                        {
                            test: /\.js$/,
                            use: [{
                                loader: 'babel-loader',
                                query: {
                                    cacheDirectory: true,
                                    plugins: [
                                        "@babel/plugin-proposal-class-properties"
                                    ]
                                }
                            }],
                        },
                    ],
                },
            })
        )
        .pipe(plugins.rename({suffix: '.min'}))
        .pipe(gulp.dest(paths.scripts.src));
});

gulp.task('scripts', function () {
    return gulp.src(appFiles.scripts)
        .pipe(concat('share.js'))
        .pipe(isProduction ? plugins.uglify() : gUtil.noop())
        .pipe(plugins.size())
        .pipe(plugins.rename({suffix: '.min'}))
        .pipe(gulp.dest(paths.scripts.dest));
});

gulp.task('fonts', function () {
    return gulp.src(appFiles.fonts)
        .pipe(gulp.dest(paths.fonts.dest));
});

gulp.task('watch', gulp.series('css', 'webpack', 'scripts', 'fonts'), function () {
    gulp.watch(appFiles.styles, ['css']).on('change', function (evt) {
        changeEvent(evt);
    });

    gulp.watch(paths.scripts.src + '*.js', ['scripts']).on('change', function (evt) {
        changeEvent(evt);
    });

    gulp.watch(paths.scripts.src + 'NativeShare/*.js', ['webpack']).on('change', function (evt) {
        changeEvent(evt);
    });
});

gulp.task('default', gulp.series('css', 'webpack', 'scripts', 'fonts'));

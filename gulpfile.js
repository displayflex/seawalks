'use strict';

var gulp = require('gulp');
var sass = require('gulp-sass');
var plumber = require('gulp-plumber');
var postcss = require('gulp-postcss');
var autoprefixer = require('autoprefixer');
var server = require('browser-sync').create();
var minify = require('gulp-csso');
var rename = require('gulp-rename');
var imagemin = require('gulp-imagemin');
var webp = require('gulp-webp');
var svgstore = require('gulp-svgstore');
var posthtml = require('gulp-posthtml');
var include = require('posthtml-include');
var run = require('run-sequence');
var del = require('del');
var uglify = require('gulp-uglify');
var pump = require('pump');
var concat = require('gulp-concat');
var htmlmin = require('gulp-htmlmin');
var tinypng = require('gulp-tinypng-compress');
var notify = require('gulp-notify');
var mqpacker = require('css-mqpacker');
var colorguard = require('colorguard');

// CSS

gulp.task('style', function () {
	gulp.src('app/sass/style.scss')
		.pipe(plumber())
		.pipe(sass())
		.on('error', notify.onError(function (error) {
			return 'Problem here: ' + error.message;
		}))
		.pipe(postcss([
			autoprefixer(),
			mqpacker({
				sort: true
			})
		]))
		.pipe(gulp.dest('build/css'))
		.pipe(minify())
		.pipe(rename('style.min.css'))
		.pipe(gulp.dest('build/css'))
		.pipe(server.stream());
});

gulp.task('colorguard', function () {
	gulp.src('build/css/style.css')
		.pipe(postcss([
			colorguard({
				threshold: 1,
				allowEquivalentNotation: true
			})
		]));
});

// HTML

gulp.task('html', function () {
	return gulp.src('app/*.html')
		.pipe(posthtml([
			include()
		]))
		.pipe(htmlmin({
			collapseWhitespace: true,
			collapseInlineTagWhitespace: false,
			conservativeCollapse: true
		}))
		.pipe(gulp.dest('build'))
		.pipe(server.stream());
});

// JS

gulp.task('concat', function () {
	return gulp.src([
		'app/js/picturefill.min.js',
		'app/js/svgxuse.min.js',
		'app/js/main-nav.js',
		'app/js/login-popup.js'
	])
		.pipe(concat('scripts.min.js'))
		.pipe(gulp.dest('build/js'));
});

gulp.task('uglify', function (cb) {
	pump(
		[
			gulp.src('build/js/*.js'),
			uglify(),
			gulp.dest('build/js')
		],
		cb
	);
});

gulp.task('js', function (done) {
	run(
		'concat',
		'uglify',
		done
	);
});

// IMAGES

gulp.task('images', function () {
	return gulp.src('app/img/**/*.{png,jpg,gif}')
		.pipe(imagemin([
			imagemin.jpegtran({ progressive: true }),
			imagemin.optipng({ optimizationLevel: 3 }),
		]))
		.pipe(gulp.dest('app/img'));
});

gulp.task('svgo', function () {
	return gulp.src(['app/img/svg/*.svg', '!app/img/svg/sprite.svg'])
		.pipe(imagemin([
			imagemin.svgo({
				plugins: [
					{ removeViewBox: false }
				]
			})
		]))
		.pipe(gulp.dest('app/img/svg'));
});

gulp.task('sprite', function () {
	return gulp.src('app/img/svg/icon-*.svg')
		.pipe(svgstore({
			inlineSvg: true
		}))
		.pipe(rename('sprite.svg'))
		.pipe(gulp.dest('app/img/svg'));
});

gulp.task('webp', function () {
	return gulp.src('app/img/content/*.{png,jpg}')
		.pipe(webp({ quality: 90 }))
		.pipe(gulp.dest('app/img/content/webp90'));
});

gulp.task('tinypng', function () {
	return gulp.src('app/img/**/*.{png,jpg,jpeg}')
		.pipe(tinypng({
			key: '0dYeOz9XSD1Gq2yu2O4Wwzik1eQUSdrj',
			sigFile: 'images/.tinypng-sigs',
			log: true
		}))
		.pipe(gulp.dest('app/img/tiny'));
});

// LIVE SERVER

gulp.task('serve', function () {
	server.init({
		server: {
			baseDir: 'build/'
		},
		notify: false
	});

	gulp.watch('app/sass/**/*.scss', ['style']);
	gulp.watch('app/*.html', ['html']);
	gulp.watch('app/js/**/*.js', ['js', server.reload]);
});

// BUILD

gulp.task('clean', function () {
	return del('build');
});

gulp.task('copy', function () {
	return gulp.src([
		'app/fonts/**/*.{woff,woff2}',
		'app/img/**',
		'!app/img/svg/icon-*.svg'
	], {
		base: 'app'
	})
		.pipe(gulp.dest('build'));
});

gulp.task('copy:favicon', function () {
	return gulp.src('app/favicon/*.{png,svg}')
		.pipe(gulp.dest('build/img/favicon'));
});

gulp.task('copy:favicon:data', function () {
	return gulp.src(['app/favicon/*.{xml,webmanifest}', 'app/favicon/favicon.ico'])
		.pipe(gulp.dest('build'));
});

gulp.task('build', function (done) {
	run(
		'clean',
		'copy',
		'copy:favicon',
		'copy:favicon:data',
		'style',
		'html',
		'js',
		done
	);
});

// DEFAULT TASK

gulp.task('default', function (done) {
	run(
		'build',
		'serve',
		done
	);
});

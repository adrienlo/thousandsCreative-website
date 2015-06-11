var gulp 			= require('gulp'),
	del 			= require('del'),
	concat 			= require('gulp-concat'),
	source 			= require('vinyl-source-stream'),
	uglify 			= require('gulp-uglify'),
	streamify 		= require('gulp-streamify'),
	transform 		= require('vinyl-transform'),
	browserify 		= require('browserify'),
	babelify 		= require('babelify'),
	jshint 			= require('gulp-jshint'),
	sourcemaps 		= require('gulp-sourcemaps'),
	sass 			= require('gulp-ruby-sass'),
	minifycss 		= require('gulp-minify-css'),
	rename 			= require('gulp-rename'),
	replace 		= require('gulp-replace'),
	inject 			= require('gulp-inject'),
	imageOptimizer	= require('gulp-imagemin'),

	// config
	config 			= require('./config.json'),
	releaseName 	= config.name,
	scripts			= config.source.scripts,

	// server
	browserSync		= require('browser-sync').create();

function gobbleError(error) {
	console.error(error.toString());
	this.emit('end');
}

// clean out the directory first
gulp.task('clean', function (cb) {
	del('./build', { force: true }, function(err) {
		if(err) {
			console.error(err.toString());
		}
	});
});

gulp.task('optimize-images', function() {
	// del(config.build.imagePath, function(err, files) {
	// 	if(err) {
	// 		console.error(err);
	// 	}
	// });

	gulp.src(config.source.imagePath + '*')
		.pipe(imageOptimizer({
            progressive: true,
            svgoPlugins: [{removeViewBox: false}]
        }))
		.pipe(gulp.dest(config.build.root + config.build.imagePath))
		.pipe(browserSync.stream());
});

gulp.task('inject', function() {
	return gulp.src(config.source.partials + 'master.html')
		.pipe(inject(gulp.src(config.source.partials + 'body.html'), {
			removeTags: true,
			starttag: '<!-- inject:body:{{ext}} -->',
			transform: function (filePath, file) {
				return file.contents.toString('utf8');
			}
		}))
		.pipe(inject(gulp.src(config.source.partials + 'templates.html'), {
			removeTags: true,
			starttag: '<!-- inject:templates:{{ext}} -->',
			transform: function (filePath, f) {
				return f.contents.toString('utf8');
			}
		}))
		.on('error', gobbleError)
		.pipe(rename('index.html'))
		.pipe(gulp.dest(config.build.root));
});

// is our javascript awesome???
// ignore our vendor files, because we really don't control the validity of them
gulp.task('jshint', function() {
	return gulp.src([
			'./src/js/main.js',
			config.source.scripts.source + 'libs/**/*.js'
		])
		.pipe(jshint())
		.pipe(jshint.reporter('default'))
		.on('error', gobbleError);
});

gulp.task('scripts.source', function() {
	//	TO DO: install watchify so it caches the files. Less file system access if unchanged files.
	// 	https://www.npmjs.com/package/watchify

	return browserify({
			entries: scripts.source.srcFile,
			debug: true
		})
		.on('error', gobbleError)
		.transform(babelify)
		.bundle()
		.on('error', gobbleError)
		.pipe(source(scripts.source.outputName + '.js'))
		.pipe(streamify(sourcemaps.init({loadMaps: true})))
		.pipe(gulp.dest(config.build.scripts.path))
		.pipe(streamify(uglify()))
		.pipe(rename(scripts.source.outputName + '.min.js'))
		.pipe(streamify(sourcemaps.write('.')))
		.pipe(gulp.dest(config.build.scripts.path))
		.pipe(browserSync.stream());
});

gulp.task('scripts.thirdParty', function() {
	return gulp.src(scripts.thirdParty.files)
		.pipe(concat(scripts.thirdParty.outputName + '.js'))
		.on('error', gobbleError)
		.pipe(streamify(sourcemaps.init({loadMaps: true})))
		.pipe(gulp.dest(config.build.scripts.path))
		.pipe(uglify())
		.pipe(rename(scripts.thirdParty.outputName + '.min.js'))
		.pipe(streamify(sourcemaps.write('.')))
		.pipe(gulp.dest(config.build.scripts.path))
		.pipe(browserSync.stream());
});

gulp.task('scripts', ['scripts.source', 'scripts.thirdParty']);

gulp.task('styles', function() {
	return sass(config.source.styles.srcFile, { 'sourcemap=none': true })
		.on('error', gobbleError)
		.pipe(rename(releaseName + '.css'))
		.pipe(gulp.dest(config.build.styles.path))
		.pipe(minifycss())
		.pipe(rename(releaseName + '.min.css'))
		.pipe(gulp.dest(config.build.styles.path))
		.pipe(browserSync.stream());
});

gulp.task('serve', ['inject', 'scripts', 'styles'], function() {
	browserSync.init({
		open: true,
		browser: 'google chrome',
		port: config.server.port || '8000',
		server: {
			baseDir: config.build.root
		},
		files: [
			config.source.scripts.source.srcFile,
			config.source.path + 'libs/**/*.js',
			config.source.scripts.thirdParty.files,
			config.source.styles.files
		]
	});

	gulp.watch(source.imagePath, ['optimize-images']);

	gulp.watch([
			scripts.source.srcFile,
			scripts.path + 'libs/**/*.js'
		],
		['jshint', 'scripts.source']);

	gulp.watch(scripts.thirdParty.files, ['scripts.thirdParty']);

	gulp.watch(config.source.styles.files, ['styles']);

	gulp
		.watch(config.source.partials + '*.html', ['inject'])
		.on('change', browserSync.reload);
});

gulp.task('default', ['optimize-images', 'serve']);
gulp.task('release', ['inject', 'scripts', 'styles', 'optimize-images']);
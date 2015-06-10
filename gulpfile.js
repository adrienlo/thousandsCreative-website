var gulp 			= require('gulp'),
	config 			= require('./config.json'),
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
	releaseName 	= config.name,

	// server vars
	http = require('http'),
	express = require('express'),
	ecstatic = require('ecstatic');

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
		.pipe(gulp.dest(config.build.root + config.build.imagePath));
});

gulp.task('inject', function() {
	return gulp.src(config.source.partials + 'master.html')
		.pipe(inject(gulp.src(config.source.partials + 'primary-nav.html'), {
			removeTags: true,
			starttag: '<!-- inject:primaryNav:{{ext}} -->',
			transform: function (filePath, file) {
				return file.contents.toString('utf8');
			}
		}))
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
	var scripts = config.source.scripts;

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
		.pipe(gulp.dest(config.build.scripts.path));
});

gulp.task('scripts.thirdParty', function() {
	var scripts = config.source.scripts;

	return gulp.src(scripts.thirdParty.files)
		.pipe(concat(scripts.thirdParty.outputName + '.js'))
		.on('error', gobbleError)
		.pipe(streamify(sourcemaps.init({loadMaps: true})))
		.pipe(gulp.dest(config.build.scripts.path))
		.pipe(uglify())
		.pipe(rename(scripts.thirdParty.outputName + '.min.js'))
		.pipe(streamify(sourcemaps.write('.')))
		.pipe(gulp.dest(config.build.scripts.path));
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
});

gulp.task('watch', function() {
	var source = config.source;

	gulp.watch(source.imagePath, ['optimize-images']);
	gulp.watch(source.partials + '*.html', ['inject', 'inject.legacy']);
	gulp.watch([
			source.scripts.source.srcFile,
			source.scripts.path + 'libs/**/*.js'
		],
		['jshint', 'scripts.source']);
	gulp.watch(source.scripts.thirdParty.files, ['scripts.thirdParty']);
	gulp.watch(source.styles.files, ['styles']);
});

gulp.task('serve', function() {
	var app = express(),
		ip = config.server.ip || '127.0.0.1',
		port = config.server.port || '8000',
		url = ip + ':' + port;

	app.use(ecstatic({ root: config.build.root, defaultExt: 'html' }));
	http.createServer(app).listen(port, function() {
		console.log('Server running at http://' + url);
	});
});

gulp.task('default', ['inject', 'scripts', 'styles', 'optimize-images', 'serve', 'watch']);
gulp.task('release', ['inject', 'scripts', 'styles', 'optimize-images']);
const gulp = require('gulp');
const browserSync = require('browser-sync');
const browserify = require('browserify');
const uglify = require('gulp-uglify');
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');
const fs = require('fs');
const postcss = require('postcss');
const url = require('postcss-url');
const open = require('open');
const replace = require('gulp-replace');

let production = true;

gulp.task('browser-sync', function() {
    browserSync({
        server: {
            baseDir: '.'
            ,index: 'examples/plugin-page.html'
            // ,https: true
        }
    });
});

function bs_reload(){
    browserSync.reload();
}

gulp.task('bs-reload', function () {
    bs_reload();
});

function impute(sourceCss, targetCss){
    console.log('sourceCss', sourceCss)
  fs.readFile(sourceCss, (err, css) => {
    postcss([url({url:'inline'})])
      .process(css, { from: sourceCss, to: targetCss })
      .then(result => {
        fs.writeFile(targetCss, result.css, function(err, result) {
            if(err) console.log('error', err);
        });
        if ( result.map ) fs.writeFile(targetCss + '.map', result.map, function(err, result) {
            if(err) console.log('error', err);
        });
      });
  });

}

gulp.task('css-impute', function (done) {
  impute('node_modules/ProtVista/style/main.css', 'src/css/protvista-imputed.css');
  impute('node_modules/litemol/dist/css/LiteMol-plugin-light.css', 'src/css/LiteMol-plugin-light-imputed.css');
  done();

});

gulp.task('build-js-css', gulp.series(['css-impute'], function (done) {
    const appBundler = browserify({
        entries: ['./src/index.js'],
        transform: [
            ['babelify', {
                "presets": ['es2015-ie'],
                "compact": false
            }
            ],
            ['browserify-css']
        ],
        standalone: 'MolArt',
        debug: true
    })
        .require("./src/index.js", {expose: "MolArt"});

    var bundle = appBundler.bundle().on('error', function(e){console.log(e)})
        .pipe(source('molart.js'));

    if (production) {
        bundle = bundle
            .pipe(buffer()) // <----- convert from streaming to buffered vinyl file object
            .pipe(uglify())
    }

    return bundle
    // bundle
        .pipe(gulp.dest('dist'))
        .pipe(gulp.dest('examples/web/lib/molart'))
        .pipe(gulp.dest('docs/examples/web/lib/molart'));

    // done();
}));

gulp.task('build-doc', function (done) {

    gulp.src(['examples/web/css/**/*']).pipe(gulp.dest('docs/examples/web/css'));
    gulp.src(['examples/web/img/**/*']).pipe(gulp.dest('docs/examples/web/img'));
    gulp.src(['examples/web/js/**/*']).pipe(gulp.dest('docs/examples/web/js'));

    gulp.src(['examples/web/index.html'])
        .pipe(replace('src="lib/molart/molart.js"', 'src="https://rawgithub.com/davidhoksza/MolArt/master/dist/molart.js">'))
        .pipe(gulp.dest('docs/examples/web/'));

    gulp.src(['examples/plugin-page.html'])
        .pipe(replace('src="../dist/molart.js"', 'src="https://rawgithub.com/davidhoksza/MolArt/master/dist/molart.js">'))
        .pipe(gulp.dest('docs/examples/'));

    done();

});

gulp.task('build', gulp.series(['build-js-css', 'build-doc']));

gulp.task('bs-reload-build', gulp.series(['build'], function (done) {
    bs_reload();
    done();
}));

gulp.task('default', gulp.series(['build']));

gulp.task('debug', function(done){
    production = false;
    done();
});

gulp.task('bs-watch', gulp.series(['browser-sync'], function (done) {
    gulp.watch("src/**/*.css", ['bs-reload-build']);
    gulp.watch("src/**/*.js", ['bs-reload-build']);
    gulp.watch("examples/**/*.html", ['bs-reload-build']);
    // gulp.watch("*.html", ['bs-reload']);
    done();
}));

gulp.task('build-debug', gulp.series(['debug', 'build']));

gulp.task('watch', gulp.series(['build-debug', 'bs-watch']));

gulp.task('prepare-mock-data', function(done) {
    const b = browserify('test/data/template.mock.data.js', {debug: true});
    return b
        .bundle().on('error', function(e){console.log(e)})
        .pipe(source('mock.data.js'))
        .pipe(gulp.dest('test/data/'))
});

gulp.task('test', gulp.series(['prepare-mock-data'], function(done) {
  open('test/test.html');
  done();

}));
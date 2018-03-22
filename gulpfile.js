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

var production = true;

gulp.task('browser-sync', function() {
    browserSync({
        server: {
            baseDir: '.'
            ,index: 'examples/plugin-page.html'
            ,https: true
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
  fs.readFile(sourceCss, (err, css) => {
    postcss([url({url:'inline'})])
      .process(css, { from: sourceCss, to: targetCss })
      .then(result => {
        fs.writeFile(targetCss, result.css);
        if ( result.map ) fs.writeFile(targetCss + '.map', result.map);
      });
  });

}

gulp.task('css-impute', function () {

  impute('node_modules/protvista/style/main.css', 'src/css/protvista-imputed.css');
  impute('node_modules/litemol/dist/css/LiteMol-plugin-light.css', 'src/css/LiteMol-plugin-light-imputed.css');

});

gulp.task('build', ['css-impute'], function () {
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
        standalone: 'MolStar',
        debug: true
    })
      .require("./src/index.js", {expose: "MolStar"});

    var bundle = appBundler.bundle().on('error', function(e){console.log(e)})
        .pipe(source('molstar.js'));

    if (production) {
        bundle = bundle
            .pipe(buffer()) // <----- convert from streaming to buffered vinyl file object
            .pipe(uglify())
    }

    return bundle
        .pipe(gulp.dest('dist'))
        .pipe(gulp.dest('examples/web/lib/molstar'))
        .pipe(gulp.dest('docs/examples/web/lib/molstar'));
});

gulp.task('bs-reload-build', ['build'], function () {
    bs_reload();
});

gulp.task('default', ['build']);

gulp.task('debug', function(){
    production = false;
});

gulp.task('watch', ['debug', 'build', 'browser-sync'], function () {

  gulp.watch("src/**/*.css", ['bs-reload-build']);
  gulp.watch("src/**/*.js", ['bs-reload-build']);
  gulp.watch("*.html", ['bs-reload']);
});

gulp.task('test', ['prepare-mock-data'], function() {
  open('test/test.html');

});

gulp.task('prepare-mock-data', function() {
  const b = browserify('test/data/template.mock.data.js', {debug: true});
  return b
    .bundle().on('error', function(e){console.log(e)})
    .pipe(source('mock.data.js'))
    .pipe(gulp.dest('test/data/'))
});

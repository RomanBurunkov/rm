const { dest, series, src } = require('gulp');
const del = require('del');
const rename = require('gulp-rename');
const terser = require('gulp-terser');

const getFiles = (files, path = './source/', ext = 'js') => files.map(f => `${path}${f}.${ext}`);

function clean(cb) {
  del(['!./build/.gitkeep', './build/**/*']);
  return cb();
}

function minify(cb) {
  src(getFiles(['rm']))
    .pipe(terser())
    .pipe(rename({ suffix: '.min' }))
    .pipe(dest('./build/'));
  return cb();
}

exports.default = series(clean, minify);

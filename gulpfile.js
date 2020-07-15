const { dest, series, src, task } = require('gulp');
const del = require('del');
const rename = require('gulp-rename');
const terser = require('gulp-terser');

function clean() {
  del(['!./build/.gitkeep', './build/**/*']);
}

function minify(cb) {
  const path = './source/';
  const files = ['rm']
  src(files.map(f => `${path}${f}.js`))
    .pipe(terser())
    .pipe(rename({ suffix: '.min' }))
    .pipe(dest('./build/'));
  return cb();
}

function defaultTask(cb) {
  clean();
  minify(() => cb());
}

exports.default = defaultTask

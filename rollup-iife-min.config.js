import babel from 'rollup-plugin-babel';
import { uglify } from 'rollup-plugin-uglify';

export default {
  input: 'src/index.js',
  output: {
    dir: 'dist',
    file: 'radar.min.js',
    format: 'iife',
    name: 'Radar',
  },
  plugins: [
    babel({
      exclude: 'node_modules/**'
    }),
    uglify(),
  ],
};

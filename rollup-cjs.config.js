import resolve from 'rollup-plugin-node-resolve';
import babel from 'rollup-plugin-babel';
import commonjs from 'rollup-plugin-commonjs';

export default {
  input: 'src/index.js',
  output: {
    file: 'dist/index.js',
    format: 'cjs',
    name: 'Radar',
  },
  plugins: [
    resolve(),
    babel({
      babelrc: false,
      exclude: 'node_modules/**',
      "presets": [
        [
          "@babel/env",
          {
            "modules": false,
            "useBuiltIns": "usage",
            "corejs": 3,
            "targets": "ie 11"
          }
        ]
      ]
    }),
    commonjs(),
  ],
};

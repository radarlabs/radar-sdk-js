import babel from 'rollup-plugin-babel';

export default {
  input: 'src/index.js',
  output: {
    dir: 'dist',
    file: 'radar.js',
    format: 'iife',
    name: 'Radar',
  },
  plugins: [
    babel({
      exclude: 'node_modules/**'
    })
  ],
};

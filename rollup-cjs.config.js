import babel from 'rollup-plugin-babel';

export default {
  input: 'src/index.js',
  output: {
    dir: 'dist',
    file: 'index.js',
    format: 'cjs',
    name: 'Radar',
  },
  plugins: [
    babel({
      exclude: 'node_modules/**'
    })
  ],
};

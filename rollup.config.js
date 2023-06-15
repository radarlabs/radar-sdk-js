import typescript from 'rollup-plugin-typescript2';
import json from '@rollup/plugin-json';
import terser from '@rollup/plugin-terser';

export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/radar.js',
      format: 'esm',
    },
    {
      file: 'dist/radar.iife.js',
      format: 'iife',
      name: 'Radar',
    },
    {
      file: 'dist/radar.iife.min.js',
      format: 'iife',
      name: 'Radar',
      plugins: [terser()],
    },
  ],
  plugins: [
    typescript(),
    json()
  ],
};

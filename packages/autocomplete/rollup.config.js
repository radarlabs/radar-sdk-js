import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import postcss from 'rollup-plugin-postcss';

export default [
  // ESM
  {
    input: 'src/index.ts',
    output: {
      dir: 'dist',
      entryFileNames: 'index.js',
      format: 'esm',
      sourcemap: true,
    },
    external: ['radar-sdk-js'],
    plugins: [
      typescript({ declaration: true, declarationDir: './dist' }),
      nodeResolve(),
      postcss({
        extract: 'radar-autocomplete.css',
        minimize: true,
      }),
    ],
  },

  // IIFE (CDN)
  {
    input: 'src/cdn-entry.ts',
    output: [
      {
        file: 'cdn/radar-autocomplete.js',
        format: 'iife',
        name: 'RadarAutocomplete',
      },
      {
        file: 'cdn/radar-autocomplete.min.js',
        format: 'iife',
        name: 'RadarAutocomplete',
        plugins: [terser()],
      },
    ],
    plugins: [
      typescript({ declaration: false, declarationDir: undefined, outDir: './cdn' }),
      nodeResolve(),
      postcss({
        extract: 'radar-autocomplete.css',
        minimize: true,
      }),
    ],
  },
];

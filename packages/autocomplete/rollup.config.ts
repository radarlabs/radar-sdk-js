import { nodeResolve } from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import postcss from 'rollup-plugin-postcss';

import type { RollupOptions } from 'rollup';

const config: RollupOptions[] = [
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
        globals: {
          'radar-sdk-js': 'Radar',
        },
      },
      {
        file: 'cdn/radar-autocomplete.min.js',
        format: 'iife',
        name: 'RadarAutocomplete',
        plugins: [terser()],
        globals: {
          'radar-sdk-js': 'Radar',
        },
      },
    ],
    external: ['radar-sdk-js'],
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

export default config;

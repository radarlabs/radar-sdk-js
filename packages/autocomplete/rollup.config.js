import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import postcss from 'rollup-plugin-postcss';
import json from '@rollup/plugin-json';

const onlyEmitFile = () => ({
  name: 'only-emit-file',
  generateBundle(outputOptions, bundle) {
    const outputFile = outputOptions.file;
    const outputFileName = outputFile.split('/').pop();
    for (const fileName in bundle) {
      if (fileName !== outputFileName && !fileName.endsWith('.css')) {
        delete bundle[fileName];
      }
    }
  }
});

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
      commonjs(),
      json(),
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
        plugins: [onlyEmitFile()],
      },
      {
        file: 'cdn/radar-autocomplete.min.js',
        format: 'iife',
        name: 'RadarAutocomplete',
        plugins: [terser(), onlyEmitFile()],
      },
    ],
    plugins: [
      typescript({ declaration: false, declarationDir: undefined, outDir: './cdn' }),
      nodeResolve(),
      commonjs(),
      json(),
      postcss({
        extract: 'radar-autocomplete.css',
        minimize: true,
      }),
    ],
  },
];

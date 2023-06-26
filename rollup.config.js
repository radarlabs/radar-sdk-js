import typescript from 'rollup-plugin-typescript2';
import json from '@rollup/plugin-json';
import terser from '@rollup/plugin-terser';
import commonjs from '@rollup/plugin-commonjs';
import postcss from 'rollup-plugin-postcss';
import { nodeResolve } from '@rollup/plugin-node-resolve';


// remove typescript declarations from file in the CDN output folder
// (only keep the output file specified in the rollup config)
const onlyEmitFile = () => ({
  name: 'only-emit-file',

  generateBundle(outputOptions, bundle) {
    const outputFile = outputOptions.file;
    const outputFileName = outputFile.split('/').pop();

    for (const fileName in bundle) {
      // remove file if doesn't match "file" in config
      if (fileName !== outputFileName && !fileName.endsWith('.css')) {
        delete bundle[fileName];
      }
    }
  }
});

export default [
  // ES Module (written to /dist)
  {
    input: 'src/index.ts',
    output: [
      {
        file: 'dist/radar.js',
        format: 'esm',
        sourcemap: true,
      },
    ],
    external: ['maplibre-gl'],
    plugins: [
      typescript(),
      nodeResolve(),
      commonjs(),
      json(),
      postcss({
        extract: 'styles/radar.css',
        minimize: true,
      }),
    ],
  },

  // IIFE (browser bundles, written to /cdn)
  {
    input: 'src/index.ts',
    output: [
      {
        file: 'cdn/radar.js',
        format: 'iife',
        name: 'Radar',
        plugins: [onlyEmitFile()],
      },
      {
        file: 'cdn/radar.min.js',
        format: 'iife',
        name: 'Radar',
        plugins: [terser(), onlyEmitFile()],
      },
    ],
    plugins: [
      typescript(),
      nodeResolve(),
      commonjs(),
      json(),
      postcss({
        extract: 'radar.css',
        minimize: false, // TODO: set to true before merging
      }),
    ],
  }
];

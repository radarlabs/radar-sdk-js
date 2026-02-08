import path from 'path';
import { fileURLToPath } from 'url';
import typescript from 'rollup-plugin-typescript2';
import json from '@rollup/plugin-json';
import terser from '@rollup/plugin-terser';
import commonjs from '@rollup/plugin-commonjs';
import postcss from 'rollup-plugin-postcss';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import alias from '@rollup/plugin-alias';
import obfuscator from 'rollup-plugin-obfuscator';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const obfuscatorConfig = {
  compact: true,
  controlFlowFlattening: true,
  deadCodeInjection: true,
  stringArray: true,
  stringArrayRotate: true,
  stringArrayShuffle: true,
  stringArrayThreshold: 0.75,
};


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
        extract: 'radar.css',
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
        minimize: true,
      }),
    ],
  },

  // IIFE (core SDK feature - no maps)
  {
    input: 'src/api.ts',
    output: [
      {
        file: 'cdn/radar-core.js',
        format: 'iife',
        name: 'Radar',
        plugins: [onlyEmitFile()],
      },
      {
        file: 'cdn/radar-core.min.js',
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
    ],
  },

  // IIFE (core SDK + fraud, obfuscated)
  {
    input: 'plugins/radar-sdk-js-fraud/src/index.ts',
    output: [
      {
        file: 'cdn/radar-core-fraud.min.js',
        format: 'iife',
        name: 'Radar',
        plugins: [terser(), onlyEmitFile()],
      },
    ],
    plugins: [
      alias({
        entries: [
          { find: /^\.\.\/\.\.\/src\/(.*)/, replacement: path.resolve(__dirname, 'src/$1') },
        ],
      }),
      typescript({
        check: false,
      }),
      nodeResolve(),
      commonjs(),
      json(),
      obfuscator({ options: obfuscatorConfig }),
    ],
  }
];

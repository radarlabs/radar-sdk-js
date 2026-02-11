import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';
import { nodeResolve } from '@rollup/plugin-node-resolve';

/** @type {import("rollup").RollupOptions[]} */
const config = [
  // ES Module (written to /dist)
  {
    input: 'src/index.ts',
    output: [
      {
        dir: 'dist',
        entryFileNames: 'radar.js',
        format: 'esm',
        sourcemap: true,
      },
    ],
    plugins: [
      typescript({ declaration: true, declarationDir: './dist' }),
      nodeResolve(),
    ],
  },

  // IIFE (browser bundles, written to /cdn)
  {
    input: 'src/iife-entry.ts',
    output: [
      {
        file: 'cdn/radar.js',
        format: 'iife',
        name: 'Radar',
      },
      {
        file: 'cdn/radar.min.js',
        format: 'iife',
        name: 'Radar',
        plugins: [terser()],
      },
    ],
    plugins: [
      typescript({ declaration: false, outDir: './cdn' }),
      nodeResolve(),
    ],
  },

  // ESM plugin types entry (for plugin authors)
  {
    input: 'src/plugin.ts',
    output: [
      {
        dir: 'dist',
        entryFileNames: 'plugin.js',
        format: 'esm',
        sourcemap: true,
      },
    ],
    plugins: [
      typescript({ declaration: true, declarationDir: './dist' }),
      nodeResolve(),
    ],
  },
];

export default config;

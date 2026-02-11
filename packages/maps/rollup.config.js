import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
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
    external: ['radar-sdk-js', 'maplibre-gl'],
    plugins: [
      typescript({ declaration: true, declarationDir: './dist' }),
      nodeResolve(),
      postcss({
        extract: 'radar.css',
        minimize: true,
      }),
    ],
  },

  // IIFE (CDN) — bundles maplibre-gl
  {
    input: 'src/cdn-entry.ts',
    output: [
      {
        file: 'cdn/radar-maps.js',
        format: 'iife',
        name: 'RadarMaps',
      },
      {
        file: 'cdn/radar-maps.min.js',
        format: 'iife',
        name: 'RadarMaps',
        plugins: [terser()],
      },
    ],
    plugins: [
      typescript({ declaration: false, declarationDir: undefined, outDir: './cdn' }),
      nodeResolve(),
      commonjs(),
      postcss({
        extract: 'radar-maps.css',
        minimize: true,
      }),
    ],
  },
];

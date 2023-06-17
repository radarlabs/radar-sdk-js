import typescript from 'rollup-plugin-typescript2';
import json from '@rollup/plugin-json';
import terser from '@rollup/plugin-terser';

// remove typescript declarations from file in the CDN output folder
// (only keep the output file specified in the rollup config)
const onlyEmitFile = (options = {}) => ({
  name: 'only-emit-file',

  generateBundle(outputOptions, bundle) {
    const outputFile = outputOptions.file;
    const outputFileName = outputFile.split('/').pop();

    for (const fileName in bundle) {
      // remove file if doesn't match "file" in config
      if (fileName !== outputFileName) {
        delete bundle[fileName];
      }
    }
  }
});

export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/radar.js',
      format: 'esm',
    },
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
    json()
  ],
};

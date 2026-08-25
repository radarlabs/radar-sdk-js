export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  // core tests live in test/, plugin tests live in packages/<plugin>/test/
  testMatch: ['<rootDir>/test/**/*.test.ts', '<rootDir>/packages/*/test/**/*.test.ts'],
  setupFilesAfterEnv: ['./test/mock-data/globals.ts'],
  moduleNameMapper: {
    '\\.css$': '<rootDir>/test/mock-data/styles.js',
    // Plugins import core as 'radar-sdk-js', which normally resolves through node_modules
    // to the built dist/. Point it at src/ instead so `npm test` works without running a
    // build first. tsconfig.test.json has the matching entry for the typechecker.
    '^radar-sdk-js$': '<rootDir>/src/index.ts',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.test.json' }],
  },
};

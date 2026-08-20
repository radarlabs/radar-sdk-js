export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  testMatch: ['<rootDir>/test/**/*.test.ts', '<rootDir>/packages/*/test/**/*.test.ts'],
  setupFilesAfterEnv: ['./test/mock-data/globals.ts'],
  moduleNameMapper: {
    '\\.css$': '<rootDir>/test/mock-data/styles.js',
    // plugin sources import the core SDK by package name; resolve to source so the suite
    // runs against an unbuilt tree (node_modules/radar-sdk-js points at dist/)
    '^radar-sdk-js$': '<rootDir>/src/index.ts',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.test.json' }],
  },
};

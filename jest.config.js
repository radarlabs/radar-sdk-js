export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  testMatch: ['<rootDir>/test/**/*.test.ts'],
  setupFiles: [
    './test/mock-data/globals.js',
  ],
  moduleNameMapper: {
    "\\.css$": "<rootDir>/test/mock-data/styles.js"
  },
};

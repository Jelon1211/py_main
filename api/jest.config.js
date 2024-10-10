module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',

  // Automatically clear mock calls and instances between every test
  clearMocks: true,

  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: false,

  // The directory where Jest should output its coverage files
  coverageDirectory: 'coverage',

  // An array of regexp pattern strings used to skip coverage collection
  coveragePathIgnorePatterns: ['\\\\node_modules\\\\', 'tests/*', 'config/*'],

  roots: ['tests/'],

  testTimeout: 90 * 1000,

  forceExit: true,
};

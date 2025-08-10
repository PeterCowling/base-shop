module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '../../../',
  testMatch: ['<rootDir>/packages/plugins/sanity/__tests__/*.test.ts'],
  moduleNameMapper: {
    '^@acme/(.*)$': '<rootDir>/packages/$1/src'
  },
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/packages/plugins/sanity/tsconfig.json'
    }
  }
};

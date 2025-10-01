const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  moduleDirectories: ['node_modules', '<rootDir>/'],
  testEnvironment: 'node',
  testMatch: ['**/__tests__/api/**/*.test.ts'],
  globals: {
    'ts-jest': {
      tsconfig: {
        lib: ['es2015', 'dom']
      }
    }
  }
}

module.exports = createJestConfig(customJestConfig)
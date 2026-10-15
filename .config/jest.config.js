module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
		rootDir: '../',
    transform: {
      '^.+\\.tsx?$': ['ts-jest', {
        tsconfig: { module: 'CommonJS', resolveJsonModule: true, esModuleInterop: true },
      }],
    },
    testMatch: ['<rootDir>/test/**/*.test.ts'],
  };


module.exports = {
  globals: {
    'ts-jest': {
      tsConfig: './tsconfig.test.json',
    },
  },
  testEnvironmentOptions: { resources: 'usable' },
  preset: 'ts-jest',
};

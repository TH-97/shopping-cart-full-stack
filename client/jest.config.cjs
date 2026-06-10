/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'jest-environment-jsdom',
  forceExit: true,
  testEnvironmentOptions: {
    customExportConditions: [''],
  },
  setupFiles: ['<rootDir>/jest.polyfills.cjs'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  transform: {
    '^.+\\.(mjs|[tj]sx?)$': ['ts-jest', { tsconfig: 'tsconfig.jest.json' }],
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(msw|@mswjs|@open-draft|@bundled-es-modules|until-async|outvariant|strict-event-emitter|is-node-process|headers-polyfill|rettime|graphql)/|.*\\.mjs$)',
  ],
};

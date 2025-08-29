export default {
  displayName: 'konfi-ui',
  preset: '../../jest.preset.js',
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  coverageDirectory: '../../coverage/apps/konfi-ui',
  transform: {
    '^.+\\.(ts|mjs|js|html)$': [
      'jest-preset-angular',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
        stringifyContentPathRegex: '\\.(html|svg)$',
      },
    ],
  },
  transformIgnorePatterns: [
    'node_modules/(?!.*\\.mjs$|@stomp/.*|sockjs-client/.*|@primeuix/.*|@ngrx/.*)',
  ],
  moduleNameMapper: {
    '^@stomp/rx-stomp$':
      '<rootDir>/src/test-utils/__mocks__/@stomp/rx-stomp.js',
    '^@stomp/stompjs$': '<rootDir>/src/test-utils/__mocks__/@stomp/stompjs.js',
    '^sockjs-client$': '<rootDir>/src/test-utils/__mocks__/sockjs-client.js',
  },
  snapshotSerializers: [
    'jest-preset-angular/build/serializers/no-ng-attributes',
    'jest-preset-angular/build/serializers/ng-snapshot',
    'jest-preset-angular/build/serializers/html-comment',
  ],
};

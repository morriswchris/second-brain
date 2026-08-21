/** @type {import('jest').Config} */
module.exports = {
  // jest-expo ships a complete transform + transformIgnorePatterns setup for
  // Expo/React Native (including expo-modules-core and reanimated). Don't
  // override transformIgnorePatterns unless you add a package it doesn't cover.
  preset: 'jest-expo',
  moduleNameMapper: {
    // Native/Node test runs don't process stylesheets; stub CSS + CSS modules.
    '\\.css$': '<rootDir>/jest/style-mock.js',
  },
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts', '!src/**/*.web.{ts,tsx}'],
};

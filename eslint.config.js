// Flat ESLint config (ESLint 9+). Uses Expo's shared config and turns off
// stylistic rules that would conflict with Prettier.
const expoConfig = require('eslint-config-expo/flat');
const eslintConfigPrettier = require('eslint-config-prettier');

module.exports = [
  ...expoConfig,
  eslintConfigPrettier,
  {
    ignores: ['dist/*', '.expo/*', 'coverage/*', 'node_modules/*', 'expo-env.d.ts'],
  },
];

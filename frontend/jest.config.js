module.exports = {
  preset: 'jest-expo',
  testEnvironment: 'jsdom',
  setupFiles: ['./jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(@react-native|react-native|@react-navigation|@expo|expo|expo-modules-core|expo-modules-.*|expo-router|react-native-gesture-handler)/)'
  ],
};
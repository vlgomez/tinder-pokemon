// Mocks to allow running Jest without transforming native/expo modules

// react-native-reanimated minimal mock (avoid importing package mock that uses ESM/TS)
jest.mock('react-native-reanimated', () => {
  const RN = require('react-native');
  return {
    __esModule: true,
    default: RN,
    View: RN.View,
    useSharedValue: (init) => ({ value: init }),
    useAnimatedStyle: () => () => ({}),
    withTiming: (toValue, _, cb) => { if (cb) cb(); return toValue; },
    withSpring: (toValue) => toValue,
    interpolate: () => 0,
    runOnJS: (fn) => fn,
  };
});

// react-native-gesture-handler minimal mock
jest.mock('react-native-gesture-handler', () => {
  const React = require('react');
  return {
    Gesture: {
      Pan: () => ({ enabled: () => ({ onUpdate: () => ({ onEnd: () => ({}) }) }) }),
    },
    GestureDetector: ({ children }) => React.createElement(React.Fragment, null, children),
  };
});

// expo-router mock (useRouter return value)
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

// expo-asset and expo modules basic mocks
jest.mock('expo-asset', () => ({
  Asset: { fromModule: () => ({}) },
}));

// @expo/vector-icons mock (Ionicons)
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const MockIcon = ({ name, size, color }) => React.createElement('Text', null, name || 'icon');
  return { Ionicons: MockIcon };
});

// expo-font mock
jest.mock('expo-font', () => ({
  loadAsync: jest.fn(() => Promise.resolve()),
}));

// expo-haptics mock
jest.mock('expo-haptics', () => ({
  notificationAsync: jest.fn(() => Promise.resolve()),
  impactAsync: jest.fn(() => Promise.resolve()),
  NotificationFeedbackType: { Success: 'success' },
  ImpactFeedbackStyle: { Light: 'light' },
}));

// expo-constants mock
jest.mock('expo-constants', () => ({
  expoConfig: {},
  manifest: {},
  deviceName: 'test-device',
}));

// AsyncStorage mock
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(() => Promise.resolve(null)),
    setItem: jest.fn(() => Promise.resolve()),
    removeItem: jest.fn(() => Promise.resolve()),
  },
}));

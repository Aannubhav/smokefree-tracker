const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Shim native-only packages for web — they call registerWebModule with non-class
// implementations which crashes React Native Web.
const WEB_SHIMS = {
  'react-native-screens': 'react-native-screens.js',
  'react-native-safe-area-context': 'react-native-safe-area-context.js',
  'react-native-gesture-handler': 'react-native-gesture-handler.js',
};

const _resolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && WEB_SHIMS[moduleName]) {
    return {
      type: 'sourceFile',
      filePath: path.resolve(__dirname, 'src/shims', WEB_SHIMS[moduleName]),
    };
  }
  if (_resolveRequest) return _resolveRequest(context, moduleName, platform);
  return context.resolveRequest(context, moduleName, platform);
};

// Keep class names during minification so registerWebModule can identify them
config.transformer.minifierConfig = {
  ...config.transformer.minifierConfig,
  keep_classnames: true,
  keep_fnames: true,
};

module.exports = config;

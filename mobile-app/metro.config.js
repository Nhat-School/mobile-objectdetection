const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * Adds .tflite to assetExts so TensorFlow Lite models can be bundled seamlessly.
 */
const defaultConfig = getDefaultConfig(__dirname);
const { assetExts, sourceExts } = defaultConfig.resolver;

const config = {
  resolver: {
    assetExts: [...assetExts, 'tflite'],
    sourceExts: [...sourceExts, 'cjs'],
  },
};

module.exports = mergeConfig(defaultConfig, config);

const { getDefaultConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 * รองรับไฟล์ .riv สำหรับ Rive animation
 */
const defaultConfig = getDefaultConfig(__dirname);
const { assetExts } = defaultConfig.resolver;
if (!assetExts.includes('riv')) {
  defaultConfig.resolver.assetExts = [...assetExts, 'riv'];
}
module.exports = defaultConfig;

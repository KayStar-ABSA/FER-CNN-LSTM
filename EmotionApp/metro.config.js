const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true, // giúp Metro bundler nhanh hơn
      },
    }),
  },
  // Giới hạn số lượng luồng worker nếu máy yếu hoặc hay treo
  maxWorkers: 1,

  // Tránh theo dõi những thư mục nặng gây lỗi
  watchFolders: [
    path.resolve(__dirname),
  ],
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);

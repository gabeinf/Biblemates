const { getDefaultConfig } = require('expo/metro-config')

const config = getDefaultConfig(__dirname)
// Rive animation files are bundled as assets.
config.resolver.assetExts.push('riv')

module.exports = config

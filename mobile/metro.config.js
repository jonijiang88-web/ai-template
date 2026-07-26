const { getDefaultConfig } = require('expo/metro-config')
const path = require('node:path')

/** 项目根目录（monorepo 根） */
const projectRoot = __dirname
/** 共享包路径 */
const sharedPackageRoot = path.resolve(projectRoot, '../packages/shared')

const config = getDefaultConfig(projectRoot)

// 将共享包加入 watch 列表，并允许 Metro 编译其 TypeScript 源码
config.watchFolders = [...(config.watchFolders ?? []), sharedPackageRoot]

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(projectRoot, '../node_modules'),
]

// 确保共享包中的 .ts 文件能被 Metro 正确处理
config.resolver.sourceExts = [...(config.resolver.sourceExts ?? []), 'ts', 'tsx']

module.exports = config

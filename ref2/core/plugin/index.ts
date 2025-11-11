export * from './types'
export * from './EventBus'
export * from './PluginManager'
export * from './PluginManagerV2'
export * from './PluginManifest'
export * from './PluginDiscovery'
export * from './PluginLoader'
export * from './CommandRegistry'
export * from './ConfigurationService'
export * from './EventEmitter'

// Export both old and new plugin managers for migration
export { pluginManager } from './PluginManager'
export { pluginManager as pluginManagerV2 } from './PluginManagerV2'

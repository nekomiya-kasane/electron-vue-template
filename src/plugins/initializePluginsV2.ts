import { pluginManagerV2 } from '@/core/plugin'

/**
 * Initialize the plugin system (V2)
 * Uses dynamic discovery and settings-based enable/disable
 */
export async function initializePluginsV2() {
  try {
    console.log('[Plugins] Initializing plugin system V2...')
    
    // Initialize the plugin manager
    // This will:
    // 1. Discover all available plugins
    // 2. Load enabled plugins from settings
    // 3. Register and activate them
    await pluginManagerV2.initialize()

    console.log('[Plugins] Plugin system V2 initialized successfully')
    
    // Return the manager for further use
    return pluginManagerV2
  } catch (error) {
    console.error('[Plugins] Failed to initialize plugin system V2:', error)
    throw error
  }
}

/**
 * Reload the plugin system
 * Useful for development and hot-reload
 */
export async function reloadPlugins() {
  try {
    console.log('[Plugins] Reloading plugin system...')
    await pluginManagerV2.reload()
    console.log('[Plugins] Plugin system reloaded successfully')
  } catch (error) {
    console.error('[Plugins] Failed to reload plugin system:', error)
    throw error
  }
}

/**
 * Enable a plugin by ID
 */
export async function enablePlugin(pluginId: string) {
  try {
    await pluginManagerV2.enablePlugin(pluginId)
  } catch (error) {
    console.error(`[Plugins] Failed to enable plugin "${pluginId}":`, error)
    throw error
  }
}

/**
 * Disable a plugin by ID
 */
export async function disablePlugin(pluginId: string) {
  try {
    await pluginManagerV2.disablePlugin(pluginId)
  } catch (error) {
    console.error(`[Plugins] Failed to disable plugin "${pluginId}":`, error)
    throw error
  }
}

/**
 * Check if a plugin is enabled
 */
export function isPluginEnabled(pluginId: string): boolean {
  return pluginManagerV2.isPluginEnabled(pluginId)
}

/**
 * Get all discovered plugins (including disabled)
 */
export function getAllPlugins() {
  return pluginManagerV2.getAllDiscoveredPlugins()
}

/**
 * Get all active plugins
 */
export function getActivePlugins() {
  return pluginManagerV2.getAllPlugins()
}

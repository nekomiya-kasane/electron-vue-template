import type { Plugin } from './types'
import type { PluginManifest } from './PluginManifest'

/**
 * Plugin Loader
 * Responsible for loading plugin modules dynamically
 */
export class PluginLoader {
  private loadedModules: Map<string, any> = new Map()

  /**
   * Load a plugin module by ID
   */
  async loadPlugin(pluginId: string, manifest: PluginManifest): Promise<Plugin | null> {
    try {
      // Check if already loaded
      if (this.loadedModules.has(pluginId)) {
        return this.loadedModules.get(pluginId)
      }

      // Determine the module path
      const modulePath = manifest.main || this.getDefaultModulePath(pluginId)
      
      // Dynamically import the plugin module
      const pluginModule = await this.importPluginModule(modulePath, pluginId)
      
      if (!pluginModule) {
        console.error(`[PluginLoader] Failed to load plugin "${pluginId}": module not found`)
        return null
      }

      // Cache the loaded module
      this.loadedModules.set(pluginId, pluginModule)
      
      return pluginModule
    } catch (error) {
      console.error(`[PluginLoader] Failed to load plugin "${pluginId}":`, error)
      return null
    }
  }

  /**
   * Import a plugin module
   */
  private async importPluginModule(modulePath: string, pluginId: string): Promise<Plugin | null> {
    try {
      // Try to import from the specified path or default location
      let module: any
      
      if (modulePath.startsWith('./') || modulePath.startsWith('../')) {
        // Relative path
        module = await import(/* @vite-ignore */ modulePath)
      } else {
        // Try built-in plugins path
        const fileName = this.getPluginFileName(pluginId)
        module = await import(`../../plugins/${fileName}.ts`)
      }

      // Extract the plugin export
      const exportName = this.getPluginExportName(pluginId)
      const plugin = module[exportName] || module.default
      
      if (!plugin) {
        console.error(`[PluginLoader] Plugin "${pluginId}" does not export a valid plugin object`)
        return null
      }

      return plugin
    } catch (error) {
      console.error(`[PluginLoader] Failed to import plugin module "${modulePath}":`, error)
      return null
    }
  }

  /**
   * Get default module path for a plugin
   */
  private getDefaultModulePath(pluginId: string): string {
    const fileName = this.getPluginFileName(pluginId)
    return `../../plugins/${fileName}.ts`
  }

  /**
   * Get plugin file name from plugin ID
   */
  private getPluginFileName(pluginId: string): string {
    // Convert kebab-case to PascalCase
    return pluginId
      .split('-')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join('') + 'Plugin'
  }

  /**
   * Get plugin export name from plugin ID
   */
  private getPluginExportName(pluginId: string): string {
    return this.getPluginFileName(pluginId)
  }

  /**
   * Unload a plugin module
   */
  unloadPlugin(pluginId: string): void {
    this.loadedModules.delete(pluginId)
  }

  /**
   * Clear all loaded modules
   */
  clearAll(): void {
    this.loadedModules.clear()
  }

  /**
   * Check if a plugin is loaded
   */
  isLoaded(pluginId: string): boolean {
    return this.loadedModules.has(pluginId)
  }
}

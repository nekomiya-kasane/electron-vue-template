import type { PluginManifest } from './PluginManifest'

/**
 * Plugin Discovery Service
 * Discovers and loads plugins from the plugins directory
 * Similar to VSCode's extension host
 */
export class PluginDiscovery {
  private discoveredPlugins: Map<string, PluginManifest> = new Map()
  private pluginsPath: string

  constructor(pluginsPath: string = './src/plugins') {
    this.pluginsPath = pluginsPath
    // pluginsPath will be used in future file system implementation
    // Currently using dynamic imports, but will use fs.readdir in the future
  }

  /**
   * Discover all plugins in the plugins directory
   * In a real implementation, this would scan the filesystem
   * For now, we'll use a registry-based approach
   */
  async discoverPlugins(): Promise<Map<string, PluginManifest>> {
    console.log(`[PluginDiscovery] Discovering plugins in ${this.pluginsPath}...`)
    
    // Clear previous discoveries
    this.discoveredPlugins.clear()

    try {
      // In a real implementation, we would:
      // 1. Scan the plugins directory
      // 2. Read each plugin's package.json or manifest.json
      // 3. Validate the manifest
      // 4. Register the plugin
      
      // For now, we'll use dynamic imports to discover built-in plugins
      const builtinPlugins = await this.discoverBuiltinPlugins()
      
      for (const [id, manifest] of builtinPlugins) {
        this.discoveredPlugins.set(id, manifest)
      }

      console.log(`[PluginDiscovery] Discovered ${this.discoveredPlugins.size} plugins`)
      return this.discoveredPlugins
    } catch (error) {
      console.error('[PluginDiscovery] Failed to discover plugins:', error)
      throw error
    }
  }

  /**
   * Discover built-in plugins
   * These are plugins that come with the application
   */
  private async discoverBuiltinPlugins(): Promise<Map<string, PluginManifest>> {
    const plugins = new Map<string, PluginManifest>()

    // Register built-in plugins with their manifests
    const builtinPluginIds = [
      'document',
      'editor',
      'editor-code',
      'model3d',
      'graph',
      'settings'
    ]

    for (const id of builtinPluginIds) {
      try {
        // Try to load the plugin's manifest
        const manifest = await this.loadPluginManifest(id)
        if (manifest) {
          manifest.isBuiltin = true
          plugins.set(id, manifest)
        }
      } catch (error) {
        console.warn(`[PluginDiscovery] Failed to load manifest for plugin "${id}":`, error)
      }
    }

    return plugins
  }

  /**
   * Load a plugin's manifest
   * In a real implementation, this would read from package.json or manifest.json
   */
  private async loadPluginManifest(pluginId: string): Promise<PluginManifest | null> {
    try {
      // Try to dynamically import the plugin to get its metadata
      const pluginModule = await import(`../../plugins/${this.getPluginFileName(pluginId)}.ts`)
      const plugin = pluginModule[this.getPluginExportName(pluginId)]
      
      if (plugin && plugin.metadata) {
        // Convert old metadata format to new manifest format
        return this.convertToManifest(plugin.metadata, pluginId)
      }
      
      return null
    } catch (error) {
      console.error(`[PluginDiscovery] Failed to load plugin "${pluginId}":`, error)
      return null
    }
  }

  /**
   * Convert old plugin metadata to new manifest format
   */
  private convertToManifest(oldMetadata: any, pluginId: string): PluginManifest {
    return {
      id: oldMetadata.id || pluginId,
      name: oldMetadata.name || pluginId,
      version: oldMetadata.version || '1.0.0',
      description: oldMetadata.description,
      author: oldMetadata.author,
      dependencies: oldMetadata.dependencies,
      isBuiltin: true,
      activationEvents: ['onStartup'], // Default activation
      contributes: {}
    }
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
   * Get a discovered plugin by ID
   */
  getPlugin(id: string): PluginManifest | undefined {
    return this.discoveredPlugins.get(id)
  }

  /**
   * Get all discovered plugins
   */
  getAllPlugins(): Map<string, PluginManifest> {
    return new Map(this.discoveredPlugins)
  }

  /**
   * Validate a plugin manifest
   */
  validateManifest(manifest: PluginManifest): boolean {
    if (!manifest.id || !manifest.name || !manifest.version) {
      console.error('[PluginDiscovery] Invalid manifest: missing required fields')
      return false
    }

    // Validate version format (semver)
    const versionRegex = /^\d+\.\d+\.\d+/
    if (!versionRegex.test(manifest.version)) {
      console.error('[PluginDiscovery] Invalid manifest: invalid version format')
      return false
    }

    return true
  }

  /**
   * Reload plugins (for hot-reload support)
   */
  async reloadPlugins(): Promise<Map<string, PluginManifest>> {
    console.log('[PluginDiscovery] Reloading plugins...')
    return this.discoverPlugins()
  }

  /**
   * Watch for plugin changes (for development)
   */
  watchPlugins(callback: (plugins: Map<string, PluginManifest>) => void): () => void {
    // In a real implementation, this would use fs.watch or chokidar
    // and call the callback when changes are detected
    console.log('[PluginDiscovery] Watching plugins for changes...')
    console.log('[PluginDiscovery] Callback registered for future use:', typeof callback)
    
    return () => {
      console.log('[PluginDiscovery] Stopped watching plugins')
    }
  }
}

import { reactive, markRaw } from 'vue'
import { EventBus } from './EventBus'
import { CommandRegistry } from './CommandRegistry'
import { ConfigurationService } from './ConfigurationService'
import { DisposableStore } from './EventEmitter'
import { PluginDiscovery } from './PluginDiscovery'
import { PluginLoader } from './PluginLoader'
import type { PluginManifest } from './PluginManifest'
import {
  PluginStatus,
  type Plugin,
  type PluginContext,
  type PluginInstance,
  type IconBarButton,
  type SidebarConfig,
  type MainViewConfig,
  type MenuConfig,
  type SidebarPosition,
  type StatusBarItem,
  type DocumentType,
  type Document
} from './types'

/**
 * Enhanced Plugin Manager with VSCode-like features
 * - Dynamic plugin discovery
 * - Enable/disable functionality
 * - Unified settings integration
 * - Hot-reload support
 */
export class PluginManagerV2 {
  private plugins: Map<string, PluginInstance> = new Map()
  private manifests: Map<string, PluginManifest> = new Map()
  private eventBus: EventBus = new EventBus()
  private storage: Map<string, any> = new Map()
  
  // Services
  private commandRegistry: CommandRegistry = new CommandRegistry()
  private configService: ConfigurationService = new ConfigurationService()
  private discovery: PluginDiscovery = new PluginDiscovery()
  private loader: PluginLoader = new PluginLoader()
  
  // Disposable management
  private pluginDisposables: Map<string, DisposableStore> = new Map()

  // Reactive state
  public state = reactive({
    documentTypes: new Map<string, DocumentType>(),
    documents: new Map<string, Document>(),
    activeDocumentId: null as string | null,
    iconButtons: [] as (IconBarButton & { documentTypes?: string[] })[],
    sidebars: new Map<string, SidebarConfig & { documentTypes?: string[] }>(),
    mainViews: new Map<string, MainViewConfig>(),
    menuSections: [] as MenuConfig['sections'],
    statusBarItems: [] as StatusBarItem[],
    activeSidebars: {
      left: null as string | null,
      right: null as string | null
    },
    activeMainView: null as { id: string; props?: Record<string, any> } | null
  })

  /**
   * Initialize the plugin system
   * Discovers and loads all plugins based on settings
   */
  async initialize(): Promise<void> {
    console.log('[PluginManager] Initializing plugin system...')

    try {
      // Discover all available plugins
      const discoveredPlugins = await this.discovery.discoverPlugins()
      
      // Store manifests
      for (const [id, manifest] of discoveredPlugins) {
        this.manifests.set(id, manifest)
      }

      // Load enabled plugins from settings
      const enabledPlugins = this.getEnabledPlugins()
      
      // Register and activate enabled plugins
      for (const pluginId of enabledPlugins) {
        const manifest = this.manifests.get(pluginId)
        if (manifest) {
          await this.registerAndActivatePlugin(pluginId, manifest)
        }
      }

      console.log(`[PluginManager] Initialized ${this.plugins.size} plugins`)
    } catch (error) {
      console.error('[PluginManager] Failed to initialize plugin system:', error)
      throw error
    }
  }

  /**
   * Get list of enabled plugins from settings
   */
  private getEnabledPlugins(): string[] {
    const allPlugins = Array.from(this.manifests.keys())
    const disabledPlugins = this.configService.get<string[]>('plugins.disabled', 'global') || []
    
    // Return all plugins except disabled ones
    return allPlugins.filter(id => !disabledPlugins.includes(id))
  }

  /**
   * Check if a plugin is enabled
   */
  isPluginEnabled(pluginId: string): boolean {
    const disabledPlugins = this.configService.get<string[]>('plugins.disabled', 'global') || []
    return !disabledPlugins.includes(pluginId)
  }

  /**
   * Enable a plugin
   */
  async enablePlugin(pluginId: string): Promise<void> {
    if (this.isPluginEnabled(pluginId)) {
      console.log(`[PluginManager] Plugin "${pluginId}" is already enabled`)
      return
    }

    // Remove from disabled list
    const disabledPlugins = this.configService.get<string[]>('plugins.disabled', 'global') || []
    const newDisabled = disabledPlugins.filter(id => id !== pluginId)
    this.configService.update('plugins.disabled', newDisabled, 'global')

    // Load and activate the plugin
    const manifest = this.manifests.get(pluginId)
    if (manifest) {
      await this.registerAndActivatePlugin(pluginId, manifest)
      this.eventBus.emit('plugin:enabled', pluginId)
      console.log(`[PluginManager] Plugin "${pluginId}" enabled`)
    }
  }

  /**
   * Disable a plugin
   */
  async disablePlugin(pluginId: string): Promise<void> {
    if (!this.isPluginEnabled(pluginId)) {
      console.log(`[PluginManager] Plugin "${pluginId}" is already disabled`)
      return
    }

    // Add to disabled list
    const disabledPlugins = this.configService.get<string[]>('plugins.disabled', 'global') || []
    if (!disabledPlugins.includes(pluginId)) {
      disabledPlugins.push(pluginId)
      this.configService.update('plugins.disabled', disabledPlugins, 'global')
    }

    // Deactivate and unregister the plugin
    await this.unregisterPlugin(pluginId)
    this.eventBus.emit('plugin:disabled', pluginId)
    console.log(`[PluginManager] Plugin "${pluginId}" disabled`)
  }

  /**
   * Register and activate a plugin
   */
  private async registerAndActivatePlugin(pluginId: string, manifest: PluginManifest): Promise<void> {
    try {
      // Load the plugin module
      const plugin = await this.loader.loadPlugin(pluginId, manifest)
      if (!plugin) {
        throw new Error(`Failed to load plugin module for "${pluginId}"`)
      }

      // Register the plugin
      await this.registerPlugin(plugin)

      // Activate if needed
      if (this.shouldActivatePlugin(manifest)) {
        await this.activatePlugin(pluginId)
      }
    } catch (error) {
      console.error(`[PluginManager] Failed to register/activate plugin "${pluginId}":`, error)
      throw error
    }
  }

  /**
   * Check if a plugin should be activated based on activation events
   */
  private shouldActivatePlugin(manifest: PluginManifest): boolean {
    if (!manifest.activationEvents || manifest.activationEvents.length === 0) {
      return true // Activate by default
    }

    // Check if any activation event matches
    for (const event of manifest.activationEvents) {
      if (event === 'onStartup') {
        return true
      }
      // Add more activation event checks here
    }

    return false
  }

  /**
   * Register a plugin
   */
  async registerPlugin(plugin: Plugin): Promise<void> {
    const { id } = plugin.metadata

    if (this.plugins.has(id)) {
      throw new Error(`Plugin "${id}" is already registered`)
    }

    // Check dependencies
    if (plugin.metadata.dependencies) {
      for (const depId of plugin.metadata.dependencies) {
        if (!this.plugins.has(depId)) {
          throw new Error(`Plugin "${id}" depends on "${depId}" which is not installed`)
        }
      }
    }

    const instance: PluginInstance = {
      plugin: markRaw(plugin),
      status: PluginStatus.UNINSTALLED
    }

    this.plugins.set(id, instance)

    try {
      // Create plugin context
      const context = this.createContext(id)

      // Call onInstall hook
      if (plugin.onInstall) {
        await plugin.onInstall(context)
      }

      // Call install method
      await plugin.install(context)

      instance.status = PluginStatus.INSTALLED

      // Emit event
      this.eventBus.emit('plugin:installed', id)

      console.log(`[PluginManager] Plugin "${id}" installed successfully`)
    } catch (error) {
      instance.status = PluginStatus.ERROR
      instance.error = error as Error
      console.error(`[PluginManager] Failed to install plugin "${id}":`, error)
      throw error
    }
  }

  /**
   * Activate a plugin
   */
  async activatePlugin(id: string): Promise<void> {
    const instance = this.plugins.get(id)
    if (!instance) {
      throw new Error(`Plugin "${id}" is not registered`)
    }

    if (instance.status === PluginStatus.ACTIVE) {
      return
    }

    try {
      const context = this.createContext(id)

      if (instance.plugin.onActivate) {
        await instance.plugin.onActivate(context)
      }

      instance.status = PluginStatus.ACTIVE
      this.eventBus.emit('plugin:activated', id)

      console.log(`[PluginManager] Plugin "${id}" activated`)
    } catch (error) {
      instance.status = PluginStatus.ERROR
      instance.error = error as Error
      console.error(`[PluginManager] Failed to activate plugin "${id}":`, error)
      throw error
    }
  }

  /**
   * Deactivate a plugin
   */
  async deactivatePlugin(id: string): Promise<void> {
    const instance = this.plugins.get(id)
    if (!instance) {
      throw new Error(`Plugin "${id}" is not registered`)
    }

    if (instance.status !== PluginStatus.ACTIVE) {
      return
    }

    try {
      const context = this.createContext(id)

      if (instance.plugin.onDeactivate) {
        await instance.plugin.onDeactivate(context)
      }

      instance.status = PluginStatus.INSTALLED
      this.eventBus.emit('plugin:deactivated', id)

      console.log(`[PluginManager] Plugin "${id}" deactivated`)
    } catch (error) {
      console.error(`[PluginManager] Failed to deactivate plugin "${id}":`, error)
      throw error
    }
  }

  /**
   * Unregister a plugin
   */
  async unregisterPlugin(id: string): Promise<void> {
    const instance = this.plugins.get(id)
    if (!instance) {
      return
    }

    try {
      // Deactivate first
      if (instance.status === PluginStatus.ACTIVE) {
        await this.deactivatePlugin(id)
      }

      const context = this.createContext(id)

      if (instance.plugin.onUninstall) {
        await instance.plugin.onUninstall(context)
      }

      // Clean up resources
      this.cleanupPluginResources(id)

      this.plugins.delete(id)
      this.eventBus.emit('plugin:uninstalled', id)

      console.log(`[PluginManager] Plugin "${id}" uninstalled`)
    } catch (error) {
      console.error(`[PluginManager] Failed to uninstall plugin "${id}":`, error)
      throw error
    }
  }

  /**
   * Reload the plugin system
   */
  async reload(): Promise<void> {
    console.log('[PluginManager] Reloading plugin system...')

    // Deactivate and unregister all plugins
    for (const [id] of this.plugins) {
      await this.unregisterPlugin(id)
    }

    // Re-initialize
    await this.initialize()

    this.eventBus.emit('plugin:system:reloaded')
    console.log('[PluginManager] Plugin system reloaded')
  }

  /**
   * Create plugin context
   */
  private createContext(pluginId: string): PluginContext {
    // Create disposable store for the plugin
    if (!this.pluginDisposables.has(pluginId)) {
      this.pluginDisposables.set(pluginId, new DisposableStore())
    }
    const disposables = this.pluginDisposables.get(pluginId)!
    
    return {
      registerDocumentType: (type: DocumentType) => {
        this.state.documentTypes.set(type.id, type)
        this.eventBus.emit('documentType:registered', type.id)
      },

      registerIconButton: (button: IconBarButton, documentTypes?: string[]) => {
        this.state.iconButtons.push({ 
          ...button, 
          id: `${pluginId}:${button.id}`,
          documentTypes 
        })
      },

      registerSidebar: (config: SidebarConfig, documentTypes?: string[]) => {
        const id = `${pluginId}:${config.id}`
        this.state.sidebars.set(id, { 
          ...config, 
          id, 
          component: markRaw(config.component),
          documentTypes 
        })
      },

      registerMainView: (config: MainViewConfig) => {
        const id = `${pluginId}:${config.id}`
        this.state.mainViews.set(id, { ...config, id, component: markRaw(config.component) })
      },

      registerMenu: (config: MenuConfig) => {
        this.state.menuSections.push(...config.sections)
      },

      registerStatusBarItem: (item: StatusBarItem) => {
        const fullItem = {
          ...item,
          id: `${pluginId}:${item.id}`,
          component: item.component ? markRaw(item.component) : undefined,
          priority: item.priority ?? 0
        }
        this.state.statusBarItems.push(fullItem)
        this.state.statusBarItems.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
      },

      createDocument: (document: Document) => {
        this.state.documents.set(document.id, document)
        this.eventBus.emit('document:created', document)
      },

      switchToDocument: (documentId: string) => {
        const document = this.state.documents.get(documentId)
        if (!document) {
          console.warn(`[PluginManager] Document "${documentId}" not found`)
          return
        }
        
        this.state.activeDocumentId = documentId
        this.eventBus.emit('document:switched', documentId, document)
        this.updateContextForDocument(document)
      },

      activateSidebar: (id: string, position: SidebarPosition) => {
        const fullId = id.includes(':') ? id : `${pluginId}:${id}`
        this.state.activeSidebars[position] = fullId
        this.eventBus.emit('sidebar:activated', fullId, position)
      },

      closeSidebar: (position: SidebarPosition) => {
        this.state.activeSidebars[position] = null
        this.eventBus.emit('sidebar:closed', position)
      },

      switchMainView: (id: string, props?: Record<string, any>) => {
        const fullId = id.includes(':') ? id : `${pluginId}:${id}`
        this.state.activeMainView = { id: fullId, props }
        this.eventBus.emit('mainview:switched', fullId, props)
      },

      on: (event: string, handler: (...args: any[]) => void) => {
        this.eventBus.on(event, handler)
      },

      off: (event: string, handler: (...args: any[]) => void) => {
        this.eventBus.off(event, handler)
      },

      emit: (event: string, ...args: any[]) => {
        this.eventBus.emit(event, ...args)
      },

      getPlugin: (id: string) => {
        return this.plugins.get(id)?.plugin
      },

      storage: {
        get: (key: string) => {
          return this.storage.get(`${pluginId}:${key}`)
        },
        set: (key: string, value: any) => {
          this.storage.set(`${pluginId}:${key}`, value)
        },
        remove: (key: string) => {
          this.storage.delete(`${pluginId}:${key}`)
        }
      },

      commands: {
        registerCommand: (id: string, handler: (...args: any[]) => any, options?: { description?: string; category?: string }) => {
          const fullId = `${pluginId}.${id}`
          this.commandRegistry.registerCommand(fullId, handler, options)
          
          disposables.add({
            dispose: () => this.commandRegistry.unregisterCommand(fullId)
          })
          
          return fullId
        },
        
        executeCommand: <T = any>(id: string, ...args: any[]) => {
          return this.commandRegistry.executeCommand<T>(id, ...args)
        },
        
        getCommands: () => {
          return this.commandRegistry.getAllCommands()
        }
      },

      configuration: {
        get: <T = any>(section: string, defaultValue?: T) => {
          return this.configService.get<T>(section) ?? defaultValue
        },
        
        update: (section: string, value: any, scope?: 'global' | 'workspace') => {
          this.configService.update(section, value, scope)
        },
        
        has: (section: string) => {
          return this.configService.has(section)
        },
        
        getConfiguration: (section?: string) => {
          return this.configService.getConfiguration(section)
        },
        
        onDidChangeConfiguration: (listener: (event: any) => void) => {
          const dispose = this.configService.onDidChangeConfiguration(listener)
          disposables.add({ dispose })
          return dispose
        }
      },

      subscriptions: disposables
    }
  }

  /**
   * Clean up plugin resources
   */
  private cleanupPluginResources(pluginId: string): void {
    // Clean up disposables
    const disposables = this.pluginDisposables.get(pluginId)
    if (disposables) {
      disposables.dispose()
      this.pluginDisposables.delete(pluginId)
    }

    // Clean up UI elements
    this.state.iconButtons = this.state.iconButtons.filter(
      btn => !btn.id.startsWith(`${pluginId}:`)
    )

    for (const [id] of this.state.sidebars) {
      if (id.startsWith(`${pluginId}:`)) {
        this.state.sidebars.delete(id)
      }
    }

    for (const [id] of this.state.mainViews) {
      if (id.startsWith(`${pluginId}:`)) {
        this.state.mainViews.delete(id)
      }
    }

    this.state.statusBarItems = this.state.statusBarItems.filter(
      item => !item.id.startsWith(`${pluginId}:`)
    )

    // Clean up storage
    for (const [key] of this.storage) {
      if (key.startsWith(`${pluginId}:`)) {
        this.storage.delete(key)
      }
    }
  }

  /**
   * Update context for document
   */
  private updateContextForDocument(document: Document): void {
    const documentType = document.type
    this.eventBus.emit('document:context-changed', documentType)
    console.log(`[PluginManager] Document context updated for type: ${documentType}`)
  }

  /**
   * Get visible icon buttons for current document
   */
  getVisibleIconButtons(): (IconBarButton & { documentTypes?: string[] })[] {
    const activeDoc = this.state.activeDocumentId 
      ? this.state.documents.get(this.state.activeDocumentId)
      : null
    
    if (!activeDoc) {
      return this.state.iconButtons.filter(btn => !btn.documentTypes || btn.documentTypes.length === 0)
    }
    
    return this.state.iconButtons.filter(btn => 
      !btn.documentTypes || 
      btn.documentTypes.length === 0 || 
      btn.documentTypes.includes(activeDoc.type)
    )
  }

  /**
   * Get visible sidebars for current document
   */
  getVisibleSidebars(): Map<string, SidebarConfig & { documentTypes?: string[] }> {
    const activeDoc = this.state.activeDocumentId 
      ? this.state.documents.get(this.state.activeDocumentId)
      : null
    
    const visible = new Map<string, SidebarConfig & { documentTypes?: string[] }>()
    
    for (const [id, sidebar] of this.state.sidebars) {
      if (!activeDoc) {
        if (!sidebar.documentTypes || sidebar.documentTypes.length === 0) {
          visible.set(id, sidebar)
        }
      } else {
        if (!sidebar.documentTypes || 
            sidebar.documentTypes.length === 0 || 
            sidebar.documentTypes.includes(activeDoc.type)) {
          visible.set(id, sidebar)
        }
      }
    }
    
    return visible
  }

  /**
   * Get all discovered plugins (including disabled)
   */
  getAllDiscoveredPlugins(): Map<string, PluginManifest> {
    return new Map(this.manifests)
  }

  /**
   * Get plugin instance
   */
  getPluginInstance(id: string): PluginInstance | undefined {
    return this.plugins.get(id)
  }

  /**
   * Get all active plugins
   */
  getAllPlugins(): Map<string, PluginInstance> {
    return this.plugins
  }

  /**
   * Get event bus
   */
  getEventBus(): EventBus {
    return this.eventBus
  }

  /**
   * Get command registry
   */
  getCommandRegistry(): CommandRegistry {
    return this.commandRegistry
  }

  /**
   * Get configuration service
   */
  getConfigurationService(): ConfigurationService {
    return this.configService
  }

  /**
   * Execute command
   */
  async executeCommand<T = any>(id: string, ...args: any[]): Promise<T> {
    return this.commandRegistry.executeCommand<T>(id, ...args)
  }

  /**
   * Get configuration
   */
  getConfiguration(section?: string) {
    return this.configService.getConfiguration(section)
  }
}

// Create global singleton
export const pluginManager = new PluginManagerV2()

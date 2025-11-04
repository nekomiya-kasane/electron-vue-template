import { reactive, markRaw } from 'vue'
import { EventBus } from './EventBus'
import {
  PluginStatus,
  type Plugin,
  type PluginContext,
  type PluginInstance,
  type IconBarButton,
  type SidebarConfig,
  type MainViewConfig,
  type MenuConfig,
  type SidebarPosition
} from './types'

/**
 * 插件管理器 - 管理所有插件的生命周期和状态
 */
export class PluginManager {
  private plugins: Map<string, PluginInstance> = new Map()
  private eventBus: EventBus = new EventBus()
  private storage: Map<string, any> = new Map()

  // 响应式状态
  public state = reactive({
    iconButtons: [] as IconBarButton[],
    sidebars: new Map<string, SidebarConfig>(),
    mainViews: new Map<string, MainViewConfig>(),
    menuSections: [] as MenuConfig['sections'],
    activeSidebars: {
      left: null as string | null,
      right: null as string | null
    },
    activeMainView: null as { id: string; props?: Record<string, any> } | null
  })

  /**
   * 注册插件
   */
  async registerPlugin(plugin: Plugin): Promise<void> {
    const { id } = plugin.metadata

    if (this.plugins.has(id)) {
      throw new Error(`Plugin "${id}" is already registered`)
    }

    // 检查依赖
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
      // 创建插件上下文
      const context = this.createContext(id)

      // 调用 onInstall 钩子
      if (plugin.onInstall) {
        await plugin.onInstall(context)
      }

      // 调用 install 方法
      await plugin.install(context)

      instance.status = PluginStatus.INSTALLED

      // 触发插件安装事件
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
   * 激活插件
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
   * 停用插件
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
   * 卸载插件
   */
  async unregisterPlugin(id: string): Promise<void> {
    const instance = this.plugins.get(id)
    if (!instance) {
      return
    }

    try {
      // 先停用
      if (instance.status === PluginStatus.ACTIVE) {
        await this.deactivatePlugin(id)
      }

      const context = this.createContext(id)

      if (instance.plugin.onUninstall) {
        await instance.plugin.onUninstall(context)
      }

      // 清理插件注册的资源
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
   * 创建插件上下文
   */
  private createContext(pluginId: string): PluginContext {
    return {
      registerIconButton: (button: IconBarButton) => {
        this.state.iconButtons.push({ ...button, id: `${pluginId}:${button.id}` })
      },

      registerSidebar: (config: SidebarConfig) => {
        const id = `${pluginId}:${config.id}`
        this.state.sidebars.set(id, { ...config, id, component: markRaw(config.component) })
      },

      registerMainView: (config: MainViewConfig) => {
        const id = `${pluginId}:${config.id}`
        this.state.mainViews.set(id, { ...config, id, component: markRaw(config.component) })
      },

      registerMenu: (config: MenuConfig) => {
        this.state.menuSections.push(...config.sections)
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
      }
    }
  }

  /**
   * 清理插件资源
   */
  private cleanupPluginResources(pluginId: string): void {
    // 清理图标按钮
    this.state.iconButtons = this.state.iconButtons.filter(
      btn => !btn.id.startsWith(`${pluginId}:`)
    )

    // 清理侧边栏
    for (const [id] of this.state.sidebars) {
      if (id.startsWith(`${pluginId}:`)) {
        this.state.sidebars.delete(id)
      }
    }

    // 清理主视图
    for (const [id] of this.state.mainViews) {
      if (id.startsWith(`${pluginId}:`)) {
        this.state.mainViews.delete(id)
      }
    }

    // 清理存储
    for (const [key] of this.storage) {
      if (key.startsWith(`${pluginId}:`)) {
        this.storage.delete(key)
      }
    }
  }

  /**
   * 获取插件实例
   */
  getPluginInstance(id: string): PluginInstance | undefined {
    return this.plugins.get(id)
  }

  /**
   * 获取所有插件
   */
  getAllPlugins(): Map<string, PluginInstance> {
    return this.plugins
  }

  /**
   * 获取事件总线（用于调试）
   */
  getEventBus(): EventBus {
    return this.eventBus
  }
}

// 创建全局单例
export const pluginManager = new PluginManager()

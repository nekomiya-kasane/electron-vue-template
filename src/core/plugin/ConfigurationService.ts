/**
 * 配置服务 - 类似 VSCode 的配置系统
 * 允许插件读取和更新配置，支持工作区和全局配置
 */

import { reactive } from 'vue'

export interface ConfigurationChangeEvent {
  affectsConfiguration(section: string): boolean
  readonly affectedKeys: string[]
}

type ConfigValue = string | number | boolean | object | null | undefined

export class ConfigurationService {
  // 全局配置
  private globalConfig = reactive<Record<string, any>>({})
  
  // 工作区配置
  private workspaceConfig = reactive<Record<string, any>>({})
  
  // 配置变化监听器
  private changeListeners: Set<(event: ConfigurationChangeEvent) => void> = new Set()

  /**
   * 获取配置值
   * @param section 配置节（如 'editor.fontSize'）
   * @param scope 'global' | 'workspace'
   */
  get<T = ConfigValue>(section: string, scope: 'global' | 'workspace' = 'workspace'): T | undefined {
    const config = scope === 'global' ? this.globalConfig : this.workspaceConfig
    return this.getNestedValue(config, section) as T
  }

  /**
   * 获取配置对象
   * @param section 配置节前缀（如 'editor'）
   */
  getConfiguration(section?: string): {
    get<T = ConfigValue>(key: string, defaultValue?: T): T
    update(key: string, value: any, scope?: 'global' | 'workspace'): void
    has(key: string): boolean
  } {
    const self = this
    const prefix = section ? `${section}.` : ''

    return {
      get<T = ConfigValue>(key: string, defaultValue?: T): T {
        const fullKey = prefix + key
        const value = self.get<T>(fullKey)
        return value !== undefined ? value : (defaultValue as T)
      },

      update(key: string, value: any, scope: 'global' | 'workspace' = 'workspace'): void {
        const fullKey = prefix + key
        self.update(fullKey, value, scope)
      },

      has(key: string): boolean {
        const fullKey = prefix + key
        return self.has(fullKey)
      }
    }
  }

  /**
   * 更新配置值
   */
  update(section: string, value: any, scope: 'global' | 'workspace' = 'workspace'): void {
    const config = scope === 'global' ? this.globalConfig : this.workspaceConfig
    this.setNestedValue(config, section, value)
    
    // 触发配置变化事件
    this.notifyConfigurationChange([section])
    
    console.log(`[ConfigurationService] Updated ${scope} config: ${section} =`, value)
  }

  /**
   * 检查配置是否存在
   */
  has(section: string, scope: 'global' | 'workspace' = 'workspace'): boolean {
    const config = scope === 'global' ? this.globalConfig : this.workspaceConfig
    return this.getNestedValue(config, section) !== undefined
  }

  /**
   * 删除配置
   */
  remove(section: string, scope: 'global' | 'workspace' = 'workspace'): void {
    const config = scope === 'global' ? this.globalConfig : this.workspaceConfig
    this.deleteNestedValue(config, section)
    
    // 触发配置变化事件
    this.notifyConfigurationChange([section])
    
    console.log(`[ConfigurationService] Removed ${scope} config: ${section}`)
  }

  /**
   * 监听配置变化
   */
  onDidChangeConfiguration(listener: (event: ConfigurationChangeEvent) => void): () => void {
    this.changeListeners.add(listener)
    
    // 返回取消监听的函数
    return () => {
      this.changeListeners.delete(listener)
    }
  }

  /**
   * 获取所有配置
   */
  getAllConfiguration(scope: 'global' | 'workspace' = 'workspace'): Record<string, any> {
    return scope === 'global' ? { ...this.globalConfig } : { ...this.workspaceConfig }
  }

  /**
   * 重置所有配置
   */
  reset(scope?: 'global' | 'workspace'): void {
    if (!scope || scope === 'global') {
      Object.keys(this.globalConfig).forEach(key => delete this.globalConfig[key])
    }
    if (!scope || scope === 'workspace') {
      Object.keys(this.workspaceConfig).forEach(key => delete this.workspaceConfig[key])
    }
    
    console.log(`[ConfigurationService] Reset ${scope || 'all'} configuration`)
  }

  /**
   * 获取嵌套值
   */
  private getNestedValue(obj: Record<string, any>, path: string): any {
    const keys = path.split('.')
    let current = obj

    for (const key of keys) {
      if (current === null || current === undefined || typeof current !== 'object') {
        return undefined
      }
      current = current[key]
    }

    return current
  }

  /**
   * 设置嵌套值
   */
  private setNestedValue(obj: Record<string, any>, path: string, value: any): void {
    const keys = path.split('.')
    const lastKey = keys.pop()!
    let current = obj

    for (const key of keys) {
      if (!(key in current) || typeof current[key] !== 'object') {
        current[key] = {}
      }
      current = current[key]
    }

    current[lastKey] = value
  }

  /**
   * 删除嵌套值
   */
  private deleteNestedValue(obj: Record<string, any>, path: string): void {
    const keys = path.split('.')
    const lastKey = keys.pop()!
    let current = obj

    for (const key of keys) {
      if (!(key in current) || typeof current[key] !== 'object') {
        return
      }
      current = current[key]
    }

    delete current[lastKey]
  }

  /**
   * 通知配置变化
   */
  private notifyConfigurationChange(affectedKeys: string[]): void {
    const event: ConfigurationChangeEvent = {
      affectsConfiguration: (section: string) => {
        return affectedKeys.some(key => 
          key === section || 
          key.startsWith(section + '.') ||
          section.startsWith(key + '.')
        )
      },
      affectedKeys
    }

    this.changeListeners.forEach(listener => {
      try {
        listener(event)
      } catch (error) {
        console.error('[ConfigurationService] Error in configuration change listener:', error)
      }
    })
  }
}

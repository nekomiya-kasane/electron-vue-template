import { reactive, watch } from 'vue'

/**
 * 设置类型
 */
export type SettingType = 'string' | 'number' | 'boolean' | 'enum' | 'object' | 'array'

/**
 * 设置作用域
 */
export type SettingScope = 'user' | 'workspace' | 'default'

/**
 * 设置定义
 */
export interface SettingDefinition {
  key: string
  type: SettingType
  default: any
  title: string
  description?: string
  enum?: string[]
  enumDescriptions?: string[]
  scope?: SettingScope
  category: string
  order?: number
  minimum?: number
  maximum?: number
  pattern?: string
  deprecated?: boolean
  deprecationMessage?: string
}

/**
 * 设置分类
 */
export interface SettingCategory {
  id: string
  title: string
  icon?: string
  order?: number
  settings: SettingDefinition[]
}

/**
 * 设置变化事件
 */
export interface SettingChangeEvent {
  key: string
  value: any
  oldValue: any
  scope: SettingScope
}

/**
 * 设置服务
 * 管理应用程序的所有设置，支持用户级和工作区级设置
 */
export class SettingsService {
  private definitions: Map<string, SettingDefinition> = new Map()
  private userSettings: Map<string, any> = reactive(new Map())
  private workspaceSettings: Map<string, any> = reactive(new Map())
  private changeListeners: Array<(event: SettingChangeEvent) => void> = []
  
  private readonly STORAGE_KEY_USER = 'settings:user'
  private readonly STORAGE_KEY_WORKSPACE = 'settings:workspace'

  constructor() {
    this.loadFromStorage()
    this.setupAutoSave()
  }

  /**
   * 注册设置定义
   */
  registerSetting(definition: SettingDefinition): void {
    this.definitions.set(definition.key, definition)
    
    // 如果当前没有设置值，使用默认值
    if (!this.userSettings.has(definition.key) && !this.workspaceSettings.has(definition.key)) {
      if (definition.scope === 'workspace') {
        this.workspaceSettings.set(definition.key, definition.default)
      } else {
        this.userSettings.set(definition.key, definition.default)
      }
    }
  }

  /**
   * 批量注册设置
   */
  registerSettings(definitions: SettingDefinition[]): void {
    definitions.forEach(def => this.registerSetting(def))
  }

  /**
   * 获取设置值
   */
  get<T = any>(key: string, scope?: SettingScope): T | undefined {
    // 优先级：workspace > user > default
    if (scope === 'workspace' || !scope) {
      if (this.workspaceSettings.has(key)) {
        return this.workspaceSettings.get(key) as T
      }
    }
    
    if (scope === 'user' || !scope) {
      if (this.userSettings.has(key)) {
        return this.userSettings.get(key) as T
      }
    }
    
    // 返回默认值
    const definition = this.definitions.get(key)
    return definition?.default as T
  }

  /**
   * 设置值
   */
  set(key: string, value: any, scope: SettingScope = 'user'): void {
    const definition = this.definitions.get(key)
    if (!definition) {
      console.warn(`Setting "${key}" is not registered`)
      return
    }

    // 验证值
    if (!this.validateValue(definition, value)) {
      console.error(`Invalid value for setting "${key}"`)
      return
    }

    const oldValue = this.get(key, scope)
    
    if (scope === 'workspace') {
      this.workspaceSettings.set(key, value)
    } else {
      this.userSettings.set(key, value)
    }

    // 触发变化事件
    this.notifyChange({
      key,
      value,
      oldValue,
      scope
    })
  }

  /**
   * 检查设置是否存在
   */
  has(key: string, scope?: SettingScope): boolean {
    if (scope === 'workspace') {
      return this.workspaceSettings.has(key)
    } else if (scope === 'user') {
      return this.userSettings.has(key)
    } else {
      return this.workspaceSettings.has(key) || this.userSettings.has(key)
    }
  }

  /**
   * 删除设置
   */
  delete(key: string, scope: SettingScope = 'user'): void {
    const oldValue = this.get(key, scope)
    
    if (scope === 'workspace') {
      this.workspaceSettings.delete(key)
    } else {
      this.userSettings.delete(key)
    }

    const definition = this.definitions.get(key)
    const newValue = definition?.default

    this.notifyChange({
      key,
      value: newValue,
      oldValue,
      scope
    })
  }

  /**
   * 重置为默认值
   */
  reset(key: string, scope: SettingScope = 'user'): void {
    const definition = this.definitions.get(key)
    if (definition) {
      this.set(key, definition.default, scope)
    }
  }

  /**
   * 重置所有设置
   */
  resetAll(scope: SettingScope = 'user'): void {
    if (scope === 'workspace') {
      this.workspaceSettings.clear()
    } else {
      this.userSettings.clear()
    }
    
    // 恢复默认值
    this.definitions.forEach((def, key) => {
      if (def.scope === scope || !def.scope) {
        this.set(key, def.default, scope)
      }
    })
  }

  /**
   * 获取所有设置
   */
  getAll(scope?: SettingScope): Record<string, any> {
    const result: Record<string, any> = {}
    
    if (scope === 'workspace' || !scope) {
      this.workspaceSettings.forEach((value, key) => {
        result[key] = value
      })
    }
    
    if (scope === 'user' || !scope) {
      this.userSettings.forEach((value, key) => {
        if (!(key in result)) {
          result[key] = value
        }
      })
    }
    
    return result
  }

  /**
   * 获取所有设置定义
   */
  getAllDefinitions(): SettingDefinition[] {
    return Array.from(this.definitions.values())
  }

  /**
   * 按分类获取设置
   */
  getByCategory(category: string): SettingDefinition[] {
    return this.getAllDefinitions().filter(def => def.category === category)
  }

  /**
   * 获取所有分类
   */
  getCategories(): SettingCategory[] {
    const categoryMap = new Map<string, SettingCategory>()
    
    this.definitions.forEach(def => {
      if (!categoryMap.has(def.category)) {
        categoryMap.set(def.category, {
          id: def.category,
          title: def.category,
          order: 0,
          settings: []
        })
      }
      categoryMap.get(def.category)!.settings.push(def)
    })
    
    return Array.from(categoryMap.values()).sort((a, b) => (a.order || 0) - (b.order || 0))
  }

  /**
   * 监听设置变化
   */
  onChange(listener: (event: SettingChangeEvent) => void): () => void {
    this.changeListeners.push(listener)
    
    // 返回取消监听的函数
    return () => {
      const index = this.changeListeners.indexOf(listener)
      if (index !== -1) {
        this.changeListeners.splice(index, 1)
      }
    }
  }

  /**
   * 监听特定设置的变化
   */
  onDidChange(key: string, listener: (value: any, oldValue: any) => void): () => void {
    return this.onChange((event) => {
      if (event.key === key) {
        listener(event.value, event.oldValue)
      }
    })
  }

  /**
   * 导出设置为 JSON
   */
  exportToJSON(scope: SettingScope = 'user'): string {
    const settings = this.getAll(scope)
    return JSON.stringify(settings, null, 2)
  }

  /**
   * 从 JSON 导入设置
   */
  importFromJSON(json: string, scope: SettingScope = 'user'): void {
    try {
      const settings = JSON.parse(json)
      Object.entries(settings).forEach(([key, value]) => {
        this.set(key, value, scope)
      })
    } catch (error) {
      console.error('Failed to import settings:', error)
      throw new Error('Invalid JSON format')
    }
  }

  /**
   * 验证设置值
   */
  private validateValue(definition: SettingDefinition, value: any): boolean {
    // 类型检查
    const valueType = Array.isArray(value) ? 'array' : typeof value
    if (definition.type === 'enum') {
      if (!definition.enum?.includes(value)) {
        return false
      }
    } else if (definition.type !== valueType) {
      return false
    }

    // 数字范围检查
    if (definition.type === 'number') {
      if (definition.minimum !== undefined && value < definition.minimum) {
        return false
      }
      if (definition.maximum !== undefined && value > definition.maximum) {
        return false
      }
    }

    // 字符串模式检查
    if (definition.type === 'string' && definition.pattern) {
      const regex = new RegExp(definition.pattern)
      if (!regex.test(value)) {
        return false
      }
    }

    return true
  }

  /**
   * 通知设置变化
   */
  private notifyChange(event: SettingChangeEvent): void {
    this.changeListeners.forEach(listener => {
      try {
        listener(event)
      } catch (error) {
        console.error('Error in setting change listener:', error)
      }
    })
  }

  /**
   * 从 localStorage 加载设置
   */
  private loadFromStorage(): void {
    try {
      const userJson = localStorage.getItem(this.STORAGE_KEY_USER)
      if (userJson) {
        const userSettings = JSON.parse(userJson)
        Object.entries(userSettings).forEach(([key, value]) => {
          this.userSettings.set(key, value)
        })
      }

      const workspaceJson = localStorage.getItem(this.STORAGE_KEY_WORKSPACE)
      if (workspaceJson) {
        const workspaceSettings = JSON.parse(workspaceJson)
        Object.entries(workspaceSettings).forEach(([key, value]) => {
          this.workspaceSettings.set(key, value)
        })
      }
    } catch (error) {
      console.error('Failed to load settings from storage:', error)
    }
  }

  /**
   * 保存设置到 localStorage
   */
  private saveToStorage(): void {
    try {
      const userSettings: Record<string, any> = {}
      this.userSettings.forEach((value, key) => {
        userSettings[key] = value
      })
      localStorage.setItem(this.STORAGE_KEY_USER, JSON.stringify(userSettings))

      const workspaceSettings: Record<string, any> = {}
      this.workspaceSettings.forEach((value, key) => {
        workspaceSettings[key] = value
      })
      localStorage.setItem(this.STORAGE_KEY_WORKSPACE, JSON.stringify(workspaceSettings))
    } catch (error) {
      console.error('Failed to save settings to storage:', error)
    }
  }

  /**
   * 设置自动保存
   */
  private setupAutoSave(): void {
    // 监听用户设置变化
    watch(() => Array.from(this.userSettings.entries()), () => {
      this.saveToStorage()
    }, { deep: true })

    // 监听工作区设置变化
    watch(() => Array.from(this.workspaceSettings.entries()), () => {
      this.saveToStorage()
    }, { deep: true })
  }
}

// 创建全局单例
export const settingsService = new SettingsService()

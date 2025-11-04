import { Component } from 'vue'

/**
 * 菜单项配置
 */
export interface MenuItem {
  id: string
  label: string
  icon?: string
  shortcut?: string
  submenu?: MenuItem[]
  action?: () => void
}

/**
 * 侧边栏位置
 */
export type SidebarPosition = 'left' | 'right'

/**
 * 图标栏按钮配置
 */
export interface IconBarButton {
  id: string
  icon: string
  title: string
  position: SidebarPosition
}

/**
 * 侧边栏配置
 */
export interface SidebarConfig {
  id: string
  title: string
  component: Component
  position: SidebarPosition
}

/**
 * 文档类型定义
 */
export interface DocumentType {
  id: string
  name: string
  extensions?: string[] // 支持的文件扩展名
  icon?: string
}

/**
 * 文档实例
 */
export interface Document {
  id: string
  title: string
  type: string // 文档类型 ID
  content?: any
  props?: Record<string, any>
}

/**
 * 主区域视图配置（文档编辑器）
 */
export interface MainViewConfig {
  id: string
  component: Component
  supportedDocumentTypes: string[] // 支持的文档类型列表
  props?: Record<string, any>
}

/**
 * 状态栏项配置
 */
export interface StatusBarItem {
  id: string
  component?: Component
  text?: string
  position: 'left' | 'center' | 'right'
  priority?: number // 数字越大优先级越高，显示越靠前
  props?: Record<string, any>
}

/**
 * 菜单节配置
 */
export interface MenuSection {
  title?: string
  items: MenuItem[]
}

/**
 * 菜单配置
 */
export interface MenuConfig {
  sections: MenuSection[]
}

/**
 * 插件上下文 - 提供给插件的 API
 */
export interface PluginContext {
  // 注册文档类型
  registerDocumentType(type: DocumentType): void
  
  // 注册图标栏按钮
  registerIconButton(button: IconBarButton, documentTypes?: string[]): void
  
  // 注册侧边栏
  registerSidebar(config: SidebarConfig, documentTypes?: string[]): void
  
  // 注册主区域视图
  registerMainView(config: MainViewConfig): void
  
  // 注册菜单项
  registerMenu(config: MenuConfig): void
  
  // 注册状态栏项
  registerStatusBarItem(item: StatusBarItem): void
  
  // 创建文档
  createDocument(document: Document): void
  
  // 切换到文档
  switchToDocument(documentId: string): void
  
  // 激活侧边栏
  activateSidebar(id: string, position: SidebarPosition): void
  
  // 关闭侧边栏
  closeSidebar(position: SidebarPosition): void
  
  // 切换到主区域视图
  switchMainView(id: string, props?: Record<string, any>): void
  
  // 事件系统
  on(event: string, handler: (...args: any[]) => void): void
  off(event: string, handler: (...args: any[]) => void): void
  emit(event: string, ...args: any[]): void
  
  // 获取其他插件实例
  getPlugin(id: string): Plugin | undefined
  
  // 存储系统（简单的键值对存储）
  storage: {
    get(key: string): any
    set(key: string, value: any): void
    remove(key: string): void
  }
}

/**
 * 插件生命周期钩子
 */
export interface PluginHooks {
  // 插件安装时调用
  onInstall?(context: PluginContext): void | Promise<void>
  
  // 插件激活时调用
  onActivate?(context: PluginContext): void | Promise<void>
  
  // 插件停用时调用
  onDeactivate?(context: PluginContext): void | Promise<void>
  
  // 插件卸载时调用
  onUninstall?(context: PluginContext): void | Promise<void>
}

/**
 * 插件元数据
 */
export interface PluginMetadata {
  id: string
  name: string
  version: string
  description?: string
  author?: string
  dependencies?: string[] // 依赖的其他插件 ID
}

/**
 * 插件接口
 */
export interface Plugin extends PluginHooks {
  metadata: PluginMetadata
  
  // 插件的主要安装逻辑
  install(context: PluginContext): void | Promise<void>
}

/**
 * 插件状态
 */
export enum PluginStatus {
  UNINSTALLED = 'uninstalled',
  INSTALLED = 'installed',
  ACTIVE = 'active',
  ERROR = 'error'
}

/**
 * 插件实例信息
 */
export interface PluginInstance {
  plugin: Plugin
  status: PluginStatus
  error?: Error
}

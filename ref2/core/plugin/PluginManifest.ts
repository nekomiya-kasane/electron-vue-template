/**
 * Plugin Manifest - VSCode-like plugin metadata and contribution points
 * Similar to VSCode's package.json for extensions
 */

/**
 * Plugin category types
 */
export enum PluginCategory {
  DOCUMENT_TYPE = 'documentType',    // 文档类型插件
  FEATURE = 'feature',                // 额外功能插件
  THEME = 'theme',                    // 主题插件
  LANGUAGE = 'language'               // 语言支持插件
}

/**
 * Plugin activation events (VSCode-like)
 */
export type ActivationEvent =
  | 'onStartup'                       // 启动时激活
  | `onDocumentType:${string}`        // 打开特定文档类型时激活
  | `onCommand:${string}`             // 执行特定命令时激活
  | `onView:${string}`                // 打开特定视图时激活
  | 'onLanguage:*'                    // 任何语言文件打开时激活

/**
 * Contribution points - what the plugin provides
 */
export interface PluginContributions {
  // 文档类型贡献
  documentTypes?: Array<{
    id: string
    name: string
    extensions?: string[]
    icon?: string
    defaultEditor?: string
  }>

  // 侧边栏贡献
  sidebars?: Array<{
    id: string
    title: string
    icon?: string
    position: 'left' | 'right'
    when?: string                     // 条件表达式，如 "documentType == 'QIViewer'"
  }>

  // 图标按钮贡献
  iconButtons?: Array<{
    id: string
    icon: string
    title: string
    position: 'left' | 'right'
    command?: string
    when?: string
  }>

  // 主视图贡献
  mainViews?: Array<{
    id: string
    supportedDocumentTypes: string[]
    priority?: number                 // 优先级，用于同一文档类型有多个视图时选择
  }>

  // 状态栏项贡献
  statusBarItems?: Array<{
    id: string
    position: 'left' | 'center' | 'right'
    priority?: number
    when?: string
  }>

  // 命令贡献
  commands?: Array<{
    id: string
    title: string
    category?: string
    icon?: string
    when?: string
  }>

  // 菜单贡献
  menus?: {
    [menuId: string]: Array<{
      command: string
      group?: string
      when?: string
    }>
  }

  // 配置贡献
  configuration?: {
    title?: string
    properties: {
      [key: string]: {
        type: 'string' | 'number' | 'boolean' | 'array' | 'object'
        default?: any
        description?: string
        enum?: any[]
        enumDescriptions?: string[]
      }
    }
  }

  // 主题贡献
  themes?: Array<{
    id: string
    label: string
    uiTheme: 'vs' | 'vs-dark' | 'hc-black'
    path: string
  }>

  // LSP 贡献
  languages?: Array<{
    id: string
    extensions?: string[]
    configuration?: string
    lspServer?: {
      module: string
      args?: string[]
      options?: Record<string, any>
    }
  }>
}

/**
 * Plugin Manifest - complete plugin metadata
 */
export interface PluginManifest {
  // 基本信息
  id: string
  name: string
  displayName?: string
  version: string
  description?: string
  publisher?: string
  author?: string | { name: string; email?: string; url?: string }
  license?: string
  homepage?: string
  repository?: string | { type: string; url: string }
  
  // 插件分类
  categories?: PluginCategory[]
  
  // 关键词
  keywords?: string[]
  
  // 图标
  icon?: string
  
  // 引擎版本要求
  engines?: {
    app?: string
  }
  
  // 依赖
  dependencies?: string[]              // 依赖的其他插件 ID
  extensionDependencies?: string[]     // VSCode 风格的依赖声明
  
  // 激活事件
  activationEvents?: ActivationEvent[]
  
  // 贡献点
  contributes?: PluginContributions
  
  // 主入口文件
  main?: string
  
  // 是否为内置插件
  isBuiltin?: boolean
  
  // 插件路径（运行时填充）
  path?: string
}

/**
 * Plugin package.json schema
 */
export interface PluginPackageJson extends PluginManifest {
  // 标准 package.json 字段
  private?: boolean
  scripts?: Record<string, string>
  devDependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
}

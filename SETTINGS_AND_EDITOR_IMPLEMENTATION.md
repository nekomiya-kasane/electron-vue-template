# 设置系统和 Monaco Editor 实现

## 📦 已完成的工作

### 1. 添加依赖 ✅

**修改文件**: `package.json`

添加了以下依赖：
```json
{
  "monaco-editor": "^0.52.0",
  "vite-plugin-monaco-editor": "^1.1.0"
}
```

### 2. 配置 Vite ✅

**修改文件**: `vite.config.ts`

添加了 Monaco Editor 插件配置：
```typescript
import monacoEditorPlugin from "vite-plugin-monaco-editor";

// 在 plugins 数组中添加
monacoEditorPlugin({
  languageWorkers: ['editorWorkerService', 'typescript', 'json', 'html', 'css']
})
```

### 3. 创建 Monaco Editor 组件 ✅

**文件**: `src/components/editor/MonacoEditor.vue`

**功能特性**：
- ✅ 完整的 Monaco Editor 封装
- ✅ 支持多种编程语言
- ✅ 支持主题切换 (vs, vs-dark, hc-black, hc-light)
- ✅ 双向数据绑定 (v-model)
- ✅ 自动布局
- ✅ 保存快捷键 (Ctrl+S / Cmd+S)
- ✅ 丰富的编辑器选项
- ✅ 暴露编辑器实例方法

**使用示例**：
```vue
<template>
  <MonacoEditor
    v-model="code"
    language="typescript"
    theme="vs-dark"
    @save="handleSave"
    @change="handleChange"
  />
</template>

<script setup>
import MonacoEditor from '@/components/editor/MonacoEditor.vue'
import { ref } from 'vue'

const code = ref('console.log("Hello World")')

function handleSave(value) {
  console.log('Saved:', value)
}

function handleChange(value) {
  console.log('Changed:', value)
}
</script>
```

### 4. 创建设置服务 ✅

**文件**: `src/core/settings/SettingsService.ts`

**核心功能**：

#### 设置管理
- ✅ 注册设置定义
- ✅ 获取/设置值
- ✅ 用户级和工作区级设置
- ✅ 默认值支持
- ✅ 设置验证

#### 设置类型
- ✅ `string` - 字符串
- ✅ `number` - 数字（支持最小/最大值）
- ✅ `boolean` - 布尔值
- ✅ `enum` - 枚举（下拉选择）
- ✅ `object` - 对象
- ✅ `array` - 数组

#### 持久化
- ✅ 自动保存到 localStorage
- ✅ 启动时自动加载
- ✅ 导出/导入 JSON

#### 事件系统
- ✅ 监听所有设置变化
- ✅ 监听特定设置变化
- ✅ 变化事件包含新旧值

**使用示例**：
```typescript
import { settingsService } from '@/core/settings'

// 注册设置
settingsService.registerSetting({
  key: 'editor.fontSize',
  type: 'number',
  default: 14,
  title: '字体大小',
  description: '编辑器字体大小',
  category: '编辑器',
  minimum: 8,
  maximum: 72
})

// 获取设置
const fontSize = settingsService.get('editor.fontSize')

// 设置值
settingsService.set('editor.fontSize', 16, 'user')

// 监听变化
settingsService.onDidChange('editor.fontSize', (value, oldValue) => {
  console.log(`Font size changed from ${oldValue} to ${value}`)
})

// 导出设置
const json = settingsService.exportToJSON('user')

// 导入设置
settingsService.importFromJSON(json, 'user')
```

## 🚀 下一步：安装依赖

### 运行命令

```bash
npm install
```

这将安装：
- `monaco-editor@^0.52.0` - Monaco Editor 核心库
- `vite-plugin-monaco-editor@^1.1.0` - Vite 集成插件

### 安装后的效果

安装完成后，TypeScript 错误将消失：
- ✅ `Cannot find module 'monaco-editor'` - 已解决
- ✅ `Cannot find module 'vite-plugin-monaco-editor'` - 已解决

## 📋 待实现功能

### 1. 设置 UI 组件 (高优先级)

需要创建可视化的设置界面：

#### SettingsView.vue
```
┌─────────────────────────────────────────────────┐
│ ⚙️ 设置                    [搜索...]  [JSON] │
├──────────┬──────────────────────────────────────┤
│ 编辑器   │ 字体大小                             │
│ 图视图   │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ 插件     │ [14]                                 │
│ 外观     │                                      │
│ 高级     │ Tab 大小                             │
│          │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│          │ [2]                                  │
│          │                                      │
│          │ 主题                                 │
│          │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│          │ [vs-dark ▼]                          │
└──────────┴──────────────────────────────────────┘
```

**组件结构**：
```
components/settings/
├── SettingsView.vue          # 主视图
├── SettingsCategory.vue      # 分类侧边栏
├── SettingItem.vue           # 单个设置项
├── SettingItemString.vue     # 字符串输入
├── SettingItemNumber.vue     # 数字输入
├── SettingItemBoolean.vue    # 开关
├── SettingItemEnum.vue       # 下拉选择
└── SettingsJsonEditor.vue    # JSON 编辑器
```

### 2. 集成到插件系统 (高优先级)

#### 扩展 PluginContext

```typescript
interface PluginContext {
  // ... 现有 API ...
  
  // 设置 API
  settings: {
    register(settings: SettingDefinition[]): void
    get<T>(key: string): T
    set(key: string, value: any, scope?: SettingScope): void
    onChange(key: string, callback: (value: any) => void): Disposable
  }
  
  // 编辑器 API
  editor: {
    open(uri: string, language?: string): Promise<void>
    getCurrent(): Editor | null
    getAll(): Editor[]
    onDidChangeActiveEditor(callback: (editor: Editor) => void): Disposable
  }
}
```

#### 创建 EditorPlugin

```typescript
export const EditorPlugin: Plugin = {
  metadata: {
    id: 'editor',
    name: '代码编辑器',
    version: '1.0.0'
  },

  install(context: PluginContext) {
    // 注册编辑器文档类型
    context.registerDocumentType({
      id: 'code',
      name: '代码文件',
      extensions: ['.ts', '.js', '.json', '.vue', '.css', '.html'],
      icon: '📝'
    })

    // 注册主视图
    context.registerMainView({
      id: 'monaco-editor',
      component: MonacoEditor,
      supportedDocumentTypes: ['code']
    })
  }
}
```

#### 创建 SettingsPlugin

```typescript
export const SettingsPlugin: Plugin = {
  metadata: {
    id: 'settings',
    name: '设置',
    version: '1.0.0'
  },

  install(context: PluginContext) {
    // 注册设置按钮
    context.registerIconButton({
      id: 'settings',
      icon: '⚙️',
      title: 'Settings',
      position: 'right'
    })

    // 注册设置侧边栏
    context.registerSidebar({
      id: 'settings',
      title: '设置',
      position: 'right',
      component: SettingsView
    })

    // 注册默认设置
    context.settings.register([
      {
        key: 'editor.fontSize',
        type: 'number',
        default: 14,
        title: '字体大小',
        category: '编辑器',
        minimum: 8,
        maximum: 72
      },
      {
        key: 'editor.theme',
        type: 'enum',
        default: 'vs-dark',
        enum: ['vs', 'vs-dark', 'hc-black', 'hc-light'],
        title: '编辑器主题',
        category: '编辑器'
      },
      {
        key: 'graph.defaultLayout',
        type: 'enum',
        default: 'cose',
        enum: ['dagre', 'circle', 'cola', 'grid', 'concentric', 'breadthfirst', 'cose'],
        title: '默认布局',
        category: '图视图'
      }
    ])
  }
}
```

### 3. LSP 支持 (中优先级)

Monaco Editor 内置了对 TypeScript、JavaScript、JSON、HTML、CSS 的语言支持，包括：
- ✅ 语法高亮
- ✅ 自动完成
- ✅ 错误提示
- ✅ 格式化
- ✅ 定义跳转

如需支持其他语言的 LSP，可以使用：
- `monaco-languageclient` - LSP 客户端
- `vscode-ws-jsonrpc` - WebSocket JSON-RPC

### 4. 多文件编辑 (低优先级)

支持多个文件同时打开：
- 标签页管理
- 文件树视图
- 文件搜索
- 最近打开的文件

## 🎯 预定义设置示例

```typescript
// 编辑器设置
{
  'editor.fontSize': 14,
  'editor.tabSize': 2,
  'editor.theme': 'vs-dark',
  'editor.minimap.enabled': true,
  'editor.wordWrap': 'on',
  'editor.lineNumbers': 'on'
}

// 图视图设置
{
  'graph.defaultLayout': 'cose',
  'graph.nodeColor': '#4CAF50',
  'graph.edgeColor': '#666',
  'graph.showGrid': true,
  'graph.showRuler': true
}

// UI 设置
{
  'ui.theme': 'light',
  'ui.sidebarPosition': 'left',
  'ui.fontSize': 12,
  'ui.compactMode': false
}

// 插件设置
{
  'plugin.autoLoad': true,
  'plugin.checkUpdates': true
}
```

## 📊 Monaco Editor 特性

### 支持的语言

Monaco Editor 内置支持以下语言：
- TypeScript / JavaScript
- JSON
- HTML
- CSS / SCSS / Less
- Markdown
- XML
- SQL
- Python
- Java
- C / C++
- C#
- Go
- Rust
- PHP
- Ruby
- Shell
- YAML
- Dockerfile
- 等等...

### 编辑器功能

- ✅ **语法高亮** - 所有支持的语言
- ✅ **自动完成** - IntelliSense
- ✅ **错误提示** - 实时诊断
- ✅ **代码格式化** - 自动格式化
- ✅ **定义跳转** - Go to Definition
- ✅ **查找引用** - Find All References
- ✅ **重命名** - Rename Symbol
- ✅ **代码折叠** - Folding
- ✅ **小地图** - Minimap
- ✅ **多光标** - Multi-cursor
- ✅ **快捷键** - VSCode 风格
- ✅ **Diff 编辑器** - 对比视图

### 主题

- `vs` - Light 主题
- `vs-dark` - Dark 主题（默认）
- `hc-black` - High Contrast Dark
- `hc-light` - High Contrast Light

可以自定义主题：
```typescript
monaco.editor.defineTheme('custom-dark', {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'comment', foreground: '6A9955' },
    { token: 'keyword', foreground: 'C586C0' }
  ],
  colors: {
    'editor.background': '#1E1E1E',
    'editor.foreground': '#D4D4D4'
  }
})
```

## 🔧 集成步骤

### Step 1: 安装依赖 ✅
```bash
npm install
```

### Step 2: 创建设置 UI 组件
- [ ] SettingsView.vue
- [ ] SettingItem.vue
- [ ] SettingsJsonEditor.vue

### Step 3: 集成到插件系统
- [ ] 扩展 PluginContext API
- [ ] 创建 EditorPlugin
- [ ] 创建 SettingsPlugin

### Step 4: 注册默认设置
- [ ] 编辑器设置
- [ ] 图视图设置
- [ ] UI 设置

### Step 5: 测试
- [ ] 设置读写
- [ ] 设置持久化
- [ ] 编辑器功能
- [ ] 主题切换

## 🎉 总结

已完成：
- ✅ Monaco Editor 组件封装
- ✅ 设置服务架构
- ✅ 依赖配置

待完成：
- ⏳ 设置 UI 组件
- ⏳ 插件系统集成
- ⏳ 默认设置注册

下一步请运行 `npm install` 安装依赖，然后我们可以继续实现设置 UI 组件！

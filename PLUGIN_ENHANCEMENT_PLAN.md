# 插件系统增强计划

## 📋 需求概述

### 1. 图元素右侧栏 ✅ (已完成)
- ✅ 显示现有的节点和边列表
- ✅ 支持搜索过滤
- ✅ 显示元素详情
- ✅ 显示历史记录

### 2. VSCode 风格设置系统 (进行中)
- ⏳ 设置架构设计
- ⏳ 可视化设置 UI
- ⏳ JSON 设置编辑器
- ⏳ 设置同步和持久化

### 3. 文本编辑器支持 (待实现)
- ⏳ 集成 Monaco Editor
- ⏳ LSP 客户端实现
- ⏳ 语法高亮和自动完成
- ⏳ 多文件编辑支持

## 🎯 已完成功能

### GraphElementsPanel 组件

**文件**: `src/components/panels/GraphElementsPanel.vue`

#### 核心功能

1. **双视图模式**
   - 节点列表视图
   - 边列表视图
   - 实时统计数量

2. **搜索过滤**
   - 按 ID 搜索
   - 按标签搜索
   - 按源/目标搜索（边）
   - 实时过滤结果

3. **元素详情**
   - 节点详情：ID、标签、颜色
   - 边详情：源、目标、样式属性
   - 可视化颜色预览

4. **历史记录**
   - 记录元素创建
   - 记录属性变更
   - 时间格式化显示
   - 变更详情展示

5. **交互功能**
   - 点击元素高亮
   - 与图视图联动
   - 事件总线通信

#### 数据结构

```typescript
interface GraphNode {
  id: string
  label: string
  color: string
}

interface GraphEdge {
  id: string
  source: string
  target: string
  label?: string
  color: string
  width: number
  arrowShape: string
  curveStyle: string
  lineStyle: string
  opacity: number
}

interface HistoryRecord {
  timestamp: number
  action: string
  changes?: Record<string, any>
}
```

#### 事件监听

```typescript
// 监听节点添加
'graph:nodeAdded' -> 更新节点列表 + 记录历史

// 监听边添加
'graph:edgeAdded' -> 更新边列表 + 记录历史

// 监听节点选择
'graph:nodeSelected' -> 显示节点详情

// 监听边选择
'graph:edgeSelected' -> 显示边详情
```

#### 触发事件

```typescript
// 聚焦节点
'graph:focusNode' -> 图中高亮节点

// 聚焦边
'graph:focusEdge' -> 图中高亮边
```

## 🔄 下一步：VSCode 风格设置系统

### 架构设计

```
SettingsSystem/
├── SettingsService.ts          # 设置服务核心
├── SettingsSchema.ts            # 设置模式定义
├── components/
│   ├── SettingsView.vue         # 设置主视图
│   ├── SettingsEditor.vue       # 可视化编辑器
│   ├── SettingsJsonEditor.vue   # JSON 编辑器
│   └── SettingItem.vue          # 单个设置项
└── types.ts                     # 类型定义
```

### 设置类型

```typescript
interface Setting {
  key: string
  type: 'string' | 'number' | 'boolean' | 'enum' | 'object' | 'array'
  default: any
  title: string
  description?: string
  enum?: string[]
  scope?: 'user' | 'workspace'
  category: string
}

interface SettingsCategory {
  id: string
  title: string
  icon?: string
  settings: Setting[]
}
```

### 设置示例

```json
{
  "editor.fontSize": 14,
  "editor.tabSize": 2,
  "editor.theme": "vs-dark",
  "graph.defaultLayout": "cose",
  "graph.nodeColor": "#4CAF50",
  "graph.edgeColor": "#666",
  "plugin.autoLoad": true,
  "ui.sidebarPosition": "left"
}
```

### UI 设计

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

## 📝 Monaco Editor 集成

### 安装依赖

```bash
npm install monaco-editor
npm install @monaco-editor/loader
```

### 组件设计

```vue
<template>
  <div class="monaco-editor-wrapper">
    <div ref="editorContainer" class="editor-container"></div>
  </div>
</template>

<script setup lang="ts">
import * as monaco from 'monaco-editor'
import { ref, onMounted, onUnmounted } from 'vue'

const editorContainer = ref<HTMLElement>()
let editor: monaco.editor.IStandaloneCodeEditor | null = null

onMounted(() => {
  if (!editorContainer.value) return
  
  editor = monaco.editor.create(editorContainer.value, {
    value: '',
    language: 'typescript',
    theme: 'vs-dark',
    automaticLayout: true,
    minimap: { enabled: true },
    fontSize: 14,
    tabSize: 2
  })
})

onUnmounted(() => {
  editor?.dispose()
})
</script>
```

### LSP 集成

```typescript
// LSP 客户端配置
interface LSPConfig {
  serverUrl: string
  language: string
  capabilities: {
    completion: boolean
    hover: boolean
    signatureHelp: boolean
    definition: boolean
    references: boolean
    rename: boolean
  }
}

// Monaco 语言服务配置
monaco.languages.registerCompletionItemProvider('typescript', {
  provideCompletionItems: async (model, position) => {
    // 调用 LSP 服务器获取补全
    const suggestions = await lspClient.completion(
      model.uri.toString(),
      position
    )
    return { suggestions }
  }
})
```

## 🎨 UI 组件规划

### 1. SettingsView.vue
- 左侧分类导航
- 右侧设置项列表
- 搜索功能
- JSON/可视化切换

### 2. SettingItem.vue
- 根据类型渲染不同控件
- 字符串：文本输入
- 数字：数字输入/滑块
- 布尔：开关
- 枚举：下拉框
- 对象/数组：展开编辑

### 3. MonacoEditor.vue
- 代码编辑器
- 语法高亮
- 自动完成
- 错误提示
- 多标签页

### 4. LSPClient.ts
- WebSocket 连接
- LSP 协议实现
- 消息队列
- 错误处理

## 📊 实现优先级

### 高优先级 (P0)
1. ✅ GraphElementsPanel 基础功能
2. ⏳ SettingsService 核心服务
3. ⏳ SettingsView 可视化编辑
4. ⏳ Monaco Editor 基础集成

### 中优先级 (P1)
5. ⏳ SettingsJsonEditor JSON 编辑
6. ⏳ 设置持久化和同步
7. ⏳ LSP 基础功能

### 低优先级 (P2)
8. ⏳ LSP 高级功能
9. ⏳ 多文件编辑
10. ⏳ 自定义主题

## 🔗 集成到插件系统

### 插件 API 扩展

```typescript
interface PluginContext {
  // ... 现有 API ...
  
  // 设置 API
  settings: {
    register(settings: Setting[]): void
    get<T>(key: string): T
    set(key: string, value: any): void
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

### 使用示例

```typescript
export class MyPlugin implements Plugin {
  async install(context: PluginContext) {
    // 注册设置
    context.settings.register([
      {
        key: 'myPlugin.enabled',
        type: 'boolean',
        default: true,
        title: '启用插件',
        category: '我的插件'
      }
    ])
    
    // 监听设置变化
    context.settings.onChange('myPlugin.enabled', (enabled) => {
      console.log('Plugin enabled:', enabled)
    })
    
    // 打开编辑器
    await context.editor.open('file:///path/to/file.ts', 'typescript')
  }
}
```

## 📈 进度跟踪

- [x] 图元素侧边栏组件
- [x] 元素列表和过滤
- [x] 元素详情显示
- [x] 历史记录功能
- [ ] 设置服务架构
- [ ] 设置 UI 组件
- [ ] Monaco Editor 集成
- [ ] LSP 客户端实现
- [ ] 插件 API 扩展
- [ ] 文档和示例

## 🎯 下一步行动

1. **创建 SettingsService**
   - 设置存储和读取
   - 设置验证
   - 变更通知

2. **实现 SettingsView**
   - 分类导航
   - 设置项渲染
   - 搜索功能

3. **集成 Monaco Editor**
   - 安装依赖
   - 创建编辑器组件
   - 配置语言支持

4. **实现 LSP 客户端**
   - WebSocket 连接
   - 协议实现
   - Monaco 集成

## 💡 技术要点

### 设置持久化
```typescript
// 使用 localStorage
const settings = JSON.parse(localStorage.getItem('settings') || '{}')

// 使用 IndexedDB (大量数据)
const db = await openDB('settings', 1)
await db.put('settings', settings, 'user')
```

### LSP 通信
```typescript
// WebSocket 连接
const ws = new WebSocket('ws://localhost:3000/lsp')

// 发送请求
ws.send(JSON.stringify({
  jsonrpc: '2.0',
  id: 1,
  method: 'textDocument/completion',
  params: { /* ... */ }
}))

// 接收响应
ws.onmessage = (event) => {
  const response = JSON.parse(event.data)
  // 处理响应
}
```

### Monaco 主题
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

## 🎉 总结

当前已完成图元素侧边栏的基础功能，包括：
- ✅ 节点和边列表显示
- ✅ 搜索过滤功能
- ✅ 元素详情展示
- ✅ 历史记录追踪
- ✅ 与图视图联动

下一步将实现 VSCode 风格的设置系统和 Monaco Editor 集成，为插件系统提供更强大的配置和编辑能力。

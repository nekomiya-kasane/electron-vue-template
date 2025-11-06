# Plugin System Quick Start Guide

## 快速开始 (Quick Start)

### 1. 使用新插件系统 (Use New Plugin System)

```typescript
// src/main.ts
import { initializePluginsV2 } from './plugins/initializePluginsV2'

// 初始化插件系统
await initializePluginsV2()
```

### 2. 管理插件 (Manage Plugins)

```typescript
import {
  enablePlugin,
  disablePlugin,
  isPluginEnabled,
  reloadPlugins
} from '@/plugins/initializePluginsV2'

// 启用插件
await enablePlugin('graph')

// 禁用插件
await disablePlugin('graph')

// 检查状态
if (isPluginEnabled('graph')) {
  console.log('Graph plugin is enabled')
}

// 重新加载
await reloadPlugins()
```

### 3. 创建插件 (Create a Plugin)

#### 步骤 1: 创建插件文件

```typescript
// src/plugins/MyPlugin.ts
import type { Plugin, PluginContext } from '@/core/plugin'

export const MyPlugin: Plugin = {
  metadata: {
    id: 'my-plugin',
    name: 'My Plugin',
    version: '1.0.0',
    description: 'My awesome plugin'
  },

  install(context: PluginContext) {
    // 注册命令
    context.commands.registerCommand('hello', () => {
      console.log('Hello from My Plugin!')
    })

    // 监听事件
    context.on('document:created', (doc) => {
      console.log('Document created:', doc)
    })
  },

  onActivate(context: PluginContext) {
    console.log('My Plugin activated!')
  }
}
```

#### 步骤 2: 创建清单文件（可选）

```json
// src/plugins/my-plugin/manifest.json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "version": "1.0.0",
  "description": "My awesome plugin",
  "categories": ["feature"],
  "activationEvents": ["onStartup"],
  "main": "./MyPlugin.ts",
  "contributes": {
    "commands": [
      {
        "id": "myPlugin.hello",
        "title": "Hello World",
        "category": "My Plugin"
      }
    ],
    "configuration": {
      "properties": {
        "myPlugin.enabled": {
          "type": "boolean",
          "default": true,
          "description": "Enable my plugin"
        }
      }
    }
  }
}
```

### 4. 添加插件设置界面 (Add Plugin Settings UI)

```vue
<template>
  <plugin-settings />
</template>

<script setup>
import PluginSettings from '@/components/settings/PluginSettings.vue'
</script>
```

### 5. 访问配置 (Access Configuration)

```typescript
// 在插件中
install(context: PluginContext) {
  // 读取配置
  const enabled = context.configuration.get('myPlugin.enabled', true)
  
  // 更新配置
  context.configuration.update('myPlugin.enabled', false, 'global')
  
  // 监听配置变化
  context.configuration.onDidChangeConfiguration((event) => {
    if (event.affectsConfiguration('myPlugin')) {
      console.log('My plugin configuration changed')
    }
  })
}
```

### 6. 注册 UI 组件 (Register UI Components)

```typescript
install(context: PluginContext) {
  // 注册侧边栏
  context.registerSidebar({
    id: 'my-sidebar',
    title: 'My Sidebar',
    position: 'left',
    component: MySidebarComponent
  }, ['myDocType'])

  // 注册图标按钮
  context.registerIconButton({
    id: 'my-button',
    icon: '🔧',
    title: 'My Tool',
    position: 'left'
  })

  // 注册状态栏项
  context.registerStatusBarItem({
    id: 'my-status',
    text: 'Ready',
    position: 'left',
    priority: 5
  })
}
```

### 7. 注册文档类型 (Register Document Type)

```typescript
install(context: PluginContext) {
  // 注册文档类型
  context.registerDocumentType({
    id: 'myDocType',
    name: 'My Document',
    extensions: ['.mydoc'],
    icon: '📄'
  })

  // 注册主视图
  context.registerMainView({
    id: 'my-viewer',
    component: MyViewerComponent,
    supportedDocumentTypes: ['myDocType']
  })
}
```

### 8. 使用事件系统 (Use Event System)

```typescript
install(context: PluginContext) {
  // 监听事件
  context.on('document:created', (doc) => {
    console.log('Document created:', doc)
  })

  // 发送事件
  context.emit('myPlugin:ready', { version: '1.0.0' })

  // 与其他插件通信
  const otherPlugin = context.getPlugin('other-plugin')
  if (otherPlugin) {
    // 使用其他插件的功能
  }
}
```

## 常用命令 (Common Commands)

```typescript
// 获取所有插件
const plugins = getAllPlugins()

// 获取活动插件
const active = getActivePlugins()

// 检查插件状态
const enabled = isPluginEnabled('graph')

// 启用/禁用
await enablePlugin('graph')
await disablePlugin('graph')

// 重新加载
await reloadPlugins()
```

## 配置示例 (Configuration Example)

```json
{
  "plugins.disabled": ["plugin-to-disable"],
  "graph.autoLayout": true,
  "graph.layoutAlgorithm": "dagre",
  "editor.fontSize": 14,
  "myPlugin.enabled": true,
  "myPlugin.mode": "auto"
}
```

## 调试技巧 (Debugging Tips)

```typescript
// 查看插件状态
console.log('Plugins:', pluginManagerV2.getAllPlugins())

// 查看配置
console.log('Config:', pluginManagerV2.getConfiguration())

// 查看事件
pluginManagerV2.getEventBus().on('*', (event, ...args) => {
  console.log('Event:', event, args)
})
```

## 更多信息 (More Information)

- 完整文档: [PLUGIN_SYSTEM.md](./PLUGIN_SYSTEM.md)
- 迁移指南: [PLUGIN_MIGRATION.md](./PLUGIN_MIGRATION.md)
- 重构总结: [REFACTORING_SUMMARY.md](./REFACTORING_SUMMARY.md)

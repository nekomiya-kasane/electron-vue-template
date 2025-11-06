# 插件系统重构完成 / Plugin System Refactoring Complete

## 🎉 重构概述 / Overview

已成功将插件系统重构为类似 VSCode 的动态插件架构，支持启动时发现、启用/禁用、热重载等功能。

Successfully refactored the plugin system into a VSCode-like dynamic plugin architecture with startup discovery, enable/disable, and hot-reload support.

## ✨ 核心特性 / Core Features

### 1. 动态插件发现 (Dynamic Plugin Discovery)
- ✅ 启动时自动发现插件
- ✅ 支持内置和外部插件
- ✅ 基于清单文件的元数据

### 2. 启用/禁用功能 (Enable/Disable)
- ✅ 通过设置启用/禁用插件
- ✅ 状态持久化
- ✅ 运行时切换

### 3. 统一设置系统 (Unified Settings)
- ✅ 所有插件设置在同一配置中
- ✅ 类似 VSCode 的 settings.json
- ✅ 全局和工作区作用域

### 4. 贡献点系统 (Contribution Points)
- ✅ 文档类型 (Document Types)
- ✅ 侧边栏 (Sidebars)
- ✅ 图标按钮 (Icon Buttons)
- ✅ 主视图 (Main Views)
- ✅ 状态栏 (Status Bar)
- ✅ 命令 (Commands)
- ✅ 菜单 (Menus)
- ✅ 配置 (Configuration)
- ✅ 主题 (Themes)
- ✅ 语言/LSP (Languages)

### 5. 插件管理界面 (Plugin Management UI)
- ✅ 查看所有插件
- ✅ 启用/禁用插件
- ✅ 搜索和过滤
- ✅ 重新加载系统

## 📁 新增文件 / New Files

### 核心系统 (Core System)
```
src/core/plugin/
├── PluginManagerV2.ts       # 增强的插件管理器
├── PluginDiscovery.ts       # 插件发现服务
├── PluginLoader.ts          # 插件加载器
├── PluginManifest.ts        # 插件清单类型定义
└── index.ts                 # 更新的导出
```

### 插件初始化 (Plugin Initialization)
```
src/plugins/
├── initializePluginsV2.ts   # 新的初始化系统
└── graph/
    └── manifest.json        # 示例插件清单
```

### UI 组件 (UI Components)
```
src/components/settings/
├── PluginSettings.vue       # 插件设置面板
└── PluginList.vue          # 插件列表组件
```

### 文档 (Documentation)
```
docs/
├── PLUGIN_SYSTEM.md         # 完整的插件系统文档
├── PLUGIN_MIGRATION.md      # 迁移指南
├── PLUGIN_QUICK_START.md    # 快速开始指南
└── REFACTORING_SUMMARY.md   # 重构总结
```

## 🚀 快速开始 / Quick Start

### 使用新插件系统

```typescript
// src/main.ts
import { initializePluginsV2 } from './plugins/initializePluginsV2'

// 初始化插件系统
await initializePluginsV2()
```

### 管理插件

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
const enabled = isPluginEnabled('graph')

// 重新加载
await reloadPlugins()
```

### 添加插件管理界面

```vue
<template>
  <plugin-settings />
</template>

<script setup>
import PluginSettings from '@/components/settings/PluginSettings.vue'
</script>
```

## 📚 插件分类 / Plugin Categories

### 1. 文档类型插件 (Document Type Plugins)
注册新的文档类型，所有插件都可以使用。

**示例:** Graph Plugin 注册 `QIViewer` 文档类型

### 2. 额外功能插件 (Feature Plugins)
为特定文档类型或全局添加功能。

**示例:** 侧边栏面板、工具栏按钮

### 3. 主题插件 (Theme Plugins)
改变应用程序的视觉样式。

**示例:** 深色主题、浅色主题

### 4. 语言插件 (Language Plugins)
提供语言特定功能和 LSP 支持。

**示例:** TypeScript 语言支持

## 🔧 主程序提供的服务 / Services Provided

### 1. 文档类型系统
- 注册自定义文档类型
- 打开和管理文档
- 文档间切换

### 2. UI 系统
- 两个侧边栏（左右）
- 状态栏
- 图标栏
- 主视图区域

### 3. 设置系统
- 统一配置存储
- 全局和工作区作用域
- 配置变更事件

### 4. 事件系统
- 插件间通信
- 主程序与插件通信
- 事件订阅和广播

### 5. 渲染支持
- WebGPU 支持
- WebGL 支持
- Canvas 渲染

### 6. LSP 支持
- 语言服务器协议集成
- 语法高亮
- 代码补全
- 诊断信息

## 📖 插件清单示例 / Plugin Manifest Example

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "version": "1.0.0",
  "description": "My awesome plugin",
  "categories": ["feature"],
  "activationEvents": ["onStartup"],
  "main": "./MyPlugin.ts",
  "contributes": {
    "documentTypes": [
      {
        "id": "myDocType",
        "name": "My Document",
        "extensions": [".mydoc"],
        "icon": "📄"
      }
    ],
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

## 🔄 向后兼容 / Backward Compatibility

- ✅ 原有 `PluginManager` 保留
- ✅ 新旧系统可以共存
- ✅ 渐进式迁移
- ✅ 现有插件无需修改即可工作

## 📝 配置示例 / Configuration Example

```json
{
  "plugins.disabled": ["plugin-id-to-disable"],
  "graph.autoLayout": true,
  "graph.layoutAlgorithm": "dagre",
  "graph.nodeColor": "#4CAF50",
  "editor.fontSize": 14,
  "theme.current": "dark"
}
```

## 🎯 激活事件 / Activation Events

```json
{
  "activationEvents": [
    "onStartup",                    // 启动时激活
    "onDocumentType:QIViewer",      // 打开特定文档类型时
    "onCommand:graph.newGraph",     // 执行特定命令时
    "onView:graph-viewer"           // 打开特定视图时
  ]
}
```

## 🛠️ 开发工具 / Development Tools

### 热重载 (Hot Reload)
```typescript
import { reloadPlugins } from '@/plugins/initializePluginsV2'

// 修改插件后重新加载
await reloadPlugins()
```

### 调试 (Debugging)
```typescript
// 查看所有插件
console.log('Plugins:', pluginManagerV2.getAllPlugins())

// 查看配置
console.log('Config:', pluginManagerV2.getConfiguration())

// 监听所有事件
pluginManagerV2.getEventBus().on('*', (event, ...args) => {
  console.log('Event:', event, args)
})
```

## 📋 待办事项 / TODO

### 短期 (Short Term)
- [ ] 为所有现有插件创建清单文件
- [ ] 更新主程序使用新的初始化系统
- [ ] 添加插件管理界面到设置页面
- [ ] 编写单元测试

### 中期 (Medium Term)
- [ ] 实现插件沙箱
- [ ] 添加插件依赖管理
- [ ] 支持外部插件安装
- [ ] 插件市场

### 长期 (Long Term)
- [ ] 插件 API 版本控制
- [ ] 插件性能分析
- [ ] 插件开发工具
- [ ] 插件文档生成器

## 📚 文档链接 / Documentation Links

- **完整文档:** [docs/PLUGIN_SYSTEM.md](./docs/PLUGIN_SYSTEM.md)
- **迁移指南:** [docs/PLUGIN_MIGRATION.md](./docs/PLUGIN_MIGRATION.md)
- **快速开始:** [docs/PLUGIN_QUICK_START.md](./docs/PLUGIN_QUICK_START.md)
- **重构总结:** [docs/REFACTORING_SUMMARY.md](./docs/REFACTORING_SUMMARY.md)

## 🤝 贡献 / Contributing

欢迎贡献新的插件或改进现有系统！

Welcome to contribute new plugins or improve the existing system!

### 创建新插件 (Create New Plugin)
1. 创建插件目录和文件
2. 编写插件代码
3. 创建清单文件（可选）
4. 测试插件功能
5. 提交 PR

### 改进系统 (Improve System)
1. 查看 TODO 列表
2. 选择一个任务
3. 实现功能
4. 编写测试
5. 更新文档
6. 提交 PR

## 📄 许可证 / License

与主项目相同 / Same as the main project

---

**重构完成时间 / Refactoring Completed:** 2025-11-06

**参考实现 / Reference Implementation:** VSCode Extension System

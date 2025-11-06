# Plugin System Refactoring Summary

## 概述 (Overview)

本次重构将插件系统从硬编码的静态注册方式改造为类似 VSCode 的动态发现和管理系统。

## 主要变更 (Key Changes)

### 1. 动态插件发现
- `PluginDiscovery.ts` - 插件发现服务
- `PluginLoader.ts` - 插件加载器
- `PluginManifest.ts` - 插件清单类型

### 2. 启用/禁用功能
- `PluginManagerV2.ts` - 增强的插件管理器
- 通过设置启用/禁用插件
- 状态持久化

### 3. 统一设置系统
- 所有插件设置存储在统一配置中
- 支持全局和工作区作用域

### 4. 贡献点系统
- 文档类型、侧边栏、图标按钮
- 主视图、状态栏、命令、菜单
- 配置、主题、语言支持

### 5. 插件管理界面
- `PluginSettings.vue` - 插件设置面板
- `PluginList.vue` - 插件列表组件

## 插件分类

1. **文档类型插件** - 注册新文档类型
2. **额外功能插件** - 添加功能
3. **主题插件** - 改变样式
4. **语言插件** - LSP 支持

## 主程序提供的服务

1. 文档类型系统
2. UI 系统（侧边栏、状态栏等）
3. 设置系统
4. 事件系统
5. 渲染支持（WebGPU/WebGL）
6. LSP 支持

## 新增文件

```
src/core/plugin/
├── PluginManagerV2.ts
├── PluginDiscovery.ts
├── PluginLoader.ts
└── PluginManifest.ts

src/plugins/
└── initializePluginsV2.ts

src/components/settings/
├── PluginSettings.vue
└── PluginList.vue

docs/
├── PLUGIN_SYSTEM.md
├── PLUGIN_MIGRATION.md
└── REFACTORING_SUMMARY.md
```

## API 使用

```typescript
// 初始化
import { initializePluginsV2 } from './plugins/initializePluginsV2'
await initializePluginsV2()

// 管理插件
await enablePlugin('graph')
await disablePlugin('graph')
const enabled = isPluginEnabled('graph')
await reloadPlugins()
```

## 向后兼容

- 原有 `PluginManager` 保留
- 新旧系统可共存
- 渐进式迁移

## 参考文档

- [Plugin System Documentation](./PLUGIN_SYSTEM.md)
- [Migration Guide](./PLUGIN_MIGRATION.md)

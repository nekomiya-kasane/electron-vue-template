# 插件系统重构 - VSCode 风格

## 🎯 重构目标

学习 VSCode 的插件机制，重构插件系统以支持：
1. **命令系统** - 插件间通过命令进行通信
2. **配置系统** - 全局和工作区配置管理
3. **EventEmitter** - 类型安全的事件发射器
4. **Disposable** - 资源自动清理机制

## 📦 新增组件

### 1. CommandRegistry（命令注册表）

类似 VSCode 的 `vscode.commands`，提供命令注册和执行功能。

#### 核心功能
```typescript
class CommandRegistry {
  // 注册命令
  registerCommand(id: string, handler: (...args: any[]) => any, options?: {
    description?: string
    category?: string
  }): void

  // 执行命令
  executeCommand<T>(id: string, ...args: any[]): Promise<T>

  // 注销命令
  unregisterCommand(id: string): boolean

  // 获取所有命令
  getAllCommands(): Command[]

  // 获取命令历史
  getCommandHistory(limit?: number): Array<{
    id: string
    args: any[]
    timestamp: number
  }>
}
```

#### 使用示例
```typescript
// 插件 A 注册命令
context.commands.registerCommand('sayHello', (name: string) => {
  console.log(`Hello, ${name}!`)
  return `Greeted ${name}`
}, {
  description: '向用户问好',
  category: 'Greetings'
})

// 插件 B 调用命令
const result = await context.commands.executeCommand('pluginA.sayHello', 'World')
console.log(result) // "Greeted World"
```

### 2. ConfigurationService（配置服务）

类似 VSCode 的 `vscode.workspace.getConfiguration`，提供配置管理功能。

#### 核心功能
```typescript
class ConfigurationService {
  // 获取配置
  get<T>(section: string, scope?: 'global' | 'workspace'): T | undefined

  // 更新配置
  update(section: string, value: any, scope?: 'global' | 'workspace'): void

  // 获取配置对象
  getConfiguration(section?: string): {
    get<T>(key: string, defaultValue?: T): T
    update(key: string, value: any, scope?: 'global' | 'workspace'): void
    has(key: string): boolean
  }

  // 监听配置变化
  onDidChangeConfiguration(listener: (event: ConfigurationChangeEvent) => void): () => void
}
```

#### 使用示例
```typescript
// 获取配置
const fontSize = context.configuration.get('editor.fontSize', 14)

// 更新配置
context.configuration.update('editor.fontSize', 16, 'workspace')

// 获取配置对象
const editorConfig = context.configuration.getConfiguration('editor')
const tabSize = editorConfig.get('tabSize', 4)

// 监听配置变化
context.configuration.onDidChangeConfiguration((event) => {
  if (event.affectsConfiguration('editor.fontSize')) {
    console.log('字体大小已更改')
  }
})
```

### 3. EventEmitter（事件发射器）

类似 VSCode 的 `vscode.EventEmitter`，提供类型安全的事件机制。

#### 核心功能
```typescript
class EventEmitter<T> {
  // 事件订阅接口
  get event(): Event<T>

  // 触发事件
  fire(event: T): void

  // 检查是否有监听器
  hasListeners(): boolean

  // 释放所有监听器
  dispose(): void
}

interface Event<T> {
  (listener: (e: T) => any, thisArgs?: any): Disposable
}
```

#### 使用示例
```typescript
// 创建事件发射器
const onDidChangeData = new EventEmitter<{ value: number }>()

// 订阅事件
const disposable = onDidChangeData.event((e) => {
  console.log('Data changed:', e.value)
})

// 触发事件
onDidChangeData.fire({ value: 42 })

// 取消订阅
disposable.dispose()
```

### 4. DisposableStore（资源管理）

类似 VSCode 的 `Disposable`，提供资源自动清理机制。

#### 核心功能
```typescript
interface Disposable {
  dispose(): void
}

class DisposableStore implements Disposable {
  // 添加 Disposable
  add<T extends Disposable>(disposable: T): T

  // 释放所有 Disposable
  dispose(): void

  // 清空但不释放
  clear(): void
}
```

#### 使用示例
```typescript
// 插件上下文自动提供 DisposableStore
const { subscriptions } = context

// 添加事件监听（自动管理）
subscriptions.add(
  context.on('data:changed', handleDataChange)
)

// 添加命令（自动管理）
subscriptions.add({
  dispose: () => context.commands.unregisterCommand('myCommand')
})

// 插件卸载时，所有 Disposable 自动释放
```

## 🔄 PluginContext 更新

### 新增 API

```typescript
interface PluginContext {
  // ... 原有 API ...

  // VSCode 风格的命令系统
  commands: {
    registerCommand(
      id: string,
      handler: (...args: any[]) => any,
      options?: { description?: string; category?: string }
    ): string
    executeCommand<T = any>(id: string, ...args: any[]): Promise<T>
    getCommands(): Array<{ id: string; description?: string; category?: string }>
  }

  // VSCode 风格的配置系统
  configuration: {
    get<T = any>(section: string, defaultValue?: T): T | undefined
    update(section: string, value: any, scope?: 'global' | 'workspace'): void
    has(section: string): boolean
    getConfiguration(section?: string): {
      get<T = any>(key: string, defaultValue?: T): T
      update(key: string, value: any, scope?: 'global' | 'workspace'): void
      has(key: string): boolean
    }
    onDidChangeConfiguration(listener: (event: ConfigurationChangeEvent) => void): () => void
  }

  // Disposable 管理
  subscriptions: DisposableStore
}
```

## 📊 插件间通信方式

### 1. 命令通信（推荐）

**场景**：插件 A 提供功能，插件 B 调用

```typescript
// 插件 A - 提供命令
export class PluginA implements Plugin {
  async install(context: PluginContext) {
    // 注册命令
    context.commands.registerCommand('openFile', async (path: string) => {
      const content = await readFile(path)
      return content
    }, {
      description: '打开文件',
      category: 'File'
    })
  }
}

// 插件 B - 调用命令
export class PluginB implements Plugin {
  async install(context: PluginContext) {
    // 执行插件 A 的命令
    const content = await context.commands.executeCommand<string>(
      'pluginA.openFile',
      '/path/to/file.txt'
    )
    console.log('File content:', content)
  }
}
```

### 2. 事件通信

**场景**：插件 A 发布事件，插件 B 订阅

```typescript
// 插件 A - 发布事件
export class PluginA implements Plugin {
  async install(context: PluginContext) {
    // 发送事件
    context.emit('file:opened', { path: '/path/to/file.txt' })
  }
}

// 插件 B - 订阅事件
export class PluginB implements Plugin {
  async install(context: PluginContext) {
    // 监听事件（自动管理生命周期）
    context.subscriptions.add({
      dispose: () => {
        context.off('file:opened', handleFileOpened)
      }
    })
    
    context.on('file:opened', handleFileOpened)
  }
}

function handleFileOpened(data: { path: string }) {
  console.log('File opened:', data.path)
}
```

### 3. 共享配置

**场景**：多个插件共享配置

```typescript
// 插件 A - 设置配置
export class PluginA implements Plugin {
  async install(context: PluginContext) {
    context.configuration.update('app.theme', 'dark', 'global')
  }
}

// 插件 B - 读取配置
export class PluginB implements Plugin {
  async install(context: PluginContext) {
    const theme = context.configuration.get('app.theme', 'light')
    console.log('Current theme:', theme)
    
    // 监听配置变化
    context.configuration.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration('app.theme')) {
        const newTheme = context.configuration.get('app.theme')
        console.log('Theme changed to:', newTheme)
      }
    })
  }
}
```

### 4. 共享存储

**场景**：插件间共享数据

```typescript
// 插件 A - 存储数据
export class PluginA implements Plugin {
  async install(context: PluginContext) {
    context.storage.set('sharedData', { count: 42 })
  }
}

// 插件 B - 读取数据
export class PluginB implements Plugin {
  async install(context: PluginContext) {
    const data = context.storage.get('pluginA:sharedData')
    console.log('Shared data:', data)
  }
}
```

## 🎯 最佳实践

### 1. 使用命令进行插件间调用

```typescript
// ✅ 推荐：通过命令调用
context.commands.executeCommand('otherPlugin.doSomething', arg1, arg2)

// ❌ 不推荐：直接获取插件实例
const plugin = context.getPlugin('otherPlugin')
plugin.doSomething(arg1, arg2)
```

### 2. 使用 Disposable 管理资源

```typescript
// ✅ 推荐：使用 subscriptions 自动管理
context.subscriptions.add(
  context.on('event', handler)
)

// ❌ 不推荐：手动管理
context.on('event', handler)
// 需要在 onUninstall 中手动 off
```

### 3. 使用配置系统共享设置

```typescript
// ✅ 推荐：使用配置系统
const config = context.configuration.getConfiguration('myPlugin')
const value = config.get('setting', defaultValue)

// ❌ 不推荐：使用 storage
const value = context.storage.get('setting') ?? defaultValue
```

### 4. 命名规范

```typescript
// 命令 ID：pluginId.commandName
context.commands.registerCommand('myPlugin.openFile', handler)

// 配置节：pluginId.settingName
context.configuration.update('myPlugin.fontSize', 14)

// 事件名：category:action
context.emit('file:opened', data)
```

## 📈 性能优化

### 1. 命令历史限制

```typescript
// 命令历史自动限制在 100 条
// 避免内存泄漏
```

### 2. 配置变化通知

```typescript
// 只通知相关的监听器
onDidChangeConfiguration((event) => {
  if (event.affectsConfiguration('mySection')) {
    // 只有相关配置变化时才执行
  }
})
```

### 3. Disposable 自动清理

```typescript
// 插件卸载时自动清理所有资源
// 无需手动管理
```

## 🔍 调试支持

### 1. 命令历史查看

```typescript
const history = pluginManager.getCommandRegistry().getCommandHistory(10)
console.log('Recent commands:', history)
```

### 2. 配置查看

```typescript
const config = pluginManager.getConfigurationService().getAllConfiguration('workspace')
console.log('Workspace config:', config)
```

### 3. 事件监听器统计

```typescript
const eventBus = pluginManager.getEventBus()
const count = eventBus.listenerCount('file:opened')
console.log('Listeners for file:opened:', count)
```

## 🎉 总结

通过学习 VSCode 的插件机制，我们实现了：

1. **命令系统** - 插件间通过命令进行解耦通信
2. **配置系统** - 统一的配置管理和变化通知
3. **EventEmitter** - 类型安全的事件机制
4. **Disposable** - 自动资源清理，防止内存泄漏

这些改进使插件系统更加：
- ✅ **解耦** - 插件间通过命令和事件通信，不直接依赖
- ✅ **类型安全** - TypeScript 类型支持
- ✅ **易用** - API 简洁直观
- ✅ **可靠** - 自动资源管理，防止泄漏
- ✅ **可扩展** - 易于添加新功能

插件开发者现在可以使用熟悉的 VSCode 风格 API 进行开发！🚀

# Socket 系统架构修复

## 问题

原始实现尝试在渲染进程中直接使用 `window.require('net')`，这在浏览器环境中不可用，导致错误：

```
TypeError: window.require is not a function
```

## 解决方案

将 Socket 服务器移到 Electron 主进程，通过 IPC 通信实现渲染进程和主进程之间的交互。

## 新架构

```
┌─────────────────────────────────────────────────────────┐
│                    渲染进程 (Renderer)                   │
│  ┌─────────────────────────────────────────────────┐   │
│  │          GraphView Component                     │   │
│  │  ┌────────────────────────────────────────┐     │   │
│  │  │      useGraphSocket (Composable)       │     │   │
│  │  │  - 通过 IPC 调用主进程 API             │     │   │
│  │  │  - 监听 IPC 事件                       │     │   │
│  │  └────────────────────────────────────────┘     │   │
│  │  ┌────────────────────────────────────────┐     │   │
│  │  │    GraphMessageHandler                 │     │   │
│  │  │  - 处理消息                            │     │   │
│  │  │  - 操作 Cytoscape                      │     │   │
│  │  └────────────────────────────────────────┘     │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                          ↕ IPC
┌─────────────────────────────────────────────────────────┐
│                    主进程 (Main Process)                 │
│  ┌─────────────────────────────────────────────────┐   │
│  │      SocketServerManager                        │   │
│  │  - 创建/停止 Socket 服务器                      │   │
│  │  - 管理客户端连接                               │   │
│  │  - 解析 JSON 消息                               │   │
│  │  - 通过 IPC 发送事件到渲染进程                  │   │
│  └─────────────────────────────────────────────────┘   │
│                          ↕                              │
│                   Node.js net 模块                      │
└─────────────────────────────────────────────────────────┘
                          ↕ TCP
┌─────────────────────────────────────────────────────────┐
│                  外部客户端 (TCP Client)                 │
│  - Python, C++, Node.js, 等                            │
│  - 发送 JSON 消息                                       │
└─────────────────────────────────────────────────────────┘
```

## 修改的文件

### 1. 主进程 (Electron)

#### `electron/ipc/handlers/socket.ts` (新建)
- **SocketServerManager** 类：管理所有 Socket 服务器
- 创建/停止服务器
- 处理客户端连接
- 解析 JSON 消息
- 通过 IPC 发送事件到渲染进程

#### `electron/ipc/index.ts`
- 注册 Socket IPC endpoints

#### `electron/preload.ts`
- 暴露 Socket API 到渲染进程
- 提供 IPC 调用包装器

### 2. 渲染进程

#### `src/vite-env.d.ts`
- 添加 Socket API 类型定义

#### `src/components/views/useGraphSocket.ts`
- 重写为使用 IPC 而不是直接调用 Node.js API
- 通过 `window.electronAPI.socket` 调用主进程

#### `src/components/views/GraphView.vue`
- 无需修改（已集成）

## IPC API

### 主进程 → 渲染进程 (Events)

```typescript
// 新连接
window.electronAPI.socket.onConnection((data) => {
  // data: { serverName: string, session: SocketSession }
})

// 收到消息
window.electronAPI.socket.onMessage((data) => {
  // data: { serverName: string, session: SocketSession, message: SocketMessage }
})

// 连接断开
window.electronAPI.socket.onDisconnection((data) => {
  // data: { serverName: string, session: SocketSession }
})
```

### 渲染进程 → 主进程 (Invoke)

```typescript
// 创建服务器
const result = await window.electronAPI.socket.createServer(name, port, host)
// result: { success: boolean, error?: string }

// 停止服务器
const result = await window.electronAPI.socket.stopServer(name)
// result: { success: boolean, error?: string }

// 获取会话列表
const sessions = await window.electronAPI.socket.getSessions(name)
// sessions: SocketSession[]

// 获取服务器状态
const status = await window.electronAPI.socket.getStatus(name)
// status: { isRunning: boolean, sessionCount: number } | null
```

## 使用方法

### 在 GraphView 中使用（已集成）

```vue
<script setup>
import { useGraphSocket } from './useGraphSocket'

const { isRunning, sessions, start, stop } = useGraphSocket(cy, {
  port: 8080,
  host: '0.0.0.0',
  autoStart: false
})

// 启动服务器
await start()

// 停止服务器
await stop()
</script>
```

### 在其他组件中使用

```typescript
// 创建服务器
const result = await window.electronAPI?.socket.createServer('my-server', 9000)
if (result.success) {
  console.log('Server started')
}

// 监听消息
window.electronAPI?.socket.onMessage((data) => {
  console.log('Received:', data.message)
})

// 停止服务器
await window.electronAPI?.socket.stopServer('my-server')
```

## 优势

1. **安全性**：Socket 服务器运行在主进程，隔离于渲染进程
2. **稳定性**：不受渲染进程刷新影响
3. **兼容性**：完全兼容 Electron 安全模型
4. **可维护性**：清晰的进程边界

## 测试

启动应用后，Socket 功能应该正常工作：

```bash
# 启动应用
npm run electron:dev

# 在 GraphView 中点击 Socket 按钮

# 运行测试脚本
node test/socket-client-test.js
```

## 注意事项

1. **只在 Electron 环境可用**：浏览器模式下 Socket API 不可用
2. **IPC 开销**：消息需要通过 IPC 传递，有轻微性能开销
3. **事件清理**：组件卸载时记得调用 `removeAllListeners()`

## 迁移指南

如果你有使用旧 Socket API 的代码，需要进行以下修改：

### 旧代码
```typescript
import { socketManager } from '@/core/socket'

const server = socketManager.createServer('my-server', { port: 8080 })
await server.start()
```

### 新代码
```typescript
const result = await window.electronAPI?.socket.createServer('my-server', 8080)
if (!result.success) {
  console.error(result.error)
}
```

## 故障排除

### 错误：Electron API not available

**原因**：在浏览器模式下运行

**解决**：使用 Electron 模式启动
```bash
npm run electron:dev
```

### 错误：Server already exists

**原因**：服务器已经在运行

**解决**：先停止现有服务器
```typescript
await window.electronAPI?.socket.stopServer('graph-view')
```

### 消息未被处理

**原因**：事件监听器未注册

**解决**：确保在创建服务器前注册监听器
```typescript
window.electronAPI?.socket.onMessage(handler)
await window.electronAPI?.socket.createServer(...)
```

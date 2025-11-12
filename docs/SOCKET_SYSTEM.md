# Socket 系统使用说明

## 概述

本项目提供了一个通用的 Socket 管理系统，支持插件创建 Socket Server 或作为 Socket Client 连接到远程服务器。

## 架构

```
┌─────────────────────────────────────────┐
│         SocketManager (单例)            │
│  ┌───────────────┐  ┌───────────────┐  │
│  │ Socket Server │  │ Socket Client │  │
│  │   (多个)      │  │   (多个)      │  │
│  └───────────────┘  └───────────────┘  │
└─────────────────────────────────────────┘
```

## 核心组件

### 1. SocketManager

全局单例，管理所有 Socket Server 和 Client 实例。

```typescript
import { socketManager } from '@/core/socket'

// 创建 Server
const server = socketManager.createServer('my-server', {
  port: 8080,
  host: '0.0.0.0',
  maxConnections: 100
})

// 创建 Client
const client = socketManager.createClient('my-client', {
  host: 'localhost',
  port: 8080,
  reconnect: true
})
```

### 2. SocketServer

支持多个客户端连接，每个连接视为独立会话。

```typescript
import { SocketServer } from '@/core/socket'

const server = new SocketServer({
  port: 8080,
  host: '0.0.0.0',
  maxConnections: 50
})

// 启动服务器
await server.start()

// 监听消息
server.onMessage((message, session) => {
  console.log(`Received from ${session.id}:`, message)
})

// 监听连接
server.onConnection((session) => {
  console.log(`Client connected: ${session.id}`)
})

// 发送消息到指定会话
server.send(sessionId, {
  framework: 'System',
  command: 'test',
  payload: { data: 'hello' }
})

// 广播消息
server.broadcast({
  framework: 'System',
  command: 'broadcast',
  payload: { message: 'Hello all!' }
})

// 停止服务器
await server.stop()
```

### 3. SocketClient

连接到远程 Socket 服务器。

```typescript
import { SocketClient } from '@/core/socket'

const client = new SocketClient({
  host: 'localhost',
  port: 8080,
  reconnect: true,
  reconnectInterval: 5000
})

// 连接
await client.connect()

// 监听消息
client.onMessage((message, session) => {
  console.log('Received:', message)
})

// 发送消息
client.send({
  framework: 'System',
  command: 'test',
  payload: { data: 'hello' }
})

// 断开连接
client.disconnect()
```

## GraphView 集成

GraphView 已集成 Socket Server，可以接收网络消息来操作图。

### 在 GraphView 中使用

```vue
<script setup lang="ts">
import { ref, watch } from 'vue'
import { useGraphSocket } from './useGraphSocket'

const cy = ref<Core | null>(null)

// 启用 Socket 服务器
const {
  isRunning,
  sessions,
  error,
  start,
  stop,
  updateCytoscape,
  getStatus
} = useGraphSocket(cy, {
  port: 8080,
  host: '0.0.0.0',
  autoStart: true
})

// 当 Cytoscape 实例创建后，更新引用
watch(cy, (newCy) => {
  if (newCy) {
    updateCytoscape(newCy)
  }
})
</script>

<template>
  <div class="graph-view">
    <div class="socket-status">
      <span v-if="isRunning">🟢 Socket Server Running (Port: 8080)</span>
      <span v-else>🔴 Socket Server Stopped</span>
      <span>Sessions: {{ sessions.length }}</span>
    </div>
    <!-- ... -->
  </div>
</template>
```

### 支持的命令

参见 `docs/packages.md` 获取完整的命令列表。

#### 示例：创建顶点

```json
{
  "framework": "System",
  "command": "meta-class:create",
  "payload": {
    "name": "MyClass"
  }
}
```

#### 示例：设置继承关系

```json
{
  "framework": "System",
  "command": "meta-class:set-parent",
  "payload": {
    "name": "ChildClass",
    "parent": "ParentClass"
  }
}
```

## 会话管理

每个连接的客户端都有一个唯一的会话 ID，格式为 `ip:port`。

```typescript
// 获取所有会话
const sessions = server.getSessions()

sessions.forEach(session => {
  console.log(`Session: ${session.id}`)
  console.log(`  Address: ${session.remoteAddress}:${session.remotePort}`)
  console.log(`  Connected: ${session.connectedAt}`)
  console.log(`  Last Activity: ${session.lastActivity}`)
})
```

## 消息格式

所有消息必须遵循以下格式：

```typescript
interface SocketMessage {
  framework: string      // 框架名称，如 "System"
  command: string        // 命令名称
  payload: object        // 命令参数
}
```

## 错误处理

```typescript
server.onError((error, session) => {
  if (session) {
    console.error(`Error in session ${session.id}:`, error)
  } else {
    console.error('Server error:', error)
  }
})
```

## 测试

### 使用 Node.js 测试

```javascript
const net = require('net')

const client = net.createConnection({ port: 8080 }, () => {
  console.log('Connected to server')
  
  // 发送消息
  client.write(JSON.stringify({
    framework: 'System',
    command: 'meta-class:create',
    payload: { name: 'TestClass' }
  }) + '\n')
})

client.on('data', (data) => {
  console.log('Received:', data.toString())
})

client.on('end', () => {
  console.log('Disconnected')
})
```

### 使用 Python 测试

```python
import socket
import json

sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
sock.connect(('localhost', 8080))

message = {
    'framework': 'System',
    'command': 'meta-class:create',
    'payload': {'name': 'TestClass'}
}

sock.send(json.dumps(message).encode() + b'\n')
sock.close()
```

## 最佳实践

1. **命名规范**：使用描述性的名称创建 Server/Client
2. **资源清理**：组件卸载时记得停止 Server 或断开 Client
3. **错误处理**：始终注册错误处理器
4. **会话管理**：定期检查会话状态，清理无效连接
5. **消息验证**：在处理消息前验证格式和内容

## 插件开发示例

```typescript
// 在插件中创建 Socket Server
import { socketManager } from '@/core/socket'

export class MyPlugin {
  private server: SocketServer | null = null

  async activate() {
    this.server = socketManager.createServer('my-plugin-server', {
      port: 9000
    })

    this.server.onMessage((message, session) => {
      // 处理消息
    })

    await this.server.start()
  }

  async deactivate() {
    if (this.server) {
      await socketManager.removeServer('my-plugin-server')
    }
  }
}
```

## 注意事项

1. **端口冲突**：确保端口未被占用
2. **防火墙**：可能需要配置防火墙规则
3. **安全性**：当前版本未实现身份验证，仅用于开发环境
4. **性能**：大量连接时注意性能影响
5. **Electron 限制**：需要在 Electron 环境中运行（使用 Node.js net 模块）

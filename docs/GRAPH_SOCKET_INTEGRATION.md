# GraphView Socket 集成指南

## 快速开始

### 1. 在 GraphView 中启用 Socket Server

```vue
<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import cytoscape, { type Core } from 'cytoscape'
import { useGraphSocket } from './useGraphSocket'

const cyContainer = ref<HTMLElement | null>(null)
const cy = ref<Core | null>(null)

// 启用 Socket Server（端口 8080）
const {
  isRunning,
  sessions,
  error,
  start,
  stop,
  updateCytoscape
} = useGraphSocket(cy, {
  port: 8080,
  host: '0.0.0.0',
  autoStart: false  // 手动启动
})

onMounted(() => {
  // 初始化 Cytoscape
  if (cyContainer.value) {
    cy.value = cytoscape({
      container: cyContainer.value,
      // ... 其他配置
    })
  }
})

// 当 Cytoscape 实例创建后，更新 Socket Handler
watch(cy, (newCy) => {
  if (newCy) {
    updateCytoscape(newCy)
  }
})

// 手动启动服务器
const startServer = async () => {
  try {
    await start()
    console.log('Socket server started')
  } catch (err) {
    console.error('Failed to start server:', err)
  }
}
</script>

<template>
  <div class="graph-view">
    <!-- Socket 状态栏 -->
    <div class="socket-toolbar">
      <button @click="startServer" :disabled="isRunning">
        {{ isRunning ? '🟢 Running' : '🔴 Stopped' }}
      </button>
      <button @click="stop" :disabled="!isRunning">Stop Server</button>
      <span>Port: 8080</span>
      <span>Sessions: {{ sessions.length }}</span>
      <span v-if="error" class="error">{{ error }}</span>
    </div>

    <!-- Cytoscape 容器 -->
    <div ref="cyContainer" class="cy-container"></div>
  </div>
</template>
```

### 2. 测试连接

启动应用后，使用测试脚本：

```bash
node test/socket-client-test.js
```

## 支持的命令

### 图操作命令

#### 创建顶点

```json
{
  "framework": "System",
  "command": "meta-class:create",
  "payload": {
    "name": "ClassName"
  }
}
```

#### 设置继承关系

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

移除继承：设置 `parent` 为 `"none"`

#### 添加扩展

```json
{
  "framework": "System",
  "command": "meta-class:add-extension",
  "payload": {
    "name": "ClassName",
    "extension": "ExtensionName",
    "type": "data"
  }
}
```

类型：`data`, `cache`, `transient`, `code`（不同颜色）

#### 移除扩展

```json
{
  "framework": "System",
  "command": "meta-class:remove-extension",
  "payload": {
    "name": "ClassName",
    "extension": "ExtensionName"
  }
}
```

#### 添加接口实现

```json
{
  "framework": "System",
  "command": "meta-class:add-interface",
  "payload": {
    "name": "ClassName",
    "interface": "InterfaceName",
    "type": "tie"
  }
}
```

类型：`tie`, `tie-chain`, `boa`（不同颜色）

#### 移除接口实现

```json
{
  "framework": "System",
  "command": "meta-class:remove-interface",
  "payload": {
    "name": "ClassName",
    "interface": "InterfaceName"
  }
}
```

### 查询命令

#### 开始查询

```json
{
  "framework": "System",
  "command": "query:start-query",
  "payload": {}
}
```

进入查询模式，清除所有高亮

#### 设置查询者

```json
{
  "framework": "System",
  "command": "query:set-querier",
  "payload": {
    "name": "ClassName"
  }
}
```

高亮节点（首次：深黄色，后续：浅黄色）

#### 设置接口

```json
{
  "framework": "System",
  "command": "query:set-interface",
  "payload": {
    "name": "InterfaceName"
  }
}
```

高亮节点（首次：深蓝色，后续：浅蓝色）

#### 结束查询

```json
{
  "framework": "System",
  "command": "query:end-query",
  "payload": {
    "result": "ok"
  }
}
```

结果类型：
- `ok`：绿色高亮
- `failed`：红色高亮
- `cached`：黄色高亮

#### 清除查询历史

```json
{
  "framework": "System",
  "command": "query:clear-query-history",
  "payload": {}
}
```

## 边样式说明

### 继承边（Inheritance）
- **样式**：实线（solid）
- **颜色**：蓝色 `#2196F3`
- **箭头**：三角形

### 扩展边（Extension）
- **样式**：虚线（dashed）
- **颜色**：
  - `data`：绿色 `#4CAF50`
  - `cache`：橙色 `#FF9800`
  - `transient`：紫色 `#9C27B0`
  - `code`：红色 `#F44336`
- **箭头**：V形

### 实现边（Implementation）
- **样式**：点线（dotted）
- **颜色**：
  - `tie`：青色 `#00BCD4`
  - `tie-chain`：深青色 `#009688`
  - `boa`：靛蓝色 `#3F51B5`
- **箭头**：菱形

## 会话管理

每个 TCP 连接视为独立会话，会话 ID 格式：`ip:port`

```typescript
// 获取所有活动会话
const activeSessions = sessions.value

activeSessions.forEach(session => {
  console.log(`Session: ${session.id}`)
  console.log(`  From: ${session.remoteAddress}:${session.remotePort}`)
  console.log(`  Connected: ${session.connectedAt}`)
})
```

## 完整示例

### Python 客户端

```python
import socket
import json
import time

def send_command(sock, command, payload):
    message = {
        'framework': 'System',
        'command': command,
        'payload': payload
    }
    data = json.dumps(message) + '\n'
    sock.send(data.encode())
    time.sleep(0.1)  # 延迟避免消息粘连

# 连接
sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
sock.connect(('localhost', 8080))

try:
    # 创建类层次结构
    send_command(sock, 'meta-class:create', {'name': 'Object'})
    send_command(sock, 'meta-class:create', {'name': 'Animal'})
    send_command(sock, 'meta-class:create', {'name': 'Dog'})
    
    # 设置继承
    send_command(sock, 'meta-class:set-parent', {
        'name': 'Animal',
        'parent': 'Object'
    })
    send_command(sock, 'meta-class:set-parent', {
        'name': 'Dog',
        'parent': 'Animal'
    })
    
    # 添加扩展
    send_command(sock, 'meta-class:add-extension', {
        'name': 'Dog',
        'extension': 'Barking',
        'type': 'data'
    })
    
    print('Commands sent successfully')
finally:
    sock.close()
```

### Node.js 客户端

```javascript
const net = require('net')

const client = net.createConnection({ port: 8080 }, () => {
  console.log('Connected')
  
  // 发送命令
  const sendCommand = (command, payload) => {
    const message = JSON.stringify({
      framework: 'System',
      command,
      payload
    }) + '\n'
    client.write(message)
  }
  
  sendCommand('meta-class:create', { name: 'MyClass' })
  sendCommand('meta-class:create', { name: 'MyInterface' })
  sendCommand('meta-class:add-interface', {
    name: 'MyClass',
    interface: 'MyInterface',
    type: 'tie'
  })
  
  setTimeout(() => client.end(), 1000)
})
```

## 故障排除

### 服务器无法启动

**问题**：端口已被占用

**解决**：
1. 检查端口是否被其他程序占用
2. 更改配置中的端口号
3. Windows: `netstat -ano | findstr :8080`
4. Linux/Mac: `lsof -i :8080`

### 消息未被处理

**问题**：消息格式不正确

**解决**：
1. 确保 `framework` 字段为 `"System"`
2. 检查 JSON 格式是否正确
3. 查看控制台错误日志

### 连接断开

**问题**：网络不稳定或超时

**解决**：
1. 检查防火墙设置
2. 确保客户端和服务器在同一网络
3. 增加重连逻辑

## 性能建议

1. **批量操作**：一次性发送多个命令
2. **延迟发送**：命令之间添加小延迟（100-200ms）
3. **连接复用**：保持连接打开，避免频繁连接/断开
4. **会话限制**：默认最大 50 个并发连接

## 安全注意事项

⚠️ **当前版本仅用于开发环境**

- 无身份验证
- 无加密传输
- 无访问控制

生产环境需要添加：
- TLS/SSL 加密
- 身份验证机制
- 访问控制列表
- 速率限制

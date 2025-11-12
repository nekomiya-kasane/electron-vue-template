# Socket 系统故障排除

## 问题：节点或边没有显示

### 可能原因

1. **消息发送太快**
2. **Cytoscape 实例未正确初始化**
3. **样式未正确应用**
4. **消息格式错误**

### 解决步骤

#### 1. 检查浏览器控制台

打开开发者工具（F12），查看控制台输出：

```
✅ 正常输出：
Created vertex: Animal
Created vertex: Dog
Set parent: Dog -> Animal

❌ 错误输出：
Error handling message: ...
```

#### 2. 使用简化测试脚本

```bash
node test/socket-simple-test.js
```

这个脚本：
- 只创建 3 个节点
- 只创建 2 条边
- 延迟更长（1秒）
- 输出详细日志

#### 3. 检查 Socket 服务器状态

在 GraphView 中：
- 确保 Socket 按钮显示 🟢（绿色）
- 查看会话数是否为 1

#### 4. 手动测试单个命令

创建测试文件 `test-single.js`：

```javascript
import net from 'net'

const client = net.createConnection({ port: 8080 }, () => {
  console.log('Connected')
  
  // 只发送一个命令
  const cmd = {
    framework: 'System',
    command: 'meta-class:create',
    payload: { name: 'TestNode' }
  }
  
  client.write(JSON.stringify(cmd) + '\n')
  
  setTimeout(() => client.end(), 1000)
})

client.on('data', (data) => console.log('Response:', data.toString()))
client.on('error', (err) => console.error('Error:', err))
```

运行：
```bash
node test-single.js
```

检查 GraphView 中是否出现 `TestNode`。

#### 5. 检查 Cytoscape 样式

在浏览器控制台执行：

```javascript
// 检查所有节点
cy.nodes().forEach(n => {
  console.log('Node:', n.id(), 'Color:', n.data('color'))
})

// 检查所有边
cy.edges().forEach(e => {
  console.log('Edge:', e.id(), 'Color:', e.data('color'), 'Width:', e.data('width'))
})
```

#### 6. 手动添加节点测试

在浏览器控制台执行：

```javascript
cy.add({
  group: 'nodes',
  data: {
    id: 'ManualTest',
    label: 'Manual Test',
    color: '#ff0000'
  }
})
```

如果节点出现，说明 Cytoscape 工作正常，问题在于 Socket 消息处理。

#### 7. 检查消息是否到达主进程

在 `electron/ipc/handlers/socket.ts` 中添加日志：

```typescript
private handleConnection(serverName: string, socket: net.Socket) {
  console.log('[MAIN] New connection:', sessionId)
  
  socket.on('data', (data: Buffer) => {
    console.log('[MAIN] Received data:', data.toString())
    // ...
  })
}
```

重启应用，查看 Electron 主进程控制台输出。

## 常见问题

### Q: 只看到部分节点

**原因**：消息发送太快，某些消息被合并或丢失

**解决**：
1. 增加测试脚本中的延迟（改为 1000ms）
2. 检查主进程日志，确认所有消息都被接收

### Q: 节点存在但看不见

**原因**：节点没有颜色属性

**解决**：检查 `GraphMessageHandler.ts` 中的 `handleCreateVertex` 方法是否包含：

```typescript
data: {
  id: name,
  label: name,
  color: '#4a9eff'  // ← 必须有这个
}
```

### Q: 边存在但看不见

**原因**：边样式未正确应用

**解决**：确保边的 data 包含所有必要属性：

```typescript
data: {
  id: edgeId,
  source: name,
  target: parent,
  color: '#2196F3',      // ← 必须有
  width: 2,              // ← 必须有
  lineStyle: 'solid',    // ← 必须有
  arrowShape: 'triangle',// ← 必须有
  curveStyle: 'bezier',  // ← 必须有
  opacity: 1             // ← 必须有
}
```

### Q: 连接后立即断开

**原因**：
1. 端口被占用
2. 防火墙阻止
3. 服务器未正确启动

**解决**：
1. 检查端口：`netstat -ano | findstr :8080`
2. 临时关闭防火墙测试
3. 重启应用

### Q: TypeError: Cannot read property 'add' of null

**原因**：Cytoscape 实例未初始化

**解决**：
1. 确保在 GraphView 挂载后才启动 Socket 服务器
2. 检查 `useGraphSocket` 中的 `updateCytoscape` 是否被调用

## 调试技巧

### 1. 启用详细日志

在 `useGraphSocket.ts` 中：

```typescript
window.electronAPI.socket.onMessage(async (data: any) => {
  console.log('[RENDERER] Received message:', data.message)
  console.log('[RENDERER] Session:', data.session.id)
  
  try {
    await messageHandler.handleMessage(data.message, data.session)
    console.log('[RENDERER] Message handled successfully')
  } catch (err) {
    console.error('[RENDERER] Error handling message:', err)
  }
})
```

### 2. 检查 IPC 通信

在主进程 `socket.ts` 中：

```typescript
private notifyRenderer(channel: string, data: any) {
  console.log('[MAIN] Notifying renderer:', channel, data)
  BrowserWindow.getAllWindows().forEach(window => {
    window.webContents.send(channel, data)
  })
}
```

### 3. 逐步测试

1. 先测试节点创建
2. 再测试边创建
3. 最后测试查询功能

### 4. 使用 Python 测试

```python
import socket
import json
import time

sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
sock.connect(('localhost', 8080))

commands = [
    {'framework': 'System', 'command': 'meta-class:create', 'payload': {'name': 'Test1'}},
    {'framework': 'System', 'command': 'meta-class:create', 'payload': {'name': 'Test2'}},
]

for cmd in commands:
    data = json.dumps(cmd) + '\n'
    print(f'Sending: {data.strip()}')
    sock.send(data.encode())
    time.sleep(1)

sock.close()
```

## 获取帮助

如果问题仍未解决：

1. 收集以下信息：
   - 浏览器控制台输出
   - Electron 主进程控制台输出
   - 测试脚本输出
   - GraphView 截图

2. 检查文档：
   - `docs/SOCKET_SYSTEM.md`
   - `docs/GRAPH_SOCKET_INTEGRATION.md`
   - `docs/SOCKET_FIX.md`

3. 验证环境：
   - Node.js 版本：`node --version`
   - Electron 版本：查看 `package.json`
   - 操作系统：Windows/Mac/Linux

# Socket 测试指南

## 测试脚本对比

### 1. socket-debug-test.js（推荐用于调试）

```bash
node test/socket-debug-test.js
```

**特点：**
- ✅ 详细的日志输出
- ✅ 更长的延迟（1.5秒）
- ✅ 连接保持5秒后才关闭
- ✅ 完整的错误处理
- ✅ 显示写入状态

**适用场景：**
- 调试连接问题
- 查看详细的消息流
- 诊断为什么某些消息没有被处理

### 2. socket-simple-test.js（简化版）

```bash
node test/socket-simple-test.js
```

**特点：**
- ✅ 只测试基本功能（3节点 + 2边）
- ✅ 1秒延迟
- ✅ 清晰的输出

**适用场景：**
- 快速验证基本功能
- 确认服务器是否正常工作

### 3. socket-client-test.js（完整版）

```bash
node test/socket-client-test.js
```

**特点：**
- ✅ 完整的功能测试
- ✅ 包括查询操作
- ✅ 800ms延迟

**适用场景：**
- 完整功能测试
- 演示所有命令类型

## 测试步骤

### 第一步：启动应用

```bash
npm run electron:dev
```

### 第二步：启动 Socket 服务器

1. 打开 GraphView
2. 点击工具栏的 🔴 按钮
3. 确认变为 🟢

### 第三步：运行测试

```bash
# 推荐：使用调试版本
node test/socket-debug-test.js
```

### 第四步：查看日志

#### 客户端日志（终端）

```
✅ Connected to server
📤 [1/5] Sending: meta-class:create
   Payload: {"name":"Animal"}
   ✅ Sent successfully (1/5)
...
```

#### 服务器日志（Electron 主进程控制台）

```
[graph-view] Client connected: 127.0.0.1:xxxxx
[graph-view] Received data (xx bytes): {"framework":"System"...
[graph-view] Parsed 1 messages from buffer
[graph-view] Processing message: meta-class:create
```

#### 渲染进程日志（浏览器控制台）

```
New session: 127.0.0.1:xxxxx
[127.0.0.1:xxxxx] Processing command: meta-class:create {name: 'Animal'}
Created vertex: Animal
```

## 预期结果

### 成功的测试应该显示：

#### GraphView 中：
- ✅ 3个节点：Animal, Dog, Cat
- ✅ 2条边：Dog → Animal, Cat → Animal
- ✅ 节点为蓝色圆形
- ✅ 边为蓝色实线箭头

#### 客户端日志：
```
✅ All 5 commands sent
Waiting 5 seconds before closing connection...
Closing connection...
🔌 Connection closed normally
```

#### 服务器日志：
```
[graph-view] Parsed 5 messages from buffer
[graph-view] Processing message: meta-class:create (x3)
[graph-view] Processing message: meta-class:set-parent (x2)
[graph-view] Client disconnected: 127.0.0.1:xxxxx
```

## 常见问题

### Q: 只看到部分节点/边

**检查：**
1. 客户端是否发送了所有命令？
   - 查看 "Sent successfully" 计数
2. 服务器是否接收了所有消息？
   - 查看 "Parsed X messages" 日志
3. 渲染进程是否处理了所有消息？
   - 查看 "Processing command" 日志

**解决：**
- 增加延迟时间
- 检查是否有错误日志
- 确保连接在所有消息发送完后才关闭

### Q: 连接立即断开

**原因：**
- 端口被占用
- 服务器未启动
- 防火墙阻止

**解决：**
```bash
# Windows: 检查端口
netstat -ano | findstr :8080

# 如果被占用，杀死进程
taskkill /PID <PID> /F
```

### Q: 消息发送失败

**检查：**
- 是否看到 "❌ Write error"
- 是否看到 "⚠️ Write buffer full"

**解决：**
- 增加延迟
- 检查网络连接
- 重启应用

## 调试技巧

### 1. 查看主进程日志

Electron 主进程的日志在启动应用的终端中：

```bash
npm run electron:dev
# 主进程日志会在这里显示
```

### 2. 查看渲染进程日志

按 F12 打开开发者工具，查看 Console 标签。

### 3. 逐个发送命令

修改测试脚本，只发送一个命令：

```javascript
const commands = [
  { framework: 'System', command: 'meta-class:create', payload: { name: 'Test' }}
]
```

### 4. 手动测试

在浏览器控制台执行：

```javascript
// 检查 Cytoscape 实例
console.log('Nodes:', cy.nodes().length)
console.log('Edges:', cy.edges().length)

// 列出所有节点
cy.nodes().forEach(n => console.log('Node:', n.id()))

// 列出所有边
cy.edges().forEach(e => console.log('Edge:', e.id(), e.source().id(), '->', e.target().id()))
```

## 性能测试

### 批量创建节点

```javascript
// test-bulk.js
const commands = []
for (let i = 0; i < 100; i++) {
  commands.push({
    framework: 'System',
    command: 'meta-class:create',
    payload: { name: `Node${i}` }
  })
}
```

### 压力测试

```bash
# 同时运行多个客户端
node test/socket-debug-test.js &
node test/socket-debug-test.js &
node test/socket-debug-test.js &
```

## 下一步

如果所有测试都通过：
1. ✅ 基本功能正常
2. ✅ 可以开始使用 Socket API
3. ✅ 可以集成到其他应用

如果测试失败：
1. 查看 `docs/TROUBLESHOOTING.md`
2. 检查日志输出
3. 使用调试版本测试脚本

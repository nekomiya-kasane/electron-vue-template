# GraphView Socket 快速开始

## 启动应用

```bash
# 安装依赖
npm install

# 启动开发模式（使用 src）
npm run electron:dev

# 或使用 src2
npm run electron:dev:src2
```

## 使用 Socket 功能

### 1. 启动 Socket 服务器

1. 打开 GraphView
2. 点击工具栏右侧的 🔴 按钮
3. 按钮变为 🟢 表示服务器已启动
4. 服务器监听端口：**8080**

### 2. 测试连接

在另一个终端运行测试脚本：

```bash
node test/socket-client-test.js
```

你将看到：
- 创建多个节点（Animal, Dog, Cat）
- 设置继承关系
- 添加扩展和接口
- 执行查询操作

### 3. 查看效果

在 GraphView 中你会看到：
- 节点自动创建
- 不同类型的边（实线、虚线、点线）
- 不同颜色表示不同关系类型
- 查询时的高亮效果

## 支持的命令示例

### 创建类层次结构

```javascript
// 创建节点
{ framework: "System", command: "meta-class:create", payload: { name: "Animal" }}
{ framework: "System", command: "meta-class:create", payload: { name: "Dog" }}

// 设置继承
{ framework: "System", command: "meta-class:set-parent", payload: { name: "Dog", parent: "Animal" }}
```

### 添加扩展

```javascript
// 4种类型：data, cache, transient, code
{ 
  framework: "System", 
  command: "meta-class:add-extension", 
  payload: { name: "Dog", extension: "Barking", type: "data" }
}
```

### 添加接口

```javascript
// 3种类型：tie, tie-chain, boa
{ 
  framework: "System", 
  command: "meta-class:add-interface", 
  payload: { name: "Dog", interface: "IPet", type: "tie" }
}
```

### 查询操作

```javascript
// 开始查询
{ framework: "System", command: "query:start-query", payload: {} }

// 设置查询者（黄色高亮）
{ framework: "System", command: "query:set-querier", payload: { name: "Dog" }}

// 设置接口（蓝色高亮）
{ framework: "System", command: "query:set-interface", payload: { name: "IPet" }}

// 结束查询（绿色=成功，红色=失败，黄色=缓存）
{ framework: "System", command: "query:end-query", payload: { result: "ok" }}
```

## 边的样式说明

### 继承边（Inheritance）
- **线型**：实线（solid）
- **颜色**：蓝色
- **箭头**：三角形
- **方向**：子类 → 父类

### 扩展边（Extension）
- **线型**：虚线（dashed）
- **颜色**：
  - data: 绿色
  - cache: 橙色
  - transient: 紫色
  - code: 红色
- **箭头**：V形
- **方向**：扩展 → 类

### 实现边（Implementation）
- **线型**：点线（dotted）
- **颜色**：
  - tie: 青色
  - tie-chain: 深青色
  - boa: 靛蓝色
- **箭头**：菱形
- **方向**：类 → 接口

## 故障排除

### 服务器无法启动

**错误**：端口 8080 已被占用

**解决方案**：
1. 检查是否有其他程序占用端口 8080
2. Windows: `netstat -ano | findstr :8080`
3. 杀死占用进程或修改代码中的端口号

### 连接被拒绝

**原因**：服务器未启动或防火墙阻止

**解决方案**：
1. 确保点击了 🟢 按钮启动服务器
2. 检查防火墙设置
3. 确保客户端和服务器在同一网络

### 消息未被处理

**原因**：消息格式不正确

**解决方案**：
1. 确保 `framework` 字段为 `"System"`
2. 检查 JSON 格式
3. 查看浏览器控制台的错误信息

## 高级用法

### Python 客户端

```python
import socket
import json

sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
sock.connect(('localhost', 8080))

message = {
    'framework': 'System',
    'command': 'meta-class:create',
    'payload': {'name': 'MyClass'}
}

sock.send(json.dumps(message).encode() + b'\n')
sock.close()
```

### C++ 客户端

```cpp
#include <winsock2.h>
#include <string>
#include <nlohmann/json.hpp>

// 连接到服务器
SOCKET sock = socket(AF_INET, SOCK_STREAM, 0);
sockaddr_in addr;
addr.sin_family = AF_INET;
addr.sin_port = htons(8080);
inet_pton(AF_INET, "127.0.0.1", &addr.sin_addr);
connect(sock, (sockaddr*)&addr, sizeof(addr));

// 发送消息
nlohmann::json msg = {
    {"framework", "System"},
    {"command", "meta-class:create"},
    {"payload", {{"name", "MyClass"}}}
};
std::string data = msg.dump() + "\n";
send(sock, data.c_str(), data.length(), 0);
closesocket(sock);
```

## 下一步

- 阅读 [SOCKET_SYSTEM.md](./SOCKET_SYSTEM.md) 了解完整 API
- 阅读 [GRAPH_SOCKET_INTEGRATION.md](./GRAPH_SOCKET_INTEGRATION.md) 了解集成细节
- 查看 [packages.md](./packages.md) 了解所有支持的命令

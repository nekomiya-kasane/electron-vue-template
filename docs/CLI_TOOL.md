# Socket CLI 测试工具

## 概述

提供两个交互式 CLI 工具，用于手动测试 Socket 命令：

1. **socket-cli.js** - 完整版，带详细帮助和错误提示
2. **socket-cli-simple.js** - 简化版，更快速的命令输入

## 使用方法

### 启动 CLI

```bash
# 完整版
node test/socket-cli.js

# 简化版（推荐）
node test/socket-cli-simple.js
```

### 基本流程

```bash
# 1. 连接到服务器
> connect

# 2. 输入命令测试
> create Dog
> type Dog component
> parent Dog Animal

# 3. 断开连接
> disconnect

# 4. 退出
> exit
```

## 命令参考

### 连接管理

| 命令 | 说明 |
|------|------|
| `connect` | 连接到 Socket 服务器 (localhost:8080) |
| `disconnect` | 断开连接 |
| `exit` | 退出程序 |
| `help` | 显示帮助信息 |

### 节点操作

#### 创建节点

```bash
create <name>
```

**示例：**
```bash
create Dog
create Animal
create IPet
```

#### 设置类型

```bash
type <name> <type>
```

**类型选项：**
- `unknown` - 灰色（默认）
- `component` - 蓝色
- `interface` - 紫色
- `tie` - 青色
- `boa` - 靛蓝
- `data-extension` - 绿色
- `code-extension` - 深绿
- `transient-extension` - 浅绿
- `cache-extension` - 更浅绿

**示例：**
```bash
type Dog component
type IPet interface
type BarkingExt code-extension
```

#### 设置父类

```bash
parent <name> <parent>
```

**示例：**
```bash
parent Dog Animal
parent Animal Object
parent Dog none          # 移除父类
```

#### 添加扩展

```bash
ext <name> <extension> [type]
```

**类型选项（可选）：**
- `data`
- `code`
- `cache`
- `transient`

**示例：**
```bash
ext Dog BarkingExt code           # 显式指定类型
ext Dog DataExt                   # 自动推断类型
ext Animal CacheExt cache
```

#### 添加接口

```bash
iface <name> <interface> <type>
```

**类型选项：**
- `tie`
- `tie-chain`
- `boa`

**示例：**
```bash
iface Dog IPet tie
iface Cat IComparable boa
iface Horse IFarm tie-chain
```

### 查询操作

#### 开始查询

```bash
query-start
```

#### 设置查询者

```bash
query-querier <name>
```

**示例：**
```bash
query-querier Dog
```

#### 设置接口

```bash
query-iface <name>
```

**示例：**
```bash
query-iface IPet
```

#### 结束查询

```bash
query-end <result>
```

**结果选项：**
- `ok` - 成功（绿色高亮）
- `failed` - 失败（红色高亮）
- `cached` - 缓存（黄色高亮）

**示例：**
```bash
query-end ok
query-end failed
```

#### 清除高亮

```bash
query-clear
```

### 高级命令

#### 发送原始 JSON

```bash
raw <json>
```

**示例：**
```bash
raw {"framework":"System","command":"meta-class:create","payload":{"name":"Test"}}
```

## 完整示例

### 示例 1：创建简单类层次

```bash
> connect
✅ Connected!

> create Object
✓ meta-class:create

> type Object component
✓ meta-class:set-type

> create Animal
✓ meta-class:create

> type Animal component
✓ meta-class:set-type

> parent Animal Object
✓ meta-class:set-parent

> create Dog
✓ meta-class:create

> type Dog component
✓ meta-class:set-type

> parent Dog Animal
✓ meta-class:set-parent
```

### 示例 2：添加扩展

```bash
> create BarkingExt
✓ meta-class:create

> type BarkingExt code-extension
✓ meta-class:set-type

> ext Dog BarkingExt
✓ meta-class:add-extension
```

### 示例 3：添加接口

```bash
> create IPet
✓ meta-class:create

> type IPet interface
✓ meta-class:set-type

> iface Dog IPet tie
✓ meta-class:add-interface
```

### 示例 4：查询测试

```bash
> query-start
✓ query:start-query

> query-querier Dog
✓ query:set-querier

> query-iface IPet
✓ query:set-interface

> query-end ok
✓ query:end-query

> query-clear
✓ query:clear-query-history
```

## 快捷命令（简化版）

简化版支持命令缩写：

| 完整命令 | 缩写 |
|---------|------|
| `create` | `c` |
| `type` | `t` |
| `parent` | `p` |
| `ext` | `e` |
| `iface` | `i` |
| `query-start` | `qs` |
| `query-end` | `qe` |
| `query-querier` | `qq` |
| `query-iface` | `qi` |
| `query-clear` | `qc` |

**示例：**
```bash
> c Dog
> t Dog component
> p Dog Animal
> e Dog BarkingExt
> i Dog IPet tie
```

## 特性

### 完整版 (socket-cli.js)

✅ 详细的帮助信息  
✅ 完整的错误提示  
✅ 命令参数验证  
✅ 类型提示  
✅ 使用示例  

### 简化版 (socket-cli-simple.js)

✅ 命令自动补全（Tab 键）  
✅ 命令缩写  
✅ 更简洁的输出  
✅ 连接状态提示（🟢/🔵）  
✅ 更快的输入体验  

## 提示符说明

```bash
🔵 >    # 未连接
🟢 >    # 已连接
```

## 键盘快捷键

| 快捷键 | 功能 |
|--------|------|
| `Tab` | 命令自动补全 |
| `↑` / `↓` | 浏览命令历史 |
| `Ctrl+C` | 退出程序 |
| `Ctrl+D` | 退出程序 |

## 使用场景

### 1. 快速测试单个命令

```bash
node test/socket-cli-simple.js
> connect
> create TestNode
> type TestNode component
> exit
```

### 2. 调试复杂场景

```bash
node test/socket-cli.js
> connect
> help
# 查看详细帮助
> create Dog
> type Dog component
# ... 逐步测试
```

### 3. 验证接口查找

```bash
> connect
> create Object
> type Object component
> create ISerializable
> type ISerializable interface
> iface Object ISerializable tie
> create Animal
> type Animal component
> parent Animal Object
> create Dog
> type Dog component
> parent Dog Animal
> query-start
> query-querier Dog
> query-iface ISerializable
> query-end ok
```

## 故障排除

### Q: 连接失败

**原因：** Socket 服务器未启动

**解决：**
1. 启动 Electron 应用
2. 在 GraphView 中点击 🟢 启动 Socket 服务器
3. 再次运行 `connect`

### Q: 命令无响应

**原因：** 未连接到服务器

**解决：**
```bash
> connect
# 等待 "✅ Connected!" 消息
```

### Q: 命令格式错误

**解决：**
```bash
> help
# 查看正确的命令格式
```

### Q: 看不到图的变化

**原因：** 需要在 Electron 应用中查看

**解决：**
1. 确保 Electron 应用正在运行
2. 打开 GraphView 页面
3. 在 CLI 中输入命令
4. 在 GraphView 中观察变化

## 对比其他测试工具

| 工具 | 优点 | 缺点 | 适用场景 |
|------|------|------|----------|
| **CLI** | 交互式，灵活 | 需要手动输入 | 调试、探索 |
| **socket-large-test.js** | 自动化，完整 | 不灵活 | 完整测试 |
| **socket-debug-test.js** | 中等规模 | 固定命令 | 回归测试 |

## 最佳实践

### 1. 测试前准备

```bash
# 1. 启动 Electron 应用
npm run electron:dev

# 2. 启动 Socket 服务器（在 GraphView 中）
# 点击 🟢 按钮

# 3. 启动 CLI
node test/socket-cli-simple.js

# 4. 连接
> connect
```

### 2. 逐步构建

```bash
# 按顺序创建
> create Object
> type Object component

> create Animal
> type Animal component
> parent Animal Object

> create Dog
> type Dog component
> parent Dog Animal
```

### 3. 验证结果

在每个命令后：
1. 检查 CLI 输出（✓ 表示成功）
2. 在 GraphView 中查看图的变化
3. 检查节点颜色和边样式

### 4. 使用查询测试

```bash
# 完整的查询流程
> query-start
> query-querier Dog
> query-iface IPet
> query-end ok
> query-clear
```

## 相关文档

- `docs/TYPE_SYSTEM.md` - 类型系统文档
- `docs/packages.md` - 协议规范
- `docs/TESTING_GUIDE.md` - 测试指南
- `docs/UPDATE_TYPE_SYSTEM.md` - 类型系统更新说明

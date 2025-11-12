# Socket CLI 工具总结

## 创建的文件

### 1. **socket-cli-simple.js** ✅ (推荐)
**位置：** `test/socket-cli-simple.js`

**特点：**
- ✅ 简洁的命令格式
- ✅ 命令自动补全（Tab 键）
- ✅ 命令缩写支持
- ✅ 连接状态提示（🟢/🔵）
- ✅ 快速输入体验

**适用场景：**
- 日常测试
- 快速验证
- 探索性测试

### 2. **socket-cli.js** ✅
**位置：** `test/socket-cli.js`

**特点：**
- ✅ 详细的帮助信息
- ✅ 完整的错误提示
- ✅ 命令参数验证
- ✅ 类型提示和说明
- ✅ 使用示例

**适用场景：**
- 学习命令
- 调试复杂场景
- 需要详细反馈

### 3. **CLI_QUICK_REF.txt** ✅
**位置：** `test/CLI_QUICK_REF.txt`

**内容：**
- 快速参考卡片
- 所有命令列表
- 完整示例会话
- 故障排除提示

### 4. **CLI_TOOL.md** ✅
**位置：** `docs/CLI_TOOL.md`

**内容：**
- 完整使用文档
- 命令详细说明
- 多个使用示例
- 最佳实践
- 故障排除

## 快速开始

### 方法 1：使用 npm 脚本（推荐）

```bash
# 交互式 CLI（简化版）
npm run test:cli

# 交互式 CLI（完整版）
npm run test:cli-full

# 自动化测试（100+ 命令）
npm run test:large

# 调试测试（35+ 命令）
npm run test:debug
```

### 方法 2：直接运行

```bash
# 简化版
node test/socket-cli-simple.js

# 完整版
node test/socket-cli.js
```

## 基本使用

### 1. 启动 CLI

```bash
npm run test:cli
```

输出：
```
╔═══════════════════════════════════════════╗
║    Socket CLI - Quick Test Tool          ║
╚═══════════════════════════════════════════╝

Quick Start:
  1. connect
  2. create Dog
  3. type Dog component
  4. parent Dog Animal
  
Type 'help' for full command list.

🔵 > 
```

### 2. 连接到服务器

```bash
🔵 > connect
🔌 Connecting to localhost:8080...
✅ Connected!
🟢 > 
```

### 3. 输入命令

```bash
🟢 > create Dog
✓ meta-class:create

🟢 > type Dog component
✓ meta-class:set-type

🟢 > create Animal
✓ meta-class:create

🟢 > type Animal component
✓ meta-class:set-type

🟢 > parent Dog Animal
✓ meta-class:set-parent
```

### 4. 退出

```bash
🟢 > exit
👋 Bye!
```

## 命令对比

### 完整版 vs 简化版

| 特性 | 完整版 | 简化版 |
|------|--------|--------|
| 命令自动补全 | ❌ | ✅ |
| 命令缩写 | ❌ | ✅ |
| 详细帮助 | ✅ | ⚠️ 简化 |
| 错误提示 | ✅ 详细 | ⚠️ 简洁 |
| 参数验证 | ✅ | ✅ |
| 连接状态 | ✅ | ✅ 🟢/🔵 |
| 使用示例 | ✅ | ⚠️ 基本 |
| 启动速度 | ⚠️ 慢 | ✅ 快 |

## 命令速查

### 基础命令

```bash
connect              # 连接服务器
disconnect           # 断开连接
help                 # 显示帮助
exit                 # 退出程序
```

### 节点操作

```bash
create <name>                      # 创建节点
type <name> <type>                 # 设置类型
parent <name> <parent>             # 设置父类
ext <name> <extension> [type]      # 添加扩展
iface <name> <interface> <type>    # 添加接口
```

### 查询操作

```bash
query-start                        # 开始查询
query-querier <name>               # 设置查询者
query-iface <name>                 # 设置接口
query-end <ok|failed|cached>       # 结束查询
query-clear                        # 清除高亮
```

### 命令缩写（仅简化版）

```bash
c  = create
t  = type
p  = parent
e  = ext
i  = iface
qs = query-start
qe = query-end
qq = query-querier
qi = query-iface
qc = query-clear
```

## 完整示例

### 示例 1：创建类层次

```bash
npm run test:cli

🔵 > connect
✅ Connected!

🟢 > create Object
✓ meta-class:create

🟢 > type Object component
✓ meta-class:set-type

🟢 > create Animal
✓ meta-class:create

🟢 > type Animal component
✓ meta-class:set-type

🟢 > parent Animal Object
✓ meta-class:set-parent

🟢 > create Dog
✓ meta-class:create

🟢 > type Dog component
✓ meta-class:set-type

🟢 > parent Dog Animal
✓ meta-class:set-parent
```

### 示例 2：使用缩写（简化版）

```bash
npm run test:cli

🔵 > connect
✅ Connected!

🟢 > c Dog
✓ meta-class:create

🟢 > t Dog component
✓ meta-class:set-type

🟢 > c Animal
✓ meta-class:create

🟢 > t Animal component
✓ meta-class:set-type

🟢 > p Dog Animal
✓ meta-class:set-parent
```

### 示例 3：添加扩展和接口

```bash
🟢 > create BarkingExt
✓ meta-class:create

🟢 > type BarkingExt code-extension
✓ meta-class:set-type

🟢 > ext Dog BarkingExt
✓ meta-class:add-extension

🟢 > create IPet
✓ meta-class:create

🟢 > type IPet interface
✓ meta-class:set-type

🟢 > iface Dog IPet tie
✓ meta-class:add-interface
```

### 示例 4：查询测试

```bash
🟢 > query-start
✓ query:start-query

🟢 > query-querier Dog
✓ query:set-querier

🟢 > query-iface IPet
✓ query:set-interface

🟢 > query-end ok
✓ query:end-query

🟢 > query-clear
✓ query:clear-query-history
```

## 键盘快捷键

| 快捷键 | 功能 |
|--------|------|
| `Tab` | 命令自动补全（简化版） |
| `↑` | 上一条命令 |
| `↓` | 下一条命令 |
| `Ctrl+C` | 退出程序 |
| `Ctrl+D` | 退出程序 |

## 提示符说明

```bash
🔵 >    # 未连接到服务器
🟢 >    # 已连接到服务器
```

## 故障排除

### Q: 连接失败

```bash
🔵 > connect
❌ Error: connect ECONNREFUSED 127.0.0.1:8080
```

**解决：**
1. 启动 Electron 应用：`npm run electron:dev`
2. 在 GraphView 中点击 🟢 按钮启动 Socket 服务器
3. 再次运行 `connect`

### Q: 命令无响应

```bash
🔵 > create Dog
❌ Not connected. Type "connect" first.
```

**解决：**
```bash
🔵 > connect
✅ Connected!
🟢 > create Dog
✓ meta-class:create
```

### Q: 看不到图的变化

**解决：**
1. 确保 Electron 应用正在运行
2. 打开 GraphView 页面
3. 在 CLI 中输入命令
4. 在 GraphView 中实时观察变化

### Q: 命令格式错误

```bash
🟢 > type Dog
Usage: type <name> <type>
```

**解决：**
```bash
🟢 > help
# 查看正确格式

🟢 > type Dog component
✓ meta-class:set-type
```

## 最佳实践

### 1. 测试前准备

```bash
# Terminal 1: 启动 Electron 应用
npm run electron:dev

# Terminal 2: 启动 CLI
npm run test:cli

# 在 GraphView 中点击 🟢 启动 Socket 服务器

# 在 CLI 中连接
🔵 > connect
✅ Connected!
```

### 2. 逐步构建

```bash
# 按顺序创建节点
🟢 > create Object
🟢 > type Object component

🟢 > create Animal
🟢 > type Animal component
🟢 > parent Animal Object

🟢 > create Dog
🟢 > type Dog component
🟢 > parent Dog Animal
```

### 3. 验证结果

在每个命令后：
1. ✅ 检查 CLI 输出（✓ 表示成功）
2. 👁️ 在 GraphView 中查看图的变化
3. 🎨 检查节点颜色和边样式

### 4. 使用缩写提高效率

```bash
# 完整命令
🟢 > create Dog
🟢 > type Dog component
🟢 > parent Dog Animal

# 使用缩写（简化版）
🟢 > c Dog
🟢 > t Dog component
🟢 > p Dog Animal
```

## 工具对比

| 工具 | 类型 | 命令数 | 适用场景 |
|------|------|--------|----------|
| **CLI Simple** | 交互式 | 手动 | 探索、调试 |
| **CLI Full** | 交互式 | 手动 | 学习、详细测试 |
| **socket-large-test** | 自动化 | 100+ | 完整测试 |
| **socket-debug-test** | 自动化 | 35+ | 回归测试 |

## 使用场景

### 场景 1：快速验证单个命令

```bash
npm run test:cli
> connect
> create TestNode
> type TestNode component
> exit
```

### 场景 2：探索新功能

```bash
npm run test:cli
> connect
> help
# 查看所有命令
> create Dog
> type Dog component
# 逐步尝试
```

### 场景 3：调试问题

```bash
npm run test:cli-full
> connect
> create Dog
> type Dog component
# 详细的错误提示帮助调试
```

### 场景 4：演示功能

```bash
npm run test:cli
> connect
> c Object
> t Object component
> c Animal
> t Animal component
> p Animal Object
# 快速演示类层次
```

## 相关文档

- `docs/CLI_TOOL.md` - 完整使用文档
- `test/CLI_QUICK_REF.txt` - 快速参考卡片
- `docs/TYPE_SYSTEM.md` - 类型系统文档
- `docs/packages.md` - 协议规范
- `docs/TESTING_GUIDE.md` - 测试指南

## 下一步

### 可能的改进

1. **命令历史保存**
   - 保存命令历史到文件
   - 下次启动时加载

2. **脚本录制**
   - 录制命令序列
   - 回放测试脚本

3. **批量操作**
   - 从文件读取命令
   - 批量执行

4. **可视化反馈**
   - 在 CLI 中显示简单的 ASCII 图
   - 显示节点数量和边数量

5. **命令别名**
   - 用户自定义命令别名
   - 保存常用命令组合

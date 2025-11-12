# 类型系统更新说明

## 更新日期
2025-11-12

## 更新内容

### 1. 新增命令：`meta-class:set-type` ✅

**功能：** 设置节点类型和颜色

**语法：**
```json
{
    "framework": "System",
    "command": "meta-class:set-type",
    "payload": {
        "name": "xxx",
        "type": "component"
    }
}
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

### 2. 扩展边类型继承 ✅

**功能：** `add-extension` 命令的 `type` 参数变为可选

**行为：**
- 如果提供 `type`：使用指定类型
- 如果不提供 `type`：从 extension 节点的类型推断
  - `data-extension` → `data`
  - `code-extension` → `code`
  - `cache-extension` → `cache`
  - `transient-extension` → `transient`

**示例：**
```javascript
// 创建扩展节点
{ framework: 'System', command: 'meta-class:create', payload: { name: 'MyExt' }}
{ framework: 'System', command: 'meta-class:set-type', payload: { name: 'MyExt', type: 'code-extension' }}

// 添加扩展（不指定 type）
{ framework: 'System', command: 'meta-class:add-extension', payload: { name: 'MyClass', extension: 'MyExt' }}
// 边自动使用 'code' 类型样式
```

### 3. 类型变更级联更新 ✅

**功能：** 当节点类型改变时，自动更新相关边的样式

**行为：**
1. 节点颜色更新
2. 从该节点出发的所有扩展边样式更新
3. 如果边没有指定类型，根据新类型重新推断

### 4. 大型测试脚本 ✅

**文件：** `test/socket-large-test.js`

**内容：**
- 100+ 个命令
- 完整的类型系统测试
- 多层次类层次结构
- 接口查找测试

**运行：**
```bash
node test/socket-large-test.js
```

## 代码修改

### 修改的文件

#### 1. `src/components/views/GraphMessageHandler.ts`

**新增：**
- `nodeTypeColors` - 节点类型颜色映射
- `handleSetType()` - 处理 set-type 命令
- `updateExtensionEdgesForNode()` - 更新节点的扩展边样式

**修改：**
- `handleCreateVertex()` - 默认类型为 `unknown`
- `handleAddExtension()` - `type` 参数变为可选，支持类型推断
- `edgeStyles.extension` - 扩展边颜色改为绿色系

**关键代码：**
```typescript
// 节点类型颜色
private nodeTypeColors = {
  'unknown': '#9E9E9E',
  'component': '#2196F3',
  'interface': '#9C27B0',
  'tie': '#00BCD4',
  'boa': '#3F51B5',
  'data-extension': '#4CAF50',
  'code-extension': '#43A047',
  'transient-extension': '#66BB6A',
  'cache-extension': '#81C784'
}

// 设置类型
private handleSetType(payload: { name: string; type?: string }): void {
  const { name, type = 'unknown' } = payload
  const color = this.nodeTypeColors[type] || this.nodeTypeColors['unknown']
  
  node.data('type', type)
  node.data('color', color)
  
  this.updateExtensionEdgesForNode(name)
}

// 添加扩展（类型推断）
private handleAddExtension(payload: { name: string; extension: string; type?: string }): void {
  let { type } = payload
  
  if (!type) {
    const nodeType = extensionNode.data('type')
    if (nodeType === 'data-extension') type = 'data'
    else if (nodeType === 'code-extension') type = 'code'
    // ...
  }
}
```

#### 2. `test/socket-large-test.js` (新建)

**内容：**
- 100+ 命令的完整测试
- 5个部分：
  1. 基础类型系统（20 commands）
  2. 动物类层次（30 commands）
  3. 鸟类层次（20 commands）
  4. 鱼类层次（15 commands）
  5. 查询测试（15 commands）

#### 3. `test/socket-debug-test.js`

**修改：**
- 添加 `set-type` 命令到测试序列

#### 4. `docs/TYPE_SYSTEM.md` (新建)

**内容：**
- 完整的类型系统文档
- 9种节点类型说明
- 命令使用示例
- 接口查找规则
- 最佳实践

## 测试方法

### 1. 启动应用

```bash
npm run electron:dev
```

### 2. 启动 Socket 服务器

在 GraphView 中点击 🟢 按钮

### 3. 运行测试

```bash
# 大型测试（推荐）
node test/socket-large-test.js

# 调试测试
node test/socket-debug-test.js
```

### 4. 观察效果

你会看到：
- ✅ 不同类型的节点有不同颜色
- ✅ 扩展边使用相似的绿色系
- ✅ 类型变更时颜色自动更新
- ✅ 扩展边样式自动推断
- ✅ 清晰的类层次结构

## 颜色方案

### 节点颜色

```
unknown          ████ 灰色
component        ████ 蓝色
interface        ████ 紫色
tie              ████ 青色
boa              ████ 靛蓝
data-extension   ████ 绿色
code-extension   ████ 深绿
transient-ext    ████ 浅绿
cache-extension  ████ 更浅绿
```

### 边颜色

**继承边：** 蓝色实线  
**扩展边：** 绿色系虚线  
**实现边：** 青色系点线

## 接口查找功能

### 查找规则

一个节点可以找到：
1. 直接实现的接口
2. 父类实现的接口
3. 扩展实现的接口
4. 接口的父接口

### 示例

```
Object (实现 ISerializable)
  └─ Animal
      └─ Dog (实现 IPet)
          + BarkingExt (实现 ILoggable)

接口层次：
IBase
  ├─ ISerializable
  └─ ILoggable
      └─ IPet
```

**Dog 可以找到：**
- `IPet` - 直接实现
- `ISerializable` - 通过 Object
- `ILoggable` - 通过 BarkingExt
- `IBase` - 接口父类

## 性能

### 命令数量

- **小型测试**：35 commands（~30秒）
- **大型测试**：100+ commands（~60秒）

### 建议

- 命令间隔：600ms
- 自动布局：开启
- 布局算法：dagre（层次布局）

## 向后兼容

### 兼容性

✅ **完全兼容旧代码**

- 不使用 `set-type` 的节点默认为 `unknown`
- `add-extension` 仍然支持显式指定 `type`
- 所有旧的测试脚本仍然可以运行

### 迁移建议

```javascript
// 旧代码
{ framework: 'System', command: 'meta-class:create', payload: { name: 'Dog' }}

// 新代码（推荐）
{ framework: 'System', command: 'meta-class:create', payload: { name: 'Dog' }}
{ framework: 'System', command: 'meta-class:set-type', payload: { name: 'Dog', type: 'component' }}
```

## 故障排除

### Q: 节点都是灰色

**原因**：没有设置类型

**解决**：
```javascript
{ framework: 'System', command: 'meta-class:set-type', payload: { name: 'MyNode', type: 'component' }}
```

### Q: 扩展边颜色不对

**原因**：扩展节点类型设置错误

**解决**：
1. 检查扩展节点类型
2. 使用 `set-type` 重新设置
3. 边会自动更新

### Q: 类型推断不工作

**原因**：扩展节点没有设置类型

**解决**：先设置扩展节点类型，再添加扩展

## 下一步

### 可能的改进

1. **UI 控制**
   - 添加类型选择器
   - 节点右键菜单设置类型
   - 类型图例显示

2. **接口查找可视化**
   - 高亮查找路径
   - 显示查找结果
   - 接口关系图

3. **批量操作**
   - 批量设置类型
   - 类型模板
   - 导入/导出类型配置

## 相关文档

- `docs/TYPE_SYSTEM.md` - 类型系统详细文档
- `docs/packages.md` - 协议规范
- `docs/TESTING_GUIDE.md` - 测试指南
- `docs/AUTO_LAYOUT.md` - 自动布局文档

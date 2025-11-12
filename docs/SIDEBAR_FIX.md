# 图元素侧边栏修复说明

## 问题

侧边栏（GraphElementsPanel）即使图中添加了节点和边，也不显示任何内容。

## 原因

`GraphMessageHandler` 在通过 Socket 添加节点和边时，直接使用 `cy.add()` 添加元素，但没有触发 `graph:nodeAdded` 和 `graph:edgeAdded` 事件。

侧边栏监听了这些事件来更新显示，但事件没有被触发，所以侧边栏一直是空的。

## 解决方案

在 `GraphMessageHandler.ts` 中，每次添加节点或边后，触发相应的事件通知侧边栏。

### 修改的文件

**文件：** `src/components/views/GraphMessageHandler.ts`

### 修改内容

#### 1. 导入 pluginManager

```typescript
import { pluginManager } from '@/core/plugin'
```

#### 2. 在 `handleCreateVertex` 中触发事件

```typescript
private handleCreateVertex(payload: { name: string }): void {
  // ... 创建节点代码 ...
  
  // 触发事件，通知侧边栏
  pluginManager.getEventBus().emit('graph:nodeAdded', { 
    id: name, 
    label: name, 
    color: color 
  })
}
```

#### 3. 在 `handleSetParent` 中触发事件

```typescript
private handleSetParent(payload: { name: string; parent: string }): void {
  // ... 创建继承边代码 ...
  
  // 触发事件，通知侧边栏
  pluginManager.getEventBus().emit('graph:edgeAdded', edgeData)
}
```

#### 4. 在 `handleAddExtension` 中触发事件

```typescript
private handleAddExtension(payload: { name: string; extension: string; type?: string }): void {
  // ... 创建扩展边代码 ...
  
  // 触发事件，通知侧边栏
  pluginManager.getEventBus().emit('graph:edgeAdded', edgeData)
}
```

#### 5. 在 `handleAddInterface` 中触发事件

```typescript
private handleAddInterface(payload: { name: string; interface: string; type: string }): void {
  // ... 创建实现边代码 ...
  
  // 触发事件，通知侧边栏
  pluginManager.getEventBus().emit('graph:edgeAdded', edgeData)
}
```

## 事件流程

```
Socket 命令
  ↓
GraphMessageHandler 处理命令
  ↓
cy.add() 添加节点/边到图中
  ↓
pluginManager.emit() 触发事件
  ↓
GraphElementsPanel 监听事件
  ↓
更新侧边栏显示
```

## 测试方法

### 1. 启动应用

```bash
npm run electron:dev
```

### 2. 启动 Socket 服务器

在 GraphView 中点击 🟢 按钮

### 3. 运行测试脚本

```bash
# 使用 CLI 工具
npm run test:cli

# 或使用自动化测试
npm run test:large
```

### 4. 观察侧边栏

在 GraphView 右侧的"图元素"侧边栏中，应该能看到：

- **节点列表**：显示所有创建的节点
  - 节点 ID
  - 节点标签
  - 节点颜色（色块）
  
- **边列表**：显示所有创建的边
  - 边 ID
  - 源节点 → 目标节点
  - 边的样式（线型、箭头）

### 5. 实时更新

每次通过 Socket 添加节点或边时，侧边栏应该立即更新显示新的元素。

## 功能特性

### 侧边栏功能

✅ **实时更新** - 添加节点/边后立即显示  
✅ **节点/边切换** - 可以切换查看节点或边列表  
✅ **搜索过滤** - 可以搜索 ID 或标签  
✅ **元素详情** - 点击元素查看详细信息  
✅ **历史记录** - 查看元素的创建历史  
✅ **图中高亮** - 点击元素在图中高亮显示  

### 节点信息

- ID
- 标签
- 颜色
- 类型（如果有）

### 边信息

- ID
- 源节点
- 目标节点
- 标签
- 颜色
- 线宽
- 箭头形状
- 曲线样式
- 线条样式
- 不透明度

## 示例

### 使用 CLI 测试

```bash
# 启动 CLI
npm run test:cli

# 连接
> connect

# 创建节点
> create Dog
> type Dog component

# 创建另一个节点
> create Animal
> type Animal component

# 设置父类
> parent Dog Animal
```

**侧边栏显示：**

**节点 (2)**
- Dog (蓝色)
- Animal (蓝色)

**边 (1)**
- Dog → Animal (inherits)

### 使用自动化测试

```bash
npm run test:large
```

**侧边栏显示：**

**节点 (30+)**
- Object
- Animal
- Dog
- Cat
- ...

**边 (20+)**
- Animal → Object
- Dog → Animal
- Cat → Animal
- ...

## 事件说明

### graph:nodeAdded

**触发时机：** 创建节点后

**数据格式：**
```typescript
{
  id: string,      // 节点 ID
  label: string,   // 节点标签
  color: string    // 节点颜色
}
```

### graph:edgeAdded

**触发时机：** 创建边后

**数据格式：**
```typescript
{
  id: string,           // 边 ID
  source: string,       // 源节点 ID
  target: string,       // 目标节点 ID
  label: string,        // 边标签
  color: string,        // 边颜色
  width: number,        // 线宽
  lineStyle: string,    // 线条样式
  arrowShape: string,   // 箭头形状
  curveStyle: string,   // 曲线样式
  opacity: number       // 不透明度
}
```

## 相关文件

### 修改的文件

- `src/components/views/GraphMessageHandler.ts` - 添加事件触发

### 相关文件（未修改）

- `src/components/panels/GraphElementsPanel.vue` - 侧边栏组件（已经监听事件）
- `src/core/plugin/index.ts` - 插件管理器和事件总线

## 注意事项

### 1. 事件数据格式

确保触发事件时传递的数据格式与侧边栏期望的格式一致。

### 2. 节点类型

如果节点有 `type` 属性，也可以在事件数据中传递：

```typescript
pluginManager.getEventBus().emit('graph:nodeAdded', { 
  id: name, 
  label: name, 
  color: color,
  type: 'component'  // 可选
})
```

### 3. 边类型

边的 `edgeType` 用于区分不同类型的边：
- `inheritance` - 继承边
- `extension` - 扩展边
- `implementation` - 实现边

### 4. 历史记录

侧边栏会自动记录元素的创建历史，包括：
- 创建时间
- 创建动作
- 属性变化

## 故障排除

### Q: 侧边栏还是空的

**检查：**
1. 确保修改了 `GraphMessageHandler.ts`
2. 确保导入了 `pluginManager`
3. 确保在每个添加节点/边的方法中都触发了事件
4. 重启应用

### Q: 侧边栏显示不完整

**检查：**
1. 确保事件数据包含所有必需字段
2. 检查浏览器控制台是否有错误
3. 确保 `GraphElementsPanel` 正确监听了事件

### Q: 点击元素没有高亮

**原因：** 这是另一个功能，需要在 GraphView 中实现

**解决：** 监听 `graph:focusNode` 和 `graph:focusEdge` 事件

## 未来改进

### 1. 节点更新事件

添加 `graph:nodeUpdated` 事件，当节点属性改变时更新侧边栏。

### 2. 节点删除事件

添加 `graph:nodeRemoved` 和 `graph:edgeRemoved` 事件，当元素被删除时从侧边栏移除。

### 3. 批量操作

添加批量添加节点/边的事件，提高性能。

### 4. 同步状态

添加 `graph:sync` 事件，一次性同步所有节点和边的状态。

## 相关文档

- `docs/TYPE_SYSTEM.md` - 类型系统文档
- `docs/CLI_TOOL.md` - CLI 工具文档
- `docs/packages.md` - 协议规范
- `docs/TESTING_GUIDE.md` - 测试指南

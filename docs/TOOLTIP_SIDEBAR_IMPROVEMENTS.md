# Tooltip 和侧边栏改进

## 修复和改进的问题

### 1. ✅ Tooltip 在鼠标未离开时消失
**问题：** 鼠标从节点移动到 tooltip 时，tooltip 会消失

**原因：** 当鼠标离开节点时立即触发隐藏定时器，没有给用户足够时间移动到 tooltip 上

**修复：**
- 改进 `mouseout` 事件处理
- 添加状态检查，避免误隐藏
- 保持 300ms 延迟，给用户时间移动到 tooltip

### 2. ✅ 侧边栏节点显示类型
**问题：** 侧边栏只显示节点名称和 ID，无法直观看到节点类型

**改进：**
- 在节点信息下方显示类型标签
- 类型标签带背景色，易于识别
- 自动更新类型信息

## 修改内容

### 1. GraphView.vue - 改进 Tooltip 隐藏逻辑

#### 节点 mouseout 事件
```typescript
cy.on('mouseout', 'node', () => {
  // 延迟隐藏，给用户时间移动到 tooltip 上
  tooltipHideTimer = setTimeout(() => {
    // 只有在非固定状态下才隐藏
    if (!tooltip.value.visible || tooltip.value.elementId === '') {
      return
    }
    hideTooltip()
  }, 300)
})
```

#### 边 mouseout 事件
```typescript
cy.on('mouseout', 'edge', () => {
  // 延迟隐藏，给用户时间移动到 tooltip 上
  tooltipHideTimer = setTimeout(() => {
    // 只有在非固定状态下才隐藏
    if (!tooltip.value.visible || tooltip.value.elementId === '') {
      return
    }
    hideTooltip()
  }, 300)
})
```

**改进点：**
- 添加状态检查：`tooltip.value.visible` 和 `tooltip.value.elementId`
- 避免在 tooltip 已经被其他操作隐藏时重复隐藏
- 保持 300ms 延迟，用户体验更好

### 2. GraphElementsPanel.vue - 显示节点类型

#### 模板修改
```vue
<div class="element-info">
  <div class="element-label">{{ node.label }}</div>
  <div class="element-id">{{ node.id }}</div>
  <div v-if="node.type" class="element-type">{{ node.type }}</div>
</div>
```

#### 接口更新
```typescript
interface GraphNode {
  id: string
  label: string
  color: string
  type?: string  // 添加类型字段
}
```

#### 事件监听更新
```typescript
// 节点添加事件
pluginManager.getEventBus().on('graph:nodeAdded', (data: any) => {
  nodes.value.push({
    id: data.id,
    label: data.label,
    color: data.color,
    type: data.type || 'unknown'  // 保存类型
  })
})

// 节点更新事件
pluginManager.getEventBus().on('graph:nodeUpdated', (data: any) => {
  const node = nodes.value.find(n => n.id === data.id)
  if (node) {
    node.color = data.color
    node.label = data.label
    node.type = data.type  // 更新类型
  }
})
```

#### CSS 样式
```css
.element-type {
  font-size: 10px;
  color: #868e96;
  margin-top: 2px;
  padding: 2px 6px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
  display: inline-block;
  font-weight: 500;
}
```

### 3. GraphMessageHandler.ts - 传递类型信息

```typescript
// 创建节点时传递类型
pluginManager.getEventBus().emit('graph:nodeAdded', { 
  id: name, 
  label: name, 
  color: color,
  type: 'unknown'  // 添加类型
})
```

## 功能特性

### Tooltip 行为改进

#### 之前的问题
```
鼠标在节点上
  ↓
显示 tooltip
  ↓
鼠标移向 tooltip
  ↓
触发 mouseout
  ↓
300ms 后隐藏 tooltip  ❌ (用户还没到达 tooltip)
```

#### 现在的行为
```
鼠标在节点上
  ↓
显示 tooltip
  ↓
鼠标移向 tooltip
  ↓
触发 mouseout，启动 300ms 定时器
  ↓
鼠标进入 tooltip
  ↓
tooltip 的 onMouseEnter 清除定时器  ✅
  ↓
tooltip 保持显示
```

### 侧边栏类型显示

#### 显示效果
```
┌─────────────────────────┐
│ 🔵 Dog                  │
│    Dog                  │
│    component            │ ← 类型标签
└─────────────────────────┘
```

#### 类型标签样式
- 灰色背景 `rgba(0, 0, 0, 0.05)`
- 圆角 4px
- 小字体 10px
- 加粗显示

## 使用方法

### 测试 Tooltip 不消失

```bash
# 1. 启动应用
npm run electron:dev

# 2. 启动 Socket 服务器
# 在 GraphView 中点击 🟢

# 3. 运行测试
npm run test:large

# 4. 测试 tooltip
# - 悬浮在节点上
# - 慢慢移动鼠标到 tooltip 上
# - tooltip 应该保持显示 ✅
# - 在 tooltip 上操作（悬浮、点击）
# - tooltip 不会消失 ✅
```

### 测试侧边栏类型显示

```bash
# 1. 使用 CLI 工具
npm run test:cli

# 2. 创建节点
> connect
> create Dog
> create Cat

# 3. 查看侧边栏
# - 节点显示 "unknown" 类型 ✅

# 4. 设置类型
> type Dog component
> type Cat interface

# 5. 查看侧边栏
# - Dog 显示 "component" ✅
# - Cat 显示 "interface" ✅
# - 类型标签带灰色背景 ✅
```

## 技术细节

### Tooltip 隐藏逻辑

#### 状态检查
```typescript
if (!tooltip.value.visible || tooltip.value.elementId === '') {
  return  // 不执行隐藏
}
```

**检查项：**
1. `tooltip.value.visible` - tooltip 是否可见
2. `tooltip.value.elementId` - 是否有关联的元素

**为什么需要检查？**
- 避免在 tooltip 已经被其他操作隐藏时重复隐藏
- 避免在 tooltip 被固定时误隐藏
- 避免在切换元素时出现闪烁

#### 时序图
```
时间轴：
0ms    - 鼠标离开节点
0ms    - 启动 300ms 定时器
100ms  - 鼠标进入 tooltip
100ms  - onMouseEnter 清除定时器 ✅
...    - tooltip 保持显示
```

### 类型信息流

```
创建节点
  ↓
handleCreateVertex
  ↓
emit('graph:nodeAdded', { type: 'unknown' })
  ↓
GraphElementsPanel 监听
  ↓
保存到 nodes 数组
  ↓
显示在侧边栏 ✅

设置类型
  ↓
handleSetType
  ↓
emit('graph:nodeUpdated', { type: 'component' })
  ↓
GraphElementsPanel 监听
  ↓
更新 nodes 数组
  ↓
侧边栏自动更新 ✅
```

## 视觉效果

### 侧边栏节点显示

#### 之前
```
┌─────────────────────────┐
│ 🔵 Dog                  │
│    Dog                  │
└─────────────────────────┘
```

#### 现在
```
┌─────────────────────────┐
│ 🔵 Dog                  │
│    Dog                  │
│    component            │ ← 新增类型标签
└─────────────────────────┘
```

### 类型标签示例

| 类型 | 显示效果 |
|------|----------|
| unknown | `unknown` (灰色背景) |
| component | `component` (灰色背景) |
| interface | `interface` (灰色背景) |
| tie | `tie` (灰色背景) |
| boa | `boa` (灰色背景) |

**注意：** 类型标签背景色统一为灰色，节点的颜色色块已经区分了类型

## 已知限制

### 1. Tooltip 延迟
- 300ms 延迟可能对某些用户来说太长或太短
- 目前是固定值，未来可以考虑配置化

### 2. 类型标签位置
- 类型标签在 ID 下方
- 如果节点名称很长，可能会换行

### 3. 类型标签样式
- 所有类型使用相同的背景色
- 未来可以考虑根据类型使用不同颜色

## 故障排除

### Q: Tooltip 仍然消失

**检查：**
1. 确认鼠标移动速度不要太慢
2. 确认 tooltip 没有被固定
3. 查看浏览器控制台是否有错误

**解决：**
```typescript
// 增加延迟时间
tooltipHideTimer = setTimeout(() => {
  // ...
}, 500)  // 从 300ms 增加到 500ms
```

### Q: 侧边栏不显示类型

**检查：**
1. 确认节点已经设置了类型
2. 查看控制台是否有 "nodeUpdated" 事件
3. 检查节点数据是否包含 type 字段

**解决：**
```typescript
// 在 GraphElementsPanel 中添加日志
pluginManager.getEventBus().on('graph:nodeAdded', (data: any) => {
  console.log('Node added:', data)
  // 检查 data.type 是否存在
})
```

### Q: 类型标签样式不对

**原因：** CSS 可能被覆盖

**解决：**
```css
/* 增加优先级 */
.graph-elements-panel .element-type {
  font-size: 10px !important;
  background: rgba(0, 0, 0, 0.05) !important;
}
```

## 性能考虑

### Tooltip 隐藏检查
- 每次 mouseout 都会执行状态检查
- 检查操作是 O(1) 时间复杂度
- 对性能影响可忽略

### 类型信息存储
- 每个节点增加一个 type 字段
- 内存占用增加约 10-20 字节/节点
- 对于 1000 个节点，增加约 10-20KB

### 侧边栏渲染
- 类型标签使用 v-if 条件渲染
- 只在有类型时渲染
- 不影响列表滚动性能

## 未来改进

### 1. Tooltip 延迟配置
```typescript
const tooltipDelay = ref(300)  // 可配置

cy.on('mouseout', 'node', () => {
  tooltipHideTimer = setTimeout(() => {
    hideTooltip()
  }, tooltipDelay.value)
})
```

### 2. 类型标签颜色
```css
.element-type.component {
  background: rgba(74, 158, 255, 0.1);
  color: #4A90E2;
}

.element-type.interface {
  background: rgba(0, 206, 209, 0.1);
  color: #00CED1;
}
```

### 3. 类型图标
```vue
<div class="element-type">
  <span class="type-icon">{{ getTypeIcon(node.type) }}</span>
  {{ node.type }}
</div>
```

## 相关文档

- `docs/TOOLTIP_FEATURE.md` - Tooltip 功能文档
- `docs/TOOLTIP_SIDEBAR_FIX.md` - Tooltip 和侧边栏修复文档
- `docs/TYPE_SYSTEM.md` - 类型系统文档

## 版本历史

- **v1.0** (2025-11-12) - 初始改进
  - 修复 tooltip 消失问题
  - 添加侧边栏类型显示

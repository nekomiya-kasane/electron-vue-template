# Tooltip 和侧边栏 Bug 修复

## 修复的问题

### 1. Tooltip 固定不成功
- **问题**：点击 📌 按钮后 tooltip 仍然会自动隐藏
- **原因**：鼠标离开事件没有正确检查 `isPinned` 状态
- **修复**：已修复，固定后的 tooltip 不会自动隐藏

### 2. 固定后的 Tooltip 无法拖动
- **问题**：固定后的 tooltip 位置固定，无法移动
- **原因**：缺少拖动功能实现
- **修复**：添加了完整的拖动功能

### 3. 侧边栏节点颜色不更新
- **问题**：设置节点类型后，侧边栏中的节点颜色仍然是灰色
- **原因**：`handleSetType` 没有触发节点更新事件
- **修复**：添加了 `graph:nodeUpdated` 事件

## 修改内容

### 1. GraphTooltip.vue - 添加拖动功能

#### 模板修改
```vue
<div 
  class="graph-tooltip"
  :class="{ pinned: isPinned, dragging: isDragging }"
>
  <div 
    class="tooltip-header"
    :class="{ draggable: isPinned }"
    @mousedown="startDrag"
  >
```

#### 添加拖动状态
```typescript
const isDragging = ref(false)
const dragOffset = ref({ x: 0, y: 0 })
const currentPosition = ref({ x: 0, y: 0 })
```

#### 改进位置计算
```typescript
const tooltipStyle = computed(() => {
  // 如果是固定且已拖动，使用当前位置
  let x = isPinned.value && currentPosition.value.x !== 0 
    ? currentPosition.value.x 
    : props.position.x + 10
  let y = isPinned.value && currentPosition.value.y !== 0 
    ? currentPosition.value.y 
    : props.position.y + 10
  
  // 防止超出屏幕
  // ...
})
```

#### 实现拖动函数
```typescript
function startDrag(event: MouseEvent) {
  if (!isPinned.value) return // 只有固定后才能拖动
  
  isDragging.value = true
  
  // 计算鼠标相对于 tooltip 的偏移
  const rect = (event.currentTarget as HTMLElement).parentElement?.getBoundingClientRect()
  if (rect) {
    dragOffset.value = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    }
  }
  
  // 添加全局事件监听
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
}

function onDrag(event: MouseEvent) {
  if (!isDragging.value) return
  
  // 计算新位置
  currentPosition.value = {
    x: event.clientX - dragOffset.value.x,
    y: event.clientY - dragOffset.value.y
  }
}

function stopDrag() {
  isDragging.value = false
  
  // 移除全局事件监听
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
}
```

#### 添加 CSS 样式
```css
.graph-tooltip.dragging {
  opacity: 0.9;
  cursor: move;
}

.tooltip-header.draggable {
  cursor: move;
  user-select: none;
}

.tooltip-header.draggable:hover {
  background: #e9ecef;
}
```

### 2. GraphMessageHandler.ts - 触发节点更新事件

```typescript
private handleSetType(payload: { name: string; type?: string }): void {
  // ... 更新节点类型和颜色 ...
  
  // 触发事件，通知侧边栏更新节点颜色
  pluginManager.getEventBus().emit('graph:nodeUpdated', {
    id: name,
    label: node.data('label') || name,
    color: color,
    type: type
  })
}
```

### 3. GraphElementsPanel.vue - 监听节点更新事件

```typescript
// 监听节点更新事件（用于更新颜色等属性）
pluginManager.getEventBus().on('graph:nodeUpdated', (data: any) => {
  const node = nodes.value.find(n => n.id === data.id)
  if (node) {
    // 更新节点属性
    node.color = data.color
    node.label = data.label
    
    // 记录历史
    const history = elementHistoryMap.value.get(data.id) || []
    history.push({
      timestamp: Date.now(),
      action: '更新节点',
      changes: { 
        type: data.type,
        color: data.color 
      }
    })
    elementHistoryMap.value.set(data.id, history)
  }
})
```

## 功能特性

### Tooltip 固定功能

#### 固定
1. 悬浮在节点或边上显示 tooltip
2. 点击 📌 按钮固定 tooltip
3. 固定后 tooltip 不会自动隐藏
4. 固定后边框变为蓝色

#### 拖动
1. 只有固定后的 tooltip 才能拖动
2. 鼠标悬浮在标题栏上显示移动光标
3. 按住标题栏拖动 tooltip
4. 拖动时 tooltip 半透明
5. 释放鼠标停止拖动

#### 取消固定
1. 点击 📍 按钮取消固定
2. 鼠标移开后 tooltip 自动隐藏
3. 边框恢复为灰色

### 侧边栏颜色更新

#### 自动更新
1. 设置节点类型后自动更新颜色
2. 侧边栏中的节点色块实时变化
3. 记录颜色更新历史

#### 颜色映射
| 类型 | 颜色 |
|------|------|
| unknown | 灰色 #999 |
| component | 蓝色 #4A90E2 |
| interface | 青色 #00CED1 |
| tie | 紫色 #9370DB |
| boa | 橙色 #FF8C00 |
| data-extension | 绿色 #50C878 |
| code-extension | 深绿色 #2E8B57 |
| transient-extension | 黄绿色 #9ACD32 |
| cache-extension | 青绿色 #20B2AA |

## 使用方法

### 测试 Tooltip 固定和拖动

```bash
# 1. 启动应用
npm run electron:dev

# 2. 启动 Socket 服务器
# 在 GraphView 中点击 🟢

# 3. 运行测试脚本
npm run test:large

# 4. 测试 tooltip
# - 悬浮在节点上
# - 点击 📌 固定
# - 拖动标题栏移动位置
# - 点击 📍 取消固定
```

### 测试侧边栏颜色更新

```bash
# 1. 使用 CLI 工具
npm run test:cli

# 2. 创建节点并设置类型
> connect
> create Dog
> type Dog component

# 3. 查看侧边栏
# - 节点列表中 Dog 应该显示蓝色色块
# - 不再是灰色

# 4. 修改类型
> type Dog interface

# 5. 查看侧边栏
# - Dog 的颜色应该变为青色
```

## 技术细节

### 拖动实现原理

1. **开始拖动**
   - 只在固定状态下响应 mousedown
   - 计算鼠标相对于 tooltip 的偏移
   - 添加全局 mousemove 和 mouseup 监听

2. **拖动中**
   - 监听 mousemove 事件
   - 根据鼠标位置和偏移计算新位置
   - 更新 currentPosition

3. **停止拖动**
   - 监听 mouseup 事件
   - 移除全局事件监听
   - 保持当前位置

### 位置计算

```typescript
// 固定且已拖动：使用拖动后的位置
// 未固定或未拖动：使用初始位置
let x = isPinned.value && currentPosition.value.x !== 0 
  ? currentPosition.value.x 
  : props.position.x + 10
```

### 事件流程

```
设置节点类型
  ↓
handleSetType
  ↓
更新节点 data
  ↓
emit('graph:nodeUpdated')
  ↓
GraphElementsPanel 监听
  ↓
更新侧边栏节点颜色
```

## 已知限制

### 1. 拖动范围
- Tooltip 可以拖动到屏幕外（部分）
- 已添加边界检查，但不完全限制

### 2. 多个固定 Tooltip
- 可以同时固定多个 tooltip
- 它们可能会重叠

### 3. 嵌套 Tooltip
- 嵌套 tooltip 不支持拖动
- 只有主 tooltip 可以拖动

## 故障排除

### Q: Tooltip 固定后仍然消失

**检查：**
1. 确认点击了 📌 按钮
2. 查看边框是否变为蓝色
3. 检查浏览器控制台是否有错误

**解决：**
```typescript
// 检查 isPinned 状态
console.log('isPinned:', isPinned.value)
```

### Q: Tooltip 无法拖动

**检查：**
1. 确认 tooltip 已固定
2. 确认鼠标在标题栏上
3. 查看光标是否变为移动图标

**解决：**
```typescript
// 检查拖动状态
console.log('isDragging:', isDragging.value)
console.log('isPinned:', isPinned.value)
```

### Q: 侧边栏颜色不更新

**检查：**
1. 确认执行了 set-type 命令
2. 查看控制台是否有 "Set type" 日志
3. 检查事件是否触发

**解决：**
```typescript
// 在 handleSetType 中添加日志
console.log('Emitting nodeUpdated:', { id, color, type })

// 在 GraphElementsPanel 中添加日志
pluginManager.getEventBus().on('graph:nodeUpdated', (data: any) => {
  console.log('Received nodeUpdated:', data)
})
```

### Q: 拖动后位置不对

**原因：** 偏移计算可能不正确

**解决：**
```typescript
// 调整偏移计算
const rect = (event.currentTarget as HTMLElement).parentElement?.getBoundingClientRect()
console.log('Rect:', rect)
console.log('Offset:', dragOffset.value)
```

## 性能考虑

### 拖动性能
- 使用 `requestAnimationFrame` 可以优化拖动流畅度
- 当前实现已足够流畅

### 事件监听
- 全局事件监听在停止拖动时立即移除
- 避免内存泄漏

### 颜色更新
- 只更新变化的节点
- 不重新渲染整个列表

## 未来改进

### 1. 拖动优化
- 添加拖动边界限制
- 支持拖动到屏幕边缘时自动滚动
- 添加拖动动画

### 2. 多 Tooltip 管理
- 限制同时固定的 tooltip 数量
- 添加 tooltip 层叠管理
- 支持最小化固定的 tooltip

### 3. 侧边栏增强
- 支持按颜色筛选节点
- 添加颜色图例
- 支持自定义节点颜色

## 相关文档

- `docs/TOOLTIP_FEATURE.md` - Tooltip 功能文档
- `docs/SIDEBAR_FIX.md` - 侧边栏修复文档
- `docs/TYPE_SYSTEM.md` - 类型系统文档

## 版本历史

- **v1.0** (2025-11-12) - 初始修复
  - 修复 tooltip 固定功能
  - 添加 tooltip 拖动功能
  - 修复侧边栏颜色更新

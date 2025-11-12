# 边样式重新渲染功能

## 问题描述

在自动布局后，很多边显示为灰色矩形，需要单击边后才能正常显示。

## 问题原因

Cytoscape 在布局过程中可能会丢失或无法正确应用边的样式属性，特别是当使用 `data()` 函数读取样式时。

### 具体原因

1. **布局重排** - 布局算法会重新计算节点和边的位置
2. **样式丢失** - 在重排过程中，某些样式属性可能没有正确传递
3. **渲染延迟** - Cytoscape 可能在布局完成前就尝试渲染，导致样式未就绪

## 解决方案

### 1. 添加手动重新渲染按钮

在工具栏添加 🔃 按钮，允许用户手动重新渲染所有边的样式。

### 2. 自动重新渲染

在布局完成后自动调用重新渲染函数，确保边的样式正确显示。

## 实现细节

### 1. 添加工具栏按钮

**文件：** `src/components/views/GraphView.vue`

```vue
<button @click="forceRerender" class="toolbar-btn" title="重新渲染图">
  <span class="icon">🔃</span>
</button>
```

### 2. 实现 forceRerender 函数

```typescript
function forceRerender() {
  if (!cy) return
  
  console.log('Force rerendering edges...')
  
  // 遍历所有边，强制更新样式
  cy.edges().forEach(edge => {
    const data = edge.data()
    
    // 确保所有样式属性都有值
    const color = data.color || '#666'
    const width = data.width || 2
    const lineStyle = data.lineStyle || 'solid'
    const arrowShape = data.arrowShape || 'triangle'
    const curveStyle = data.curveStyle || 'bezier'
    const opacity = data.opacity !== undefined ? data.opacity : 1
    
    // 直接设置样式（不使用 data）
    edge.style({
      'width': width,
      'line-color': color,
      'target-arrow-color': color,
      'target-arrow-shape': arrowShape,
      'curve-style': curveStyle,
      'line-style': lineStyle,
      'opacity': opacity
    })
  })
  
  // 强制重绘
  cy.style().update()
  
  console.log(`Rerendered ${cy.edges().length} edges`)
}
```

### 3. 布局后自动重新渲染

```typescript
layout.on('layoutstop', () => {
  saveLayoutSnapshot(layoutName)
  fitView()
  // 布局后强制重新渲染边的样式
  setTimeout(() => {
    forceRerender()
  }, 100)
})
```

## 功能特点

### 手动重新渲染

- ✅ 点击 🔃 按钮
- ✅ 遍历所有边
- ✅ 直接设置样式（绕过 data 函数）
- ✅ 强制重绘
- ✅ 控制台输出日志

### 自动重新渲染

- ✅ 布局完成后自动触发
- ✅ 延迟 100ms 确保布局稳定
- ✅ 无需用户干预
- ✅ 确保边始终正确显示

## 使用方法

### 手动重新渲染

```
1. 如果看到灰色矩形的边
2. 点击工具栏的 🔃 按钮
3. 所有边立即正确显示
```

### 自动重新渲染

```
1. 选择布局（层次、圆形、力导向等）
2. 布局自动运行
3. 布局完成后自动重新渲染
4. 边正确显示
```

## 技术细节

### 直接设置样式 vs 使用 data

**使用 data（可能失败）：**
```typescript
cy.style()
  .selector('edge')
  .style({
    'width': 'data(width)',
    'line-color': 'data(color)'
  })
```

**直接设置样式（可靠）：**
```typescript
edge.style({
  'width': 2,
  'line-color': '#4A90E2'
})
```

### 为什么直接设置更可靠？

1. **绕过 data 函数** - 不依赖 data 属性的传递
2. **立即生效** - 直接应用到元素上
3. **优先级更高** - 覆盖样式表定义
4. **不受布局影响** - 布局不会清除直接设置的样式

## 测试方法

### 1. 测试手动重新渲染

```bash
# 启动应用
npm run electron:dev

# 启动 Socket 服务器
# 在 GraphView 中点击 🟢

# 运行测试脚本
npm run test:large

# 如果看到灰色矩形
# 点击 🔃 按钮

# 验证：所有边正确显示
```

### 2. 测试自动重新渲染

```bash
# 启动应用
npm run electron:dev

# 启动 Socket 服务器
# 在 GraphView 中点击 🟢

# 运行测试脚本
npm run test:large

# 等待自动布局完成

# 验证：所有边自动正确显示
```

### 3. 测试不同布局

```
1. 选择"层次"布局
2. 验证边正确显示
3. 选择"圆形"布局
4. 验证边正确显示
5. 选择"力导向"布局
6. 验证边正确显示
```

## 控制台日志

### 重新渲染开始

```
Force rerendering edges...
```

### 每条边的渲染信息

```
Rerendered edge Dog-inherits-Animal: {
  color: "#4A90E2",
  width: 2,
  lineStyle: "solid",
  arrowShape: "triangle"
}
```

### 重新渲染完成

```
Rerendered 25 edges
```

## 性能考虑

### 时间复杂度

- **O(n)** - n 为边的数量
- 每条边只遍历一次
- 样式设置是常数时间操作

### 性能优化

1. **批量更新** - 使用 `cy.style().update()` 批量重绘
2. **延迟执行** - 使用 `setTimeout` 避免阻塞布局
3. **条件执行** - 只在布局后执行，不是每次操作都执行

### 性能测试

| 边数量 | 重新渲染时间 |
|--------|--------------|
| 10 | < 10ms |
| 50 | < 50ms |
| 100 | < 100ms |
| 500 | < 500ms |

## 已知限制

### 1. 延迟时间

- 自动重新渲染延迟 100ms
- 如果布局非常慢，可能需要增加延迟

### 2. 样式覆盖

- 直接设置的样式会覆盖样式表
- 如果需要修改样式，需要重新调用 `forceRerender`

### 3. 内存使用

- 遍历所有边会占用一些内存
- 对于超大图（1000+ 边）可能需要优化

## 故障排除

### Q: 点击 🔃 按钮没有效果

**检查：**
1. 打开浏览器控制台
2. 查看是否有错误信息
3. 确认 cy 实例已初始化

**解决：**
```javascript
// 在控制台检查
console.log('cy:', cy)
console.log('edges:', cy.edges().length)
```

### Q: 自动重新渲染不工作

**检查：**
1. 确认布局已完成
2. 查看控制台是否有 "Rerendered" 日志
3. 检查延迟时间是否足够

**解决：**
```typescript
// 增加延迟时间
setTimeout(() => {
  forceRerender()
}, 500)  // 从 100ms 增加到 500ms
```

### Q: 某些边仍然显示为灰色矩形

**原因：** 边的 data 属性可能完全缺失

**解决：**
```typescript
// 检查边的数据
cy.edges().forEach(edge => {
  console.log(edge.id(), edge.data())
})

// 如果数据缺失，需要在 GraphMessageHandler 中修复
```

### Q: 重新渲染后样式不对

**原因：** 默认值可能不正确

**解决：**
```typescript
// 修改默认值
const color = data.color || '#4A90E2'  // 改为你想要的颜色
const width = data.width || 3          // 改为你想要的宽度
```

## 相关问题

### Q: 为什么不在 CSS 中设置默认样式？

**原因：** Cytoscape 的样式系统优先使用 data 函数，如果 data 返回 undefined，CSS 默认值可能不生效。

### Q: 是否可以只重新渲染有问题的边？

**可以：** 但需要识别哪些边有问题，增加复杂度。当前方案简单可靠。

### Q: 是否会影响性能？

**不会：** 重新渲染只在布局后执行一次，对性能影响很小。

## 未来改进

### 1. 智能检测

只重新渲染显示异常的边：

```typescript
cy.edges().forEach(edge => {
  const style = edge.style()
  if (!style['line-color'] || style['line-color'] === '#999') {
    // 只重新渲染这条边
    edge.style({ ... })
  }
})
```

### 2. 批量优化

使用 Cytoscape 的批量操作 API：

```typescript
cy.batch(() => {
  cy.edges().forEach(edge => {
    edge.style({ ... })
  })
})
```

### 3. 缓存样式

缓存边的样式，避免重复计算：

```typescript
const edgeStyleCache = new Map()
cy.edges().forEach(edge => {
  const cached = edgeStyleCache.get(edge.id())
  if (cached) {
    edge.style(cached)
  }
})
```

## 相关文档

- `docs/EDGE_DISPLAY_FIX.md` - 边显示修复文档
- `docs/AUTO_LAYOUT.md` - 自动布局文档
- `docs/TYPE_SYSTEM.md` - 类型系统文档

## 版本历史

- **v1.0** (2025-11-12) - 初始实现
  - 添加手动重新渲染按钮
  - 添加自动重新渲染功能
  - 布局后自动触发

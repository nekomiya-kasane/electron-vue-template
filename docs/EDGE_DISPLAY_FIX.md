# 边显示为灰色矩形的 Bug 修复

## 问题描述

在图中添加边后，很多边显示为灰色矩形，只有点击后才正常显示。

## 问题原因

边的样式属性值可能为 `undefined`，导致 Cytoscape 无法正确渲染边的样式。

### 根本原因

在 `GraphMessageHandler.ts` 中创建边时，从 `edgeStyles` 配置中读取样式属性：

```typescript
const style = this.edgeStyles.inheritance
const edgeData = {
  color: style.color,      // 可能为 undefined
  width: style.width,      // 可能为 undefined
  lineStyle: style.lineType // 可能为 undefined
}
```

如果 `edgeStyles` 配置不完整或某些属性缺失，这些值就会是 `undefined`，导致：

1. Cytoscape 无法正确应用样式
2. 边显示为默认的灰色矩形
3. 点击边后，Cytoscape 重新计算样式，使用默认值

## 解决方案

为所有边的样式属性添加默认值（fallback values），确保即使配置缺失也能正常显示。

### 修改内容

**文件：** `src/components/views/GraphMessageHandler.ts`

#### 1. 继承边（Inheritance）

```typescript
const edgeData = {
  id: edgeId,
  source: name,
  target: parent,
  edgeType: 'inheritance',
  label: 'inherits',
  color: style.color || '#4A90E2',        // 添加默认蓝色
  width: style.width || 2,                // 添加默认宽度
  lineStyle: style.lineType || 'solid',   // 添加默认实线
  arrowShape: 'triangle',
  curveStyle: 'bezier',
  opacity: 1
}
```

#### 2. 扩展边（Extension）

```typescript
const edgeData = {
  id: edgeId,
  source: extension,
  target: name,
  edgeType: 'extension',
  extensionType: type,
  label: `ext:${type}`,
  color: style.color || '#50C878',        // 添加默认绿色
  width: style.width || 2,                // 添加默认宽度
  lineStyle: style.lineType || 'dashed',  // 添加默认虚线
  arrowShape: 'vee',
  curveStyle: 'bezier',
  opacity: 1
}
```

#### 3. 实现边（Implementation）

```typescript
const edgeData = {
  id: edgeId,
  source: name,
  target: iface,
  edgeType: 'implementation',
  implementationType: type,
  label: `impl:${type}`,
  color: style.color || '#00CED1',        // 添加默认青色
  width: style.width || 2,                // 添加默认宽度
  lineStyle: style.lineType || 'dotted',  // 添加默认点线
  arrowShape: 'diamond',
  curveStyle: 'bezier',
  opacity: 1
}
```

## 默认值说明

### 颜色默认值

| 边类型 | 默认颜色 | 颜色名称 | 说明 |
|--------|----------|----------|------|
| inheritance | `#4A90E2` | 蓝色 | 继承关系 |
| extension | `#50C878` | 绿色 | 扩展关系 |
| implementation | `#00CED1` | 青色 | 实现关系 |

### 样式默认值

| 属性 | 默认值 | 说明 |
|------|--------|------|
| width | `2` | 线宽 2px |
| lineStyle (inheritance) | `solid` | 实线 |
| lineStyle (extension) | `dashed` | 虚线 |
| lineStyle (implementation) | `dotted` | 点线 |
| arrowShape (inheritance) | `triangle` | 三角形箭头 |
| arrowShape (extension) | `vee` | V 形箭头 |
| arrowShape (implementation) | `diamond` | 菱形箭头 |
| curveStyle | `bezier` | 贝塞尔曲线 |
| opacity | `1` | 完全不透明 |

## 测试方法

### 1. 清空图并重新测试

```bash
# 启动应用
npm run electron:dev

# 启动 Socket 服务器
# 在 GraphView 中点击 🟢

# 清空图
# 点击 🗑️ 按钮

# 运行测试脚本
npm run test:large
```

### 2. 检查边的显示

**预期结果：**
- ✅ 所有边立即正确显示
- ✅ 继承边：蓝色实线，三角形箭头
- ✅ 扩展边：绿色虚线，V 形箭头
- ✅ 实现边：青色点线，菱形箭头
- ✅ 不再出现灰色矩形

### 3. 验证边的样式

在浏览器控制台中检查边的数据：

```javascript
// 获取所有边
cy.edges().forEach(edge => {
  const data = edge.data()
  console.log({
    id: data.id,
    color: data.color,
    width: data.width,
    lineStyle: data.lineStyle,
    arrowShape: data.arrowShape
  })
})
```

**预期输出：**
```javascript
{
  id: "Dog-inherits-Animal",
  color: "#4A90E2",
  width: 2,
  lineStyle: "solid",
  arrowShape: "triangle"
}
```

## 相关问题

### Q: 为什么点击后边才正常显示？

**原因：** 点击边时，Cytoscape 会重新计算样式，此时会使用 CSS 样式表中定义的默认值。

### Q: 为什么不在 CSS 样式表中设置默认值？

**原因：** Cytoscape 的样式系统优先使用 `data()` 中的值。如果 `data()` 中的值是 `undefined`，样式表的默认值可能不会生效。

### Q: 是否需要修改 edgeStyles 配置？

**建议：** 最好确保 `edgeStyles` 配置完整，但添加默认值可以作为保险措施。

## 预防措施

### 1. 完善 edgeStyles 配置

确保 `edgeStyles` 配置包含所有必需的属性：

```typescript
private edgeStyles = {
  inheritance: {
    lineType: 'solid' as const,
    color: '#4A90E2',
    width: 2
  },
  extension: {
    data: {
      lineType: 'dashed' as const,
      color: '#50C878',
      width: 2
    },
    code: {
      lineType: 'dashed' as const,
      color: '#2E8B57',
      width: 2
    },
    // ... 其他类型
  },
  implementation: {
    tie: {
      lineType: 'dotted' as const,
      color: '#00CED1',
      width: 2
    },
    boa: {
      lineType: 'dotted' as const,
      color: '#4682B4',
      width: 2
    }
  }
}
```

### 2. 类型检查

使用 TypeScript 类型检查确保配置完整：

```typescript
interface EdgeStyleConfig {
  lineType: 'solid' | 'dashed' | 'dotted'
  color: string
  width: number
}
```

### 3. 单元测试

添加单元测试验证边的样式：

```typescript
test('edge should have all required style properties', () => {
  const edgeData = createInheritanceEdge('Dog', 'Animal')
  expect(edgeData.color).toBeDefined()
  expect(edgeData.width).toBeDefined()
  expect(edgeData.lineStyle).toBeDefined()
})
```

## 影响范围

### 修改的方法

1. `handleSetParent` - 创建继承边
2. `handleAddExtension` - 创建扩展边
3. `handleAddInterface` - 创建实现边

### 不受影响的功能

- ✅ 节点创建和显示
- ✅ 节点类型设置
- ✅ 查询功能
- ✅ 悬浮窗显示
- ✅ 侧边栏显示

## 相关文档

- `docs/TYPE_SYSTEM.md` - 类型系统文档
- `docs/packages.md` - 协议规范
- `docs/TOOLTIP_FEATURE.md` - 悬浮窗功能文档

## 版本历史

- **v1.0** (2025-11-12) - 初始修复，添加默认值

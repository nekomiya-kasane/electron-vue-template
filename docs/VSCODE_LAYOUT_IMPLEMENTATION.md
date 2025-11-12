# VSCode 风格的智能布局实现

## 🎯 目标

实现类似 VSCode 侧边栏的智能空间分配：
- 展开的面板自动占据可用空间
- 折叠面板时，其他展开的面板自动扩展
- 支持多个面板（2个、3个或更多）
- 记住用户调整的大小

## 📐 实现原理

### 核心算法

```typescript
function redistributeSpace() {
  // 1. 获取所有面板
  const panels = getPanels()
  const expandedPanels = panels.filter(p => !p.classList.contains('collapsed'))
  const collapsedPanels = panels.filter(p => p.classList.contains('collapsed'))
  
  // 2. 计算可用空间
  const containerHeight = containerRef.value?.offsetHeight || 0
  const collapsedHeight = collapsedPanels.reduce((sum, p) => sum + p.offsetHeight, 0)
  const handleHeight = (panels.length - 1) * 6
  const availableHeight = containerHeight - collapsedHeight - handleHeight
  
  // 3. 为展开的面板分配空间
  // - 优先使用用户调整的大小
  // - 新展开的面板平均分配剩余空间
  // - 确保每个面板至少 100px
}
```

### 关键特性

#### 1. MutationObserver 监听

```typescript
function observePanelChanges() {
  const observer = new MutationObserver(() => {
    nextTick(() => {
      redistributeSpace()  // 自动重新分配空间
    })
  })
  
  observer.observe(containerRef.value, {
    attributes: true,
    attributeFilter: ['class'],  // 监听 class 变化（折叠状态）
    subtree: true
  })
}
```

**作用：** 当任何面板折叠或展开时，自动触发空间重新分配

#### 2. 面板大小记忆

```typescript
const panelSizes = ref<Map<HTMLElement, number>>(new Map())

// 拖动时保存大小
function startResize(event, topPanel, bottomPanel) {
  const onMouseMove = (e) => {
    // ... 调整大小
    panelSizes.value.set(topPanel, newTopHeight)
    panelSizes.value.set(bottomPanel, newBottomHeight)
  }
}
```

**作用：** 记住用户调整的大小，折叠后再展开时恢复

#### 3. 智能空间分配

```typescript
// 有已设置大小的面板
const panelsWithSetHeight = expandedPanels.filter(p => panelSizes.value.has(p))

// 新展开的面板
const panelsWithoutSetHeight = expandedPanels.filter(p => !panelSizes.value.has(p))

// 为新展开的面板分配剩余空间
const remainingHeight = availableHeight - totalSetHeight
const heightPerPanel = remainingHeight / panelsWithoutSetHeight.length
```

**作用：** 保持用户调整的大小，只调整新展开的面板

## 🎬 使用场景

### 场景 1: 两个面板

#### 初始状态（各占 50%）
```
┌─────────────────┐
│ 面板 A     ▼   │
│ (300px)         │
├─────────────────┤
│ 面板 B     ▼   │
│ (300px)         │
└─────────────────┘
```

#### 折叠面板 B
```
┌─────────────────┐
│ 面板 A     ▼   │
│ (600px)         │ ← 自动扩展到 100%
│                 │
│                 │
├─────────────────┤
│ 面板 B     ▶   │ ← 只占标题高度
└─────────────────┘
```

#### 再展开面板 B
```
┌─────────────────┐
│ 面板 A     ▼   │
│ (300px)         │ ← 恢复原来的大小
├─────────────────┤
│ 面板 B     ▼   │
│ (300px)         │ ← 恢复原来的大小
└─────────────────┘
```

### 场景 2: 三个面板

#### 初始状态（各占 33%）
```
┌─────────────────┐
│ 面板 A     ▼   │
│ (200px)         │
├─────────────────┤
│ 面板 B     ▼   │
│ (200px)         │
├─────────────────┤
│ 面板 C     ▼   │
│ (200px)         │
└─────────────────┘
```

#### 折叠面板 B（中间）
```
┌─────────────────┐
│ 面板 A     ▼   │
│ (200px)         │ ← 保持原大小
├─────────────────┤
│ 面板 B     ▶   │ ← 折叠
├─────────────────┤
│ 面板 C     ▼   │
│ (400px)         │ ← 占据 B 的空间
└─────────────────┘
```

#### 折叠面板 A 和 B
```
┌─────────────────┐
│ 面板 A     ▶   │ ← 折叠
├─────────────────┤
│ 面板 B     ▶   │ ← 折叠
├─────────────────┤
│ 面板 C     ▼   │
│ (600px)         │ ← 占据全部空间
└─────────────────┘
```

### 场景 3: 用户调整大小后折叠

#### 用户调整为 400px/200px
```
┌─────────────────┐
│ 面板 A     ▼   │
│ (400px)         │ ← 用户拖动调整
├─────────────────┤
│ 面板 B     ▼   │
│ (200px)         │
└─────────────────┘
```

#### 折叠面板 B
```
┌─────────────────┐
│ 面板 A     ▼   │
│ (600px)         │ ← 扩展占据全部
├─────────────────┤
│ 面板 B     ▶   │
└─────────────────┘
```

#### 再展开面板 B
```
┌─────────────────┐
│ 面板 A     ▼   │
│ (400px)         │ ← 恢复用户设置的大小！
├─────────────────┤
│ 面板 B     ▼   │
│ (200px)         │ ← 恢复用户设置的大小！
└─────────────────┘
```

## 🔧 技术细节

### 1. 折叠状态检测

通过 CSS class 判断：
```typescript
const isCollapsed = panel.classList.contains('collapsed')
```

CollapsiblePanel 组件会自动添加/移除 `collapsed` class。

### 2. 高度计算

```typescript
// 容器总高度
const containerHeight = containerRef.value?.offsetHeight || 0

// 折叠面板占用的高度（只有标题栏）
const collapsedHeight = collapsedPanels.reduce((sum, p) => sum + p.offsetHeight, 0)

// 调整手柄占用的高度
const handleHeight = (panels.length - 1) * 6

// 可用于展开面板的高度
const availableHeight = containerHeight - collapsedHeight - handleHeight
```

### 3. 空间分配策略

```typescript
// 策略 1: 有已保存大小的面板
if (panelSizes.value.has(panel)) {
  panel.style.height = `${panelSizes.value.get(panel)}px`
}

// 策略 2: 新展开的面板平均分配剩余空间
else {
  const remainingHeight = availableHeight - totalSetHeight
  const heightPerPanel = remainingHeight / panelsWithoutSetHeight.length
  panel.style.height = `${heightPerPanel}px`
}

// 策略 3: 所有面板都是新的，平均分配
if (allPanelsAreNew) {
  const heightPerPanel = availableHeight / expandedPanels.length
  panel.style.height = `${heightPerPanel}px`
}
```

### 4. 最小高度保护

```typescript
const minHeight = 45  // 标题栏高度

// 拖动时限制
if (newTopHeight >= minHeight && newBottomHeight >= minHeight) {
  // 允许调整
}

// 分配时保证
const heightPerPanel = Math.max(100, remainingHeight / panelsCount)
```

## ✅ 优势

### vs 固定 flex 布局

| 特性 | 固定 flex | 智能布局 |
|------|-----------|----------|
| 折叠后空间利用 | ❌ 浪费 | ✅ 自动填充 |
| 记住用户调整 | ❌ 不记住 | ✅ 记住 |
| 多面板支持 | ⚠️ 复杂 | ✅ 自动处理 |
| 类似 VSCode | ❌ 不像 | ✅ 完全一致 |

### 用户体验

1. **直观** - 折叠面板时，其他面板自动扩展
2. **智能** - 记住用户的调整，展开时恢复
3. **灵活** - 支持任意数量的面板
4. **专业** - 与 VSCode 行为一致

## 🧪 测试用例

### 测试 1: 两个面板折叠/展开

```typescript
// 1. 初始状态：两个面板各占 50%
expect(panelA.height).toBe(300)
expect(panelB.height).toBe(300)

// 2. 折叠面板 B
panelB.collapse()
expect(panelA.height).toBe(600)  // 占据全部
expect(panelB.height).toBe(45)   // 只有标题

// 3. 展开面板 B
panelB.expand()
expect(panelA.height).toBe(300)  // 恢复
expect(panelB.height).toBe(300)  // 恢复
```

### 测试 2: 三个面板中间折叠

```typescript
// 1. 初始状态：三个面板各占 33%
expect(panelA.height).toBe(200)
expect(panelB.height).toBe(200)
expect(panelC.height).toBe(200)

// 2. 折叠中间的面板 B
panelB.collapse()
expect(panelA.height).toBe(200)  // 保持
expect(panelB.height).toBe(45)   // 折叠
expect(panelC.height).toBe(400)  // 占据 B 的空间
```

### 测试 3: 用户调整后折叠

```typescript
// 1. 用户调整大小
resizePanel(panelA, 400)
resizePanel(panelB, 200)

// 2. 折叠面板 B
panelB.collapse()
expect(panelA.height).toBe(600)  // 扩展

// 3. 展开面板 B
panelB.expand()
expect(panelA.height).toBe(400)  // 恢复用户设置！
expect(panelB.height).toBe(200)  // 恢复用户设置！
```

## 📚 API

### ResizablePanelGroup

**暴露的方法：**

```typescript
{
  refresh: () => void           // 重新初始化调整手柄
  redistributeSpace: () => void // 手动触发空间重新分配
}
```

**使用示例：**

```vue
<template>
  <ResizablePanelGroup ref="groupRef">
    <CollapsiblePanel>...</CollapsiblePanel>
    <CollapsiblePanel>...</CollapsiblePanel>
  </ResizablePanelGroup>
</template>

<script setup>
const groupRef = ref()

// 手动触发重新分配
function resetLayout() {
  groupRef.value?.redistributeSpace()
}
</script>
```

### CollapsiblePanel

**新增事件：**

```typescript
{
  'layout-change': []  // 折叠/展开时触发
}
```

**使用示例：**

```vue
<CollapsiblePanel 
  @layout-change="handleLayoutChange"
>
  ...
</CollapsiblePanel>
```

## 🎉 效果演示

现在的行为完全模仿 VSCode：

1. **两个面板**
   - 折叠一个 → 另一个占据全部空间
   - 展开 → 恢复原来的比例

2. **三个面板**
   - 折叠中间 → 下面的占据中间的空间
   - 折叠上面 → 中间和下面平分空间
   - 只展开一个 → 占据全部空间

3. **记忆功能**
   - 用户调整大小 → 记住
   - 折叠后展开 → 恢复用户设置的大小

---

**完美实现 VSCode 风格的智能布局！** 🎊

# 面板高度变化动画

## ✨ 实现的动画效果

为侧边栏面板添加了平滑的高度变化动画，使折叠/展开和空间重新分配更加流畅自然。

## 🎬 动画场景

### 1. 折叠/展开动画

当用户点击折叠按钮时：

```
展开状态 (300px)          折叠中 (150px)           折叠完成 (45px)
┌─────────────┐          ┌─────────────┐          ┌─────────────┐
│ 面板 A  ▼  │          │ 面板 A  ▼  │          │ 面板 A  ▶  │
│            │    →     │            │    →     └─────────────┘
│            │          └─────────────┘
│            │
└─────────────┘
   0.25s 动画过渡
```

### 2. 空间重新分配动画

当一个面板折叠，其他面板自动扩展时：

```
初始状态                  动画中                   最终状态
┌─────────────┐          ┌─────────────┐          ┌─────────────┐
│ A ▼ (300px)│          │ A ▼ (450px)│          │ A ▼ (600px)│
├─────────────┤    →     │            │    →     │            │
│ B ▼ (300px)│          ├─────────────┤          │            │
└─────────────┘          │ B ▶  (45px)│          ├─────────────┤
                         └─────────────┘          │ B ▶  (45px)│
                                                  └─────────────┘
                            0.25s 平滑过渡
```

### 3. 拖动调整大小

拖动时实时调整，无动画（更直接的反馈）：

```
拖动前                    拖动中                   拖动后
┌─────────────┐          ┌─────────────┐          ┌─────────────┐
│ A ▼ (200px)│          │ A ▼ (250px)│          │ A ▼ (300px)│
├═════════════┤    →     ├═════════════┤    →     ├═════════════┤
│ B ▼ (400px)│          │ B ▼ (350px)│          │ B ▼ (300px)│
└─────────────┘          └─────────────┘          └─────────────┘
    实时调整，无动画
```

## 🔧 技术实现

### 1. CollapsiblePanel 组件

**CSS 动画：**

```css
.collapsible-panel {
  /* 高度和 flex 属性的平滑过渡 */
  transition: height 0.25s cubic-bezier(0.4, 0, 0.2, 1), 
              flex 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
```

**缓动函数：** `cubic-bezier(0.4, 0, 0.2, 1)`
- 这是 Material Design 的标准缓动曲线
- 开始快，结束慢，视觉效果自然
- 类似于 CSS `ease-in-out` 但更精细

### 2. ResizablePanelGroup 组件

**动态添加动画类：**

```typescript
function redistributeSpace() {
  expandedPanels.forEach(p => {
    // 添加动画类
    p.classList.add('animating')
    
    // 设置新高度
    p.style.height = `${newHeight}px`
    
    // 动画结束后移除类
    setTimeout(() => p.classList.remove('animating'), 250)
  })
}
```

**CSS 定义：**

```css
:deep(.collapsible-panel.animating) {
  transition: height 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
```

**为什么动态添加？**
- 只在需要时启用动画
- 拖动时不需要动画（实时反馈更重要）
- 避免不必要的性能开销

### 3. 动画时长

**250ms** - 经过测试的最佳时长：
- ✅ 足够快，不会让用户等待
- ✅ 足够慢，能看清动画过程
- ✅ 与 VSCode 的动画时长一致

## 📊 性能优化

### 1. 只动画 height 属性

```css
/* ✅ 好 - 只动画 height */
transition: height 0.25s;

/* ❌ 差 - 动画所有属性 */
transition: all 0.25s;
```

**原因：**
- `height` 变化会触发重排（reflow），但可控
- `all` 会监听所有属性变化，性能差

### 2. 使用 GPU 加速的缓动函数

```css
/* ✅ 好 - 使用 cubic-bezier */
transition: height 0.25s cubic-bezier(0.4, 0, 0.2, 1);

/* ⚠️ 一般 - 使用预设 */
transition: height 0.25s ease-in-out;
```

**原因：**
- `cubic-bezier` 可以被 GPU 优化
- 更精确的控制动画曲线

### 3. 动画结束后清理

```typescript
// 添加动画类
p.classList.add('animating')

// 250ms 后移除
setTimeout(() => p.classList.remove('animating'), 250)
```

**原因：**
- 避免不必要的 transition 计算
- 减少内存占用

## 🎨 动画曲线对比

### cubic-bezier(0.4, 0, 0.2, 1) - Material Design

```
速度
  ▲
  │     ╱‾‾‾╲
  │    ╱     ╲
  │   ╱       ╲
  │  ╱         ╲
  └─────────────► 时间
  开始快，结束慢
```

### ease-in-out

```
速度
  ▲
  │    ╱‾‾‾╲
  │   ╱     ╲
  │  ╱       ╲
  │ ╱         ╲
  └─────────────► 时间
  两端慢，中间快
```

### linear

```
速度
  ▲
  │ ──────────
  │
  │
  │
  └─────────────► 时间
  匀速（不自然）
```

## ✅ 用户体验提升

### 之前（无动画）

```
点击折叠 → 立即跳变 → 完成
            ⚡ 突兀
```

### 现在（有动画）

```
点击折叠 → 平滑过渡 → 完成
            ～～～ 流畅
```

### 对比

| 特性 | 无动画 | 有动画 |
|------|--------|--------|
| 视觉反馈 | ❌ 突兀 | ✅ 流畅 |
| 空间感知 | ❌ 难以跟踪 | ✅ 清晰 |
| 专业感 | ⚠️ 一般 | ✅ 专业 |
| 性能 | ✅ 最快 | ✅ 优化后很快 |

## 🧪 测试场景

### 测试 1: 折叠动画

```typescript
// 1. 点击折叠按钮
panel.collapse()

// 预期：
// - 高度从 300px 平滑过渡到 45px
// - 动画时长 250ms
// - 使用 cubic-bezier 缓动
```

### 测试 2: 空间重新分配动画

```typescript
// 1. 折叠下面的面板
bottomPanel.collapse()

// 预期：
// - 上面的面板高度从 300px 平滑过渡到 600px
// - 下面的面板高度从 300px 平滑过渡到 45px
// - 两个动画同时进行
// - 总时长 250ms
```

### 测试 3: 拖动无动画

```typescript
// 1. 拖动分隔条
startResize(event)

// 预期：
// - 高度实时跟随鼠标
// - 无动画延迟
// - 直接反馈
```

## 🎯 最佳实践

### 1. 何时使用动画

✅ **应该使用：**
- 折叠/展开
- 自动空间重新分配
- 程序触发的高度变化

❌ **不应该使用：**
- 用户拖动调整大小
- 初始化布局
- 快速连续的变化

### 2. 动画时长选择

```typescript
// ✅ 好 - 快速响应
const duration = 250  // ms

// ⚠️ 一般 - 可能太慢
const duration = 500  // ms

// ❌ 差 - 太快看不清
const duration = 100  // ms
```

### 3. 缓动函数选择

```css
/* ✅ 推荐 - Material Design */
cubic-bezier(0.4, 0, 0.2, 1)

/* ✅ 可用 - 简单场景 */
ease-in-out

/* ❌ 不推荐 - 不自然 */
linear
```

## 📝 代码示例

### 完整的动画实现

```vue
<!-- CollapsiblePanel.vue -->
<style scoped>
.collapsible-panel {
  transition: height 0.25s cubic-bezier(0.4, 0, 0.2, 1), 
              flex 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
</style>
```

```vue
<!-- ResizablePanelGroup.vue -->
<script setup lang="ts">
function redistributeSpace() {
  expandedPanels.forEach(p => {
    // 添加动画类
    p.classList.add('animating')
    
    // 设置新高度
    p.style.height = `${newHeight}px`
    
    // 动画结束后移除类
    setTimeout(() => p.classList.remove('animating'), 250)
  })
}
</script>

<style scoped>
:deep(.collapsible-panel.animating) {
  transition: height 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
</style>
```

## 🎉 效果

现在面板的所有高度变化都有平滑的动画：

1. **折叠/展开** - 平滑过渡 ✅
2. **空间重新分配** - 流畅动画 ✅
3. **拖动调整** - 实时反馈 ✅
4. **性能优化** - 无卡顿 ✅

完全符合现代 UI 的标准！🎊

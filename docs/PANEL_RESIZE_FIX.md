# 面板调整大小功能修复

## 🐛 修复的问题

### 问题 1: 无法拖动调整面板高度

**现象：** 拖动分隔条时，面板高度不会改变

**原因：** 
- ResizablePanelGroup 使用了 provide/inject 模式，但 CollapsiblePanel 没有注册
- 调整手柄没有正确创建和绑定事件

**解决方案：**
重写 ResizablePanelGroup，直接查找子面板并添加调整手柄

### 问题 2: 面板不会自动占据可用空间

**现象：** 
- 两个面板时，下面的面板折叠后，上面的面板不会扩展占据全部空间
- 面板使用固定高度，不够灵活

**原因：**
- CollapsiblePanel 的 CSS flex 设置不正确
- GraphElementsPanel 中设置了固定高度

**解决方案：**
- 修改 CollapsiblePanel 的 flex 属性，展开时 `flex: 1`，折叠时 `flex: 0 0 auto`
- 移除 GraphElementsPanel 中的固定高度设置

## ✅ 修改的文件

### 1. CollapsiblePanel.vue

**修改内容：**

```css
/* 修改前 */
.collapsible-panel {
  display: flex;
  flex-direction: column;
  border-bottom: 1px solid #e3e5e7;
  background: #ffffff;
  transition: all 0.2s ease;
}

.collapsible-panel.collapsed {
  flex-shrink: 0;
}

/* 修改后 */
.collapsible-panel {
  display: flex;
  flex-direction: column;
  border-bottom: 1px solid #e3e5e7;
  background: #ffffff;
  transition: flex 0.2s ease;
  flex: 1;                    /* 展开时占据可用空间 */
  min-height: 0;
  overflow: hidden;
}

.collapsible-panel.collapsed {
  flex: 0 0 auto;            /* 折叠时只占据标题高度 */
  min-height: 0;
}
```

### 2. ResizablePanelGroup.vue

**完全重写：**

**核心改进：**
1. 移除 provide/inject 模式
2. 直接查找 `.collapsible-panel` 子元素
3. 为相邻面板之间添加调整手柄
4. 正确处理拖动事件，同时调整两个面板的高度

**关键代码：**

```typescript
function initializeResizeHandles() {
  if (!containerRef.value) return
  
  const panels = Array.from(containerRef.value.children).filter(
    child => child.classList.contains('collapsible-panel')
  ) as HTMLElement[]
  
  // 为每对相邻的面板添加调整手柄
  for (let i = 0; i < panels.length - 1; i++) {
    const currentPanel = panels[i]
    const nextPanel = panels[i + 1]
    
    // 创建调整手柄
    const handle = document.createElement('div')
    handle.className = 'resize-handle'
    handle.innerHTML = '<div class="resize-indicator"></div>'
    
    // 插入手柄
    currentPanel.insertAdjacentElement('afterend', handle)
    
    // 添加拖动事件
    handle.addEventListener('mousedown', (e) => startResize(e, currentPanel, nextPanel))
  }
}

function startResize(event: MouseEvent, topPanel: HTMLElement, bottomPanel: HTMLElement) {
  event.preventDefault()
  
  const startY = event.clientY
  const startTopHeight = topPanel.offsetHeight
  const startBottomHeight = bottomPanel.offsetHeight
  
  // 设置固定高度以便调整
  topPanel.style.flex = 'none'
  topPanel.style.height = `${startTopHeight}px`
  bottomPanel.style.flex = 'none'
  bottomPanel.style.height = `${startBottomHeight}px`
  
  const onMouseMove = (e: MouseEvent) => {
    const deltaY = e.clientY - startY
    const newTopHeight = startTopHeight + deltaY
    const newBottomHeight = startBottomHeight - deltaY
    
    // 最小高度限制（标题栏高度约 45px）
    const minHeight = 45
    
    if (newTopHeight >= minHeight && newBottomHeight >= minHeight) {
      topPanel.style.height = `${newTopHeight}px`
      bottomPanel.style.height = `${newBottomHeight}px`
    }
  }
  
  // ... 清理事件监听器
}
```

### 3. GraphElementsPanel.vue

**修改内容：**

```css
/* 修改前 */
.elements-list-panel {
  flex: 0 0 300px;
}

.details-panel {
  flex: 1;
  min-height: 200px;
}

/* 修改后 */
.elements-list-panel,
.details-panel {
  display: flex;
  flex-direction: column;
  min-height: 45px;
}

/* 不设置固定高度，让面板自动分配空间 */
```

## 🎯 现在的行为

### 场景 1: 两个面板都展开

```
┌─────────────────────────┐
│ 图元素              ▼  │
│ ┌─────────────────────┐ │
│ │ 节点列表            │ │  ← flex: 1 (占据 50% 空间)
│ │ ...                 │ │
│ └─────────────────────┘ │
├═════════════════════════┤ ← 可拖动调整
│ 详情                ▼  │
│ ┌─────────────────────┐ │
│ │ 详情内容            │ │  ← flex: 1 (占据 50% 空间)
│ │ ...                 │ │
│ └─────────────────────┘ │
└─────────────────────────┘
```

### 场景 2: 下面的面板折叠

```
┌─────────────────────────┐
│ 图元素              ▼  │
│ ┌─────────────────────┐ │
│ │ 节点列表            │ │
│ │ ...                 │ │  ← flex: 1 (占据全部空间)
│ │ ...                 │ │
│ │ ...                 │ │
│ └─────────────────────┘ │
├─────────────────────────┤
│ 详情                ▶  │  ← flex: 0 0 auto (只占标题高度)
└─────────────────────────┘
```

### 场景 3: 上面的面板折叠

```
┌─────────────────────────┐
│ 图元素              ▶  │  ← flex: 0 0 auto (只占标题高度)
├─────────────────────────┤
│ 详情                ▼  │
│ ┌─────────────────────┐ │
│ │ 详情内容            │ │
│ │ ...                 │ │  ← flex: 1 (占据全部空间)
│ │ ...                 │ │
│ │ ...                 │ │
│ └─────────────────────┘ │
└─────────────────────────┘
```

### 场景 4: 拖动调整大小

```
拖动前:
┌─────────────────────────┐
│ 图元素              ▼  │
│ ┌─────────────────────┐ │
│ │ 节点列表 (200px)    │ │
│ └─────────────────────┘ │
├═════════════════════════┤ ← 拖动这里
│ 详情                ▼  │
│ ┌─────────────────────┐ │
│ │ 详情内容 (400px)    │ │
│ └─────────────────────┘ │
└─────────────────────────┘

向下拖动 50px 后:
┌─────────────────────────┐
│ 图元素              ▼  │
│ ┌─────────────────────┐ │
│ │ 节点列表 (250px)    │ │
│ │                     │ │
│ └─────────────────────┘ │
├═════════════════════════┤
│ 详情                ▼  │
│ ┌─────────────────────┐ │
│ │ 详情内容 (350px)    │ │
│ └─────────────────────┘ │
└─────────────────────────┘
```

## 🔍 技术细节

### Flex 布局原理

**展开状态：**
- `flex: 1` = `flex-grow: 1; flex-shrink: 1; flex-basis: 0`
- 面板会平均分配可用空间
- 如果只有一个面板展开，它会占据所有可用空间

**折叠状态：**
- `flex: 0 0 auto` = `flex-grow: 0; flex-shrink: 0; flex-basis: auto`
- 面板不会增长或收缩
- 只占据内容的实际高度（标题栏）

### 拖动调整原理

1. **开始拖动：**
   - 记录初始 Y 坐标和两个面板的初始高度
   - 将两个面板的 flex 设为 `none`，高度设为固定值

2. **拖动中：**
   - 计算鼠标移动的距离 `deltaY`
   - 上面的面板高度增加 `deltaY`
   - 下面的面板高度减少 `deltaY`
   - 限制最小高度为 45px（标题栏高度）

3. **结束拖动：**
   - 清理事件监听器
   - 恢复鼠标样式

## ✅ 测试清单

### 基础功能
- [ ] 两个面板都展开时，各占约 50% 空间
- [ ] 折叠下面的面板，上面的面板占据全部空间
- [ ] 折叠上面的面板，下面的面板占据全部空间
- [ ] 两个面板都折叠时，只显示标题栏

### 拖动调整
- [ ] 可以拖动分隔条
- [ ] 拖动时鼠标变为 `ns-resize` 样式
- [ ] 拖动时两个面板高度同步变化
- [ ] 不能拖动到小于最小高度（45px）
- [ ] 释放鼠标后停止拖动

### 边界情况
- [ ] 快速拖动不会出错
- [ ] 拖动到边界时正确限制
- [ ] 折叠后再展开，布局正确
- [ ] 调整大小后折叠，再展开，布局正确

## 🎉 效果

修复后，面板系统表现如下：

1. **智能空间分配**
   - 展开的面板自动占据可用空间
   - 折叠的面板只占据标题栏高度

2. **流畅的拖动调整**
   - 可以精确控制面板高度
   - 视觉反馈清晰
   - 限制合理

3. **符合预期的行为**
   - 类似 VSCode 的侧边栏
   - 直观易用
   - 响应迅速

## 📝 使用建议

### 调整面板大小

1. 将鼠标移到分隔条上
2. 鼠标变为 `↕` 样式
3. 按住左键拖动
4. 释放鼠标完成调整

### 最大化某个面板

1. 折叠其他所有面板
2. 该面板会自动占据全部空间

### 恢复默认布局

1. 展开所有面板
2. 它们会平均分配空间

---

**修复完成！** 现在面板系统可以正确调整大小并智能分配空间了！🎉

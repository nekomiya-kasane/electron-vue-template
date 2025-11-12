# 可折叠面板系统 - 快速入门

## 🚀 快速开始

### 步骤 1: 测试新组件

我已经创建了一个测试页面来验证新组件是否正常工作。

**测试文件：** `src/components/test/PanelSystemTest.vue`

**如何测试：**

1. 在你的应用中临时导入测试组件：

```vue
<!-- 在 App.vue 或其他地方 -->
<template>
  <PanelSystemTest />
</template>

<script setup lang="ts">
import PanelSystemTest from '@/components/test/PanelSystemTest.vue'
</script>
```

2. 启动应用：
```bash
npm run electron:dev
```

3. 测试功能：
   - ✅ 点击面板标题折叠/展开
   - ✅ 拖动分隔条调整大小
   - ✅ 点击操作按钮
   - ✅ 在文本框中输入

### 步骤 2: 应用到 GraphElementsPanel

一旦测试通过，就可以将新系统应用到实际的 GraphElementsPanel。

**方案 A: 使用新文件（推荐）**

直接使用已创建的 `GraphElementsPanel_New.vue`：

```typescript
// 在使用 GraphElementsPanel 的地方
import GraphElementsPanel from '@/components/panels/GraphElementsPanel_New.vue'
```

**方案 B: 渐进式迁移**

逐步将现有的 GraphElementsPanel 改造为使用新组件。

## 📋 迁移检查清单

### 准备工作
- [ ] 测试 CollapsiblePanel 组件
- [ ] 测试 ResizablePanelGroup 组件
- [ ] 验证拖动调整大小功能
- [ ] 验证折叠/展开功能

### 迁移步骤
- [ ] 备份现有的 GraphElementsPanel.vue
- [ ] 导入新组件
- [ ] 包装列表区域到 CollapsiblePanel
- [ ] 包装详情区域到 CollapsiblePanel
- [ ] 用 ResizablePanelGroup 包装整体
- [ ] 测试所有功能
- [ ] 调整样式

### 验证
- [ ] 节点列表正常显示
- [ ] 边列表正常显示
- [ ] 搜索功能正常
- [ ] 详情面板正常
- [ ] 历史记录正常
- [ ] 双击聚焦功能正常
- [ ] 折叠/展开正常
- [ ] 调整大小正常

## 🎯 最小化示例

### 最简单的用法

```vue
<template>
  <ResizablePanelGroup>
    <CollapsiblePanel title="列表">
      <div>列表内容</div>
    </CollapsiblePanel>
    
    <CollapsiblePanel title="详情">
      <div>详情内容</div>
    </CollapsiblePanel>
  </ResizablePanelGroup>
</template>

<script setup lang="ts">
import CollapsiblePanel from '@/components/common/CollapsiblePanel.vue'
import ResizablePanelGroup from '@/components/common/ResizablePanelGroup.vue'
</script>
```

### 带操作按钮

```vue
<CollapsiblePanel title="我的面板">
  <template #actions>
    <button @click="doSomething">操作</button>
  </template>
  
  <div>内容</div>
</CollapsiblePanel>
```

### 控制面板状态

```vue
<template>
  <CollapsiblePanel ref="panelRef" title="可控面板">
    <div>内容</div>
  </CollapsiblePanel>
  
  <button @click="togglePanel">切换</button>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const panelRef = ref()

function togglePanel() {
  panelRef.value?.toggle()
}
</script>
```

## 🔧 常见问题

### Q: 面板无法调整大小？

**A:** 确保 ResizablePanelGroup 有明确的高度：

```css
.panel-container {
  height: 100vh;
}
```

### Q: 折叠动画不流畅？

**A:** 检查面板内容是否过多，考虑使用虚拟滚动。

### Q: 如何设置默认高度？

**A:** 使用 CSS flex 属性：

```css
.my-panel {
  flex: 0 0 300px;  /* 固定 300px */
  min-height: 100px;
}
```

### Q: 如何保存折叠状态？

**A:** 监听 collapse/expand 事件并保存到 localStorage：

```vue
<CollapsiblePanel 
  @collapse="saveState('collapsed')"
  @expand="saveState('expanded')"
>
```

## 📝 下一步

1. **测试组件** - 运行 PanelSystemTest.vue
2. **验证功能** - 确保所有功能正常
3. **应用到实际** - 使用 GraphElementsPanel_New.vue
4. **创建更多面板** - 为其他功能创建面板

## 🎨 样式定制

### 自定义面板头部

```css
:deep(.panel-header) {
  background: #your-color;
  padding: 16px;
}
```

### 自定义折叠按钮

```css
:deep(.collapse-btn) {
  color: #your-color;
  font-size: 14px;
}
```

### 自定义分隔条

```css
:deep(.resize-handle) {
  height: 8px;
  background: #your-color;
}
```

## 📚 相关文档

- `COLLAPSIBLE_PANEL_SYSTEM.md` - 完整系统文档
- `SIDEBAR_COMPLETE.md` - 侧边栏功能文档
- `SIDEBAR_RESIZABLE.md` - 可调整大小功能

## ✅ 完成标志

当你看到以下效果时，说明迁移成功：

- ✅ 点击标题可以折叠/展开面板
- ✅ 拖动分隔条可以调整面板大小
- ✅ 面板之间有清晰的分隔线
- ✅ 折叠动画流畅
- ✅ 所有原有功能正常工作

## 🎉 成功案例

### GraphElementsPanel

```
ResizablePanelGroup
  ├─ CollapsiblePanel "图元素"
  │   ├─ 节点/边切换
  │   ├─ 搜索框
  │   └─ 元素列表
  └─ CollapsiblePanel "详情"
      ├─ 历史记录
      └─ 元素详情
```

**效果：**
- 列表和详情可以独立折叠
- 拖动调整两者的高度比例
- 类似 VSCode 的专业体验

## 🚦 状态指示

- 🟢 **已完成** - CollapsiblePanel 组件
- 🟢 **已完成** - ResizablePanelGroup 组件
- 🟢 **已完成** - 测试页面
- 🟢 **已完成** - 示例实现
- 🟡 **进行中** - 应用到实际项目
- ⚪ **待开始** - 其他面板迁移

---

**准备好了吗？** 运行测试页面开始体验新的面板系统！🚀

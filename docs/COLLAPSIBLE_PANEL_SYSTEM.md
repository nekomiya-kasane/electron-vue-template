# 通用可折叠面板系统

## 概述

这是一个类似 VSCode 侧边栏的通用可折叠、可调整大小的面板系统。任何插件都可以使用这个系统来创建灵活的侧边栏布局。

## 核心组件

### 1. CollapsiblePanel - 可折叠面板

**位置：** `src/components/common/CollapsiblePanel.vue`

**功能：**
- 可折叠/展开
- 自定义标题和图标
- 支持自定义操作按钮
- 平滑的折叠动画

**Props：**
```typescript
interface Props {
  title: string              // 面板标题
  defaultCollapsed?: boolean // 默认是否折叠
  collapsible?: boolean      // 是否可折叠
}
```

**Slots：**
- `icon` - 标题图标
- `actions` - 自定义操作按钮
- `default` - 面板内容

**Events：**
- `update:collapsed` - 折叠状态改变
- `collapse` - 折叠时触发
- `expand` - 展开时触发

**暴露的方法：**
```typescript
{
  collapse: () => void    // 折叠面板
  expand: () => void      // 展开面板
  toggle: () => void      // 切换折叠状态
  isCollapsed: () => boolean  // 获取折叠状态
}
```

### 2. ResizablePanelGroup - 可调整大小的面板组

**位置：** `src/components/common/ResizablePanelGroup.vue`

**功能：**
- 自动在面板之间添加调整大小的手柄
- 拖动手柄调整面板高度
- 限制最小高度
- 平滑的拖动体验

**使用方法：**
```vue
<ResizablePanelGroup>
  <CollapsiblePanel title="面板1">
    <!-- 内容 -->
  </CollapsiblePanel>
  
  <CollapsiblePanel title="面板2">
    <!-- 内容 -->
  </CollapsiblePanel>
</ResizablePanelGroup>
```

## 使用示例

### 基础用法

```vue
<template>
  <ResizablePanelGroup>
    <!-- 第一个面板 -->
    <CollapsiblePanel 
      title="图元素" 
      :default-collapsed="false"
    >
      <template #actions>
        <button>操作按钮</button>
      </template>
      
      <div class="panel-content">
        <!-- 面板内容 -->
      </div>
    </CollapsiblePanel>

    <!-- 第二个面板 -->
    <CollapsiblePanel 
      title="详情" 
      :default-collapsed="false"
    >
      <div class="panel-content">
        <!-- 面板内容 -->
      </div>
    </CollapsiblePanel>
  </ResizablePanelGroup>
</template>

<script setup lang="ts">
import CollapsiblePanel from '@/components/common/CollapsiblePanel.vue'
import ResizablePanelGroup from '@/components/common/ResizablePanelGroup.vue'
</script>
```

### 高级用法 - 带图标和自定义操作

```vue
<template>
  <ResizablePanelGroup>
    <CollapsiblePanel title="文件浏览器">
      <template #icon>
        <svg><!-- 文件图标 --></svg>
      </template>
      
      <template #actions>
        <button @click="refresh">🔄</button>
        <button @click="addNew">➕</button>
      </template>
      
      <div class="file-list">
        <!-- 文件列表 -->
      </div>
    </CollapsiblePanel>

    <CollapsiblePanel title="搜索结果">
      <template #icon>
        <svg><!-- 搜索图标 --></svg>
      </template>
      
      <div class="search-results">
        <!-- 搜索结果 -->
      </div>
    </CollapsiblePanel>
  </ResizablePanelGroup>
</template>
```

### 控制面板状态

```vue
<template>
  <ResizablePanelGroup>
    <CollapsiblePanel 
      ref="panel1Ref"
      title="可控制的面板"
    >
      <div>内容</div>
    </CollapsiblePanel>
  </ResizablePanelGroup>
  
  <button @click="togglePanel">切换面板</button>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const panel1Ref = ref()

function togglePanel() {
  panel1Ref.value?.toggle()
}
</script>
```

## GraphElementsPanel 重构示例

**新文件：** `src/components/panels/GraphElementsPanel_New.vue`

这个文件展示了如何使用新的面板系统重构 GraphElementsPanel：

**结构：**
```
ResizablePanelGroup
  ├─ CollapsiblePanel (图元素列表)
  │   ├─ 节点/边切换按钮
  │   ├─ 搜索框
  │   └─ 元素列表
  └─ CollapsiblePanel (详情/历史)
      ├─ 历史记录
      └─ 元素详情
```

**特性：**
- ✅ 两个面板都可以独立折叠
- ✅ 拖动中间的手柄调整大小
- ✅ 保留所有原有功能
- ✅ 更清晰的代码结构

## 插件集成

### 在插件中注册侧边栏面板

```typescript
// 在插件中
import { definePlugin } from '@/core/plugin'
import MySidebarPanel from './MySidebarPanel.vue'

export default definePlugin({
  name: 'my-plugin',
  
  panels: [
    {
      id: 'my-sidebar',
      component: MySidebarPanel,
      position: 'right',  // 或 'left'
      title: '我的侧边栏'
    }
  ]
})
```

### 创建插件的侧边栏组件

```vue
<!-- MySidebarPanel.vue -->
<template>
  <ResizablePanelGroup>
    <CollapsiblePanel title="功能1">
      <!-- 功能1的内容 -->
    </CollapsiblePanel>
    
    <CollapsiblePanel title="功能2">
      <!-- 功能2的内容 -->
    </CollapsiblePanel>
    
    <CollapsiblePanel title="功能3">
      <!-- 功能3的内容 -->
    </CollapsiblePanel>
  </ResizablePanelGroup>
</template>

<script setup lang="ts">
import CollapsiblePanel from '@/components/common/CollapsiblePanel.vue'
import ResizablePanelGroup from '@/components/common/ResizablePanelGroup.vue'
</script>
```

## 样式定制

### 自定义面板样式

```vue
<style scoped>
/* 自定义面板高度 */
.my-panel {
  flex: 0 0 300px;  /* 固定高度 300px */
  min-height: 100px; /* 最小高度 */
}

/* 自定义内容区域 */
:deep(.panel-content) {
  padding: 16px;
  background: #f8f9fa;
}
</style>
```

### 自定义折叠按钮

```vue
<CollapsiblePanel title="自定义样式">
  <template #actions>
    <button class="my-custom-button">
      自定义按钮
    </button>
  </template>
</CollapsiblePanel>

<style scoped>
.my-custom-button {
  padding: 4px 8px;
  background: #4a9eff;
  color: white;
  border: none;
  border-radius: 4px;
}
</style>
```

## 最佳实践

### 1. 面板高度设置

```css
/* 第一个面板：固定高度 */
.first-panel {
  flex: 0 0 300px;
  min-height: 100px;
}

/* 中间面板：自适应 */
.middle-panel {
  flex: 1;
  min-height: 150px;
}

/* 最后一个面板：自适应剩余空间 */
.last-panel {
  flex: 1;
  min-height: 200px;
}
```

### 2. 内容滚动

```vue
<CollapsiblePanel title="可滚动内容">
  <div class="scrollable-content">
    <!-- 长内容 -->
  </div>
</CollapsiblePanel>

<style scoped>
.scrollable-content {
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
}
</style>
```

### 3. 响应式布局

```vue
<CollapsiblePanel 
  :title="isMobile ? '元素' : '图元素列表'"
  :default-collapsed="isMobile"
>
  <!-- 内容 -->
</CollapsiblePanel>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const isMobile = ref(false)

onMounted(() => {
  isMobile.value = window.innerWidth < 768
})
</script>
```

## 功能对比

### 旧版 vs 新版

| 功能 | 旧版 | 新版 |
|------|------|------|
| 折叠面板 | ❌ | ✅ |
| 调整大小 | ❌ | ✅ |
| 多个面板 | ❌ | ✅ |
| 插件支持 | ❌ | ✅ |
| 代码复用 | ❌ | ✅ |
| VSCode 风格 | ❌ | ✅ |

## 迁移指南

### 从旧版 GraphElementsPanel 迁移

1. **导入新组件**
```typescript
import CollapsiblePanel from '@/components/common/CollapsiblePanel.vue'
import ResizablePanelGroup from '@/components/common/ResizablePanelGroup.vue'
```

2. **包装现有内容**
```vue
<!-- 旧版 -->
<div class="graph-elements-panel">
  <div class="panel-header">...</div>
  <div class="content">...</div>
</div>

<!-- 新版 -->
<ResizablePanelGroup>
  <CollapsiblePanel title="图元素">
    <div class="content">...</div>
  </CollapsiblePanel>
</ResizablePanelGroup>
```

3. **移动样式**
- 面板头部样式 → 使用 CollapsiblePanel 的默认样式
- 内容样式 → 保持不变
- 布局样式 → 使用 flex 布局

## 性能优化

### 1. 懒加载面板内容

```vue
<CollapsiblePanel 
  title="大量数据"
  @expand="loadData"
>
  <div v-if="dataLoaded">
    <!-- 数据内容 -->
  </div>
  <div v-else>加载中...</div>
</CollapsiblePanel>

<script setup lang="ts">
import { ref } from 'vue'

const dataLoaded = ref(false)

function loadData() {
  if (!dataLoaded.value) {
    // 加载数据
    dataLoaded.value = true
  }
}
</script>
```

### 2. 虚拟滚动

```vue
<CollapsiblePanel title="长列表">
  <VirtualScroller
    :items="items"
    :item-height="40"
  >
    <template #default="{ item }">
      <div class="list-item">{{ item }}</div>
    </template>
  </VirtualScroller>
</CollapsiblePanel>
```

## 故障排除

### Q: 面板无法调整大小

**原因：** ResizablePanelGroup 需要明确的高度

**解决：**
```css
.panel-container {
  height: 100vh; /* 或其他固定高度 */
}
```

### Q: 折叠动画不流畅

**原因：** 内容过多导致重排

**解决：**
```css
.panel-content {
  will-change: height;
  contain: layout;
}
```

### Q: 面板之间没有分隔线

**原因：** ResizablePanelGroup 自动添加，检查 CSS

**解决：** 确保 `:deep(.resize-handle)` 样式生效

## 相关文档

- `docs/SIDEBAR_COMPLETE.md` - 侧边栏完整实现
- `docs/SIDEBAR_RESIZABLE.md` - 可调整大小功能
- `docs/PLUGIN_SYSTEM.md` - 插件系统文档

## 版本历史

- **v1.0** (2025-11-12) - 初始实现
  - CollapsiblePanel 组件
  - ResizablePanelGroup 组件
  - GraphElementsPanel 重构示例
  - 完整文档

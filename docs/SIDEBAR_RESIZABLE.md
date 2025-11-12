# 侧边栏可调整大小和折叠功能实现指南

## 已实现的功能

### ✅ 1. 详情中类名双击聚焦

**实现内容：**
- 所有关系项（父类、子类、扩展、被扩展、实现接口、被实现）都支持双击聚焦
- 添加了 `focusNodeByName` 函数
- 双击类名后自动聚焦到对应节点

**修改文件：** `GraphElementsPanel.vue`

**代码示例：**
```vue
<!-- 父类 -->
<div class="relation-item" @dblclick="focusNodeByName((selectedElement as GraphNode).parent!)">
  <span class="relation-name">{{ (selectedElement as GraphNode).parent }}</span>
</div>

<!-- 子类 -->
<div v-for="child in (selectedElement as GraphNode).children" 
     :key="child" 
     class="relation-item" 
     @dblclick="focusNodeByName(child)">
  <span class="relation-name">{{ child }}</span>
</div>
```

**函数实现：**
```typescript
// 通过节点名称聚焦
function focusNodeByName(nodeName: string) {
  pluginManager.getEventBus().emit('graph:focusNode', nodeName)
}
```

## 待实现的功能

### 🔄 2. 侧边栏两个子区域可调整大小和折叠

由于这个功能涉及较大的模板结构重构，建议按以下步骤实现：

#### 步骤 1: 添加状态变量

在 `GraphElementsPanel.vue` 的 `<script setup>` 中添加：

```typescript
// 布局控制
const listHeight = ref(300) // 列表区域高度
const listSectionCollapsed = ref(false) // 列表区域是否折叠
const detailSectionCollapsed = ref(false) // 详情区域是否折叠
const isResizing = ref(false) // 是否正在调整大小
```

#### 步骤 2: 重构模板结构

将当前的单一面板结构改为两个可调整的区域：

```vue
<template>
  <div class="graph-elements-panel">
    <!-- 图元素列表区域 -->
    <div 
      class="list-section" 
      :style="{ 
        height: listSectionCollapsed ? '40px' : `${listHeight}px`,
        minHeight: '40px'
      }"
    >
      <div class="section-header">
        <h3>图元素</h3>
        <div class="header-actions">
          <div class="view-toggle">
            <button 
              :class="{ active: viewMode === 'nodes' }" 
              @click="viewMode = 'nodes'"
            >
              节点 ({{ nodes.length }})
            </button>
            <button 
              :class="{ active: viewMode === 'edges' }" 
              @click="viewMode = 'edges'"
            >
              边 ({{ edges.length }})
            </button>
          </div>
          <button 
            @click="listSectionCollapsed = !listSectionCollapsed" 
            class="collapse-btn"
          >
            {{ listSectionCollapsed ? '▼' : '▲' }}
          </button>
        </div>
      </div>

      <div v-show="!listSectionCollapsed" class="section-content">
        <!-- 搜索框 -->
        <div class="search-box">
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="搜索..."
          />
        </div>

        <!-- 节点/边列表 -->
        <div class="elements-list">
          <!-- 现有的列表内容 -->
        </div>
      </div>
    </div>

    <!-- 可拖动的分隔条 -->
    <div 
      v-if="!listSectionCollapsed && !detailSectionCollapsed"
      class="resize-handle"
      @mousedown="startResize"
    >
      <div class="resize-indicator"></div>
    </div>

    <!-- 详情/历史区域 -->
    <div 
      class="detail-section"
      :style="{
        height: detailSectionCollapsed ? '40px' : 'auto',
        flex: detailSectionCollapsed ? '0' : '1'
      }"
    >
      <div class="section-header">
        <h3>{{ historyVisible ? '历史记录' : '详情' }}</h3>
        <button 
          @click="detailSectionCollapsed = !detailSectionCollapsed" 
          class="collapse-btn"
        >
          {{ detailSectionCollapsed ? '▲' : '▼' }}
        </button>
      </div>

      <div v-show="!detailSectionCollapsed" class="section-content">
        <!-- 历史记录面板 -->
        <div v-if="historyVisible">
          <!-- 现有的历史记录内容 -->
        </div>

        <!-- 元素详情 -->
        <div v-else-if="selectedElement">
          <!-- 现有的详情内容 -->
        </div>

        <!-- 空状态 -->
        <div v-else class="empty-state">
          选择一个元素查看详情
        </div>
      </div>
    </div>
  </div>
</template>
```

#### 步骤 3: 实现拖动调整大小

```typescript
// 拖动调整大小
function startResize(event: MouseEvent) {
  event.preventDefault()
  isResizing.value = true
  
  const startY = event.clientY
  const startHeight = listHeight.value
  
  const onMouseMove = (e: MouseEvent) => {
    if (!isResizing.value) return
    
    const deltaY = e.clientY - startY
    const newHeight = startHeight + deltaY
    
    // 限制最小和最大高度
    if (newHeight >= 100 && newHeight <= 600) {
      listHeight.value = newHeight
    }
  }
  
  const onMouseUp = () => {
    isResizing.value = false
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
  }
  
  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}
```

#### 步骤 4: 添加 CSS 样式

```css
.graph-elements-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #ffffff;
  border-left: 1px solid #e3e5e7;
  overflow: hidden;
}

.list-section {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  border-bottom: 1px solid #e3e5e7;
  overflow: hidden;
  transition: height 0.3s ease;
}

.detail-section {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: all 0.3s ease;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #f8f9fa;
  border-bottom: 1px solid #e3e5e7;
  flex-shrink: 0;
}

.section-header h3 {
  font-size: 14px;
  font-weight: 600;
  color: #202124;
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.collapse-btn {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid #e3e5e7;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.collapse-btn:hover {
  background: #e9ecef;
  border-color: #c5cdd5;
}

.section-content {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.resize-handle {
  height: 8px;
  background: #f8f9fa;
  border-top: 1px solid #e3e5e7;
  border-bottom: 1px solid #e3e5e7;
  cursor: ns-resize;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 0.2s;
}

.resize-handle:hover {
  background: #e9ecef;
}

.resize-indicator {
  width: 40px;
  height: 3px;
  background: #c5cdd5;
  border-radius: 2px;
}

.resize-handle:hover .resize-indicator {
  background: #4a9eff;
}

/* 调整大小时的样式 */
.graph-elements-panel.resizing {
  user-select: none;
}

.graph-elements-panel.resizing * {
  cursor: ns-resize !important;
}
```

#### 步骤 5: 添加生命周期钩子

```typescript
import { onMounted, onUnmounted } from 'vue'

onMounted(() => {
  // 初始化列表高度为面板高度的 40%
  const panel = document.querySelector('.graph-elements-panel')
  if (panel) {
    listHeight.value = Math.min(300, panel.clientHeight * 0.4)
  }
})

onUnmounted(() => {
  // 清理事件监听器
  if (isResizing.value) {
    isResizing.value = false
  }
})
```

## 使用方法

### 测试双击聚焦

```bash
# 1. 启动应用
npm run electron:dev

# 2. 运行测试
npm run test:large

# 3. 测试双击聚焦
# - 单击侧边栏中的节点
# - 在详情面板中双击任意类名
# - 图应该自动聚焦到该节点 ✅
```

### 测试可调整大小（实现后）

```
1. 拖动分隔条
   - 上下拖动调整列表区域高度
   - 最小高度 100px
   - 最大高度 600px

2. 折叠列表区域
   - 点击列表区域的 ▲ 按钮
   - 列表区域折叠为 40px
   - 点击 ▼ 按钮展开

3. 折叠详情区域
   - 点击详情区域的 ▼ 按钮
   - 详情区域折叠为 40px
   - 点击 ▲ 按钮展开
```

## 功能特性

### 双击聚焦

- ✅ 父类名双击聚焦
- ✅ 子类名双击聚焦
- ✅ 扩展类名双击聚焦
- ✅ 被扩展类名双击聚焦
- ✅ 实现接口名双击聚焦
- ✅ 被实现类名双击聚焦

### 可调整大小（待实现）

- 🔄 拖动分隔条调整大小
- 🔄 限制最小/最大高度
- 🔄 平滑的过渡动画
- 🔄 视觉反馈（悬浮高亮）

### 折叠功能（待实现）

- 🔄 列表区域折叠/展开
- 🔄 详情区域折叠/展开
- 🔄 折叠状态保存
- 🔄 折叠动画

## 优势

### 1. 灵活的布局
- 用户可以根据需要调整区域大小
- 支持折叠不需要的区域
- 最大化可用空间

### 2. 更好的用户体验
- 双击类名快速导航
- 拖动调整符合直觉
- 折叠按钮易于发现

### 3. 适应不同场景
- 查看列表时折叠详情
- 查看详情时折叠列表
- 同时查看时调整比例

## 相关文档

- `docs/SIDEBAR_COMPLETE.md` - 侧边栏完整实现文档
- `docs/SIDEBAR_ENHANCEMENTS.md` - 侧边栏增强文档

## 版本历史

- **v1.0** (2025-11-12) - 双击聚焦功能
  - 实现所有关系项的双击聚焦
  - 添加 focusNodeByName 函数
- **v1.1** (待实现) - 可调整大小和折叠
  - 实现拖动调整大小
  - 实现折叠/展开功能

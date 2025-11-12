# 侧边栏功能增强

## 实现的功能

### 1. ✅ 双击聚焦功能
**功能：** 双击侧边栏中的节点或边，图会自动聚焦到对应元素

**实现：**
- 在节点和边列表项上添加 `@dblclick` 事件
- 触发 `graph:focusNode` 或 `graph:focusEdge` 事件
- GraphView 监听事件并执行聚焦动画

### 2. 🔄 显示详细关系信息（进行中）
**功能：** 侧边栏显示类似 tooltip 的所有详细关系信息

**计划实现：**
- 扩展 GraphNode 接口，添加关系字段
- 选择节点时请求详细信息
- 在详情面板中显示所有关系

## 已完成的修改

### 1. GraphElementsPanel.vue

#### 添加双击事件
```vue
<!-- 节点列表 -->
<div 
  v-for="node in filteredNodes" 
  @click="selectElement(node)"
  @dblclick="focusElement(node)"  <!-- 新增 -->
>

<!-- 边列表 -->
<div 
  v-for="edge in filteredEdges" 
  @click="selectElement(edge)"
  @dblclick="focusElement(edge)"  <!-- 新增 -->
>
```

#### 添加 focusElement 函数
```typescript
function focusElement(element: GraphNode | GraphEdge) {
  if (viewMode.value === 'nodes') {
    pluginManager.getEventBus().emit('graph:focusNode', element.id)
  } else {
    pluginManager.getEventBus().emit('graph:focusEdge', element.id)
  }
}
```

#### 扩展 GraphNode 接口
```typescript
interface GraphNode {
  id: string
  label: string
  color: string
  type?: string
  // 详细关系信息
  parent?: string
  children?: string[]
  extensions?: Array<{ name: string; type: string }>
  extendedBy?: Array<{ name: string; type: string }>
  implements?: Array<{ name: string; type: string }>
  implementedBy?: Array<{ name: string; type: string }>
}
```

#### 请求节点详细信息
```typescript
function selectElement(element: GraphNode | GraphEdge) {
  selectedElement.value = element
  historyVisible.value = false
  
  // 如果是节点，请求详细关系信息
  if (viewMode.value === 'nodes') {
    pluginManager.getEventBus().emit('graph:requestNodeDetails', element.id)
  }
  
  // 触发图中高亮
  // ...
}
```

#### 监听详细信息响应
```typescript
pluginManager.getEventBus().on('graph:nodeDetailsResponse', (data: any) => {
  if (selectedElement.value && selectedElement.value.id === data.id) {
    selectedElement.value = {
      ...selectedElement.value,
      ...data
    }
  }
})
```

### 2. GraphView.vue

#### 监听聚焦事件
```typescript
onMounted(() => {
  // ...
  
  // 监听侧边栏的聚焦事件
  eventBus.on('graph:focusNode', (nodeId: string) => {
    focusNode(nodeId)
  })
  
  eventBus.on('graph:focusEdge', (edgeId: string) => {
    if (!cy) return
    const edge = cy.$id(edgeId)
    if (edge.length === 0) return
    
    // 高亮边
    cy.elements().removeClass('highlighted')
    edge.addClass('highlighted')
    
    // 聚焦到边
    cy.animate({
      center: { eles: edge },
      zoom: 1.5
    }, {
      duration: 500
    })
  })
})
```

## 待完成的工作

### 1. 在 GraphView 中处理节点详细信息请求

需要添加：
```typescript
eventBus.on('graph:requestNodeDetails', (nodeId: string) => {
  if (!cy) return
  
  const node = cy.$id(nodeId)
  if (node.length === 0) return
  
  // 查询节点关系（类似 GraphTooltip 的逻辑）
  const data = node.data()
  
  // 获取父类
  const parentEdges = cy.edges(`[source = "${nodeId}"][edgeType = "inheritance"]`)
  const parent = parentEdges.length > 0 ? parentEdges[0].data('target') : null
  
  // 获取子类
  const childEdges = cy.edges(`[target = "${nodeId}"][edgeType = "inheritance"]`)
  const children: string[] = []
  childEdges.forEach(edge => {
    children.push(edge.data('source'))
  })
  
  // 获取扩展
  const extensionEdges = cy.edges(`[source = "${nodeId}"][edgeType = "extension"]`)
  const extensions: Array<{ name: string; type: string }> = []
  extensionEdges.forEach(edge => {
    extensions.push({
      name: edge.data('target'),
      type: edge.data('extensionType')
    })
  })
  
  // 获取被扩展
  const extendedByEdges = cy.edges(`[target = "${nodeId}"][edgeType = "extension"]`)
  const extendedBy: Array<{ name: string; type: string }> = []
  extendedByEdges.forEach(edge => {
    extendedBy.push({
      name: edge.data('source'),
      type: edge.data('extensionType')
    })
  })
  
  // 获取接口实现
  const interfaceEdges = cy.edges(`[source = "${nodeId}"][edgeType = "implementation"]`)
  const implements: Array<{ name: string; type: string }> = []
  interfaceEdges.forEach(edge => {
    implements.push({
      name: edge.data('target'),
      type: edge.data('implementationType')
    })
  })
  
  // 获取被实现
  const implementedByEdges = cy.edges(`[target = "${nodeId}"][edgeType = "implementation"]`)
  const implementedBy: Array<{ name: string; type: string }> = []
  implementedByEdges.forEach(edge => {
    implementedBy.push({
      name: edge.data('source'),
      type: edge.data('implementationType')
    })
  })
  
  // 发送响应
  eventBus.emit('graph:nodeDetailsResponse', {
    id: nodeId,
    parent,
    children,
    extensions,
    extendedBy,
    implements,
    implementedBy
  })
})
```

### 2. 在侧边栏详情面板中显示关系信息

需要在 `GraphElementsPanel.vue` 的详情面板中添加：

```vue
<!-- 元素详情 -->
<div v-if="selectedElement && !historyVisible" class="element-details">
  <div class="details-header">
    <h4>详情</h4>
    <button @click="selectedElement = null" class="close-btn">✕</button>
  </div>
  <div class="details-content">
    <!-- 基本信息 -->
    <div class="detail-row">
      <span class="detail-label">ID:</span>
      <span class="detail-value">{{ selectedElement.id }}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">标签:</span>
      <span class="detail-value">{{ selectedElement.label || '无' }}</span>
    </div>
    <div v-if="viewMode === 'nodes' && selectedElement.type" class="detail-row">
      <span class="detail-label">类型:</span>
      <span class="detail-value">{{ selectedElement.type }}</span>
    </div>
    <div v-if="viewMode === 'nodes'" class="detail-row">
      <span class="detail-label">颜色:</span>
      <span class="detail-value">
        <span class="color-preview" :style="{ backgroundColor: selectedElement.color }"></span>
        {{ selectedElement.color }}
      </span>
    </div>
    
    <!-- 节点关系信息 -->
    <template v-if="viewMode === 'nodes' && 'parent' in selectedElement">
      <!-- 父类 -->
      <div v-if="selectedElement.parent" class="detail-section">
        <div class="section-title">父类</div>
        <div class="relation-item">
          {{ selectedElement.parent }}
        </div>
      </div>
      
      <!-- 子类 -->
      <div v-if="selectedElement.children && selectedElement.children.length > 0" class="detail-section">
        <div class="section-title">子类 ({{ selectedElement.children.length }})</div>
        <div v-for="child in selectedElement.children" :key="child" class="relation-item">
          {{ child }}
        </div>
      </div>
      
      <!-- 扩展 -->
      <div v-if="selectedElement.extensions && selectedElement.extensions.length > 0" class="detail-section">
        <div class="section-title">扩展 ({{ selectedElement.extensions.length }})</div>
        <div v-for="ext in selectedElement.extensions" :key="ext.name" class="relation-item">
          <span class="relation-name">{{ ext.name }}</span>
          <span class="relation-type">{{ ext.type }}</span>
        </div>
      </div>
      
      <!-- 被扩展 -->
      <div v-if="selectedElement.extendedBy && selectedElement.extendedBy.length > 0" class="detail-section">
        <div class="section-title">被扩展 ({{ selectedElement.extendedBy.length }})</div>
        <div v-for="ext in selectedElement.extendedBy" :key="ext.name" class="relation-item">
          <span class="relation-name">{{ ext.name }}</span>
          <span class="relation-type">{{ ext.type }}</span>
        </div>
      </div>
      
      <!-- 实现接口 -->
      <div v-if="selectedElement.implements && selectedElement.implements.length > 0" class="detail-section">
        <div class="section-title">实现接口 ({{ selectedElement.implements.length }})</div>
        <div v-for="iface in selectedElement.implements" :key="iface.name" class="relation-item">
          <span class="relation-name">{{ iface.name }}</span>
          <span class="relation-type">{{ iface.type }}</span>
        </div>
      </div>
      
      <!-- 被实现 -->
      <div v-if="selectedElement.implementedBy && selectedElement.implementedBy.length > 0" class="detail-section">
        <div class="section-title">被实现 ({{ selectedElement.implementedBy.length }})</div>
        <div v-for="impl in selectedElement.implementedBy" :key="impl.name" class="relation-item">
          <span class="relation-name">{{ impl.name }}</span>
          <span class="relation-type">{{ impl.type }}</span>
        </div>
      </div>
    </template>
    
    <!-- 边信息（保持原样）-->
    <template v-if="viewMode === 'edges' && 'source' in selectedElement">
      <!-- ... 边的详细信息 ... -->
    </template>
  </div>
</div>
```

### 3. 添加 CSS 样式

```css
.detail-section {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #e3e5e7;
}

.section-title {
  font-size: 12px;
  font-weight: 600;
  color: #202124;
  margin-bottom: 8px;
}

.relation-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 8px;
  margin-bottom: 4px;
  background: #f8f9fa;
  border-radius: 4px;
  font-size: 11px;
}

.relation-name {
  font-family: monospace;
  color: #4a9eff;
  flex: 1;
}

.relation-type {
  font-size: 10px;
  color: #868e96;
  padding: 2px 6px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 3px;
  margin-left: 8px;
}
```

## 使用方法

### 测试双击聚焦

```bash
# 1. 启动应用
npm run electron:dev

# 2. 启动 Socket 服务器
# 在 GraphView 中点击 🟢

# 3. 运行测试
npm run test:large

# 4. 测试双击聚焦
# - 打开图元素侧边栏
# - 双击任意节点
# - 图应该自动聚焦到该节点 ✅
# - 节点高亮显示 ✅
# - 缩放到 1.5x ✅
```

### 测试详细信息显示

```bash
# 1. 单击侧边栏中的节点
# 2. 详情面板应该显示：
#    - 基本信息（ID、标签、类型、颜色）
#    - 父类
#    - 子类列表
#    - 扩展关系
#    - 被扩展关系
#    - 实现的接口
#    - 被实现情况
```

## 功能对比

### Tooltip vs 侧边栏

| 功能 | Tooltip | 侧边栏 |
|------|---------|--------|
| 显示触发 | 鼠标悬浮 | 单击选择 |
| 固定显示 | 可固定 | 始终显示 |
| 拖动 | 可拖动 | 固定位置 |
| 递归查询 | 支持嵌套 | 不支持 |
| 详细信息 | 完整 | 完整 |
| 聚焦功能 | 点击类名 | 双击元素 |
| 历史记录 | 无 | 有 |

## 优势

### 1. 双击聚焦
- 快速定位元素
- 直观的交互方式
- 适合大型图的导航

### 2. 详细信息显示
- 持久化显示，不会消失
- 可以慢慢查看和分析
- 结合历史记录功能
- 适合深入研究节点关系

### 3. 互补性
- Tooltip：快速查看
- 侧边栏：详细分析
- 两者配合使用，体验更好

## 相关文档

- `docs/TOOLTIP_FEATURE.md` - Tooltip 功能文档
- `docs/TOOLTIP_SIDEBAR_FIX.md` - Tooltip 和侧边栏修复文档
- `docs/TYPE_SYSTEM.md` - 类型系统文档

## 版本历史

- **v1.0** (2025-11-12) - 初始实现
  - 实现双击聚焦功能
  - 扩展数据结构支持详细信息
  - 添加事件通信机制

<template>
  <ResizablePanelGroup>
    <!-- 图元素列表面板 -->
    <CollapsiblePanel 
      title="图元素" 
      :default-collapsed="false"
      class="elements-list-panel"
    >
      <template #actions>
        <div class="view-toggle">
          <button 
            :class="{ active: viewMode === 'nodes' }" 
            @click="viewMode = 'nodes'"
            class="toggle-btn"
          >
            节点 ({{ nodes.length }})
          </button>
          <button 
            :class="{ active: viewMode === 'edges' }" 
            @click="viewMode = 'edges'"
            class="toggle-btn"
          >
            边 ({{ edges.length }})
          </button>
        </div>
      </template>

      <!-- 搜索过滤 -->
      <div class="search-box">
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="搜索 ID 或标签..."
          class="search-input"
        />
        <button v-if="searchQuery" @click="searchQuery = ''" class="clear-btn">✕</button>
      </div>

      <!-- 节点列表 -->
      <div v-if="viewMode === 'nodes'" class="elements-list">
        <div 
          v-for="node in filteredNodes" 
          :key="node.id"
          :class="['element-item', { selected: selectedElement?.id === node.id }]"
          @click="selectElement(node)"
          @dblclick="focusElement(node)"
        >
          <div class="element-icon" :style="{ backgroundColor: node.color }"></div>
          <div class="element-info">
            <div class="element-label">{{ node.label }}</div>
            <div class="element-id">{{ node.id }}</div>
            <div v-if="node.type" class="element-type">{{ node.type }}</div>
          </div>
          <button @click.stop="showHistory(node)" class="history-btn" title="查看历史">
            📜
          </button>
        </div>
        <div v-if="filteredNodes.length === 0" class="empty-state">
          {{ searchQuery ? '未找到匹配的节点' : '暂无节点' }}
        </div>
      </div>

      <!-- 边列表 -->
      <div v-if="viewMode === 'edges'" class="elements-list">
        <div 
          v-for="edge in filteredEdges" 
          :key="edge.id"
          :class="['element-item', { selected: selectedElement?.id === edge.id }]"
          @click="selectElement(edge)"
          @dblclick="focusElement(edge)"
        >
          <div class="edge-indicator" :style="{ backgroundColor: edge.color }"></div>
          <div class="element-info">
            <div class="element-label">{{ edge.label || '未命名' }}</div>
            <div class="element-id">{{ edge.source }} → {{ edge.target }}</div>
            <div class="edge-style">
              {{ edge.lineStyle }} · {{ edge.arrowShape }}
            </div>
          </div>
          <button @click.stop="showHistory(edge)" class="history-btn" title="查看历史">
            📜
          </button>
        </div>
        <div v-if="filteredEdges.length === 0" class="empty-state">
          {{ searchQuery ? '未找到匹配的边' : '暂无边' }}
        </div>
      </div>
    </CollapsiblePanel>

    <!-- 详情/历史面板 -->
    <CollapsiblePanel 
      :title="historyVisible ? '历史记录' : '详情'" 
      :default-collapsed="false"
      class="details-panel"
    >
      <!-- 历史记录 -->
      <div v-if="historyVisible" class="history-content">
        <div class="history-header-info">
          <h4>{{ historyElement?.label || historyElement?.id }}</h4>
          <button @click="historyVisible = false" class="close-btn">✕</button>
        </div>
        <div class="history-list">
          <div 
            v-for="(record, index) in elementHistory" 
            :key="index"
            class="history-item"
          >
            <div class="history-time">{{ formatTime(record.timestamp) }}</div>
            <div class="history-action">{{ record.action }}</div>
            <div v-if="record.changes" class="history-changes">
              <div v-for="(value, key) in record.changes" :key="key" class="change-item">
                <span class="change-key">{{ key }}:</span>
                <span class="change-value">{{ value }}</span>
              </div>
            </div>
          </div>
          <div v-if="elementHistory.length === 0" class="empty-state">
            暂无历史记录
          </div>
        </div>
      </div>

      <!-- 元素详情 -->
      <div v-else-if="selectedElement" class="details-content">
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
          <div v-if="(selectedElement as GraphNode).parent" class="detail-section">
            <div class="section-title">父类</div>
            <div class="relation-item" @dblclick="focusNodeByName((selectedElement as GraphNode).parent!)">
              <span class="relation-name">{{ (selectedElement as GraphNode).parent }}</span>
            </div>
          </div>
          
          <!-- 子类 -->
          <div v-if="(selectedElement as GraphNode).children && (selectedElement as GraphNode).children!.length > 0" class="detail-section">
            <div class="section-title">子类 ({{ (selectedElement as GraphNode).children!.length }})</div>
            <div v-for="child in (selectedElement as GraphNode).children" :key="child" class="relation-item" @dblclick="focusNodeByName(child)">
              <span class="relation-name">{{ child }}</span>
            </div>
          </div>
          
          <!-- 扩展 -->
          <div v-if="(selectedElement as GraphNode).extensions && (selectedElement as GraphNode).extensions!.length > 0" class="detail-section">
            <div class="section-title">扩展 ({{ (selectedElement as GraphNode).extensions!.length }})</div>
            <div v-for="ext in (selectedElement as GraphNode).extensions" :key="ext.name" class="relation-item" @dblclick="focusNodeByName(ext.name)">
              <span class="relation-name">{{ ext.name }}</span>
              <span class="relation-type">{{ ext.type }}</span>
            </div>
          </div>
          
          <!-- 被扩展 -->
          <div v-if="(selectedElement as GraphNode).extendedBy && (selectedElement as GraphNode).extendedBy!.length > 0" class="detail-section">
            <div class="section-title">被扩展 ({{ (selectedElement as GraphNode).extendedBy!.length }})</div>
            <div v-for="ext in (selectedElement as GraphNode).extendedBy" :key="ext.name" class="relation-item" @dblclick="focusNodeByName(ext.name)">
              <span class="relation-name">{{ ext.name }}</span>
              <span class="relation-type">{{ ext.type }}</span>
            </div>
          </div>
          
          <!-- 实现接口 -->
          <div v-if="(selectedElement as GraphNode).implements && (selectedElement as GraphNode).implements!.length > 0" class="detail-section">
            <div class="section-title">实现接口 ({{ (selectedElement as GraphNode).implements!.length }})</div>
            <div v-for="iface in (selectedElement as GraphNode).implements" :key="iface.name" class="relation-item" @dblclick="focusNodeByName(iface.name)">
              <span class="relation-name">{{ iface.name }}</span>
              <span class="relation-type">{{ iface.type }}</span>
            </div>
          </div>
          
          <!-- 被实现 -->
          <div v-if="(selectedElement as GraphNode).implementedBy && (selectedElement as GraphNode).implementedBy!.length > 0" class="detail-section">
            <div class="section-title">被实现 ({{ (selectedElement as GraphNode).implementedBy!.length }})</div>
            <div v-for="impl in (selectedElement as GraphNode).implementedBy" :key="impl.name" class="relation-item" @dblclick="focusNodeByName(impl.name)">
              <span class="relation-name">{{ impl.name }}</span>
              <span class="relation-type">{{ impl.type }}</span>
            </div>
          </div>
        </template>
        
        <!-- 边信息 -->
        <template v-if="viewMode === 'edges' && 'source' in selectedElement">
          <div class="detail-row">
            <span class="detail-label">源:</span>
            <span class="detail-value">{{ (selectedElement as GraphEdge).source }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">目标:</span>
            <span class="detail-value">{{ (selectedElement as GraphEdge).target }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">颜色:</span>
            <span class="detail-value">
              <span class="color-preview" :style="{ backgroundColor: selectedElement.color }"></span>
              {{ selectedElement.color }}
            </span>
          </div>
          <div class="detail-row">
            <span class="detail-label">线宽:</span>
            <span class="detail-value">{{ (selectedElement as GraphEdge).width }}px</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">箭头:</span>
            <span class="detail-value">{{ (selectedElement as GraphEdge).arrowShape }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">曲线:</span>
            <span class="detail-value">{{ (selectedElement as GraphEdge).curveStyle }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">线条:</span>
            <span class="detail-value">{{ (selectedElement as GraphEdge).lineStyle }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">不透明度:</span>
            <span class="detail-value">{{ Math.round((selectedElement as GraphEdge).opacity * 100) }}%</span>
          </div>
        </template>
      </div>

      <!-- 空状态 -->
      <div v-else class="empty-state">
        选择一个元素查看详情
      </div>
    </CollapsiblePanel>
  </ResizablePanelGroup>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { pluginManager } from '@/core/plugin'
import CollapsiblePanel from '@/components/common/CollapsiblePanel.vue'
import ResizablePanelGroup from '@/components/common/ResizablePanelGroup.vue'

// 接口定义（与原来相同）
interface GraphNode {
  id: string
  label: string
  color: string
  type?: string
  parent?: string
  children?: string[]
  extensions?: Array<{ name: string; type: string }>
  extendedBy?: Array<{ name: string; type: string }>
  implements?: Array<{ name: string; type: string }>
  implementedBy?: Array<{ name: string; type: string }>
}

interface GraphEdge {
  id: string
  source: string
  target: string
  label?: string
  color: string
  width: number
  arrowShape: string
  curveStyle: string
  lineStyle: string
  opacity: number
}

interface HistoryRecord {
  timestamp: number
  action: string
  changes?: Record<string, any>
}

const viewMode = ref<'nodes' | 'edges'>('nodes')
const searchQuery = ref('')
const selectedElement = ref<GraphNode | GraphEdge | null>(null)
const historyVisible = ref(false)
const historyElement = ref<GraphNode | GraphEdge | null>(null)

const nodes = ref<GraphNode[]>([])
const edges = ref<GraphEdge[]>([])
const elementHistoryMap = ref<Map<string, HistoryRecord[]>>(new Map())

// 过滤后的节点
const filteredNodes = computed(() => {
  if (!searchQuery.value) return nodes.value
  const query = searchQuery.value.toLowerCase()
  return nodes.value.filter(node => 
    node.id.toLowerCase().includes(query) || 
    node.label.toLowerCase().includes(query)
  )
})

// 过滤后的边
const filteredEdges = computed(() => {
  if (!searchQuery.value) return edges.value
  const query = searchQuery.value.toLowerCase()
  return edges.value.filter(edge => 
    edge.id.toLowerCase().includes(query) ||
    edge.source.toLowerCase().includes(query) ||
    edge.target.toLowerCase().includes(query)
  )
})

// 当前元素的历史记录
const elementHistory = computed(() => {
  if (!historyElement.value) return []
  return elementHistoryMap.value.get(historyElement.value.id) || []
})

// 选择元素（单击）
function selectElement(element: GraphNode | GraphEdge) {
  selectedElement.value = element
  historyVisible.value = false
  
  // 如果是节点，请求详细关系信息
  if (viewMode.value === 'nodes') {
    pluginManager.getEventBus().emit('graph:requestNodeDetails', element.id)
  }
  
  // 注意：单击只选择，不聚焦。聚焦由双击触发
}

// 双击聚焦元素
function focusElement(element: GraphNode | GraphEdge) {
  if (viewMode.value === 'nodes') {
    pluginManager.getEventBus().emit('graph:focusNode', element.id)
  } else {
    pluginManager.getEventBus().emit('graph:focusEdge', element.id)
  }
}

// 通过节点名称聚焦
function focusNodeByName(nodeName: string) {
  pluginManager.getEventBus().emit('graph:focusNode', nodeName)
}

// 显示历史记录
function showHistory(element: GraphNode | GraphEdge) {
  historyElement.value = element
  historyVisible.value = true
  selectedElement.value = null
}

// 格式化时间
function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
  
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 监听图事件，更新数据
pluginManager.getEventBus().on('graph:nodeAdded', (data: any) => {
  nodes.value.push({
    id: data.id,
    label: data.label,
    color: data.color,
    type: data.type || 'unknown'
  })
  
  const history = elementHistoryMap.value.get(data.id) || []
  history.push({
    timestamp: Date.now(),
    action: '创建节点',
    changes: { label: data.label, color: data.color }
  })
  elementHistoryMap.value.set(data.id, history)
})

pluginManager.getEventBus().on('graph:edgeAdded', (data: any) => {
  edges.value.push({
    id: data.id,
    source: data.source,
    target: data.target,
    label: data.label,
    color: data.color,
    width: data.width,
    arrowShape: data.arrowShape,
    curveStyle: data.curveStyle,
    lineStyle: data.lineStyle,
    opacity: data.opacity
  })
  
  const history = elementHistoryMap.value.get(data.id) || []
  history.push({
    timestamp: Date.now(),
    action: '创建边',
    changes: {
      source: data.source,
      target: data.target,
      label: data.label
    }
  })
  elementHistoryMap.value.set(data.id, history)
})

// 监听节点更新事件
pluginManager.getEventBus().on('graph:nodeUpdated', (data: any) => {
  const node = nodes.value.find(n => n.id === data.id)
  if (node) {
    node.color = data.color
    node.label = data.label
    node.type = data.type
    
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

// 监听节点详细信息响应
pluginManager.getEventBus().on('graph:nodeDetailsResponse', (data: any) => {
  if (selectedElement.value && selectedElement.value.id === data.id) {
    selectedElement.value = {
      ...selectedElement.value,
      ...data
    }
  }
})

defineExpose({
  refreshData: () => {
    // 刷新数据的方法
  }
})
</script>

<style scoped>
.elements-list-panel,
.details-panel {
  display: flex;
  flex-direction: column;
  min-height: 100px;
}

.elements-list-panel {
  flex: 0 0 300px;
}

.details-panel {
  flex: 1;
  min-height: 200px;
}

.view-toggle {
  display: flex;
  gap: 4px;
  background: #e9ecef;
  padding: 2px;
  border-radius: 6px;
}

.toggle-btn {
  padding: 4px 12px;
  font-size: 11px;
  border: none;
  background: transparent;
  color: #5f6368;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
  font-weight: 500;
}

.toggle-btn:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #202124;
}

.toggle-btn.active {
  background: #ffffff;
  color: #4a9eff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.search-box {
  padding: 8px 12px;
  border-bottom: 1px solid #e3e5e7;
  position: relative;
  flex-shrink: 0;
}

.search-input {
  width: 100%;
  padding: 6px 28px 6px 8px;
  border: 1px solid #e3e5e7;
  border-radius: 4px;
  font-size: 12px;
  outline: none;
  transition: border-color 0.2s;
}

.search-input:focus {
  border-color: #4a9eff;
}

.clear-btn {
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 4px;
  color: #5f6368;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.clear-btn:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #202124;
}

.elements-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.element-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  margin-bottom: 4px;
  background: #fff;
  border: 1px solid #e3e5e7;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.element-item:hover {
  background: #f8f9fa;
  border-color: #c5cdd5;
}

.element-item.selected {
  background: #e3f2fd;
  border-color: #4a9eff;
}

.element-icon,
.edge-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.edge-indicator {
  border-radius: 2px;
}

.element-info {
  flex: 1;
  min-width: 0;
}

.element-label {
  font-size: 13px;
  font-weight: 500;
  color: #202124;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.element-id {
  font-size: 11px;
  color: #5f6368;
  font-family: monospace;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.element-type {
  font-size: 10px;
  color: #868e96;
  margin-top: 2px;
  padding: 2px 6px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
  display: inline-block;
  font-weight: 500;
}

.edge-style {
  font-size: 10px;
  color: #868e96;
  margin-top: 2px;
}

.history-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid #e3e5e7;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.history-btn:hover {
  background: #f0f4f8;
  border-color: #c5cdd5;
}

.empty-state {
  padding: 32px 16px;
  text-align: center;
  color: #868e96;
  font-size: 12px;
}

.history-content,
.details-content {
  padding: 12px 16px;
  overflow-y: auto;
}

.history-header-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e3e5e7;
}

.history-header-info h4 {
  font-size: 14px;
  font-weight: 600;
  color: #202124;
  margin: 0;
}

.close-btn {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid #e3e5e7;
  border-radius: 4px;
  font-size: 14px;
  color: #5f6368;
  cursor: pointer;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #f0f4f8;
  border-color: #c5cdd5;
  color: #202124;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.history-item {
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e3e5e7;
}

.history-time {
  font-size: 11px;
  color: #868e96;
  margin-bottom: 4px;
}

.history-action {
  font-size: 12px;
  font-weight: 500;
  color: #202124;
  margin-bottom: 8px;
}

.history-changes {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.change-item {
  font-size: 11px;
  color: #5f6368;
  padding: 4px 8px;
  background: #ffffff;
  border-radius: 4px;
}

.change-key {
  font-weight: 500;
  margin-right: 4px;
}

.change-value {
  font-family: monospace;
}

.detail-row {
  display: flex;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #e3e5e7;
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-label {
  width: 80px;
  font-size: 12px;
  font-weight: 500;
  color: #5f6368;
  flex-shrink: 0;
}

.detail-value {
  flex: 1;
  font-size: 12px;
  color: #202124;
  font-family: monospace;
  display: flex;
  align-items: center;
  gap: 8px;
}

.color-preview {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  border: 1px solid #e3e5e7;
}

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
  cursor: pointer;
  transition: background 0.2s;
}

.relation-item:hover {
  background: #e9ecef;
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
  font-weight: 500;
}
</style>

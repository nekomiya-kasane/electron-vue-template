<template>
  <div class="graph-elements-panel">
    <div class="panel-header">
      <h3>图元素</h3>
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
    </div>

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
      >
        <div class="element-icon" :style="{ backgroundColor: node.color }"></div>
        <div class="element-info">
          <div class="element-label">{{ node.label }}</div>
          <div class="element-id">{{ node.id }}</div>
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

    <!-- 历史记录面板 -->
    <div v-if="historyVisible" class="history-panel">
      <div class="history-header">
        <h4>历史记录 - {{ historyElement?.label || historyElement?.id }}</h4>
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
    <div v-if="selectedElement && !historyVisible" class="element-details">
      <div class="details-header">
        <h4>详情</h4>
        <button @click="selectedElement = null" class="close-btn">✕</button>
      </div>
      <div class="details-content">
        <div class="detail-row">
          <span class="detail-label">ID:</span>
          <span class="detail-value">{{ selectedElement.id }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">标签:</span>
          <span class="detail-value">{{ selectedElement.label || '无' }}</span>
        </div>
        <div v-if="viewMode === 'nodes'" class="detail-row">
          <span class="detail-label">颜色:</span>
          <span class="detail-value">
            <span class="color-preview" :style="{ backgroundColor: selectedElement.color }"></span>
            {{ selectedElement.color }}
          </span>
        </div>
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { pluginManager } from '@/core/plugin'

interface GraphNode {
  id: string
  label: string
  color: string
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

// 模拟数据（实际应从 GraphView 获取）
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
    edge.label?.toLowerCase().includes(query) ||
    edge.source.toLowerCase().includes(query) ||
    edge.target.toLowerCase().includes(query)
  )
})

// 当前元素的历史记录
const elementHistory = computed(() => {
  if (!historyElement.value) return []
  return elementHistoryMap.value.get(historyElement.value.id) || []
})

// 选择元素
function selectElement(element: GraphNode | GraphEdge) {
  selectedElement.value = element
  historyVisible.value = false
  
  // 触发图中高亮
  if (viewMode.value === 'nodes') {
    pluginManager.getEventBus().emit('graph:focusNode', element.id)
  } else {
    pluginManager.getEventBus().emit('graph:focusEdge', element.id)
  }
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
    color: data.color
  })
  
  // 记录历史
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
  
  // 记录历史
  const history = elementHistoryMap.value.get(data.id) || []
  history.push({
    timestamp: Date.now(),
    action: '创建边',
    changes: {
      source: data.source,
      target: data.target,
      style: `${data.lineStyle} ${data.arrowShape}`
    }
  })
  elementHistoryMap.value.set(data.id, history)
})

// 监听节点选择事件
pluginManager.getEventBus().on('graph:nodeSelected', (nodeId: string) => {
  const node = nodes.value.find(n => n.id === nodeId)
  if (node) {
    selectedElement.value = node
    viewMode.value = 'nodes'
  }
})

// 监听边选择事件
pluginManager.getEventBus().on('graph:edgeSelected', (edgeId: string) => {
  const edge = edges.value.find(e => e.id === edgeId)
  if (edge) {
    selectedElement.value = edge
    viewMode.value = 'edges'
  }
})

// 暴露方法供外部调用
defineExpose({
  refreshData: () => {
    // 刷新数据的方法
  }
})
</script>

<style scoped>
.graph-elements-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #ffffff;
  border-left: 1px solid #e3e5e7;
}

.panel-header {
  padding: 16px;
  border-bottom: 1px solid #e3e5e7;
  background: #f8f9fa;
}

.panel-header h3 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #202124;
}

.view-toggle {
  display: flex;
  gap: 4px;
}

.toggle-btn {
  flex: 1;
  padding: 6px 12px;
  background: #fff;
  border: 1px solid #e3e5e7;
  border-radius: 6px;
  color: #5f6368;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.toggle-btn:hover {
  background: #f0f4f8;
  border-color: #c5cdd5;
}

.toggle-btn.active {
  background: #4a9eff;
  border-color: #4a9eff;
  color: #fff;
}

.search-box {
  position: relative;
  padding: 12px 16px;
  border-bottom: 1px solid #e3e5e7;
}

.search-input {
  width: 100%;
  padding: 8px 32px 8px 12px;
  background: #f8f9fa;
  border: 1px solid #e3e5e7;
  border-radius: 6px;
  font-size: 12px;
  color: #202124;
  transition: all 0.2s;
}

.search-input:focus {
  outline: none;
  background: #fff;
  border-color: #4a9eff;
  box-shadow: 0 0 0 3px rgba(74, 158, 255, 0.1);
}

.clear-btn {
  position: absolute;
  right: 24px;
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

.element-icon {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  flex-shrink: 0;
}

.edge-indicator {
  width: 4px;
  height: 32px;
  border-radius: 2px;
  flex-shrink: 0;
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

.history-panel,
.element-details {
  border-top: 1px solid #e3e5e7;
  background: #f8f9fa;
  max-height: 40%;
  display: flex;
  flex-direction: column;
}

.history-header,
.details-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #e3e5e7;
  background: #fff;
}

.history-header h4,
.details-header h4 {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: #202124;
}

.close-btn {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 4px;
  color: #5f6368;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #202124;
}

.history-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.history-item {
  padding: 12px;
  margin-bottom: 8px;
  background: #fff;
  border: 1px solid #e3e5e7;
  border-radius: 6px;
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
  padding-left: 12px;
  border-left: 2px solid #e3e5e7;
}

.change-item {
  font-size: 11px;
  color: #5f6368;
  margin-bottom: 4px;
}

.change-key {
  font-weight: 500;
  margin-right: 4px;
}

.change-value {
  font-family: monospace;
}

.details-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px 16px;
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
</style>

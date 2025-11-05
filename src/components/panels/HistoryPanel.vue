<template>
  <div class="history-panel">
    <div class="panel-header">
      <h3>操作历史</h3>
      <button @click="clearHistory" class="btn-clear" title="清空历史">
        🗑️
      </button>
    </div>

    <div class="filter-bar">
      <select v-model="filterType" class="filter-select">
        <option value="all">全部</option>
        <option value="addNode">添加节点</option>
        <option value="addEdge">添加边</option>
        <option value="highlight">高亮</option>
        <option value="packet">数据包</option>
      </select>
    </div>

    <div class="history-list">
      <div 
        v-for="item in filteredHistory" 
        :key="item.id"
        class="history-item"
        :class="`type-${item.type}`"
        @click="selectHistoryItem(item)"
      >
        <div class="history-icon">{{ getIcon(item.type) }}</div>
        <div class="history-content">
          <div class="history-action">{{ item.action }}</div>
          <div class="history-detail">{{ item.detail }}</div>
          <div class="history-time">{{ formatTime(item.timestamp) }}</div>
        </div>
        <button 
          v-if="item.replayable"
          @click.stop="replayAction(item)" 
          class="btn-replay"
          title="重放操作"
        >
          ↻
        </button>
      </div>
    </div>

    <div v-if="history.length === 0" class="empty-state">
      <div class="empty-icon">📜</div>
      <div class="empty-text">暂无历史记录</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { pluginManager } from '@/core/plugin'

interface HistoryItem {
  id: string
  type: 'addNode' | 'addEdge' | 'highlight' | 'packet' | 'other'
  action: string
  detail: string
  timestamp: number
  data?: any
  replayable: boolean
}

const history = ref<HistoryItem[]>([])
const filterType = ref<string>('all')

// 过滤后的历史
const filteredHistory = computed(() => {
  if (filterType.value === 'all') {
    return history.value
  }
  return history.value.filter(item => item.type === filterType.value)
})

// 添加历史记录
function addHistoryItem(type: HistoryItem['type'], action: string, detail: string, data?: any, replayable: boolean = false) {
  const item: HistoryItem = {
    id: `history-${Date.now()}-${Math.random()}`,
    type,
    action,
    detail,
    timestamp: Date.now(),
    data,
    replayable
  }

  history.value.unshift(item)

  // 限制历史记录数量
  if (history.value.length > 100) {
    history.value = history.value.slice(0, 100)
  }
}

// 选择历史项
function selectHistoryItem(item: HistoryItem) {
  console.log('[HistoryPanel] Selected:', item)
  
  const eventBus = pluginManager.getEventBus()
  eventBus.emit('history:selected', item)
}

// 重放操作
function replayAction(item: HistoryItem) {
  console.log('[HistoryPanel] Replaying:', item)
  
  const eventBus = pluginManager.getEventBus()
  eventBus.emit('history:replay', item)

  // 添加重放记录
  addHistoryItem('other', '重放操作', `重放: ${item.action}`, item.data, false)
}

// 清空历史
function clearHistory() {
  if (confirm('确定要清空所有历史记录吗？')) {
    history.value = []
  }
}

// 获取图标
function getIcon(type: string): string {
  const icons: Record<string, string> = {
    addNode: '⊕',
    addEdge: '→',
    highlight: '✨',
    packet: '📦',
    other: '•'
  }
  return icons[type] || '•'
}

// 格式化时间
function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  const seconds = date.getSeconds().toString().padStart(2, '0')
  return `${hours}:${minutes}:${seconds}`
}

onMounted(() => {
  const eventBus = pluginManager.getEventBus()

  // 监听数据包
  eventBus.on('data:packet', (packet: any) => {
    if (packet.type === 'QI') {
      addHistoryItem(
        'packet',
        'QI 数据包',
        `${packet.action || 'unknown'} - ${JSON.stringify(packet).substring(0, 50)}...`,
        packet,
        true
      )
    }
  })

  // 监听图操作
  eventBus.on('graph:nodeAdded', (data: any) => {
    addHistoryItem('addNode', '添加节点', `ID: ${data.id}, Label: ${data.label}`, data, true)
  })

  eventBus.on('graph:edgeAdded', (data: any) => {
    addHistoryItem('addEdge', '添加边', `${data.source} → ${data.target}`, data, true)
  })

  eventBus.on('graph:highlighted', (data: any) => {
    addHistoryItem('highlight', '高亮节点', `节点: ${data.nodeId}`, data, true)
  })

  console.log('[HistoryPanel] Mounted and listening for events')
})

defineExpose({
  addHistoryItem,
  clearHistory
})
</script>

<style scoped>
.history-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #1a1a1a;
  color: #fff;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.panel-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}

.btn-clear {
  width: 32px;
  height: 32px;
  padding: 0;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-clear:hover {
  background: #f44336;
  border-color: #f44336;
}

.filter-bar {
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.filter-select {
  width: 100%;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: #fff;
  font-size: 12px;
  cursor: pointer;
}

.filter-select:focus {
  outline: none;
  border-color: #2196F3;
}

.history-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.history-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  margin-bottom: 8px;
  background: rgba(255, 255, 255, 0.05);
  border-left: 3px solid transparent;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.history-item:hover {
  background: rgba(255, 255, 255, 0.08);
}

.history-item.type-addNode {
  border-left-color: #4CAF50;
}

.history-item.type-addEdge {
  border-left-color: #2196F3;
}

.history-item.type-highlight {
  border-left-color: #FFD700;
}

.history-item.type-packet {
  border-left-color: #FF9800;
}

.history-icon {
  font-size: 20px;
  line-height: 1;
  opacity: 0.8;
}

.history-content {
  flex: 1;
  min-width: 0;
}

.history-action {
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 4px;
}

.history-detail {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.history-time {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.4);
}

.btn-replay {
  width: 28px;
  height: 28px;
  padding: 0;
  background: rgba(33, 150, 243, 0.2);
  border: 1px solid rgba(33, 150, 243, 0.3);
  border-radius: 4px;
  color: #2196F3;
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-replay:hover {
  background: #2196F3;
  color: #fff;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 32px;
  text-align: center;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.3;
}

.empty-text {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
}
</style>

<template>
  <div class="session-panel">
    <div class="panel-header">
      <h3>会话管理</h3>
      <button @click="createNewSession" class="btn-new">新建</button>
    </div>

    <div class="session-list">
      <div 
        v-for="session in sessions" 
        :key="session.id"
        class="session-item"
        :class="{ active: session.id === activeSessionId }"
        @click="selectSession(session.id)"
      >
        <div class="session-icon">📊</div>
        <div class="session-info">
          <div class="session-name">{{ session.name }}</div>
          <div class="session-meta">
            <span>{{ session.nodeCount }} 节点</span>
            <span>{{ session.edgeCount }} 边</span>
          </div>
          <div class="session-time">{{ formatTime(session.createdAt) }}</div>
        </div>
        <button 
          @click.stop="deleteSession(session.id)" 
          class="btn-delete"
          title="删除会话"
        >
          ×
        </button>
      </div>
    </div>

    <div v-if="sessions.length === 0" class="empty-state">
      <div class="empty-icon">📊</div>
      <div class="empty-text">暂无会话</div>
      <button @click="createNewSession" class="btn-create">创建第一个会话</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { pluginManager } from '@/core/plugin'

interface Session {
  id: string
  name: string
  nodeCount: number
  edgeCount: number
  createdAt: number
  data?: any
}

const sessions = ref<Session[]>([])
const activeSessionId = ref<string | null>(null)

// 创建新会话
function createNewSession() {
  const id = `session-${Date.now()}`
  const newSession: Session = {
    id,
    name: `会话 ${sessions.value.length + 1}`,
    nodeCount: 0,
    edgeCount: 0,
    createdAt: Date.now()
  }

  sessions.value.unshift(newSession)
  selectSession(id)

  // 触发事件
  const eventBus = pluginManager.getEventBus()
  eventBus.emit('session:created', newSession)
}

// 选择会话
function selectSession(id: string) {
  activeSessionId.value = id
  const session = sessions.value.find(s => s.id === id)
  
  if (session) {
    const eventBus = pluginManager.getEventBus()
    eventBus.emit('session:selected', session)
  }
}

// 删除会话
function deleteSession(id: string) {
  const index = sessions.value.findIndex(s => s.id === id)
  if (index !== -1) {
    sessions.value.splice(index, 1)
    
    if (activeSessionId.value === id) {
      activeSessionId.value = sessions.value[0]?.id || null
    }

    const eventBus = pluginManager.getEventBus()
    eventBus.emit('session:deleted', id)
  }
}

// 格式化时间
function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  if (diff < 60000) {
    return '刚刚'
  } else if (diff < 3600000) {
    return `${Math.floor(diff / 60000)} 分钟前`
  } else if (diff < 86400000) {
    return `${Math.floor(diff / 3600000)} 小时前`
  } else {
    return date.toLocaleDateString()
  }
}

// 更新会话统计
function updateSessionStats(sessionId: string, nodeCount: number, edgeCount: number) {
  const session = sessions.value.find(s => s.id === sessionId)
  if (session) {
    session.nodeCount = nodeCount
    session.edgeCount = edgeCount
  }
}

onMounted(() => {
  // 创建默认会话
  createNewSession()

  // 监听图更新事件
  const eventBus = pluginManager.getEventBus()
  eventBus.on('graph:updated', (data: any) => {
    if (activeSessionId.value) {
      updateSessionStats(activeSessionId.value, data.nodeCount, data.edgeCount)
    }
  })
})

defineExpose({
  createNewSession,
  selectSession,
  updateSessionStats
})
</script>

<style scoped>
.session-panel {
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

.btn-new {
  padding: 6px 12px;
  background: #2196F3;
  border: none;
  border-radius: 4px;
  color: #fff;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-new:hover {
  background: #1976D2;
}

.session-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.session-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  margin-bottom: 8px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.session-item:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.2);
}

.session-item.active {
  background: rgba(33, 150, 243, 0.2);
  border-color: #2196F3;
}

.session-icon {
  font-size: 24px;
  line-height: 1;
}

.session-info {
  flex: 1;
  min-width: 0;
}

.session-name {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.session-meta {
  display: flex;
  gap: 12px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 4px;
}

.session-time {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
}

.btn-delete {
  width: 24px;
  height: 24px;
  padding: 0;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 4px;
  color: #fff;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-delete:hover {
  background: #f44336;
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
  margin-bottom: 16px;
}

.btn-create {
  padding: 8px 16px;
  background: #2196F3;
  border: none;
  border-radius: 6px;
  color: #fff;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-create:hover {
  background: #1976D2;
}
</style>

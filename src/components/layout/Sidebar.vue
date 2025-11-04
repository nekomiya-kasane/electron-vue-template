<template>
  <div 
    class="sidebar" 
    :class="[{ 'no-transition': isResizing }, `sidebar-${position}`]"
    :style="{ width: currentWidth + 'px', minWidth: currentWidth + 'px' }"
  >
    <div class="sidebar-header">
      <div class="sidebar-title">{{ title }}</div>
    </div>
    <div class="sidebar-content">
      <slot></slot>
    </div>
    <!-- 调整宽度的拖拽手柄 -->
    <div 
      :class="['resize-handle', `resize-handle-${position}`]"
      @mousedown="startResize"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'

const props = defineProps<{
  title: string
  sidebarId: string
  position: 'left' | 'right'
}>()

const emit = defineEmits<{
  widthChange: [width: number]
}>()

const currentWidth = ref(260)
const isResizing = ref(false)
const startX = ref(0)
const startWidth = ref(0)

// 从 localStorage 加载宽度
onMounted(() => {
  const savedWidth = localStorage.getItem(`sidebar-width-${props.sidebarId}`)
  if (savedWidth) {
    currentWidth.value = parseInt(savedWidth, 10)
  }
})

// 监听宽度变化，保存到 localStorage
watch(currentWidth, (newWidth) => {
  localStorage.setItem(`sidebar-width-${props.sidebarId}`, String(newWidth))
  emit('widthChange', newWidth)
})

const startResize = (e: MouseEvent) => {
  isResizing.value = true
  startX.value = e.clientX
  startWidth.value = currentWidth.value
  
  document.addEventListener('mousemove', handleResize)
  document.addEventListener('mouseup', stopResize)
  
  // 防止文本选择
  e.preventDefault()
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
}

const handleResize = (e: MouseEvent) => {
  if (!isResizing.value) return
  
  const delta = props.position === 'left' 
    ? e.clientX - startX.value 
    : startX.value - e.clientX
  
  const newWidth = startWidth.value + delta
  
  // 限制最小和最大宽度
  if (newWidth >= 200 && newWidth <= 600) {
    currentWidth.value = newWidth
  }
}

const stopResize = () => {
  isResizing.value = false
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
}
</script>

<style scoped>
.sidebar {
  display: flex;
  flex-direction: column;
  background: #f7f9fa;
  height: 100%;
  flex-shrink: 0;
  position: relative;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: width;
}

.sidebar-left {
  border-right: 1px solid #e3e5e7;
}

.sidebar-right {
  border-left: 1px solid #e3e5e7;
}

.sidebar.no-transition {
  transition: none;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-bottom: 1px solid #e3e5e7;
  background: #fff;
  height: 40px;
  flex-shrink: 0;
}

.sidebar-title {
  font-size: 14px;
  font-weight: 500;
  color: #202124;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 8px;
  min-width: 0;
}

.sidebar-content::-webkit-scrollbar {
  width: 6px;
}

.sidebar-content::-webkit-scrollbar-thumb {
  background: #d0d0d0;
  border-radius: 3px;
}

.sidebar-content::-webkit-scrollbar-thumb:hover {
  background: #b0b0b0;
}

/* 拖拽手柄 */
.resize-handle {
  position: absolute;
  top: 0;
  width: 4px;
  height: 100%;
  cursor: col-resize;
  background: transparent;
  transition: background 0.2s ease;
  z-index: 10;
}

.resize-handle-left {
  right: 0;
}

.resize-handle-right {
  left: 0;
}

.resize-handle:hover {
  background: #4a9eff;
}

.resize-handle:active {
  background: #2b7fd9;
}
</style>

<template>
  <div 
    v-if="visible"
    class="graph-tooltip"
    :class="{ pinned: isPinned, dragging: isDragging }"
    :style="tooltipStyle"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
  >
    <!-- 标题栏 -->
    <div 
      class="tooltip-header"
      :class="{ draggable: isPinned }"
      @mousedown="startDrag"
    >
      <div class="tooltip-title">
        <span class="tooltip-icon">{{ elementType === 'node' ? '⬢' : '→' }}</span>
        <span class="tooltip-name">{{ elementData?.label || elementData?.id }}</span>
      </div>
      <div class="tooltip-actions">
        <button 
          v-if="!isPinned"
          @click="pin" 
          class="action-btn" 
          title="固定"
        >
          📌
        </button>
        <button 
          v-else
          @click="unpin" 
          class="action-btn pinned" 
          title="取消固定"
        >
          📍
        </button>
        <button @click="close" class="action-btn" title="关闭">✕</button>
      </div>
    </div>

    <!-- 内容区 -->
    <div class="tooltip-content">
      <!-- 节点信息 -->
      <template v-if="elementType === 'node' && nodeInfo">
        <!-- 基本信息 -->
        <div class="info-section">
          <div class="info-row">
            <span class="info-label">ID:</span>
            <span class="info-value">{{ nodeInfo.id }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Name:</span>
            <span class="info-value">{{ nodeInfo.name }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Type:</span>
            <span class="info-value type-badge" :style="{ backgroundColor: nodeInfo.color }">
              {{ nodeInfo.type }}
            </span>
          </div>
        </div>

        <!-- 父类 -->
        <div v-if="nodeInfo.parent" class="info-section">
          <div class="section-title">Parent</div>
          <div class="info-row">
            <span 
              class="node-link"
              @mouseenter="showNestedTooltip($event, nodeInfo.parent)"
              @mouseleave="hideNestedTooltip"
              @click="focusNode(nodeInfo.parent)"
            >
              {{ nodeInfo.parent }}
            </span>
          </div>
        </div>

        <!-- 子类 -->
        <div v-if="nodeInfo.children && nodeInfo.children.length > 0" class="info-section">
          <div class="section-title">Children ({{ nodeInfo.children.length }})</div>
          <div class="node-list">
            <span 
              v-for="child in nodeInfo.children" 
              :key="child"
              class="node-link"
              @mouseenter="showNestedTooltip($event, child)"
              @mouseleave="hideNestedTooltip"
              @click="focusNode(child)"
            >
              {{ child }}
            </span>
          </div>
        </div>

        <!-- 扩展 -->
        <div v-if="nodeInfo.extensions && nodeInfo.extensions.length > 0" class="info-section">
          <div class="section-title">Extensions ({{ nodeInfo.extensions.length }})</div>
          <div class="extension-list">
            <div 
              v-for="ext in nodeInfo.extensions" 
              :key="ext.name"
              class="extension-item"
            >
              <span 
                class="node-link"
                @mouseenter="showNestedTooltip($event, ext.name)"
                @mouseleave="hideNestedTooltip"
                @click="focusNode(ext.name)"
              >
                {{ ext.name }}
              </span>
              <span class="extension-type">{{ ext.type }}</span>
            </div>
          </div>
        </div>

        <!-- 被扩展 -->
        <div v-if="nodeInfo.extendedBy && nodeInfo.extendedBy.length > 0" class="info-section">
          <div class="section-title">Extended By ({{ nodeInfo.extendedBy.length }})</div>
          <div class="extension-list">
            <div 
              v-for="ext in nodeInfo.extendedBy" 
              :key="ext.name"
              class="extension-item"
            >
              <span 
                class="node-link"
                @mouseenter="showNestedTooltip($event, ext.name)"
                @mouseleave="hideNestedTooltip"
                @click="focusNode(ext.name)"
              >
                {{ ext.name }}
              </span>
              <span class="extension-type">{{ ext.type }}</span>
            </div>
          </div>
        </div>

        <!-- 接口实现 -->
        <div v-if="nodeInfo.interfaces && nodeInfo.interfaces.length > 0" class="info-section">
          <div class="section-title">Implements ({{ nodeInfo.interfaces.length }})</div>
          <div class="interface-list">
            <div 
              v-for="iface in nodeInfo.interfaces" 
              :key="iface.name"
              class="interface-item"
            >
              <span 
                class="node-link"
                @mouseenter="showNestedTooltip($event, iface.name)"
                @mouseleave="hideNestedTooltip"
                @click="focusNode(iface.name)"
              >
                {{ iface.name }}
              </span>
              <span class="interface-type">{{ iface.type }}</span>
            </div>
          </div>
        </div>

        <!-- 被实现（如果是接口） -->
        <div v-if="nodeInfo.implementedBy && nodeInfo.implementedBy.length > 0" class="info-section">
          <div class="section-title">Implemented By ({{ nodeInfo.implementedBy.length }})</div>
          <div class="interface-list">
            <div 
              v-for="impl in nodeInfo.implementedBy" 
              :key="impl.name"
              class="interface-item"
            >
              <span 
                class="node-link"
                @mouseenter="showNestedTooltip($event, impl.name)"
                @mouseleave="hideNestedTooltip"
                @click="focusNode(impl.name)"
              >
                {{ impl.name }}
              </span>
              <span class="interface-type">{{ impl.type }}</span>
            </div>
          </div>
        </div>
      </template>

      <!-- 边信息 -->
      <template v-if="elementType === 'edge' && edgeInfo">
        <div class="info-section">
          <div class="info-row">
            <span class="info-label">Source:</span>
            <span 
              class="node-link"
              @mouseenter="showNestedTooltip($event, edgeInfo.source)"
              @mouseleave="hideNestedTooltip"
              @click="focusNode(edgeInfo.source)"
            >
              {{ edgeInfo.source }}
            </span>
          </div>
          <div class="info-row">
            <span class="info-label">Target:</span>
            <span 
              class="node-link"
              @mouseenter="showNestedTooltip($event, edgeInfo.target)"
              @mouseleave="hideNestedTooltip"
              @click="focusNode(edgeInfo.target)"
            >
              {{ edgeInfo.target }}
            </span>
          </div>
          <div class="info-row">
            <span class="info-label">Type:</span>
            <span class="info-value">{{ edgeInfo.edgeType }}</span>
          </div>
          <div v-if="edgeInfo.extensionType" class="info-row">
            <span class="info-label">Extension Type:</span>
            <span class="info-value">{{ edgeInfo.extensionType }}</span>
          </div>
          <div v-if="edgeInfo.implementationType" class="info-row">
            <span class="info-label">Implementation Type:</span>
            <span class="info-value">{{ edgeInfo.implementationType }}</span>
          </div>
        </div>
      </template>
    </div>

    <!-- 嵌套 tooltip -->
    <GraphTooltip
      v-if="nestedTooltip.visible"
      :visible="nestedTooltip.visible"
      :element-id="nestedTooltip.elementId"
      :element-type="'node'"
      :position="nestedTooltip.position"
      :cy="cy"
      :is-nested="true"
      @close="hideNestedTooltip"
      @focus="focusNode"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import type { Core } from 'cytoscape'

interface Props {
  visible: boolean
  elementId: string
  elementType: 'node' | 'edge'
  position: { x: number; y: number }
  cy: Core | null
  isNested?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isNested: false
})

const emit = defineEmits<{
  close: []
  focus: [nodeId: string]
}>()

const isPinned = ref(false)
const isDragging = ref(false)
const elementData = ref<any>(null)
const nodeInfo = ref<any>(null)
const edgeInfo = ref<any>(null)
const nestedTooltip = ref({
  visible: false,
  elementId: '',
  position: { x: 0, y: 0 }
})

// 拖动相关状态
const dragOffset = ref({ x: 0, y: 0 })
const currentPosition = ref({ x: 0, y: 0 })

let hideTimer: any = null

// Tooltip 样式
const tooltipStyle = computed(() => {
  const maxWidth = window.innerWidth - 20
  const maxHeight = window.innerHeight - 20
  
  // 如果是固定且已拖动，使用当前位置
  let x = isPinned.value && currentPosition.value.x !== 0 
    ? currentPosition.value.x 
    : props.position.x + 10
  let y = isPinned.value && currentPosition.value.y !== 0 
    ? currentPosition.value.y 
    : props.position.y + 10
  
  // 防止超出屏幕
  if (x + 400 > maxWidth) {
    x = maxWidth - 400
  }
  if (x < 0) {
    x = 0
  }
  if (y + 300 > maxHeight) {
    y = maxHeight - 300
  }
  if (y < 0) {
    y = 0
  }
  
  return {
    left: `${x}px`,
    top: `${y}px`
  }
})

// 加载元素数据
function loadElementData() {
  if (!props.cy || !props.elementId) return

  const element = props.cy.$id(props.elementId)
  if (element.length === 0) return

  elementData.value = element.data()

  if (props.elementType === 'node') {
    loadNodeInfo()
  } else {
    loadEdgeInfo()
  }
}

// 加载节点信息
function loadNodeInfo() {
  if (!props.cy || !props.elementId) return

  const node = props.cy.$id(props.elementId)
  if (node.length === 0) return

  const data = node.data()
  
  // 获取父类
  const parentEdges = props.cy.edges(`[source = "${props.elementId}"][edgeType = "inheritance"]`)
  const parent = parentEdges.length > 0 ? parentEdges[0].data('target') : null

  // 获取子类
  const childEdges = props.cy.edges(`[target = "${props.elementId}"][edgeType = "inheritance"]`)
  const children: string[] = []
  childEdges.forEach(edge => {
    children.push(edge.data('source'))
  })

  // 获取扩展（这个节点扩展了哪些）
  const extensionEdges = props.cy.edges(`[source = "${props.elementId}"][edgeType = "extension"]`)
  const extensions: Array<{ name: string; type: string }> = []
  extensionEdges.forEach(edge => {
    extensions.push({
      name: edge.data('target'),
      type: edge.data('extensionType')
    })
  })

  // 获取被扩展（哪些节点扩展了这个）
  const extendedByEdges = props.cy.edges(`[target = "${props.elementId}"][edgeType = "extension"]`)
  const extendedBy: Array<{ name: string; type: string }> = []
  extendedByEdges.forEach(edge => {
    extendedBy.push({
      name: edge.data('source'),
      type: edge.data('extensionType')
    })
  })

  // 获取接口实现
  const interfaceEdges = props.cy.edges(`[source = "${props.elementId}"][edgeType = "implementation"]`)
  const interfaces: Array<{ name: string; type: string }> = []
  interfaceEdges.forEach(edge => {
    interfaces.push({
      name: edge.data('target'),
      type: edge.data('implementationType')
    })
  })

  // 获取被实现（如果是接口）
  const implementedByEdges = props.cy.edges(`[target = "${props.elementId}"][edgeType = "implementation"]`)
  const implementedBy: Array<{ name: string; type: string }> = []
  implementedByEdges.forEach(edge => {
    implementedBy.push({
      name: edge.data('source'),
      type: edge.data('implementationType')
    })
  })

  nodeInfo.value = {
    id: data.id,
    name: data.label || data.id,
    type: data.type || 'unknown',
    color: data.color || '#999',
    parent,
    children,
    extensions,
    extendedBy,
    interfaces,
    implementedBy
  }
}

// 加载边信息
function loadEdgeInfo() {
  if (!props.cy || !props.elementId) return

  const edge = props.cy.$id(props.elementId)
  if (edge.length === 0) return

  const data = edge.data()
  
  edgeInfo.value = {
    source: data.source,
    target: data.target,
    edgeType: data.edgeType,
    extensionType: data.extensionType,
    implementationType: data.implementationType
  }
}

// 固定
function pin() {
  isPinned.value = true
}

// 取消固定
function unpin() {
  isPinned.value = false
}

// 关闭
function close() {
  emit('close')
}

// 聚焦节点
function focusNode(nodeId: string) {
  emit('focus', nodeId)
}

// 显示嵌套 tooltip
function showNestedTooltip(event: MouseEvent, nodeId: string) {
  if (props.isNested) return // 嵌套 tooltip 不再显示更深层的 tooltip
  
  clearTimeout(hideTimer)
  
  nestedTooltip.value = {
    visible: true,
    elementId: nodeId,
    position: {
      x: event.clientX,
      y: event.clientY
    }
  }
}

// 隐藏嵌套 tooltip
function hideNestedTooltip() {
  if (props.isNested) return
  
  hideTimer = setTimeout(() => {
    nestedTooltip.value.visible = false
  }, 200)
}

// 鼠标进入
function onMouseEnter() {
  clearTimeout(hideTimer)
}

// 鼠标离开
function onMouseLeave() {
  if (!isPinned.value && !props.isNested) {
    hideTimer = setTimeout(() => {
      emit('close')
    }, 300)
  }
}

// 拖动相关函数
function startDrag(event: MouseEvent) {
  if (!isPinned.value) return // 只有固定后才能拖动
  
  event.preventDefault()
  event.stopPropagation()
  
  isDragging.value = true
  
  // 计算鼠标相对于 tooltip 的偏移
  const rect = (event.currentTarget as HTMLElement).parentElement?.getBoundingClientRect()
  if (rect) {
    dragOffset.value = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    }
  }
  
  // 添加全局事件监听
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
}

function onDrag(event: MouseEvent) {
  if (!isDragging.value) return
  
  event.preventDefault()
  
  // 计算新位置
  currentPosition.value = {
    x: event.clientX - dragOffset.value.x,
    y: event.clientY - dragOffset.value.y
  }
}

function stopDrag() {
  isDragging.value = false
  
  // 移除全局事件监听
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
}

// 监听变化
watch(() => [props.visible, props.elementId], () => {
  if (props.visible) {
    loadElementData()
    // 重置位置
    if (!isPinned.value) {
      currentPosition.value = { x: 0, y: 0 }
    }
  }
}, { immediate: true })

onUnmounted(() => {
  clearTimeout(hideTimer)
  // 清理拖动事件监听
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
})
</script>

<style lang="scss" scoped>
.graph-tooltip {
  position: fixed;
  min-width: 300px;
  max-width: 400px;
  background: #ffffff;
  border: 1px solid #e3e5e7;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 10000;
  font-size: 12px;
  overflow: hidden;
}

.graph-tooltip.pinned {
  border-color: #4a9eff;
  box-shadow: 0 4px 16px rgba(74, 158, 255, 0.3);
}

.graph-tooltip.dragging {
  opacity: 0.9;
  cursor: move;
}

.tooltip-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: #f8f9fa;
  border-bottom: 1px solid #e3e5e7;
}

.tooltip-header.draggable {
  cursor: move;
  user-select: none;
}

.tooltip-header.draggable:hover {
  background: #e9ecef;
}

.tooltip-title {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.tooltip-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.tooltip-name {
  font-weight: 600;
  color: #202124;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tooltip-actions {
  display: flex;
  gap: 4px;
}

.action-btn {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.action-btn:hover {
  background: rgba(0, 0, 0, 0.05);
}

.action-btn.pinned {
  color: #4a9eff;
}

.tooltip-content {
  padding: 12px;
  max-height: 500px;
  overflow-y: auto;
}

.info-section {
  margin-bottom: 12px;
}

.info-section:last-child {
  margin-bottom: 0;
}

.section-title {
  font-weight: 600;
  color: #202124;
  margin-bottom: 6px;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-row {
  display: flex;
  align-items: center;
  padding: 4px 0;
  gap: 8px;
}

.info-label {
  font-weight: 500;
  color: #5f6368;
  min-width: 80px;
  flex-shrink: 0;
}

.info-value {
  color: #202124;
  font-family: monospace;
  flex: 1;
}

.type-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  color: #fff;
  font-size: 11px;
  font-weight: 500;
}

.node-link {
  color: #4a9eff;
  cursor: pointer;
  text-decoration: none;
  font-family: monospace;
  transition: all 0.2s;
  padding: 2px 4px;
  border-radius: 3px;
}

.node-link:hover {
  background: #e3f2fd;
  text-decoration: underline;
}

.node-list,
.extension-list,
.interface-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.extension-item,
.interface-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 8px;
  background: #f8f9fa;
  border-radius: 4px;
}

.extension-type,
.interface-type {
  font-size: 10px;
  color: #5f6368;
  background: #e3e5e7;
  padding: 2px 6px;
  border-radius: 3px;
}

/* 滚动条样式 */
.tooltip-content::-webkit-scrollbar {
  width: 6px;
}

.tooltip-content::-webkit-scrollbar-track {
  background: #f8f9fa;
}

.tooltip-content::-webkit-scrollbar-thumb {
  background: #c5cdd5;
  border-radius: 3px;
}

.tooltip-content::-webkit-scrollbar-thumb:hover {
  background: #a8b2bd;
}
</style>

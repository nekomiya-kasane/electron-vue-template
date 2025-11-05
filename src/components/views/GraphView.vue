<template>
  <div class="graph-view">
    <canvas 
      ref="canvasRef" 
      class="graph-canvas"
      @mousedown="handleMouseDown"
      @mousemove="handleMouseMove"
      @mouseup="handleMouseUp"
      @wheel="handleWheel"
    ></canvas>
    <div class="graph-controls">
      <button @click="resetView" class="control-btn" title="重置视图和缩放">🔄 重置</button>
      <button @click="zoomIn" class="control-btn" title="放大">🔍+ 放大</button>
      <button @click="zoomOut" class="control-btn" title="缩小">🔍- 缩小</button>
      <button @click="autoLayout" class="control-btn" title="自动布局">📐 布局</button>
      <button @click="clearGraph" class="control-btn" title="清空图">🗑️ 清空</button>
    </div>
    <div class="graph-stats">
      <div>节点: {{ nodes.length }}</div>
      <div>边: {{ edges.length }}</div>
      <div>缩放: {{ (viewScale * 100).toFixed(0) }}%</div>
      <div v-if="selectedNode">选中: {{ selectedNode.id }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { pluginManager } from '@/core/plugin'

interface GraphNode {
  id: string
  label: string
  x: number
  y: number
  vx: number
  vy: number
  color: string
  highlighted: boolean
  tempHighlighted: boolean
  radius: number
}

interface GraphEdge {
  id: string
  source: string
  target: string
  label?: string
  color: string
  highlighted: boolean
}

defineProps<{
  initialData?: any
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const nodes = ref<GraphNode[]>([])
const edges = ref<GraphEdge[]>([])
const selectedNode = ref<GraphNode | null>(null)

// 视图状态
const viewOffset = ref({ x: 100, y: 300 })
const viewScale = ref(1)
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })
const draggedNode = ref<GraphNode | null>(null)

// 动画
let animationFrameId: number | null = null
let ctx: CanvasRenderingContext2D | null = null

// 初始化画布
function initCanvas() {
  const canvas = canvasRef.value
  if (!canvas) return

  ctx = canvas.getContext('2d')
  if (!ctx) return

  resizeCanvas()
  window.addEventListener('resize', resizeCanvas)

  // 创建示例图
  createSampleGraph()

  // 开始渲染循环
  render()
}

// 调整画布大小
function resizeCanvas() {
  const canvas = canvasRef.value
  if (!canvas) return

  const rect = canvas.getBoundingClientRect()
  canvas.width = rect.width * devicePixelRatio
  canvas.height = rect.height * devicePixelRatio
  
  if (ctx) {
    ctx.scale(devicePixelRatio, devicePixelRatio)
  }
}

// 创建示例图
function createSampleGraph() {
  nodes.value = [
    { id: 'A', label: 'Node A', x: 100, y: -100, vx: 0, vy: 0, color: '#4CAF50', highlighted: false, tempHighlighted: false, radius: 30 },
    { id: 'B', label: 'Node B', x: 300, y: -100, vx: 0, vy: 0, color: '#2196F3', highlighted: false, tempHighlighted: false, radius: 30 },
    { id: 'C', label: 'Node C', x: 200, y: 50, vx: 0, vy: 0, color: '#FF9800', highlighted: false, tempHighlighted: false, radius: 30 },
  ]

  edges.value = [
    { id: 'AB', source: 'A', target: 'B', label: 'edge 1', color: '#666', highlighted: false },
    { id: 'BC', source: 'B', target: 'C', label: 'edge 2', color: '#666', highlighted: false },
    { id: 'CA', source: 'C', target: 'A', label: 'edge 3', color: '#666', highlighted: false },
  ]
}

// 渲染循环
function render() {
  if (!ctx || !canvasRef.value) return

  const canvas = canvasRef.value
  const width = canvas.width / devicePixelRatio
  const height = canvas.height / devicePixelRatio

  // 清空画布
  ctx.clearRect(0, 0, width, height)

  // 绘制网格（最底层）
  drawGrid(ctx, width, height)

  // 应用变换
  ctx.save()
  ctx.translate(viewOffset.value.x, viewOffset.value.y)
  ctx.scale(viewScale.value, viewScale.value)

  // 绘制坐标轴
  drawAxes(ctx!)

  // 绘制边
  edges.value.forEach(edge => {
    const sourceNode = nodes.value.find(n => n.id === edge.source)
    const targetNode = nodes.value.find(n => n.id === edge.target)
    if (!sourceNode || !targetNode) return

    drawEdge(ctx!, sourceNode, targetNode, edge)
  })

  // 绘制节点
  nodes.value.forEach(node => {
    drawNode(ctx!, node)
  })

  ctx.restore()

  animationFrameId = requestAnimationFrame(render)
}

// 绘制网格
function drawGrid(context: CanvasRenderingContext2D, width: number, height: number) {
  context.save()
  context.strokeStyle = '#f0f0f0'
  context.lineWidth = 1

  const gridSize = 50 * viewScale.value
  const offsetX = viewOffset.value.x % gridSize
  const offsetY = viewOffset.value.y % gridSize

  // 垂直线
  for (let x = offsetX; x < width; x += gridSize) {
    context.beginPath()
    context.moveTo(x, 0)
    context.lineTo(x, height)
    context.stroke()
  }

  // 水平线
  for (let y = offsetY; y < height; y += gridSize) {
    context.beginPath()
    context.moveTo(0, y)
    context.lineTo(width, y)
    context.stroke()
  }

  context.restore()
}

// 绘制坐标轴
function drawAxes(context: CanvasRenderingContext2D) {
  context.save()
  
  // X 轴（红色）
  context.strokeStyle = '#ff6b6b'
  context.lineWidth = 2
  context.beginPath()
  context.moveTo(0, 0)
  context.lineTo(500, 0)
  context.stroke()
  
  // X 轴箭头
  context.fillStyle = '#ff6b6b'
  context.beginPath()
  context.moveTo(500, 0)
  context.lineTo(490, -5)
  context.lineTo(490, 5)
  context.closePath()
  context.fill()
  
  // X 轴标签
  context.fillStyle = '#ff6b6b'
  context.font = 'bold 14px sans-serif'
  context.textAlign = 'left'
  context.textBaseline = 'top'
  context.fillText('X', 510, -10)
  
  // Y 轴（绿色）
  context.strokeStyle = '#51cf66'
  context.lineWidth = 2
  context.beginPath()
  context.moveTo(0, 0)
  context.lineTo(0, -500)
  context.stroke()
  
  // Y 轴箭头
  context.fillStyle = '#51cf66'
  context.beginPath()
  context.moveTo(0, -500)
  context.lineTo(-5, -490)
  context.lineTo(5, -490)
  context.closePath()
  context.fill()
  
  // Y 轴标签
  context.fillStyle = '#51cf66'
  context.font = 'bold 14px sans-serif'
  context.textAlign = 'left'
  context.textBaseline = 'bottom'
  context.fillText('Y', 5, -510)
  
  // 原点标记
  context.fillStyle = '#868e96'
  context.beginPath()
  context.arc(0, 0, 4, 0, Math.PI * 2)
  context.fill()
  
  // 原点标签
  context.fillStyle = '#868e96'
  context.font = '12px sans-serif'
  context.textAlign = 'right'
  context.textBaseline = 'top'
  context.fillText('O', -8, 8)
  
  context.restore()
}

// 绘制节点
function drawNode(context: CanvasRenderingContext2D, node: GraphNode) {
  // 高亮光晕
  if (node.highlighted || node.tempHighlighted) {
    context.save()
    const gradient = context.createRadialGradient(node.x, node.y, node.radius, node.x, node.y, node.radius + 10)
    gradient.addColorStop(0, node.tempHighlighted ? 'rgba(255, 255, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)')
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
    context.fillStyle = gradient
    context.beginPath()
    context.arc(node.x, node.y, node.radius + 10, 0, Math.PI * 2)
    context.fill()
    context.restore()
  }

  // 节点圆形
  context.save()
  context.fillStyle = node.color
  context.strokeStyle = node.highlighted ? '#FFD700' : '#fff'
  context.lineWidth = node.highlighted ? 4 : 2
  context.beginPath()
  context.arc(node.x, node.y, node.radius, 0, Math.PI * 2)
  context.fill()
  context.stroke()
  context.restore()

  // 节点标签
  context.save()
  context.fillStyle = '#fff'
  context.font = 'bold 14px sans-serif'
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.fillText(node.label, node.x, node.y)
  context.restore()
}

// 绘制边（带箭头）
function drawEdge(context: CanvasRenderingContext2D, source: GraphNode, target: GraphNode, edge: GraphEdge) {
  const dx = target.x - source.x
  const dy = target.y - source.y
  const angle = Math.atan2(dy, dx)

  // 计算起点和终点（考虑节点半径）
  const startX = source.x + Math.cos(angle) * source.radius
  const startY = source.y + Math.sin(angle) * source.radius
  const endX = target.x - Math.cos(angle) * target.radius
  const endY = target.y - Math.sin(angle) * target.radius

  context.save()
  context.strokeStyle = edge.highlighted ? '#FFD700' : edge.color
  context.lineWidth = edge.highlighted ? 3 : 2
  context.fillStyle = edge.highlighted ? '#FFD700' : edge.color

  // 绘制线
  context.beginPath()
  context.moveTo(startX, startY)
  context.lineTo(endX, endY)
  context.stroke()

  // 绘制箭头
  const arrowSize = 10
  context.beginPath()
  context.moveTo(endX, endY)
  context.lineTo(
    endX - arrowSize * Math.cos(angle - Math.PI / 6),
    endY - arrowSize * Math.sin(angle - Math.PI / 6)
  )
  context.lineTo(
    endX - arrowSize * Math.cos(angle + Math.PI / 6),
    endY - arrowSize * Math.sin(angle + Math.PI / 6)
  )
  context.closePath()
  context.fill()

  // 绘制边标签
  if (edge.label) {
    const midX = (startX + endX) / 2
    const midY = (startY + endY) / 2
    context.fillStyle = '#fff'
    context.font = '12px sans-serif'
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    
    // 背景
    const metrics = context.measureText(edge.label)
    context.fillStyle = 'rgba(255, 255, 255, 0.95)'
    context.strokeStyle = '#e3e5e7'
    context.lineWidth = 1
    context.strokeRect(midX - metrics.width / 2 - 4, midY - 8, metrics.width + 8, 16)
    context.fillRect(midX - metrics.width / 2 - 4, midY - 8, metrics.width + 8, 16)
    
    context.fillStyle = '#202124'
    context.fillText(edge.label, midX, midY)
  }

  context.restore()
}

// 鼠标事件处理
function handleMouseDown(e: MouseEvent) {
  const rect = canvasRef.value?.getBoundingClientRect()
  if (!rect) return

  const x = (e.clientX - rect.left - viewOffset.value.x) / viewScale.value
  const y = (e.clientY - rect.top - viewOffset.value.y) / viewScale.value

  // 检查是否点击了节点
  const clickedNode = nodes.value.find(node => {
    const dx = x - node.x
    const dy = y - node.y
    return Math.sqrt(dx * dx + dy * dy) <= node.radius
  })

  if (clickedNode) {
    draggedNode.value = clickedNode
    selectedNode.value = clickedNode
    dragStart.value = { x: e.clientX, y: e.clientY }
  } else {
    isDragging.value = true
    dragStart.value = { x: e.clientX, y: e.clientY }
    selectedNode.value = null
  }
}

function handleMouseMove(e: MouseEvent) {
  const rect = canvasRef.value?.getBoundingClientRect()
  if (!rect) return

  if (draggedNode.value) {
    // 拖动节点
    const dx = (e.clientX - dragStart.value.x) / viewScale.value
    const dy = (e.clientY - dragStart.value.y) / viewScale.value
    draggedNode.value.x += dx
    draggedNode.value.y += dy
    dragStart.value = { x: e.clientX, y: e.clientY }
  } else if (isDragging.value) {
    // 拖动视图
    const dx = e.clientX - dragStart.value.x
    const dy = e.clientY - dragStart.value.y
    viewOffset.value.x += dx
    viewOffset.value.y += dy
    dragStart.value = { x: e.clientX, y: e.clientY }
  } else {
    // 悬停高亮
    const x = (e.clientX - rect.left - viewOffset.value.x) / viewScale.value
    const y = (e.clientY - rect.top - viewOffset.value.y) / viewScale.value

    nodes.value.forEach(node => {
      const dx = x - node.x
      const dy = y - node.y
      node.tempHighlighted = Math.sqrt(dx * dx + dy * dy) <= node.radius
    })
  }
}

function handleMouseUp() {
  isDragging.value = false
  draggedNode.value = null
}

function handleWheel(e: WheelEvent) {
  e.preventDefault()
  const delta = e.deltaY * -0.001
  viewScale.value = Math.max(0.1, Math.min(3, viewScale.value + delta))
}

// 控制函数
function resetView() {
  viewOffset.value = { x: 100, y: 300 }
  viewScale.value = 1
}

function zoomIn() {
  viewScale.value = Math.min(3, viewScale.value + 0.1)
}

function zoomOut() {
  viewScale.value = Math.max(0.1, viewScale.value - 0.1)
}

function autoLayout() {
  // 简单的力导向布局
  const canvas = canvasRef.value
  if (!canvas) return

  const centerX = canvas.width / devicePixelRatio / 2
  const centerY = canvas.height / devicePixelRatio / 2
  const radius = 150

  nodes.value.forEach((node, index) => {
    const angle = (index / nodes.value.length) * Math.PI * 2
    node.x = centerX + Math.cos(angle) * radius
    node.y = centerY + Math.sin(angle) * radius
  })
}

function clearGraph() {
  nodes.value = []
  edges.value = []
  selectedNode.value = null
}

// 添加节点
function addNode(id: string, label: string, color: string = '#4CAF50') {
  const canvas = canvasRef.value
  if (!canvas) return

  const existing = nodes.value.find(n => n.id === id)
  if (existing) {
    // 临时高亮已存在的节点
    existing.tempHighlighted = true
    setTimeout(() => {
      existing.tempHighlighted = false
    }, 1000)
    return
  }

  const centerX = canvas.width / devicePixelRatio / 2
  const centerY = canvas.height / devicePixelRatio / 2

  nodes.value.push({
    id,
    label,
    x: centerX + (Math.random() - 0.5) * 200,
    y: centerY + (Math.random() - 0.5) * 200,
    vx: 0,
    vy: 0,
    color,
    highlighted: false,
    tempHighlighted: false,
    radius: 30
  })
}

// 添加边
function addEdge(id: string, source: string, target: string, label?: string, color: string = '#666') {
  const existing = edges.value.find(e => e.id === id)
  if (existing) return

  edges.value.push({
    id,
    source,
    target,
    label,
    color,
    highlighted: false
  })
}

// 高亮节点
function highlightNode(id: string, highlight: boolean = true) {
  const node = nodes.value.find(n => n.id === id)
  if (node) {
    node.highlighted = highlight
  }
}

// 临时高亮节点
function tempHighlightNode(id: string, duration: number = 1000) {
  const node = nodes.value.find(n => n.id === id)
  if (node) {
    node.tempHighlighted = true
    setTimeout(() => {
      node.tempHighlighted = false
    }, duration)
  }
}

// 高亮边
function highlightEdge(id: string, highlight: boolean = true) {
  const edge = edges.value.find(e => e.id === id)
  if (edge) {
    edge.highlighted = highlight
  }
}

// 处理数据包
function handleDataPacket(packet: any) {
  if (packet.type !== 'QI') return

  console.log('[GraphView] Received QI packet:', packet)

  // 根据数据包内容更新图
  if (packet.action === 'addNode') {
    addNode(packet.id, packet.label || packet.id, packet.color)
  } else if (packet.action === 'addEdge') {
    addEdge(packet.id, packet.source, packet.target, packet.label, packet.color)
  } else if (packet.action === 'highlight') {
    highlightNode(packet.nodeId, true)
  } else if (packet.action === 'unhighlight') {
    highlightNode(packet.nodeId, false)
  } else if (packet.action === 'tempHighlight') {
    tempHighlightNode(packet.nodeId, packet.duration)
  } else if (packet.action === 'highlightEdge') {
    highlightEdge(packet.edgeId, true)
  }
}

// 监听数据包
onMounted(() => {
  initCanvas()

  // 监听 QI 数据包
  const eventBus = pluginManager.getEventBus()
  eventBus.on('data:packet', handleDataPacket)
  
  console.log('[GraphView] Mounted and listening for QI packets')
})

onUnmounted(() => {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId)
  }

  window.removeEventListener('resize', resizeCanvas)

  // 取消监听
  const eventBus = pluginManager.getEventBus()
  eventBus.off('data:packet', handleDataPacket)
})

// 暴露方法给外部
defineExpose({
  addNode,
  addEdge,
  highlightNode,
  tempHighlightNode,
  highlightEdge,
  clearGraph,
  autoLayout
})
</script>

<style scoped>
.graph-view {
  position: relative;
  width: 100%;
  height: 100%;
  background: #ffffff;
  overflow: hidden;
}

.graph-canvas {
  width: 100%;
  height: 100%;
  display: block;
  cursor: grab;
}

.graph-canvas:active {
  cursor: grabbing;
}

.graph-controls {
  position: absolute;
  top: 16px;
  left: 16px;
  display: flex;
  gap: 8px;
}

.control-btn {
  padding: 8px 16px;
  background: #fff;
  backdrop-filter: blur(10px);
  border: 1px solid #e3e5e7;
  border-radius: 6px;
  color: #202124;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.control-btn:hover {
  background: #f0f4f8;
  border-color: #c5cdd5;
}

.graph-stats {
  position: absolute;
  top: 16px;
  right: 16px;
  padding: 12px 16px;
  background: #fff;
  backdrop-filter: blur(10px);
  border: 1px solid #e3e5e7;
  border-radius: 8px;
  color: #202124;
  font-size: 12px;
  line-height: 1.6;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
</style>

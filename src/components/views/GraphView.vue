<template>
  <div class="graph-view">
    <canvas ref="gridCanvas" class="grid-canvas"></canvas>
    <div ref="cyContainer" class="cy-container"></div>
    <!-- 悬浮工具栏 -->
    <div class="floating-toolbar">
      <div class="toolbar-section">
        <button @click="resetView" class="toolbar-btn" title="重置视图">
          <span class="icon">🔄</span>
        </button>
        <button @click="zoomIn" class="toolbar-btn" title="放大">
          <span class="icon">🔍+</span>
        </button>
        <button @click="zoomOut" class="toolbar-btn" title="缩小">
          <span class="icon">🔍-</span>
        </button>
        <button @click="fitView" class="toolbar-btn" title="适应视图">
          <span class="icon">📏</span>
        </button>
      </div>
      
      <div class="toolbar-divider"></div>
      
      <div class="toolbar-section">
        <select v-model="selectedLayout" @change="applyLayout" class="toolbar-select" title="选择布局">
          <option value="dagre">📊 层次</option>
          <option value="circle">⭕ 圆形</option>
          <option value="cola">🧲 力导向</option>
          <option value="grid">🔲 网格</option>
          <option value="concentric">🎯 同心圆</option>
          <option value="breadthfirst">🌳 BFS</option>
          <option value="cose">🌀 CoSE</option>
        </select>
        <button @click="undoLayout" :disabled="!canUndo" class="toolbar-btn" title="撤销布局">
          <span class="icon">↩️</span>
        </button>
        <button @click="redoLayout" :disabled="!canRedo" class="toolbar-btn" title="重做布局">
          <span class="icon">↪️</span>
        </button>
      </div>
      
      <div class="toolbar-divider"></div>
      
      <div class="toolbar-section">
        <button @click="clearGraph" class="toolbar-btn" title="清空图">
          <span class="icon">🗑️</span>
        </button>
      </div>
    </div>
    <div class="graph-stats">
      <div>节点: {{ nodeCount }}</div>
      <div>边: {{ edgeCount }}</div>
      <div>缩放: {{ zoomLevel }}%</div>
      <div v-if="selectedNodeId">选中: {{ selectedNodeId }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { pluginManager } from '@/core/plugin'
import cytoscape, { type Core } from 'cytoscape'
// @ts-ignore
import dagre from 'cytoscape-dagre'
// @ts-ignore
import cola from 'cytoscape-cola'

// 注册布局插件
cytoscape.use(dagre)
cytoscape.use(cola)

defineProps<{
  initialData?: any
}>()

const cyContainer = ref<HTMLDivElement | null>(null)
const gridCanvas = ref<HTMLCanvasElement | null>(null)
let cy: Core | null = null
let gridCtx: CanvasRenderingContext2D | null = null

// 状态
const nodeCount = ref(0)
const edgeCount = ref(0)
const zoomLevel = ref(100)
const selectedNodeId = ref<string | null>(null)
const selectedLayout = ref('dagre')

// 布局历史记录
interface LayoutSnapshot {
  positions: { [key: string]: { x: number; y: number } }
  layout: string
  timestamp: number
}

const layoutHistory = ref<LayoutSnapshot[]>([])
const historyIndex = ref(-1)
const canUndo = ref(false)
const canRedo = ref(false)

// 初始化 Cytoscape
function initCytoscape() {
  if (!cyContainer.value) return

  cy = cytoscape({
    container: cyContainer.value,
    
    style: [
      // 节点样式
      {
        selector: 'node',
        style: {
          'background-color': 'data(color)',
          'label': 'data(label)',
          'width': 60,
          'height': 60,
          'font-size': 14,
          'text-valign': 'center',
          'text-halign': 'center',
          'color': '#202124',
          'text-outline-width': 2,
          'text-outline-color': '#fff',
          'border-width': 2,
          'border-color': '#e3e5e7'
        }
      },
      // 选中节点
      {
        selector: 'node:selected',
        style: {
          'border-width': 4,
          'border-color': '#4a9eff',
          'background-color': '#e3f2fd'
        }
      },
      // 高亮节点
      {
        selector: 'node.highlighted',
        style: {
          'border-width': 4,
          'border-color': '#FFD700'
        } as any
      },
      // 临时高亮节点
      {
        selector: 'node.temp-highlighted',
        style: {
          'background-color': '#FFF9C4'
        } as any
      },
      // 边样式
      {
        selector: 'edge',
        style: {
          'width': 3,
          'line-color': 'data(color)',
          'target-arrow-color': 'data(color)',
          'target-arrow-shape': 'triangle',
          'curve-style': 'bezier',
          'label': 'data(label)',
          'font-size': 12,
          'text-rotation': 'autorotate',
          'text-margin-y': -10,
          'color': '#5f6368',
          'text-background-color': '#fff',
          'text-background-opacity': 0.9,
          'text-background-padding': '3px',
          'text-border-width': 1,
          'text-border-color': '#e3e5e7',
          'text-border-opacity': 1
        }
      },
      // 高亮边
      {
        selector: 'edge.highlighted',
        style: {
          'width': 5,
          'line-color': '#FFD700',
          'target-arrow-color': '#FFD700'
        }
      }
    ],

    elements: [],
    
    layout: {
      name: 'dagre'
    } as any,

    // 交互设置
    minZoom: 0.1,
    maxZoom: 3,
    wheelSensitivity: 0.5  // 增加滚轮灵敏度
  })

  // 事件监听
  cy.on('select', 'node', (evt) => {
    const node = evt.target
    selectedNodeId.value = node.id()
    pluginManager.getEventBus().emit('graph:nodeSelected', node.id())
  })

  cy.on('unselect', 'node', () => {
    selectedNodeId.value = null
  })

  cy.on('tap', 'node', (evt) => {
    const node = evt.target
    pluginManager.getEventBus().emit('graph:nodeTapped', node.id())
  })

  cy.on('zoom', () => {
    updateZoomLevel()
    drawGrid()
  })

  cy.on('pan', () => {
    drawGrid()
  })

  // 更新统计
  updateStats()

  // 初始化网格
  initGrid()

  // 创建示例图
  createSampleGraph()
  
  // 保存初始布局
  saveLayoutSnapshot('dagre')
}

// 初始化网格
function initGrid() {
  if (!gridCanvas.value) return
  
  const canvas = gridCanvas.value
  const dpr = window.devicePixelRatio || 1
  
  // 设置画布大小
  const rect = canvas.getBoundingClientRect()
  canvas.width = rect.width * dpr
  canvas.height = rect.height * dpr
  
  gridCtx = canvas.getContext('2d')
  if (gridCtx) {
    gridCtx.scale(dpr, dpr)
  }
  
  // 监听窗口大小变化
  window.addEventListener('resize', () => {
    if (!gridCanvas.value || !gridCtx) return
    const rect = gridCanvas.value.getBoundingClientRect()
    gridCanvas.value.width = rect.width * dpr
    gridCanvas.value.height = rect.height * dpr
    gridCtx.scale(dpr, dpr)
    drawGrid()
  })
  
  drawGrid()
}

// 绘制网格和坐标标尺
function drawGrid() {
  if (!gridCanvas.value || !gridCtx || !cy) return
  
  const canvas = gridCanvas.value
  const ctx = gridCtx
  const rect = canvas.getBoundingClientRect()
  const width = rect.width
  const height = rect.height
  
  // 清空画布
  ctx.clearRect(0, 0, width, height)
  
  // 获取 Cytoscape 的平移和缩放
  const pan = cy.pan()
  const zoom = cy.zoom()
  
  // 网格大小（根据缩放调整）
  const baseGridSize = 50
  const gridSize = baseGridSize * zoom
  
  // 计算网格起始位置
  const offsetX = pan.x % gridSize
  const offsetY = pan.y % gridSize
  
  // 绘制网格线
  ctx.strokeStyle = '#f0f0f0'
  ctx.lineWidth = 1
  
  // 垂直线
  for (let x = offsetX; x < width; x += gridSize) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, height)
    ctx.stroke()
  }
  
  // 水平线
  for (let y = offsetY; y < height; y += gridSize) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(width, y)
    ctx.stroke()
  }
  
  // 绘制坐标轴（原点位置）
  const originX = pan.x
  const originY = pan.y
  
  // X 轴（红色）
  if (originY >= 0 && originY <= height) {
    ctx.strokeStyle = '#ff6b6b'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(0, originY)
    ctx.lineTo(width, originY)
    ctx.stroke()
    
    // X 轴标尺刻度
    ctx.fillStyle = '#ff6b6b'
    ctx.font = '10px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    
    const xStep = baseGridSize * zoom
    for (let x = originX; x < width; x += xStep) {
      if (x > 0) {
        const value = Math.round((x - originX) / zoom)
        ctx.fillText(value.toString(), x, originY + 4)
        // 刻度线
        ctx.beginPath()
        ctx.moveTo(x, originY - 3)
        ctx.lineTo(x, originY + 3)
        ctx.stroke()
      }
    }
    for (let x = originX - xStep; x > 0; x -= xStep) {
      const value = Math.round((x - originX) / zoom)
      ctx.fillText(value.toString(), x, originY + 4)
      // 刻度线
      ctx.beginPath()
      ctx.moveTo(x, originY - 3)
      ctx.lineTo(x, originY + 3)
      ctx.stroke()
    }
  }
  
  // Y 轴（绿色）
  if (originX >= 0 && originX <= width) {
    ctx.strokeStyle = '#51cf66'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(originX, 0)
    ctx.lineTo(originX, height)
    ctx.stroke()
    
    // Y 轴标尺刻度
    ctx.fillStyle = '#51cf66'
    ctx.font = '10px sans-serif'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    
    const yStep = baseGridSize * zoom
    for (let y = originY; y < height; y += yStep) {
      if (y > 0) {
        const value = Math.round((originY - y) / zoom)
        ctx.fillText(value.toString(), originX + 4, y)
        // 刻度线
        ctx.beginPath()
        ctx.moveTo(originX - 3, y)
        ctx.lineTo(originX + 3, y)
        ctx.stroke()
      }
    }
    for (let y = originY - yStep; y > 0; y -= yStep) {
      const value = Math.round((originY - y) / zoom)
      ctx.fillText(value.toString(), originX + 4, y)
      // 刻度线
      ctx.beginPath()
      ctx.moveTo(originX - 3, y)
      ctx.lineTo(originX + 3, y)
      ctx.stroke()
    }
  }
  
  // 原点标记
  if (originX >= 0 && originX <= width && originY >= 0 && originY <= height) {
    ctx.fillStyle = '#868e96'
    ctx.beginPath()
    ctx.arc(originX, originY, 4, 0, Math.PI * 2)
    ctx.fill()
    
    // 原点标签
    ctx.fillStyle = '#868e96'
    ctx.font = 'bold 12px sans-serif'
    ctx.textAlign = 'right'
    ctx.textBaseline = 'bottom'
    ctx.fillText('O (0,0)', originX - 8, originY - 8)
  }
}

// 更新统计信息
function updateStats() {
  if (!cy) return
  nodeCount.value = cy.nodes().length
  edgeCount.value = cy.edges().length
}

// 更新缩放级别
function updateZoomLevel() {
  if (!cy) return
  zoomLevel.value = Math.round(cy.zoom() * 100)
}

// 创建示例图
function createSampleGraph() {
  if (!cy) return

  cy.add([
    // 节点
    { data: { id: 'A', label: 'Node A', color: '#4CAF50' } },
    { data: { id: 'B', label: 'Node B', color: '#2196F3' } },
    { data: { id: 'C', label: 'Node C', color: '#FF9800' } },
    
    // 边
    { data: { id: 'AB', source: 'A', target: 'B', label: 'edge 1', color: '#666' } },
    { data: { id: 'BC', source: 'B', target: 'C', label: 'edge 2', color: '#666' } },
    { data: { id: 'CA', source: 'C', target: 'A', label: 'edge 3', color: '#666' } }
  ])

  // 应用布局
  const layout: any = { name: 'dagre', rankDir: 'TB', nodeSep: 50, rankSep: 100 }
  cy.layout(layout).run()
  
  updateStats()
}

// 控制函数
function resetView() {
  if (!cy) return
  cy.reset()
  cy.fit()
  updateZoomLevel()
}

function zoomIn() {
  if (!cy) return
  cy.zoom(cy.zoom() * 1.2)
  cy.center()
  updateZoomLevel()
}

function zoomOut() {
  if (!cy) return
  cy.zoom(cy.zoom() * 0.8)
  cy.center()
  updateZoomLevel()
}

function fitView() {
  if (!cy) return
  cy.fit(undefined, 50)
  updateZoomLevel()
}

// 保存布局快照
function saveLayoutSnapshot(layoutName: string) {
  if (!cy) return
  
  const positions: { [key: string]: { x: number; y: number } } = {}
  cy.nodes().forEach(node => {
    const pos = node.position()
    positions[node.id()] = { x: pos.x, y: pos.y }
  })
  
  const snapshot: LayoutSnapshot = {
    positions,
    layout: layoutName,
    timestamp: Date.now()
  }
  
  // 删除当前索引之后的历史
  layoutHistory.value = layoutHistory.value.slice(0, historyIndex.value + 1)
  
  // 添加新快照
  layoutHistory.value.push(snapshot)
  historyIndex.value = layoutHistory.value.length - 1
  
  // 限制历史记录数量
  if (layoutHistory.value.length > 50) {
    layoutHistory.value.shift()
    historyIndex.value--
  }
  
  updateHistoryButtons()
}

// 恢复布局快照
function restoreLayoutSnapshot(snapshot: LayoutSnapshot) {
  if (!cy) return
  
  cy.nodes().forEach(node => {
    const pos = snapshot.positions[node.id()]
    if (pos) {
      node.position(pos)
    }
  })
  
  selectedLayout.value = snapshot.layout
}

// 更新历史按钮状态
function updateHistoryButtons() {
  canUndo.value = historyIndex.value > 0
  canRedo.value = historyIndex.value < layoutHistory.value.length - 1
}

// 撤销布局
function undoLayout() {
  if (!canUndo.value || historyIndex.value <= 0) return
  
  historyIndex.value--
  const snapshot = layoutHistory.value[historyIndex.value]
  restoreLayoutSnapshot(snapshot)
  updateHistoryButtons()
}

// 重做布局
function redoLayout() {
  if (!canRedo.value || historyIndex.value >= layoutHistory.value.length - 1) return
  
  historyIndex.value++
  const snapshot = layoutHistory.value[historyIndex.value]
  restoreLayoutSnapshot(snapshot)
  updateHistoryButtons()
}

// 应用布局
function applyLayout() {
  if (!cy) return
  
  const layoutName = selectedLayout.value
  let layoutOptions: any = {
    name: layoutName,
    animate: true,
    animationDuration: 500,
    fit: true,
    padding: 50
  }
  
  // 根据不同布局类型设置特定参数
  switch (layoutName) {
    case 'dagre':
      layoutOptions = {
        ...layoutOptions,
        rankDir: 'TB',
        nodeSep: 50,
        rankSep: 100
      }
      break
    
    case 'circle':
      layoutOptions = {
        ...layoutOptions,
        radius: 200,
        startAngle: 0,
        sweep: 2 * Math.PI
      }
      break
    
    case 'cola':
      layoutOptions = {
        ...layoutOptions,
        nodeSpacing: 50,
        edgeLength: 100,
        randomize: false
      }
      break
    
    case 'grid':
      layoutOptions = {
        ...layoutOptions,
        rows: undefined,
        cols: undefined,
        position: (node: any) => node.position()
      }
      break
    
    case 'concentric':
      layoutOptions = {
        ...layoutOptions,
        concentric: (node: any) => node.degree(),
        levelWidth: () => 2,
        minNodeSpacing: 50
      }
      break
    
    case 'breadthfirst':
      layoutOptions = {
        ...layoutOptions,
        directed: true,
        spacingFactor: 1.5,
        grid: false
      }
      break
    
    case 'cose':
      layoutOptions = {
        ...layoutOptions,
        nodeRepulsion: 400000,
        idealEdgeLength: 100,
        edgeElasticity: 100,
        nestingFactor: 5,
        gravity: 80,
        numIter: 1000,
        initialTemp: 200,
        coolingFactor: 0.95,
        minTemp: 1.0
      }
      break
  }
  
  const layout = cy.layout(layoutOptions)
  
  // 布局完成后保存快照
  layout.on('layoutstop', () => {
    saveLayoutSnapshot(layoutName)
    fitView()
  })
  
  layout.run()
}

function clearGraph() {
  if (!cy) return
  cy.elements().remove()
  selectedNodeId.value = null
  updateStats()
}

// 添加节点
function addNode(id: string, label: string, color: string = '#4CAF50') {
  if (!cy) return
  
  const existingNode = cy.getElementById(id)
  if (existingNode.length > 0) {
    console.warn(`Node ${id} already exists`)
    return
  }

  cy.add({ data: { id, label, color } })
  updateStats()
  
  pluginManager.getEventBus().emit('graph:nodeAdded', { id, label, color })
}

// 添加边
function addEdge(id: string, source: string, target: string, label?: string, color: string = '#666') {
  if (!cy) return
  
  const existingEdge = cy.getElementById(id)
  if (existingEdge.length > 0) {
    console.warn(`Edge ${id} already exists`)
    return
  }

  cy.add({ data: { id, source, target, label, color } })
  updateStats()
  
  pluginManager.getEventBus().emit('graph:edgeAdded', { id, source, target, label, color })
}

// 高亮节点
function highlightNode(nodeId: string) {
  if (!cy) return
  const node = cy.getElementById(nodeId)
  if (node.length > 0) {
    node.addClass('highlighted')
    pluginManager.getEventBus().emit('graph:highlighted', nodeId)
  }
}

// 临时高亮节点
function tempHighlightNode(nodeId: string, duration: number = 2000) {
  if (!cy) return
  const node = cy.getElementById(nodeId)
  if (node.length > 0) {
    node.addClass('temp-highlighted')
    setTimeout(() => {
      node.removeClass('temp-highlighted')
    }, duration)
  }
}

// 高亮边
function highlightEdge(edgeId: string) {
  if (!cy) return
  const edge = cy.getElementById(edgeId)
  if (edge.length > 0) {
    edge.addClass('highlighted')
  }
}

// 监听数据包
function handleDataPacket(packet: any) {
  if (packet.type !== 'QI') return

  console.log('[GraphView] Received QI packet:', packet)

  switch (packet.action) {
    case 'addNode':
      if (packet.id) {
        addNode(packet.id, packet.label || packet.id, packet.color || '#4CAF50')
      }
      break
    
    case 'addEdge':
      if (packet.id && packet.source && packet.target) {
        addEdge(packet.id, packet.source, packet.target, packet.label, packet.color || '#666')
      }
      break
    
    case 'highlight':
      if (packet.nodeId) {
        highlightNode(packet.nodeId)
      }
      break
    
    case 'tempHighlight':
      if (packet.nodeId) {
        tempHighlightNode(packet.nodeId, packet.duration || 2000)
      }
      break
    
    case 'highlightEdge':
      if (packet.edgeId) {
        highlightEdge(packet.edgeId)
      }
      break
  }
}

// 生命周期
onMounted(() => {
  initCytoscape()
  
  // 监听数据包
  const eventBus = pluginManager.getEventBus()
  eventBus.on('data:packet', handleDataPacket)
})

onUnmounted(() => {
  const eventBus = pluginManager.getEventBus()
  eventBus.off('data:packet', handleDataPacket)
  
  if (cy) {
    cy.destroy()
  }
})

// 暴露方法供外部调用
defineExpose({
  addNode,
  addEdge,
  highlightNode,
  tempHighlightNode,
  highlightEdge,
  clearGraph,
  resetView,
  fitView
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

.grid-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}

.cy-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

/* 悬浮工具栏 */
.floating-toolbar {
  position: absolute;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 0;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid #e3e5e7;
  border-radius: 12px;
  padding: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 10;
  transition: all 0.3s ease;
}

.floating-toolbar:hover {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

.toolbar-section {
  display: flex;
  align-items: center;
  gap: 4px;
}

.toolbar-divider {
  width: 1px;
  height: 24px;
  background: #e3e5e7;
  margin: 0 8px;
}

.toolbar-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.toolbar-btn .icon {
  font-size: 18px;
  line-height: 1;
}

.toolbar-btn:hover:not(:disabled) {
  background: rgba(0, 0, 0, 0.05);
}

.toolbar-btn:active:not(:disabled) {
  background: rgba(0, 0, 0, 0.1);
  transform: scale(0.95);
}

.toolbar-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.toolbar-select {
  padding: 6px 12px;
  background: transparent;
  border: 1px solid #e3e5e7;
  border-radius: 8px;
  color: #202124;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 120px;
  height: 36px;
}

.toolbar-select:hover {
  background: rgba(0, 0, 0, 0.03);
  border-color: #c5cdd5;
}

.toolbar-select:focus {
  outline: none;
  border-color: #4a9eff;
  background: rgba(74, 158, 255, 0.05);
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
  z-index: 10;
}
</style>

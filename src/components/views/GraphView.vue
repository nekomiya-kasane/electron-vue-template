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
        <button @click="showEdgeStylePanel = !showEdgeStylePanel" class="toolbar-btn" title="边样式设置">
          <span class="icon">🎨</span>
        </button>
        <button @click="forceRerender" class="toolbar-btn" title="重新渲染图">
          <span class="icon">🔃</span>
        </button>
        <button @click="clearGraph" class="toolbar-btn" title="清空图">
          <span class="icon">🗑️</span>
        </button>
      </div>

      <div class="toolbar-divider"></div>

      <div class="toolbar-section">
        <button 
          @click="toggleSocketServer" 
          :class="['toolbar-btn', { active: socketIsRunning }]" 
          :title="socketIsRunning ? '停止 Socket 服务器' : '启动 Socket 服务器'"
        >
          <span class="icon">{{ socketIsRunning ? '🟢' : '🔴' }}</span>
        </button>
        <span v-if="socketIsRunning" class="socket-info" title="活动会话数">
          {{ socketSessions.length }}
        </span>
        <button 
          v-if="socketIsRunning"
          @click="toggleSocketAutoLayout" 
          :class="['toolbar-btn', { active: socketAutoLayout }]" 
          :title="socketAutoLayout ? '关闭自动布局' : '开启自动布局'"
        >
          <span class="icon">{{ socketAutoLayout ? '🔄' : '⏸️' }}</span>
        </button>
      </div>
    </div>

    <!-- 边样式设置面板 -->
    <div v-if="showEdgeStylePanel" class="edge-style-panel">
      <div class="panel-header">
        <h3>边样式设置</h3>
        <button @click="showEdgeStylePanel = false" class="close-btn">✕</button>
      </div>
      <div class="panel-content">
        <div class="style-group">
          <label>线宽</label>
          <input 
            type="range" 
            v-model.number="defaultEdgeStyle.width" 
            min="1" 
            max="10" 
            step="0.5"
            @input="applyEdgeStyle"
          />
          <span class="value">{{ defaultEdgeStyle.width }}px</span>
        </div>

        <div class="style-group">
          <label>颜色</label>
          <input 
            type="color" 
            v-model="defaultEdgeStyle.color"
            @input="applyEdgeStyle"
          />
          <span class="value">{{ defaultEdgeStyle.color }}</span>
        </div>

        <div class="style-group">
          <label>箭头形状</label>
          <select v-model="defaultEdgeStyle.arrowShape" @change="applyEdgeStyle">
            <option value="triangle">三角形</option>
            <option value="triangle-tee">三角形-T</option>
            <option value="circle-triangle">圆-三角</option>
            <option value="triangle-cross">三角形-十字</option>
            <option value="triangle-backcurve">三角形-弧</option>
            <option value="vee">V形</option>
            <option value="tee">T形</option>
            <option value="square">方形</option>
            <option value="circle">圆形</option>
            <option value="diamond">菱形</option>
            <option value="chevron">箭头</option>
            <option value="none">无</option>
          </select>
        </div>

        <div class="style-group">
          <label>曲线样式</label>
          <select v-model="defaultEdgeStyle.curveStyle" @change="applyEdgeStyle">
            <option value="bezier">贝塞尔曲线</option>
            <option value="straight">直线</option>
            <option value="segments">折线</option>
            <option value="taxi">出租车路径</option>
          </select>
        </div>

        <div class="style-group">
          <label>线条样式</label>
          <select v-model="defaultEdgeStyle.lineStyle" @change="applyEdgeStyle">
            <option value="solid">实线</option>
            <option value="dotted">点线</option>
            <option value="dashed">虚线</option>
          </select>
        </div>

        <div class="style-group">
          <label>不透明度</label>
          <input 
            type="range" 
            v-model.number="defaultEdgeStyle.opacity" 
            min="0" 
            max="1" 
            step="0.1"
            @input="applyEdgeStyle"
          />
          <span class="value">{{ Math.round(defaultEdgeStyle.opacity * 100) }}%</span>
        </div>

        <div class="panel-actions">
          <button @click="resetEdgeStyle" class="action-btn">重置默认</button>
          <button @click="applyToSelectedEdge" class="action-btn primary" :disabled="!selectedEdgeId">
            应用到选中边
          </button>
        </div>
      </div>
    </div>

    <div class="graph-stats">
      <div>节点: {{ nodeCount }}</div>
      <div>边: {{ edgeCount }}</div>
      <div>缩放: {{ zoomLevel }}%</div>
      <div v-if="selectedNodeId">选中节点: {{ selectedNodeId }}</div>
      <div v-if="selectedEdgeId">选中边: {{ selectedEdgeId }}</div>
    </div>

    <!-- Tooltip -->
    <GraphTooltip
      :visible="tooltip.visible"
      :element-id="tooltip.elementId"
      :element-type="tooltip.elementType"
      :position="tooltip.position"
      :cy="cyRef"
      @close="hideTooltip"
      @focus="focusNode"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { pluginManager } from '@/core/plugin'
import cytoscape, { type Core } from 'cytoscape'
// @ts-ignore
import dagre from 'cytoscape-dagre'
// @ts-ignore
import cola from 'cytoscape-cola'
import { useGraphSocket } from './useGraphSocket'
import GraphTooltip from './GraphTooltip.vue'

// 注册布局插件
cytoscape.use(dagre)
cytoscape.use(cola)

defineProps<{
  initialData?: any
}>()

const cyContainer = ref<HTMLDivElement | null>(null)
const gridCanvas = ref<HTMLCanvasElement | null>(null)
const cyRef = ref<Core | null>(null)
let cy: Core | null = null
let gridCtx: CanvasRenderingContext2D | null = null

// Socket 集成
const {
  isRunning: socketIsRunning,
  sessions: socketSessions,
  autoLayout: socketAutoLayout,
  layoutName: socketLayoutName,
  start: startSocket,
  stop: stopSocket,
  updateCytoscape,
  toggleAutoLayout,
  setLayoutName: setSocketLayoutName,
  runLayout: runSocketLayout
} = useGraphSocket(cyRef, {
  port: 8080,
  host: '0.0.0.0',
  autoStart: false,
  autoLayout: true,
  layoutName: 'dagre'
})

// 状态
const nodeCount = ref(0)
const edgeCount = ref(0)
const zoomLevel = ref(100)
const selectedNodeId = ref<string | null>(null)
const selectedEdgeId = ref<string | null>(null)
const selectedLayout = ref('cose')  // 使用 CoSE 布局，节点分布更均匀

// Tooltip 状态
const tooltip = ref({
  visible: false,
  elementId: '',
  elementType: 'node' as 'node' | 'edge',
  position: { x: 0, y: 0 }
})

let tooltipHideTimer: any = null

// 边样式配置
interface EdgeStyle {
  width: number
  color: string
  arrowShape: 'triangle' | 'triangle-tee' | 'circle-triangle' | 'triangle-cross' | 'triangle-backcurve' | 'vee' | 'tee' | 'square' | 'circle' | 'diamond' | 'chevron' | 'none'
  curveStyle: 'bezier' | 'straight' | 'segments' | 'taxi'
  lineStyle: 'solid' | 'dotted' | 'dashed'
  opacity: number
}

const defaultEdgeStyle = ref<EdgeStyle>({
  width: 3,
  color: '#666',
  arrowShape: 'triangle',
  curveStyle: 'bezier',
  lineStyle: 'solid',
  opacity: 1
})

const showEdgeStylePanel = ref(false)

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
          'width': 'data(width)',
          'line-color': 'data(color)',
          'target-arrow-color': 'data(color)',
          'target-arrow-shape': 'data(arrowShape)',
          'curve-style': 'data(curveStyle)',
          'line-style': 'data(lineStyle)',
          'opacity': 'data(opacity)',
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
        } as any
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
    selectedEdgeId.value = null
    pluginManager.getEventBus().emit('graph:nodeSelected', node.id())
  })

  cy.on('unselect', 'node', () => {
    selectedNodeId.value = null
  })

  cy.on('tap', 'node', (evt) => {
    const node = evt.target
    pluginManager.getEventBus().emit('graph:nodeTapped', node.id())
  })

  // 边选择事件
  cy.on('select', 'edge', (evt) => {
    const edge = evt.target
    selectedEdgeId.value = edge.id()
    selectedNodeId.value = null
    pluginManager.getEventBus().emit('graph:edgeSelected', edge.id())
  })

  cy.on('unselect', 'edge', () => {
    selectedEdgeId.value = null
  })

  cy.on('tap', 'edge', (evt) => {
    const edge = evt.target
    pluginManager.getEventBus().emit('graph:edgeTapped', edge.id())
  })

  // 鼠标悬浮事件 - 节点
  cy.on('mouseover', 'node', (evt) => {
    const node = evt.target
    showTooltip(node.id(), 'node', evt.originalEvent)
  })

  cy.on('mouseout', 'node', () => {
    // 延迟隐藏，给用户时间移动到 tooltip 上
    tooltipHideTimer = setTimeout(() => {
      // 只有在非固定状态下才隐藏
      if (!tooltip.value.visible || tooltip.value.elementId === '') {
        return
      }
      hideTooltip()
    }, 300)
  })

  // 鼠标悬浮事件 - 边
  cy.on('mouseover', 'edge', (evt) => {
    const edge = evt.target
    showTooltip(edge.id(), 'edge', evt.originalEvent)
  })

  cy.on('mouseout', 'edge', () => {
    // 延迟隐藏，给用户时间移动到 tooltip 上
    tooltipHideTimer = setTimeout(() => {
      // 只有在非固定状态下才隐藏
      if (!tooltip.value.visible || tooltip.value.elementId === '') {
        return
      }
      hideTooltip()
    }, 300)
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

  // 创建示例图（已注释，使用 Socket 动态创建）
  // createSampleGraph()
  
  // 保存初始布局
  // saveLayoutSnapshot('cose')
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
    { data: { id: 'D', label: 'Node D', color: '#E91E63' } },
    { data: { id: 'E', label: 'Node E', color: '#9C27B0' } },
    
    // 边 - 展示不同样式
    { 
      data: { 
        id: 'AB', 
        source: 'A', 
        target: 'B', 
        label: '实线', 
        color: '#666',
        width: 3,
        arrowShape: 'triangle',
        curveStyle: 'bezier',
        lineStyle: 'solid',
        opacity: 1
      } 
    },
    { 
      data: { 
        id: 'BC', 
        source: 'B', 
        target: 'C', 
        label: '虚线', 
        color: '#2196F3',
        width: 4,
        arrowShape: 'vee',
        curveStyle: 'bezier',
        lineStyle: 'dashed',
        opacity: 0.8
      } 
    },
    { 
      data: { 
        id: 'CD', 
        source: 'C', 
        target: 'D', 
        label: '点线', 
        color: '#FF9800',
        width: 2,
        arrowShape: 'circle',
        curveStyle: 'bezier',
        lineStyle: 'dotted',
        opacity: 0.9
      } 
    },
    { 
      data: { 
        id: 'DE', 
        source: 'D', 
        target: 'E', 
        label: '直线', 
        color: '#E91E63',
        width: 5,
        arrowShape: 'diamond',
        curveStyle: 'straight',
        lineStyle: 'solid',
        opacity: 1
      } 
    },
    { 
      data: { 
        id: 'EA', 
        source: 'E', 
        target: 'A', 
        label: '曲线', 
        color: '#9C27B0',
        width: 3,
        arrowShape: 'triangle-tee',
        curveStyle: 'bezier',
        lineStyle: 'solid',
        opacity: 0.85
      } 
    }
  ])

  // 应用 CoSE 布局（更均匀的分布）
  const layout: any = { 
    name: 'cose',
    animate: true,
    animationDuration: 500,
    nodeRepulsion: 400000,
    idealEdgeLength: 100,
    edgeElasticity: 100,
    gravity: 80,
    numIter: 1000,
    fit: true,
    padding: 50
  }
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
  
  // 布局完成后保存快照并重新渲染
  layout.on('layoutstop', () => {
    saveLayoutSnapshot(layoutName)
    fitView()
    // 布局后强制重新渲染边的样式
    setTimeout(() => {
      forceRerender()
    }, 100)
  })
  
  layout.run()
}

function clearGraph() {
  if (!cy) return
  cy.elements().remove()
  selectedNodeId.value = null
  selectedEdgeId.value = null
  updateStats()
}

// 强制重新渲染所有边的样式
function forceRerender() {
  if (!cy) return
  
  console.log('Force rerendering edges...')
  
  // 遍历所有边，强制更新样式
  cy.edges().forEach(edge => {
    const data = edge.data()
    
    // 确保所有样式属性都有值
    const color = data.color || '#666'
    const width = data.width || 2
    const lineStyle = data.lineStyle || 'solid'
    const arrowShape = data.arrowShape || 'triangle'
    const curveStyle = data.curveStyle || 'bezier'
    const opacity = data.opacity !== undefined ? data.opacity : 1
    
    // 直接设置样式（不使用 data）
    edge.style({
      'width': width,
      'line-color': color,
      'target-arrow-color': color,
      'target-arrow-shape': arrowShape,
      'curve-style': curveStyle,
      'line-style': lineStyle,
      'opacity': opacity
    })
    
    console.log(`Rerendered edge ${data.id}:`, {
      color, width, lineStyle, arrowShape
    })
  })
  
  // 强制重绘
  cy.style().update()
  
  console.log(`Rerendered ${cy.edges().length} edges`)
}

// Tooltip 相关函数
function showTooltip(elementId: string, elementType: 'node' | 'edge', event: any) {
  clearTimeout(tooltipHideTimer)
  
  tooltip.value = {
    visible: true,
    elementId,
    elementType,
    position: {
      x: event.renderedPosition?.x || event.clientX || 0,
      y: event.renderedPosition?.y || event.clientY || 0
    }
  }
}

function hideTooltip() {
  tooltip.value.visible = false
}

function focusNode(nodeId: string) {
  if (!cy) return
  
  const node = cy.$id(nodeId)
  if (node.length === 0) return
  
  // 高亮节点
  cy.elements().removeClass('highlighted')
  node.addClass('highlighted')
  
  // 聚焦到节点
  cy.animate({
    center: { eles: node },
    zoom: 1.5
  }, {
    duration: 500
  })
  
  selectedNodeId.value = nodeId
}

// 应用边样式到所有边
function applyEdgeStyle() {
  if (!cy) return
  
  const style = defaultEdgeStyle.value
  
  cy.style()
    .selector('edge')
    .style({
      'width': style.width,
      'line-color': style.color,
      'target-arrow-color': style.color,
      'target-arrow-shape': style.arrowShape,
      'curve-style': style.curveStyle,
      'line-style': style.lineStyle,
      'opacity': style.opacity
    } as any)
    .update()
}

// 重置边样式为默认值
function resetEdgeStyle() {
  defaultEdgeStyle.value = {
    width: 3,
    color: '#666',
    arrowShape: 'triangle',
    curveStyle: 'bezier',
    lineStyle: 'solid',
    opacity: 1
  }
  applyEdgeStyle()
}

// 应用样式到选中的边
function applyToSelectedEdge() {
  if (!cy || !selectedEdgeId.value) return
  
  const edge = cy.getElementById(selectedEdgeId.value)
  if (edge.length === 0) return
  
  const style = defaultEdgeStyle.value
  
  edge.style({
    'width': style.width,
    'line-color': style.color,
    'target-arrow-color': style.color,
    'target-arrow-shape': style.arrowShape,
    'curve-style': style.curveStyle,
    'line-style': style.lineStyle,
    'opacity': style.opacity
  } as any)
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

// 添加边（支持自定义样式）
function addEdge(
  id: string, 
  source: string, 
  target: string, 
  label?: string, 
  options?: {
    color?: string
    width?: number
    arrowShape?: string
    curveStyle?: string
    lineStyle?: string
    opacity?: number
  }
) {
  if (!cy) return
  
  const existingEdge = cy.getElementById(id)
  if (existingEdge.length > 0) {
    console.warn(`Edge ${id} already exists`)
    return
  }

  // 合并默认样式和自定义样式
  const edgeData = {
    id,
    source,
    target,
    label,
    color: options?.color || '#666',
    width: options?.width || 3,
    arrowShape: options?.arrowShape || 'triangle',
    curveStyle: options?.curveStyle || 'bezier',
    lineStyle: options?.lineStyle || 'solid',
    opacity: options?.opacity || 1
  }

  cy.add({ data: edgeData })
  updateStats()
  
  pluginManager.getEventBus().emit('graph:edgeAdded', edgeData)
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

// Socket 控制函数
const toggleSocketServer = async () => {
  try {
    if (socketIsRunning.value) {
      await stopSocket()
      console.log('Socket server stopped')
    } else {
      await startSocket()
      console.log('Socket server started on port 8080')
    }
  } catch (error) {
    console.error('Socket server error:', error)
    alert(`Socket 服务器错误: ${error}`)
  }
}

// 切换自动布局
const toggleSocketAutoLayout = () => {
  toggleAutoLayout(!socketAutoLayout.value)
  console.log(`Socket auto-layout: ${socketAutoLayout.value ? 'enabled' : 'disabled'}`)
}

// 生命周期
onMounted(() => {
  initCytoscape()
  
  // 更新 Socket Handler 的 Cytoscape 引用
  if (cy) {
    cyRef.value = cy
    updateCytoscape(cy)
  }
  
  // 监听数据包
  const eventBus = pluginManager.getEventBus()
  eventBus.on('data:packet', handleDataPacket)
  
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
    
    // 聚焦到边（聚焦到边的中点）
    cy.animate({
      center: { eles: edge },
      zoom: 1.5
    }, {
      duration: 500
    })
  })
  
  // 处理节点详细信息请求
  eventBus.on('graph:requestNodeDetails', (nodeId: string) => {
    if (!cy) return
    
    const node = cy.$id(nodeId)
    if (node.length === 0) return
    
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
        type: edge.data('extensionType') || 'unknown'
      })
    })
    
    // 获取被扩展
    const extendedByEdges = cy.edges(`[target = "${nodeId}"][edgeType = "extension"]`)
    const extendedBy: Array<{ name: string; type: string }> = []
    extendedByEdges.forEach(edge => {
      extendedBy.push({
        name: edge.data('source'),
        type: edge.data('extensionType') || 'unknown'
      })
    })
    
    // 获取接口实现
    const interfaceEdges = cy.edges(`[source = "${nodeId}"][edgeType = "implementation"]`)
    const implementsList: Array<{ name: string; type: string }> = []
    interfaceEdges.forEach(edge => {
      implementsList.push({
        name: edge.data('target'),
        type: edge.data('implementationType') || 'unknown'
      })
    })
    
    // 获取被实现
    const implementedByEdges = cy.edges(`[target = "${nodeId}"][edgeType = "implementation"]`)
    const implementedByList: Array<{ name: string; type: string }> = []
    implementedByEdges.forEach(edge => {
      implementedByList.push({
        name: edge.data('source'),
        type: edge.data('implementationType') || 'unknown'
      })
    })
    
    // 发送响应
    eventBus.emit('graph:nodeDetailsResponse', {
      id: nodeId,
      parent,
      children,
      extensions,
      extendedBy,
      implements: implementsList,
      implementedBy: implementedByList
    })
  })
})

// 监听 cy 变化
watch(cyRef, (newCy) => {
  if (newCy) {
    updateCytoscape(newCy)
  }
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

<style lang="scss" scoped>
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
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(10px);
  border: 1px solid #e3e5e7;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
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
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid #e3e5e7;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  color: #202124;
  font-size: 12px;
}

.toolbar-btn .icon {
  font-size: 14px;
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
  top: 12px;
  right: 12px;
  padding: 8px 12px;
  background: #fff;
  backdrop-filter: blur(10px);
  border: 1px solid #e3e5e7;
  border-radius: 6px;
  color: #202124;
  font-size: 11px;
  line-height: 1.5;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  z-index: 10;
}

/* 边样式设置面板 */
.edge-style-panel {
  position: absolute;
  top: 80px;
  right: 16px;
  width: 300px;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(10px);
  border: 1px solid #e3e5e7;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 20;
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid #e3e5e7;
  background: #f8f9fa;
}

.panel-header h3 {
  margin: 0;
  font-size: 14px;
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
  cursor: pointer;
  font-size: 16px;
  color: #5f6368;
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #202124;
}

.panel-content {
  padding: 16px;
  max-height: 500px;
  overflow-y: auto;
}

.style-group {
  margin-bottom: 16px;
}

.style-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 12px;
  font-weight: 500;
  color: #5f6368;
}

.style-group input[type="range"] {
  width: 100%;
  height: 4px;
  border-radius: 2px;
  background: #e3e5e7;
  outline: none;
  -webkit-appearance: none;
}

.style-group input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #4a9eff;
  cursor: pointer;
  transition: all 0.2s;
}

.style-group input[type="range"]::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

.style-group input[type="color"] {
  width: 100%;
  height: 36px;
  border: 1px solid #e3e5e7;
  border-radius: 6px;
  cursor: pointer;
}

.style-group select {
  width: 100%;
  padding: 8px 12px;
  background: #fff;
  border: 1px solid #e3e5e7;
  border-radius: 6px;
  color: #202124;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.style-group select:hover {
  border-color: #c5cdd5;
}

.style-group select:focus {
  outline: none;
  border-color: #4a9eff;
  box-shadow: 0 0 0 3px rgba(74, 158, 255, 0.1);
}

.style-group .value {
  display: inline-block;
  margin-left: 8px;
  font-size: 11px;
  color: #5f6368;
  font-family: monospace;
}

.panel-actions {
  display: flex;
  gap: 8px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #e3e5e7;
}

.action-btn {
  flex: 1;
  padding: 8px 16px;
  background: #fff;
  border: 1px solid #e3e5e7;
  border-radius: 6px;
  color: #202124;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover:not(:disabled) {
  background: #f0f4f8;
  border-color: #c5cdd5;
}

.action-btn.primary {
  background: #4a9eff;
  border-color: #4a9eff;
  color: #fff;
}

.action-btn.primary:hover:not(:disabled) {
  background: #3a8eef;
  border-color: #3a8eef;
}

.action-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* Socket 相关样式 */
.toolbar-btn.active {
  background: rgba(76, 175, 80, 0.1);
  border-color: #4CAF50;
}

.socket-info {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  background: #4CAF50;
  color: white;
  font-size: 11px;
  font-weight: 600;
  border-radius: 10px;
  margin-left: 4px;
}
</style>

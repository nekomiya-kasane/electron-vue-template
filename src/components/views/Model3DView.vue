<template>
  <div class="model-3d-view">
    <canvas 
      ref="canvasRef" 
      class="webgpu-canvas"
      @mousedown="handleMouseDown"
      @mousemove="handleMouseMove"
      @mouseup="handleMouseUp"
      @wheel="handleWheel"
    ></canvas>
    <div class="controls-overlay">
      <div class="control-info">
        <div>旋转: 左键拖拽</div>
        <div>平移: 右键拖拽</div>
        <div>缩放: 滚轮</div>
      </div>
      <div class="model-info" v-if="modelLoaded">
        <div>顶点数: {{ vertexCount }}</div>
        <div>缩放: {{ scale.toFixed(2) }}x</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'

const props = defineProps<{
  modelData?: ArrayBuffer
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const modelLoaded = ref(false)
const vertexCount = ref(0)

// 相机参数
const rotation = ref({ x: 0, y: 0 })
const position = ref({ x: 0, y: 0, z: -5 })
const scale = ref(1)

// 鼠标交互状态
const isDragging = ref(false)
const isRightDragging = ref(false)
const lastMousePos = ref({ x: 0, y: 0 })

// WebGPU 相关
let device: GPUDevice | null = null
let context: GPUCanvasContext | null = null
let pipeline: GPURenderPipeline | null = null
let vertexBuffer: GPUBuffer | null = null
let uniformBuffer: GPUBuffer | null = null
let bindGroup: GPUBindGroup | null = null
let animationFrameId: number | null = null

// 顶点着色器
const vertexShaderCode = `
struct Uniforms {
  modelViewProjection: mat4x4<f32>,
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;

struct VertexInput {
  @location(0) position: vec3<f32>,
  @location(1) color: vec3<f32>,
}

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) color: vec3<f32>,
}

@vertex
fn main(input: VertexInput) -> VertexOutput {
  var output: VertexOutput;
  output.position = uniforms.modelViewProjection * vec4<f32>(input.position, 1.0);
  output.color = input.color;
  return output;
}
`

// 片段着色器
const fragmentShaderCode = `
@fragment
fn main(@location(0) color: vec3<f32>) -> @location(0) vec4<f32> {
  return vec4<f32>(color, 1.0);
}
`

// 初始化 WebGPU
async function initWebGPU() {
  if (!canvasRef.value) return

  // 检查 WebGPU 支持
  if (!navigator.gpu) {
    console.error('WebGPU not supported')
    alert('您的浏览器不支持 WebGPU')
    return
  }

  // 获取适配器和设备
  const adapter = await navigator.gpu.requestAdapter()
  if (!adapter) {
    console.error('No adapter found')
    return
  }

  device = await adapter.requestDevice()
  context = canvasRef.value.getContext('webgpu') as GPUCanvasContext

  const presentationFormat = navigator.gpu.getPreferredCanvasFormat()
  context.configure({
    device,
    format: presentationFormat,
    alphaMode: 'premultiplied',
  })

  // 创建着色器模块
  const vertexShaderModule = device.createShaderModule({
    code: vertexShaderCode,
  })

  const fragmentShaderModule = device.createShaderModule({
    code: fragmentShaderCode,
  })

  // 创建渲染管线
  pipeline = device.createRenderPipeline({
    layout: 'auto',
    vertex: {
      module: vertexShaderModule,
      entryPoint: 'main',
      buffers: [
        {
          arrayStride: 24, // 6 floats * 4 bytes
          attributes: [
            { shaderLocation: 0, offset: 0, format: 'float32x3' }, // position
            { shaderLocation: 1, offset: 12, format: 'float32x3' }, // color
          ],
        },
      ],
    },
    fragment: {
      module: fragmentShaderModule,
      entryPoint: 'main',
      targets: [{ format: presentationFormat }],
    },
    primitive: {
      topology: 'triangle-list',
      cullMode: 'back',
    },
    depthStencil: {
      depthWriteEnabled: true,
      depthCompare: 'less',
      format: 'depth24plus',
    },
  })

  // 创建坐标轴和默认立方体
  createDefaultScene()

  // 创建 uniform buffer
  uniformBuffer = device.createBuffer({
    size: 64, // mat4x4 = 16 floats * 4 bytes
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  })

  // 创建 bind group
  bindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      {
        binding: 0,
        resource: { buffer: uniformBuffer },
      },
    ],
  })

  modelLoaded.value = true

  // 开始渲染循环
  render()
}

// 创建默认场景（坐标轴 + 立方体）
function createDefaultScene() {
  if (!device) return

  const vertices = new Float32Array([
    // 坐标轴 - X轴 (红色)
    0, 0, 0,  1, 0, 0,
    2, 0, 0,  1, 0, 0,
    
    // Y轴 (绿色)
    0, 0, 0,  0, 1, 0,
    0, 2, 0,  0, 1, 0,
    
    // Z轴 (蓝色)
    0, 0, 0,  0, 0, 1,
    0, 0, 2,  0, 0, 1,

    // 立方体 (灰色)
    // 前面
    -0.5, -0.5,  0.5,  0.7, 0.7, 0.7,
     0.5, -0.5,  0.5,  0.7, 0.7, 0.7,
     0.5,  0.5,  0.5,  0.7, 0.7, 0.7,
    -0.5, -0.5,  0.5,  0.7, 0.7, 0.7,
     0.5,  0.5,  0.5,  0.7, 0.7, 0.7,
    -0.5,  0.5,  0.5,  0.7, 0.7, 0.7,

    // 后面
    -0.5, -0.5, -0.5,  0.5, 0.5, 0.5,
     0.5,  0.5, -0.5,  0.5, 0.5, 0.5,
     0.5, -0.5, -0.5,  0.5, 0.5, 0.5,
    -0.5, -0.5, -0.5,  0.5, 0.5, 0.5,
    -0.5,  0.5, -0.5,  0.5, 0.5, 0.5,
     0.5,  0.5, -0.5,  0.5, 0.5, 0.5,

    // 其他四个面...
    // 上面
    -0.5,  0.5, -0.5,  0.6, 0.6, 0.6,
    -0.5,  0.5,  0.5,  0.6, 0.6, 0.6,
     0.5,  0.5,  0.5,  0.6, 0.6, 0.6,
    -0.5,  0.5, -0.5,  0.6, 0.6, 0.6,
     0.5,  0.5,  0.5,  0.6, 0.6, 0.6,
     0.5,  0.5, -0.5,  0.6, 0.6, 0.6,

    // 下面
    -0.5, -0.5, -0.5,  0.4, 0.4, 0.4,
     0.5, -0.5,  0.5,  0.4, 0.4, 0.4,
    -0.5, -0.5,  0.5,  0.4, 0.4, 0.4,
    -0.5, -0.5, -0.5,  0.4, 0.4, 0.4,
     0.5, -0.5, -0.5,  0.4, 0.4, 0.4,
     0.5, -0.5,  0.5,  0.4, 0.4, 0.4,

    // 左面
    -0.5, -0.5, -0.5,  0.55, 0.55, 0.55,
    -0.5, -0.5,  0.5,  0.55, 0.55, 0.55,
    -0.5,  0.5,  0.5,  0.55, 0.55, 0.55,
    -0.5, -0.5, -0.5,  0.55, 0.55, 0.55,
    -0.5,  0.5,  0.5,  0.55, 0.55, 0.55,
    -0.5,  0.5, -0.5,  0.55, 0.55, 0.55,

    // 右面
     0.5, -0.5, -0.5,  0.65, 0.65, 0.65,
     0.5,  0.5,  0.5,  0.65, 0.65, 0.65,
     0.5, -0.5,  0.5,  0.65, 0.65, 0.65,
     0.5, -0.5, -0.5,  0.65, 0.65, 0.65,
     0.5,  0.5, -0.5,  0.65, 0.65, 0.65,
     0.5,  0.5,  0.5,  0.65, 0.65, 0.65,
  ])

  vertexCount.value = vertices.length / 6
  
  vertexBuffer = device.createBuffer({
    size: vertices.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  })

  device.queue.writeBuffer(vertexBuffer, 0, vertices)
}

// 创建变换矩阵
function createTransformMatrix(): Float32Array {
  const canvas = canvasRef.value
  if (!canvas) return new Float32Array(16)

  const aspect = canvas.width / canvas.height
  const fov = Math.PI / 4
  const near = 0.1
  const far = 100

  // 透视投影矩阵
  const f = 1.0 / Math.tan(fov / 2)
  const projection = new Float32Array([
    f / aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (far + near) / (near - far), -1,
    0, 0, (2 * far * near) / (near - far), 0,
  ])

  // 视图矩阵
  const view = new Float32Array([
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    position.value.x, position.value.y, position.value.z, 1,
  ])

  // 旋转矩阵
  const cosX = Math.cos(rotation.value.x)
  const sinX = Math.sin(rotation.value.x)
  const cosY = Math.cos(rotation.value.y)
  const sinY = Math.sin(rotation.value.y)

  const rotationMatrix = new Float32Array([
    cosY, sinX * sinY, -cosX * sinY, 0,
    0, cosX, sinX, 0,
    sinY, -sinX * cosY, cosX * cosY, 0,
    0, 0, 0, 1,
  ])

  // 缩放矩阵
  const scaleMatrix = new Float32Array([
    scale.value, 0, 0, 0,
    0, scale.value, 0, 0,
    0, 0, scale.value, 0,
    0, 0, 0, 1,
  ])

  // 组合矩阵: projection * view * rotation * scale
  return multiplyMatrices(projection, multiplyMatrices(view, multiplyMatrices(rotationMatrix, scaleMatrix)))
}

// 矩阵乘法
function multiplyMatrices(a: Float32Array, b: Float32Array): Float32Array {
  const result = new Float32Array(16)
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      result[i * 4 + j] = 
        a[i * 4 + 0] * b[0 * 4 + j] +
        a[i * 4 + 1] * b[1 * 4 + j] +
        a[i * 4 + 2] * b[2 * 4 + j] +
        a[i * 4 + 3] * b[3 * 4 + j]
    }
  }
  return result
}

// 渲染循环
function render() {
  if (!device || !context || !pipeline || !vertexBuffer || !uniformBuffer || !bindGroup) return

  const canvas = canvasRef.value
  if (!canvas) return

  // 更新 canvas 尺寸
  const width = canvas.clientWidth * devicePixelRatio
  const height = canvas.clientHeight * devicePixelRatio
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width
    canvas.height = height
  }

  // 更新 uniform
  const transformMatrix = createTransformMatrix()
  device.queue.writeBuffer(uniformBuffer, 0, transformMatrix.buffer, transformMatrix.byteOffset, transformMatrix.byteLength)

  // 创建深度纹理
  const depthTexture = device.createTexture({
    size: [canvas.width, canvas.height],
    format: 'depth24plus',
    usage: GPUTextureUsage.RENDER_ATTACHMENT,
  })

  const commandEncoder = device.createCommandEncoder()
  const textureView = context.getCurrentTexture().createView()

  const renderPassDescriptor: GPURenderPassDescriptor = {
    colorAttachments: [
      {
        view: textureView,
        clearValue: { r: 0.1, g: 0.1, b: 0.15, a: 1.0 },
        loadOp: 'clear',
        storeOp: 'store',
      },
    ],
    depthStencilAttachment: {
      view: depthTexture.createView(),
      depthClearValue: 1.0,
      depthLoadOp: 'clear',
      depthStoreOp: 'store',
    },
  }

  const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor)
  passEncoder.setPipeline(pipeline)
  passEncoder.setBindGroup(0, bindGroup)
  passEncoder.setVertexBuffer(0, vertexBuffer)
  
  // 绘制坐标轴 (线)
  passEncoder.draw(6, 1, 0, 0)
  
  // 绘制立方体
  passEncoder.draw(vertexCount.value - 6, 1, 6, 0)
  
  passEncoder.end()

  device.queue.submit([commandEncoder.finish()])

  animationFrameId = requestAnimationFrame(render)
}

// 鼠标事件处理
function handleMouseDown(e: MouseEvent) {
  if (e.button === 0) {
    isDragging.value = true
  } else if (e.button === 2) {
    isRightDragging.value = true
    e.preventDefault()
  }
  lastMousePos.value = { x: e.clientX, y: e.clientY }
}

function handleMouseMove(e: MouseEvent) {
  if (!isDragging.value && !isRightDragging.value) return

  const dx = e.clientX - lastMousePos.value.x
  const dy = e.clientY - lastMousePos.value.y

  if (isDragging.value) {
    // 旋转
    rotation.value.y += dx * 0.01
    rotation.value.x += dy * 0.01
  } else if (isRightDragging.value) {
    // 平移
    position.value.x += dx * 0.01
    position.value.y -= dy * 0.01
  }

  lastMousePos.value = { x: e.clientX, y: e.clientY }
}

function handleMouseUp() {
  isDragging.value = false
  isRightDragging.value = false
}

function handleWheel(e: WheelEvent) {
  e.preventDefault()
  const delta = e.deltaY * -0.001
  scale.value = Math.max(0.1, Math.min(10, scale.value + delta))
}

// 监听模型数据变化
watch(() => props.modelData, (newData) => {
  if (newData) {
    // TODO: 解析模型数据并更新顶点缓冲区
    console.log('Model data received:', newData.byteLength, 'bytes')
  }
})

onMounted(() => {
  initWebGPU()
  
  // 禁用右键菜单
  canvasRef.value?.addEventListener('contextmenu', (e) => e.preventDefault())
})

onUnmounted(() => {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId)
  }
  
  // 清理 WebGPU 资源
  vertexBuffer?.destroy()
  uniformBuffer?.destroy()
})
</script>

<style lang="scss" scoped>
.model-3d-view {
  position: relative;
  width: 100%;
  height: 100%;
  background: #0a0a0f;
  overflow: hidden;
}

.webgpu-canvas {
  width: 100%;
  height: 100%;
  display: block;
  cursor: grab;
}

.webgpu-canvas:active {
  cursor: grabbing;
}

.controls-overlay {
  position: absolute;
  top: 16px;
  left: 16px;
  right: 16px;
  pointer-events: none;
  display: flex;
  justify-content: space-between;
}

.control-info,
.model-info {
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(10px);
  padding: 12px 16px;
  border-radius: 8px;
  color: #fff;
  font-size: 12px;
  line-height: 1.6;
}

.model-info {
  text-align: right;
}
</style>

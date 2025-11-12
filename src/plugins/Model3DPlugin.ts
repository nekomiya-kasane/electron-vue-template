import { defineAsyncComponent } from 'vue'
import type { Plugin, PluginContext } from '@/core/plugin'

/**
 * 3D 模型显示插件
 * 基于 WebGPU 技术，支持模型加载、旋转、平移、缩放
 */
export const Model3DPlugin: Plugin = {
  metadata: {
    id: 'model3d',
    name: '3D 模型查看器',
    version: '1.0.0',
    description: '基于 WebGPU 的三维模型显示和交互'
  },

  install(context: PluginContext) {
    // 注册 3D 模型文档类型
    context.registerDocumentType({
      id: '3d-model',
      name: '3D 模型',
      extensions: ['.obj', '.gltf', '.glb', '.stl'],
      icon: '🎲'
    })

    // 注册主视图（3D 查看器）
    context.registerMainView({
      id: '3d-viewer',
      component: defineAsyncComponent(() => import('@/components/views/Model3DView.vue')),
      supportedDocumentTypes: ['3d-model']
    })

    // 注册菜单项
    context.registerMenu({
      sections: [
        {
          title: '3D 模型',
          items: [
            { 
              id: 'open-model', 
              label: '打开模型文件', 
              icon: '📂', 
              shortcut: 'Ctrl+Shift+O',
              action: () => {
                openModelFile(context)
              }
            },
            { 
              id: 'reset-view', 
              label: '重置视图', 
              icon: '🔄',
              action: () => {
                context.emit('3d:reset-view')
              }
            }
          ]
        }
      ]
    })

    // 注册状态栏项
    context.registerStatusBarItem({
      id: '3d-renderer',
      text: 'WebGPU',
      position: 'right',
      priority: 3
    })

    // 监听文档上下文变化
    context.on('document:context-changed', (documentType: string) => {
      if (documentType === '3d-model') {
        console.log('[Model3DPlugin] 3D model context activated')
      }
    })
  },

  onActivate(_context: PluginContext) {
    console.log('[Model3DPlugin] Activated')
  },

  onDeactivate(_context: PluginContext) {
    console.log('[Model3DPlugin] Deactivated')
  }
}

/**
 * 打开模型文件
 */
async function openModelFile(context: PluginContext) {
  try {
    // 使用 Electron 的文件对话框
    if (window.electronAPI) {
      // TODO: 添加 Electron IPC 方法打开文件对话框
      console.log('Opening file dialog...')
    } else {
      // 浏览器环境，使用 input file
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.obj,.gltf,.glb,.stl'
      
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0]
        if (!file) return

        const arrayBuffer = await file.arrayBuffer()
        
        // 创建新的 3D 模型文档
        const docId = `model-${Date.now()}`
        context.createDocument({
          id: docId,
          title: file.name,
          type: '3d-model',
          content: arrayBuffer,
          props: {
            modelData: arrayBuffer,
            fileName: file.name
          }
        })

        // 切换到新文档
        context.switchToDocument(docId)
        
        // 切换到 3D 查看器
        context.switchMainView('3d-viewer', {
          modelData: arrayBuffer,
          fileName: file.name
        })

        console.log(`[Model3DPlugin] Loaded model: ${file.name}`)
      }

      input.click()
    }
  } catch (error) {
    console.error('[Model3DPlugin] Failed to open model file:', error)
  }
}

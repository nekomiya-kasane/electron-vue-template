import { pluginManager } from '@/core/plugin'
import { DocumentPlugin } from './DocumentPlugin'
import { EditorPlugin } from './EditorPlugin'
import { Model3DPlugin } from './Model3DPlugin'

/**
 * 初始化所有插件
 */
export async function initializePlugins() {
  try {
    // 注册插件
    await pluginManager.registerPlugin(DocumentPlugin)
    await pluginManager.registerPlugin(EditorPlugin)
    await pluginManager.registerPlugin(Model3DPlugin)

    // 激活插件
    await pluginManager.activatePlugin('document')
    await pluginManager.activatePlugin('editor')
    await pluginManager.activatePlugin('model3d')

    console.log('[Plugins] All plugins initialized successfully')
  } catch (error) {
    console.error('[Plugins] Failed to initialize plugins:', error)
    throw error
  }
}

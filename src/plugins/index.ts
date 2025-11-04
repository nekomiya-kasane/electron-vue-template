import { pluginManager } from '@/core/plugin'
import { DocumentPlugin } from './DocumentPlugin'
import { EditorPlugin } from './EditorPlugin'

/**
 * 初始化所有插件
 */
export async function initializePlugins() {
  try {
    // 注册插件
    await pluginManager.registerPlugin(DocumentPlugin)
    await pluginManager.registerPlugin(EditorPlugin)

    // 激活插件
    await pluginManager.activatePlugin('document')
    await pluginManager.activatePlugin('editor')

    console.log('[Plugins] All plugins initialized successfully')
  } catch (error) {
    console.error('[Plugins] Failed to initialize plugins:', error)
    throw error
  }
}

<template>
  <div class="plugin-settings">
    <n-card title="插件管理" :bordered="false">
      <n-space vertical :size="16">
        <n-alert type="info" :show-icon="true">
          插件系统允许您启用或禁用功能模块。更改将在重新加载后生效。
        </n-alert>

        <n-input
          v-model:value="searchQuery"
          placeholder="搜索插件..."
          clearable
        >
          <template #prefix>
            <n-icon :component="Search" />
          </template>
        </n-input>

        <n-tabs type="line" animated>
          <n-tab-pane name="all" tab="全部插件">
            <plugin-list
              :plugins="filteredPlugins"
              :enabled-plugins="enabledPluginIds"
              @toggle="handleTogglePlugin"
            />
          </n-tab-pane>

          <n-tab-pane name="enabled" tab="已启用">
            <plugin-list
              :plugins="enabledPlugins"
              :enabled-plugins="enabledPluginIds"
              @toggle="handleTogglePlugin"
            />
          </n-tab-pane>

          <n-tab-pane name="disabled" tab="已禁用">
            <plugin-list
              :plugins="disabledPlugins"
              :enabled-plugins="enabledPluginIds"
              @toggle="handleTogglePlugin"
            />
          </n-tab-pane>

          <n-tab-pane name="builtin" tab="内置插件">
            <plugin-list
              :plugins="builtinPlugins"
              :enabled-plugins="enabledPluginIds"
              @toggle="handleTogglePlugin"
            />
          </n-tab-pane>
        </n-tabs>

        <n-space>
          <n-button type="primary" @click="handleReload">
            <template #icon>
              <n-icon :component="Reload" />
            </template>
            重新加载插件系统
          </n-button>

          <n-button @click="handleReset">
            <template #icon>
              <n-icon :component="Reset" />
            </template>
            重置为默认
          </n-button>
        </n-space>
      </n-space>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { NCard, NSpace, NAlert, NInput, NTabs, NTabPane, NButton, NIcon, useMessage } from 'naive-ui'
import { Search, Reload, RefreshOutline as Reset } from '@vicons/ionicons5'
import PluginList from './PluginList.vue'
import { pluginManagerV2 } from '@/core/plugin'
import { reloadPlugins, enablePlugin, disablePlugin, isPluginEnabled } from '@/plugins/initializePluginsV2'
import type { PluginManifest } from '@/core/plugin'

const message = useMessage()
const searchQuery = ref('')
const plugins = ref<Map<string, PluginManifest>>(new Map())
const enabledPluginIds = ref<Set<string>>(new Set())

// Load plugins
onMounted(async () => {
  await loadPlugins()
})

async function loadPlugins() {
  try {
    plugins.value = pluginManagerV2.getAllDiscoveredPlugins()
    updateEnabledPlugins()
  } catch (error) {
    console.error('Failed to load plugins:', error)
    message.error('加载插件列表失败')
  }
}

function updateEnabledPlugins() {
  enabledPluginIds.value.clear()
  for (const [id] of plugins.value) {
    if (isPluginEnabled(id)) {
      enabledPluginIds.value.add(id)
    }
  }
}

// Filtered plugins
const filteredPlugins = computed(() => {
  const query = searchQuery.value.toLowerCase()
  if (!query) {
    return Array.from(plugins.value.values())
  }
  
  return Array.from(plugins.value.values()).filter(plugin => 
    plugin.name.toLowerCase().includes(query) ||
    plugin.id.toLowerCase().includes(query) ||
    plugin.description?.toLowerCase().includes(query) ||
    plugin.keywords?.some(k => k.toLowerCase().includes(query))
  )
})

const enabledPlugins = computed(() => 
  Array.from(plugins.value.values()).filter(p => enabledPluginIds.value.has(p.id))
)

const disabledPlugins = computed(() => 
  Array.from(plugins.value.values()).filter(p => !enabledPluginIds.value.has(p.id))
)

const builtinPlugins = computed(() => 
  Array.from(plugins.value.values()).filter(p => p.isBuiltin)
)

// Handlers
async function handleTogglePlugin(pluginId: string, enabled: boolean) {
  try {
    if (enabled) {
      await enablePlugin(pluginId)
      enabledPluginIds.value.add(pluginId)
      message.success(`插件 "${pluginId}" 已启用`)
    } else {
      await disablePlugin(pluginId)
      enabledPluginIds.value.delete(pluginId)
      message.success(`插件 "${pluginId}" 已禁用`)
    }
  } catch (error) {
    console.error('Failed to toggle plugin:', error)
    message.error(`切换插件状态失败: ${error}`)
  }
}

async function handleReload() {
  try {
    message.loading('正在重新加载插件系统...', { duration: 0 })
    await reloadPlugins()
    await loadPlugins()
    message.destroyAll()
    message.success('插件系统已重新加载')
  } catch (error) {
    console.error('Failed to reload plugins:', error)
    message.destroyAll()
    message.error('重新加载插件系统失败')
  }
}

async function handleReset() {
  try {
    // Reset to default (enable all plugins)
    const config = pluginManagerV2.getConfigurationService()
    config.update('plugins.disabled', [], 'global')
    
    await reloadPlugins()
    await loadPlugins()
    
    message.success('已重置为默认设置')
  } catch (error) {
    console.error('Failed to reset plugins:', error)
    message.error('重置失败')
  }
}
</script>

<style lang="scss" scoped>
.plugin-settings {
  padding: 16px;
  max-width: 1200px;
  margin: 0 auto;
}
</style>

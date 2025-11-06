<template>
  <n-list hoverable clickable>
    <n-list-item v-for="plugin in plugins" :key="plugin.id">
      <template #prefix>
        <n-avatar :size="48">
          {{ plugin.icon || '🔌' }}
        </n-avatar>
      </template>

      <n-thing>
        <template #header>
          <n-space align="center">
            <span>{{ plugin.displayName || plugin.name }}</span>
            <n-tag v-if="plugin.isBuiltin" size="small" type="info">内置</n-tag>
            <n-tag
              v-for="category in plugin.categories"
              :key="category"
              size="small"
              :type="getCategoryType(category)"
            >
              {{ getCategoryLabel(category) }}
            </n-tag>
          </n-space>
        </template>

        <template #header-extra>
          <n-switch
            :value="enabledPlugins.has(plugin.id)"
            @update:value="(val) => $emit('toggle', plugin.id, val)"
          />
        </template>

        <template #description>
          <n-space vertical :size="4">
            <n-text depth="3">{{ plugin.description }}</n-text>
            <n-space :size="8">
              <n-text depth="3" :size="12">
                <n-icon :component="Code" /> {{ plugin.id }}
              </n-text>
              <n-text depth="3" :size="12">
                <n-icon :component="GitBranch" /> v{{ plugin.version }}
              </n-text>
              <n-text v-if="plugin.author" depth="3" :size="12">
                <n-icon :component="Person" /> {{ formatAuthor(plugin.author) }}
              </n-text>
            </n-space>
            <n-space v-if="plugin.keywords && plugin.keywords.length > 0" :size="4">
              <n-tag
                v-for="keyword in plugin.keywords"
                :key="keyword"
                size="tiny"
                :bordered="false"
              >
                {{ keyword }}
              </n-tag>
            </n-space>
          </n-space>
        </template>
      </n-thing>
    </n-list-item>

    <n-empty v-if="plugins.length === 0" description="没有找到插件" />
  </n-list>
</template>

<script setup lang="ts">
import { NList, NListItem, NAvatar, NThing, NSpace, NText, NTag, NSwitch, NIcon, NEmpty } from 'naive-ui'
import { Code, GitBranch, Person } from '@vicons/ionicons5'
import type { PluginManifest, PluginCategory } from '@/core/plugin'

interface Props {
  plugins: PluginManifest[]
  enabledPlugins: Set<string>
}

defineProps<Props>()
defineEmits<{
  toggle: [pluginId: string, enabled: boolean]
}>()

function getCategoryType(category: PluginCategory): 'default' | 'success' | 'warning' | 'error' | 'info' {
  switch (category) {
    case 'documentType':
      return 'success'
    case 'feature':
      return 'info'
    case 'theme':
      return 'warning'
    case 'language':
      return 'default'
    default:
      return 'default'
  }
}

function getCategoryLabel(category: PluginCategory): string {
  switch (category) {
    case 'documentType':
      return '文档类型'
    case 'feature':
      return '功能'
    case 'theme':
      return '主题'
    case 'language':
      return '语言'
    default:
      return category
  }
}

function formatAuthor(author: string | { name: string; email?: string; url?: string }): string {
  if (typeof author === 'string') {
    return author
  }
  return author.name
}
</script>

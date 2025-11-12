<template>
  <div class="settings-view">
    <!-- 顶部工具栏 -->
    <div class="settings-header">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="搜索设置..."
        class="search-input"
      />
      <div class="header-actions">
        <button
          @click="viewMode = 'ui'"
          :class="['mode-btn', { active: viewMode === 'ui' }]"
          title="可视化编辑"
        >
          🎨 UI
        </button>
        <button
          @click="viewMode = 'json'"
          :class="['mode-btn', { active: viewMode === 'json' }]"
          title="JSON 编辑"
        >
          {} JSON
        </button>
      </div>
    </div>

    <!-- UI 模式 -->
    <div v-if="viewMode === 'ui'" class="settings-content">
      <!-- 左侧分类 -->
      <div class="categories-sidebar">
        <div
          v-for="category in categories"
          :key="category.id"
          :class="['category-item', { active: activeCategory === category.id }]"
          @click="activeCategory = category.id"
        >
          <span v-if="category.icon" class="category-icon">{{ category.icon }}</span>
          <span class="category-title">{{ category.title }}</span>
          <span class="category-count">{{ category.settings.length }}</span>
        </div>
      </div>

      <!-- 右侧设置列表 -->
      <div class="settings-list">
        <div v-if="filteredSettings.length === 0" class="empty-state">
          <div class="empty-icon">🔍</div>
          <div class="empty-text">
            {{ searchQuery ? '未找到匹配的设置' : '此分类暂无设置' }}
          </div>
        </div>
        
        <div v-else class="settings-group">
          <h3 class="group-title">{{ currentCategoryTitle }}</h3>
          <SettingItem
            v-for="definition in filteredSettings"
            :key="definition.key"
            :definition="definition"
            :value="getSettingValue(definition.key)"
            @update="(value) => updateSetting(definition.key, value)"
          />
        </div>
      </div>
    </div>

    <!-- JSON 模式 -->
    <div v-else class="json-editor-container">
      <div class="json-toolbar">
        <button @click="formatJson" class="toolbar-btn">格式化</button>
        <button @click="saveJson" class="toolbar-btn primary">保存</button>
        <button @click="resetJson" class="toolbar-btn">重置</button>
      </div>
      <textarea
        v-model="jsonContent"
        class="json-editor"
        spellcheck="false"
      ></textarea>
      <div v-if="jsonError" class="json-error">
        ❌ {{ jsonError }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { settingsService } from '@/core/settings'
import SettingItem from './SettingItem.vue'

const searchQuery = ref('')
const viewMode = ref<'ui' | 'json'>('ui')
const activeCategory = ref('')
const jsonContent = ref('')
const jsonError = ref('')

// 获取所有分类
const categories = computed(() => {
  return settingsService.getCategories()
})

// 设置默认分类
if (categories.value.length > 0 && !activeCategory.value) {
  activeCategory.value = categories.value[0].id
}

// 当前分类标题
const currentCategoryTitle = computed(() => {
  const category = categories.value.find(c => c.id === activeCategory.value)
  return category?.title || ''
})

// 过滤后的设置
const filteredSettings = computed(() => {
  const category = categories.value.find(c => c.id === activeCategory.value)
  if (!category) return []

  if (!searchQuery.value) {
    return category.settings
  }

  const query = searchQuery.value.toLowerCase()
  return category.settings.filter(setting =>
    setting.title.toLowerCase().includes(query) ||
    setting.key.toLowerCase().includes(query) ||
    setting.description?.toLowerCase().includes(query)
  )
})

// 获取设置值
function getSettingValue(key: string) {
  return settingsService.get(key)
}

// 更新设置
function updateSetting(key: string, value: any) {
  settingsService.set(key, value, 'user')
}

// 初始化 JSON 内容
function initJsonContent() {
  const settings = settingsService.getAll('user')
  jsonContent.value = JSON.stringify(settings, null, 2)
  jsonError.value = ''
}

// 格式化 JSON
function formatJson() {
  try {
    const parsed = JSON.parse(jsonContent.value)
    jsonContent.value = JSON.stringify(parsed, null, 2)
    jsonError.value = ''
  } catch (error) {
    jsonError.value = '无效的 JSON 格式'
  }
}

// 保存 JSON
function saveJson() {
  try {
    settingsService.importFromJSON(jsonContent.value, 'user')
    jsonError.value = ''
  } catch (error) {
    jsonError.value = error instanceof Error ? error.message : '保存失败'
  }
}

// 重置 JSON
function resetJson() {
  initJsonContent()
}

// 监听视图模式切换
watch(viewMode, (newMode) => {
  if (newMode === 'json') {
    initJsonContent()
  }
})

// 初始化
initJsonContent()
</script>

<style scoped>
.settings-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;
}

.settings-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-bottom: 1px solid #e3e5e7;
  background: #f8f9fa;
}

.search-input {
  flex: 1;
  padding: 8px 12px;
  background: #fff;
  border: 1px solid #e3e5e7;
  border-radius: 6px;
  font-size: 13px;
  color: #202124;
  transition: all 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #4a9eff;
  box-shadow: 0 0 0 3px rgba(74, 158, 255, 0.1);
}

.header-actions {
  display: flex;
  gap: 4px;
}

.mode-btn {
  padding: 6px 12px;
  background: #fff;
  border: 1px solid #e3e5e7;
  border-radius: 6px;
  color: #5f6368;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.mode-btn:hover {
  background: #f0f4f8;
  border-color: #c5cdd5;
}

.mode-btn.active {
  background: #4a9eff;
  border-color: #4a9eff;
  color: #fff;
}

.settings-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.categories-sidebar {
  width: 200px;
  border-right: 1px solid #e3e5e7;
  overflow-y: auto;
  background: #f8f9fa;
}

.category-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  cursor: pointer;
  transition: all 0.2s;
  border-left: 3px solid transparent;
}

.category-item:hover {
  background: #e3e5e7;
}

.category-item.active {
  background: #fff;
  border-left-color: #4a9eff;
}

.category-icon {
  font-size: 16px;
}

.category-title {
  flex: 1;
  font-size: 13px;
  color: #202124;
}

.category-count {
  font-size: 11px;
  color: #868e96;
  background: #e3e5e7;
  padding: 2px 6px;
  border-radius: 10px;
}

.settings-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px 24px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #868e96;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-text {
  font-size: 14px;
}

.settings-group {
  max-width: 600px;
}

.group-title {
  margin: 0 0 24px 0;
  font-size: 20px;
  font-weight: 600;
  color: #202124;
}

.json-editor-container {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}

.json-toolbar {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid #e3e5e7;
  background: #f8f9fa;
}

.toolbar-btn {
  padding: 6px 16px;
  background: #fff;
  border: 1px solid #e3e5e7;
  border-radius: 6px;
  color: #202124;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.toolbar-btn:hover {
  background: #f0f4f8;
  border-color: #c5cdd5;
}

.toolbar-btn.primary {
  background: #4a9eff;
  border-color: #4a9eff;
  color: #fff;
}

.toolbar-btn.primary:hover {
  background: #3a8eef;
}

.json-editor {
  flex: 1;
  padding: 16px;
  background: #1e1e1e;
  color: #d4d4d4;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.6;
  border: none;
  resize: none;
  outline: none;
}

.json-error {
  padding: 12px 16px;
  background: #fee;
  border-top: 1px solid #fcc;
  color: #c33;
  font-size: 13px;
}
</style>

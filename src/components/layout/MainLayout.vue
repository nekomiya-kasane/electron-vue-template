<template>
  <div class="main-layout">
    <!-- 顶部：Logo + 标签栏 + 窗口控制 -->
    <div class="top-bar">
      <TitleBar @menu-click="handleMenuClick" />
      <div class="tab-bar-wrapper">
        <TabBar
          :tabs="tabs"
          :active-tab-id="activeTabId"
          @select="selectTab"
          @close="closeTab"
          @add="addTab"
        />
      </div>
      <div class="window-controls">
        <button class="control-btn" @click="minimizeWindow" title="最小化">
          <span class="icon">−</span>
        </button>
        <button class="control-btn" @click="maximizeWindow" title="最大化">
          <span class="icon">□</span>
        </button>
        <button class="control-btn close-btn" @click="closeWindow" title="关闭">
          <span class="icon">×</span>
        </button>
      </div>
    </div>

    <!-- 主内容区 -->
    <div class="content-area">
      <!-- 左侧图标栏 -->
      <IconBar
        position="left"
        :items="leftIconBarItems"
        :active-id="activeLeftPanel || undefined"
        @select="toggleLeftPanel"
      />

      <!-- 左侧边栏 -->
      <Sidebar
        v-if="activeLeftPanel"
        :title="getLeftPanelTitle() || ''"
        :sidebar-id="activeLeftPanel"
        position="left"
      >
        <component :is="getLeftPanelComponent()" />
      </Sidebar>

      <!-- 中间主区域 -->
      <div class="main-area">
        <component 
          v-if="activeMainView"
          :is="getMainViewComponent()"
          v-bind="activeMainView.props"
        />
        <div v-else class="empty-state">
          <div class="empty-icon">📝</div>
          <div class="empty-text">选择一个文档开始编辑</div>
        </div>
      </div>

      <!-- 右侧边栏 -->
      <Sidebar
        v-if="activeRightPanel"
        :title="getRightPanelTitle() || ''"
        :sidebar-id="activeRightPanel"
        position="right"
      >
        <component :is="getRightPanelComponent()" />
      </Sidebar>

      <!-- 右侧图标栏 -->
      <IconBar
        position="right"
        :items="rightIconBarItems"
        :active-id="activeRightPanel || undefined"
        @select="toggleRightPanel"
      />
    </div>

    <!-- 底部状态栏 -->
    <StatusBar :items="state.statusBarItems" />

    <!-- 应用菜单 -->
    <AppMenu
      :is-open="isMenuOpen"
      :position="menuPosition"
      :menu-sections="menuSections"
      @close="closeMenu"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import TitleBar from './TitleBar.vue'
import Sidebar from './Sidebar.vue'
import IconBar from './IconBar.vue'
import TabBar, { type Tab } from './TabBar.vue'
import AppMenu from './AppMenu.vue'
import StatusBar from './StatusBar.vue'
import { pluginManager } from '@/core/plugin'

// 从插件管理器获取状态
const state = pluginManager.state

// 标签页管理
const tabs = ref<Tab[]>([
  { id: '1', title: '欢迎使用', icon: '📄' }
])
const activeTabId = ref('1')

const selectTab = (id: string) => {
  activeTabId.value = id
}

const closeTab = (id: string) => {
  const index = tabs.value.findIndex(t => t.id === id)
  if (index === -1 || tabs.value.length === 1) return
  
  tabs.value.splice(index, 1)
  
  if (activeTabId.value === id) {
    activeTabId.value = tabs.value[Math.max(0, index - 1)].id
  }
}

const addTab = () => {
  const newId = String(Date.now())
  tabs.value.push({
    id: newId,
    title: '新建文档',
    icon: '📄'
  })
  activeTabId.value = newId
}

// 图标栏按钮 - 从插件系统获取，根据当前文档类型过滤
const leftIconBarItems = computed(() => {
  const visible = pluginManager.getVisibleIconButtons()
  return visible.filter(btn => btn.position === 'left')
})

const rightIconBarItems = computed(() => {
  const visible = pluginManager.getVisibleIconButtons()
  return visible.filter(btn => btn.position === 'right')
})

// 侧边栏管理
const activeLeftPanel = computed(() => state.activeSidebars.left)
const activeRightPanel = computed(() => state.activeSidebars.right)

const toggleLeftPanel = (id: string) => {
  // 切换侧边栏状态
  if (state.activeSidebars.left === id) {
    state.activeSidebars.left = null
  } else {
    state.activeSidebars.left = id
  }
  
  // 通知插件（在状态更新后）
  const eventBus = pluginManager.getEventBus()
  eventBus.emit('iconbar:click', id, 'left')
}

const toggleRightPanel = (id: string) => {
  // 切换侧边栏状态
  if (state.activeSidebars.right === id) {
    state.activeSidebars.right = null
  } else {
    state.activeSidebars.right = id
  }
  
  // 通知插件（在状态更新后）
  const eventBus = pluginManager.getEventBus()
  eventBus.emit('iconbar:click', id, 'right')
}

const getLeftPanelTitle = () => {
  if (!state.activeSidebars.left) return ''
  const visibleSidebars = pluginManager.getVisibleSidebars()
  return visibleSidebars.get(state.activeSidebars.left)?.title || ''
}

const getRightPanelTitle = () => {
  if (!state.activeSidebars.right) return ''
  const visibleSidebars = pluginManager.getVisibleSidebars()
  return visibleSidebars.get(state.activeSidebars.right)?.title || ''
}

const getLeftPanelComponent = () => {
  if (!state.activeSidebars.left) return null
  const visibleSidebars = pluginManager.getVisibleSidebars()
  return visibleSidebars.get(state.activeSidebars.left)?.component || null
}

const getRightPanelComponent = () => {
  if (!state.activeSidebars.right) return null
  const visibleSidebars = pluginManager.getVisibleSidebars()
  return visibleSidebars.get(state.activeSidebars.right)?.component || null
}

// 主视图管理
const activeMainView = computed(() => state.activeMainView)

const getMainViewComponent = () => {
  if (!state.activeMainView) return null
  return state.mainViews.get(state.activeMainView.id)?.component || null
}

// 应用菜单
const isMenuOpen = ref(false)
const menuPosition = ref({ x: 0, y: 0 })

const menuSections = computed(() => state.menuSections)

const handleMenuClick = (event: { x: number; y: number }) => {
  menuPosition.value = event
  isMenuOpen.value = true
}

const closeMenu = () => {
  isMenuOpen.value = false
}

// 窗口控制
const minimizeWindow = () => {
  if (window.electronAPI?.window) {
    window.electronAPI.window.minimize()
  }
}

const maximizeWindow = () => {
  if (window.electronAPI?.window) {
    window.electronAPI.window.maximize()
  }
}

const closeWindow = () => {
  if (window.electronAPI?.window) {
    window.electronAPI.window.close()
  }
}
</script>

<style scoped>
.main-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  background: #fff;
}

/* 顶部栏：Logo + 标签栏 + 窗口控制 */
.top-bar {
  display: flex;
  align-items: center;
  height: 32px;
  background: #ffffff;
  border-bottom: 1px solid #e3e5e7;
  flex-shrink: 0;
  -webkit-app-region: drag;
}

.tab-bar-wrapper {
  flex: 1;
  overflow: hidden;
  -webkit-app-region: drag;
}

.window-controls {
  display: flex;
  -webkit-app-region: no-drag;
}

.control-btn {
  background: none;
  border: none;
  width: 40px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 6px;
  margin: 2px 3px;
}

.control-btn:hover {
  background: rgba(0, 0, 0, 0.08);
  transform: scale(1.05);
}

.control-btn.close-btn:hover {
  background: #e81123;
  transform: scale(1.05);
}

.control-btn.close-btn:hover .icon {
  color: white;
}

.control-btn .icon {
  font-size: 16px;
  color: #5f6368;
  font-weight: 300;
}

/* 主内容区 */
.content-area {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* 主区域 */
.main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #fff;
  overflow: hidden;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #9aa0a6;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-text {
  font-size: 16px;
}
</style>

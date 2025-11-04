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
        :active-id="activeLeftPanel"
        @select="toggleLeftPanel"
      />

      <!-- 左侧边栏 -->
      <transition name="sidebar-slide">
        <Sidebar
          v-if="activeLeftPanel"
          :title="getLeftPanelTitle()"
        >
          <component :is="getLeftPanelComponent()" />
        </Sidebar>
      </transition>

      <!-- 中间编辑区 -->
      <div class="editor-area">
        <div class="editor-header">
          <input 
            type="text" 
            class="doc-title" 
            placeholder="无标题文档"
            :value="currentTab?.title"
          />
        </div>
        <div class="editor-content">
          <div class="editor-placeholder">
            在此处开始编写...
          </div>
        </div>
      </div>

      <!-- 右侧边栏 -->
      <transition name="sidebar-slide">
        <Sidebar
          v-if="activeRightPanel"
          :title="getRightPanelTitle()"
        >
          <component :is="getRightPanelComponent()" />
        </Sidebar>
      </transition>

      <!-- 右侧图标栏 -->
      <IconBar
        position="right"
        :items="rightIconBarItems"
        :active-id="activeRightPanel"
        @select="toggleRightPanel"
      />
    </div>

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
import IconBar, { type IconBarItem } from './IconBar.vue'
import TabBar, { type Tab } from './TabBar.vue'
import AppMenu, { type MenuSection } from './AppMenu.vue'

// 侧边栏内容组件
import DocTree from '../panels/DocTree.vue'
import Outline from '../panels/Outline.vue'
import Backlinks from '../panels/Backlinks.vue'
import Bookmarks from '../panels/Bookmarks.vue'
import Tags from '../panels/Tags.vue'

// 标签页管理
const tabs = ref<Tab[]>([
  { id: '1', title: '欢迎使用', icon: '📄' }
])
const activeTabId = ref('1')

const currentTab = computed(() => tabs.value.find(t => t.id === activeTabId.value))

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

// 左侧面板
const activeLeftPanel = ref<string>('doc-tree')
const leftIconBarItems: IconBarItem[] = [
  { id: 'doc-tree', icon: '📁', title: '文档树' },
  { id: 'bookmarks', icon: '⭐', title: '书签' },
  { id: 'tags', icon: '🏷️', title: '标签' }
]

const toggleLeftPanel = (id: string) => {
  activeLeftPanel.value = activeLeftPanel.value === id ? '' : id
}

const getLeftPanelTitle = () => {
  const item = leftIconBarItems.find(i => i.id === activeLeftPanel.value)
  return item?.title || ''
}

const getLeftPanelComponent = () => {
  switch (activeLeftPanel.value) {
    case 'doc-tree': return DocTree
    case 'bookmarks': return Bookmarks
    case 'tags': return Tags
    default: return null
  }
}

// 右侧面板
const activeRightPanel = ref<string>('outline')
const rightIconBarItems: IconBarItem[] = [
  { id: 'outline', icon: '📋', title: '大纲' },
  { id: 'backlinks', icon: '🔗', title: '反链' }
]

const toggleRightPanel = (id: string) => {
  activeRightPanel.value = activeRightPanel.value === id ? '' : id
}

const getRightPanelTitle = () => {
  const item = rightIconBarItems.find(i => i.id === activeRightPanel.value)
  return item?.title || ''
}

const getRightPanelComponent = () => {
  switch (activeRightPanel.value) {
    case 'outline': return Outline
    case 'backlinks': return Backlinks
    default: return null
  }
}

// 应用菜单
const isMenuOpen = ref(false)
const menuPosition = ref({ x: 0, y: 0 })

const menuSections: MenuSection[] = [
  {
    items: [
      { id: 'new-doc', label: '新建文档', icon: '📄', shortcut: 'Ctrl+N' },
      { id: 'new-notebook', label: '新建笔记本', icon: '📁' }
    ]
  },
  {
    items: [
      { id: 'open', label: '打开', icon: '📂', shortcut: 'Ctrl+O' },
      { id: 'recent', label: '最近打开', icon: '🕒', submenu: [
        { id: 'recent-1', label: '文档 1' },
        { id: 'recent-2', label: '文档 2' }
      ]}
    ]
  },
  {
    items: [
      { id: 'settings', label: '设置', icon: '⚙️', shortcut: 'Ctrl+,' },
      { id: 'about', label: '关于', icon: 'ℹ️' }
    ]
  }
]

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
  height: 32px;
  flex-shrink: 0;
  background: #f7f9fa;
  border-bottom: 1px solid #e3e5e7;
  -webkit-app-region: drag;
}

.tab-bar-wrapper {
  flex: 1;
  display: flex;
  overflow: hidden;
  -webkit-app-region: no-drag;
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

/* 编辑区 */
.editor-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #fff;
  overflow: hidden;
}

.editor-header {
  padding: 20px 40px 10px;
  border-bottom: 1px solid #e3e5e7;
  flex-shrink: 0;
}

.doc-title {
  width: 100%;
  border: none;
  outline: none;
  font-size: 24px;
  font-weight: 600;
  color: #202124;
  padding: 8px 0;
}

.doc-title::placeholder {
  color: #dadce0;
}

.editor-content {
  flex: 1;
  padding: 20px 40px;
  overflow-y: auto;
  line-height: 1.8;
}

.editor-placeholder {
  color: #9aa0a6;
  font-size: 14px;
}

/* 侧边栏过渡动画 */
.sidebar-slide-enter-active,
.sidebar-slide-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.sidebar-slide-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

.sidebar-slide-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}
</style>

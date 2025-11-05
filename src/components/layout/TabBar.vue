<template>
  <div class="tab-bar">
    <div class="tabs-container">
      <div
        v-for="tab in tabs"
        :key="tab.id"
        class="tab"
        :class="{ active: activeTabId === tab.id }"
        @click="selectTab(tab.id)"
      >
        <span class="tab-icon" v-if="tab.icon">{{ tab.icon }}</span>
        <span class="tab-title">{{ tab.title }}</span>
        <button class="tab-close" @click.stop="closeTab(tab.id)" v-if="tabs.length > 1">
          <span class="icon">×</span>
        </button>
      </div>
      <button class="tab-add" @click="addTab" title="新建标签页">
        <span class="icon">+</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue'

export interface Tab {
  id: string
  title: string
  icon?: string
}

defineProps<{
  tabs: Tab[]
  activeTabId: string
}>()

const emit = defineEmits<{
  select: [id: string]
  close: [id: string]
  add: []
}>()

const selectTab = (id: string) => {
  emit('select', id)
}

const closeTab = (id: string) => {
  emit('close', id)
}

const addTab = () => {
  emit('add')
}
</script>

<style scoped>
.tab-bar {
  display: flex;
  align-items: center;
  height: 100%;
  overflow: hidden;
}

.tabs-container {
  display: flex;
  align-items: center;
  height: 100%;
  flex: 1;
  overflow-x: auto;
  overflow-y: hidden;
}

.tabs-container::-webkit-scrollbar {
  height: 0;
}

.tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 12px;
  height: 100%;
  min-width: 120px;
  max-width: 200px;
  cursor: pointer;
  border-right: 1px solid #e3e5e7;
  transition: background 0.2s;
  flex-shrink: 0;
  position: relative;
  background: rgba(0, 0, 0, 0.02);
  -webkit-app-region: no-drag;
}

.tab:hover {
  background: rgba(0, 0, 0, 0.05);
}

.tab.active {
  background: #fff;
}

.tab.active::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: #4a9eff;
}

.tab-icon {
  font-size: 14px;
  flex-shrink: 0;
}

.tab-title {
  flex: 1;
  font-size: 13px;
  color: #202124;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tab-close {
  background: none;
  border: none;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s ease;
  flex-shrink: 0;
  opacity: 0;
}

.tab:hover .tab-close {
  opacity: 1;
}

.tab-close:hover {
  background: rgba(0, 0, 0, 0.15);
  transform: scale(1.15);
}

.tab-close .icon {
  font-size: 18px;
  color: #5f6368;
}

.tab-add {
  background: none;
  border: none;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s ease;
  margin: 0 6px;
  flex-shrink: 0;
  -webkit-app-region: no-drag;
}

.tab-add:hover {
  background: rgba(0, 0, 0, 0.08);
  transform: scale(1.1);
}

.tab-add .icon {
  font-size: 18px;
  color: #5f6368;
}
</style>

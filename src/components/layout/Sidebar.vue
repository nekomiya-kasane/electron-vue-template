<template>
  <div class="sidebar">
    <div class="sidebar-header">
      <div class="sidebar-title">{{ title }}</div>
      <button class="sidebar-toggle" @click="toggleCollapse">
        <span class="icon">{{ isCollapsed ? '›' : '‹' }}</span>
      </button>
    </div>
    <div class="sidebar-content">
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  title: string
}>()

const isCollapsed = ref(false)

const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
}
</script>

<style scoped>
.sidebar {
  display: flex;
  flex-direction: column;
  background: #f7f9fa;
  border-right: 1px solid #e3e5e7;
  height: 100%;
  min-width: 200px;
  width: 260px;
  flex-shrink: 0;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-bottom: 1px solid #e3e5e7;
  background: #fff;
  height: 40px;
  flex-shrink: 0;
}

.sidebar-title {
  font-size: 14px;
  font-weight: 500;
  color: #202124;
}

.sidebar-toggle {
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s ease;
  width: 28px;
  height: 28px;
}

.sidebar-toggle:hover {
  background: #e8eaed;
  transform: scale(1.1);
}

.icon {
  font-size: 18px;
  color: #5f6368;
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  transition: opacity 0.2s ease;
}

.sidebar-content::-webkit-scrollbar {
  width: 6px;
}

.sidebar-content::-webkit-scrollbar-thumb {
  background: #d0d0d0;
  border-radius: 3px;
}

.sidebar-content::-webkit-scrollbar-thumb:hover {
  background: #b0b0b0;
}
</style>

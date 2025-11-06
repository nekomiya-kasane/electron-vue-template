<template>
  <div class="app-menu" v-if="isOpen" @click.self="close">
    <div class="menu-panel" :style="{ left: position.x + 'px', top: position.y + 'px' }">
      <div class="menu-section" v-for="section in menuSections" :key="section.title">
        <div class="menu-section-title" v-if="section.title">{{ section.title }}</div>
        <div
          v-for="item in section.items"
          :key="item.id"
          class="menu-item"
          :class="{ 'has-submenu': item.submenu }"
          @click="handleItemClick(item)"
          @mouseenter="handleMouseEnter(item, $event)"
        >
          <span class="menu-item-icon" v-if="item.icon">{{ item.icon }}</span>
          <span class="menu-item-label">{{ item.label }}</span>
          <span class="menu-item-shortcut" v-if="item.shortcut">{{ item.shortcut }}</span>
          <span class="menu-item-arrow" v-if="item.submenu">›</span>
        </div>
      </div>
      
      <!-- 子菜单 -->
      <div
        v-if="activeSubmenu"
        class="submenu-panel"
        :style="{ left: submenuPosition.x + 'px', top: submenuPosition.y + 'px' }"
      >
        <div
          v-for="subitem in activeSubmenu"
          :key="subitem.id"
          class="menu-item"
          @click="handleItemClick(subitem)"
        >
          <span class="menu-item-icon" v-if="subitem.icon">{{ subitem.icon }}</span>
          <span class="menu-item-label">{{ subitem.label }}</span>
          <span class="menu-item-shortcut" v-if="subitem.shortcut">{{ subitem.shortcut }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { MenuItem, MenuSection } from '@/core/plugin/types'

defineProps<{
  isOpen: boolean
  position: { x: number; y: number }
  menuSections: MenuSection[]
}>()

const emit = defineEmits<{
  close: []
}>()

const activeSubmenu = ref<MenuItem[] | null>(null)
const submenuPosition = ref({ x: 0, y: 0 })

const handleItemClick = (item: MenuItem) => {
  if (item.submenu) {
    return
  }
  if (item.action) {
    item.action()
  }
  close()
}

const handleMouseEnter = (item: MenuItem, event: MouseEvent) => {
  if (item.submenu) {
    const target = event.currentTarget as HTMLElement
    const rect = target.getBoundingClientRect()
    activeSubmenu.value = item.submenu
    submenuPosition.value = {
      x: rect.width - 2,
      y: 0
    }
  } else {
    activeSubmenu.value = null
  }
}

const close = () => {
  activeSubmenu.value = null
  emit('close')
}
</script>

<style scoped>
.app-menu {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
}

.menu-panel,
.submenu-panel {
  position: absolute;
  background: #fff;
  border: 1px solid #e3e5e7;
  border-radius: 8px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
  min-width: 200px;
  padding: 6px;
  z-index: 10000;
  animation: menuFadeIn 0.2s ease;
}

@keyframes menuFadeIn {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.submenu-panel {
  z-index: 10001;
}

.menu-section {
  padding: 4px 0;
}

.menu-section + .menu-section {
  border-top: 1px solid #e3e5e7;
}

.menu-section-title {
  padding: 6px 12px;
  font-size: 11px;
  font-weight: 600;
  color: #5f6368;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 13px;
  color: #202124;
  position: relative;
  border-radius: 6px;
  margin: 2px 4px;
}

.menu-item:hover {
  background: #e8eaed;
  transform: translateX(2px);
}

.menu-item-icon {
  font-size: 16px;
  width: 20px;
  text-align: center;
}

.menu-item-label {
  flex: 1;
}

.menu-item-shortcut {
  font-size: 11px;
  color: #5f6368;
  margin-left: auto;
}

.menu-item-arrow {
  font-size: 14px;
  color: #5f6368;
  margin-left: 8px;
}

.has-submenu {
  padding-right: 8px;
}
</style>

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

<style lang="scss" scoped>
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
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 180px;
  padding: 4px;
  z-index: 10000;
  animation: menuFadeIn 0.15s ease;
}

@keyframes menuFadeIn {
  from {
    opacity: 0;
    transform: translateY(-4px);
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
  padding: 2px 0;
}

.menu-section + .menu-section {
  border-top: 1px solid #e8eaed;
  margin-top: 2px;
  padding-top: 2px;
}

.menu-section-title {
  padding: 4px 8px 2px 8px;
  font-size: 10px;
  font-weight: 600;
  color: #5f6368;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 8px;
  cursor: pointer;
  transition: background 0.15s ease;
  font-size: 13px;
  color: #202124;
  position: relative;
  border-radius: 3px;
  margin: 1px 2px;
  line-height: 1.4;
}

.menu-item:hover {
  background: #f1f3f4;
}

.menu-item-icon {
  font-size: 15px;
  width: 18px;
  text-align: center;
  flex-shrink: 0;
}

.menu-item-label {
  flex: 1;
  white-space: nowrap;
}

.menu-item-shortcut {
  font-size: 11px;
  color: #5f6368;
  margin-left: 12px;
  flex-shrink: 0;
}

.menu-item-arrow {
  font-size: 13px;
  color: #5f6368;
  margin-left: 4px;
  flex-shrink: 0;
}

.has-submenu {
  padding-right: 6px;
}
</style>

<template>
  <div class="resizable-panel-group" ref="containerRef">
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from 'vue'

const containerRef = ref<HTMLElement | null>(null)
const panelSizes = ref<Map<HTMLElement, number>>(new Map())

onMounted(async () => {
  await nextTick()
  initializeResizeHandles()
  redistributeSpace()
  
  // 监听子元素的变化
  observePanelChanges()
})

function observePanelChanges() {
  if (!containerRef.value) return
  
  const observer = new MutationObserver((mutations) => {
    // 只响应 collapsed class 的变化，忽略 animating class
    const hasCollapsedChange = mutations.some(mutation => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
        const target = mutation.target as HTMLElement
        const oldClasses = mutation.oldValue || ''
        const newClasses = target.className
        
        // 检查 collapsed 状态是否改变
        const wasCollapsed = oldClasses.includes('collapsed')
        const isCollapsed = newClasses.includes('collapsed')
        
        return wasCollapsed !== isCollapsed
      }
      return false
    })
    
    if (hasCollapsedChange) {
      nextTick(() => {
        redistributeSpace()
      })
    }
  })
  
  observer.observe(containerRef.value, {
    attributes: true,
    attributeFilter: ['class'],
    attributeOldValue: true,  // 需要旧值来比较
    subtree: true
  })
}

function getPanels(): HTMLElement[] {
  if (!containerRef.value) return []
  return Array.from(containerRef.value.children).filter(
    child => child.classList.contains('collapsible-panel')
  ) as HTMLElement[]
}

function redistributeSpace() {
  const panels = getPanels()
  if (panels.length === 0) return
  
  const expandedPanels = panels.filter(p => !p.classList.contains('collapsed'))
  const collapsedPanels = panels.filter(p => p.classList.contains('collapsed'))
  
  // 如果所有面板都折叠了，不做处理
  if (expandedPanels.length === 0) {
    panels.forEach(p => {
      p.style.flex = '0 0 auto'
      p.style.height = 'auto'
    })
    return
  }
  
  // 计算可用空间
  const containerHeight = containerRef.value?.offsetHeight || 0
  const collapsedHeight = collapsedPanels.reduce((sum, p) => sum + p.offsetHeight, 0)
  const handleHeight = (panels.length - 1) * 6 // 每个手柄 6px
  const availableHeight = containerHeight - collapsedHeight - handleHeight
  
  // 为展开的面板分配空间
  if (expandedPanels.length > 0) {
    // 检查是否有已设置的高度
    let totalSetHeight = 0
    const panelsWithSetHeight: HTMLElement[] = []
    const panelsWithoutSetHeight: HTMLElement[] = []
    
    expandedPanels.forEach(p => {
      const savedSize = panelSizes.value.get(p)
      if (savedSize && savedSize > 0) {
        totalSetHeight += savedSize
        panelsWithSetHeight.push(p)
      } else {
        panelsWithoutSetHeight.push(p)
      }
    })
    
    // 如果有未设置高度的面板，平均分配剩余空间
    if (panelsWithoutSetHeight.length > 0) {
      const remainingHeight = availableHeight - totalSetHeight
      const heightPerPanel = Math.max(100, remainingHeight / panelsWithoutSetHeight.length)
      
      panelsWithoutSetHeight.forEach(p => {
        // 添加动画类
        p.classList.add('animating')
        p.style.flex = 'none'
        p.style.height = `${heightPerPanel}px`
        panelSizes.value.set(p, heightPerPanel)
        
        // 动画结束后移除类
        setTimeout(() => p.classList.remove('animating'), 250)
      })
    }
    
    // 设置已有高度的面板
    panelsWithSetHeight.forEach(p => {
      const savedSize = panelSizes.value.get(p)!
      // 添加动画类
      p.classList.add('animating')
      p.style.flex = 'none'
      p.style.height = `${savedSize}px`
      
      // 动画结束后移除类
      setTimeout(() => p.classList.remove('animating'), 250)
    })
    
    // 如果没有任何已设置的高度，平均分配
    if (panelsWithSetHeight.length === 0 && panelsWithoutSetHeight.length === 0) {
      const heightPerPanel = availableHeight / expandedPanels.length
      expandedPanels.forEach(p => {
        // 添加动画类
        p.classList.add('animating')
        p.style.flex = 'none'
        p.style.height = `${heightPerPanel}px`
        panelSizes.value.set(p, heightPerPanel)
        
        // 动画结束后移除类
        setTimeout(() => p.classList.remove('animating'), 250)
      })
    }
  }
  
  // 折叠的面板
  collapsedPanels.forEach(p => {
    p.style.flex = '0 0 auto'
    p.style.height = 'auto'
  })
}

function initializeResizeHandles() {
  if (!containerRef.value) return
  
  const panels = getPanels()
  
  // 为每对相邻的面板添加调整手柄
  for (let i = 0; i < panels.length - 1; i++) {
    const currentPanel = panels[i]
    const nextPanel = panels[i + 1]
    
    // 检查是否已经有手柄
    const existingHandle = currentPanel.nextElementSibling
    if (existingHandle && existingHandle.classList.contains('resize-handle')) {
      continue
    }
    
    // 创建调整手柄
    const handle = document.createElement('div')
    handle.className = 'resize-handle'
    handle.innerHTML = '<div class="resize-indicator"></div>'
    
    // 插入手柄
    currentPanel.insertAdjacentElement('afterend', handle)
    
    // 添加拖动事件
    handle.addEventListener('mousedown', (e) => startResize(e, currentPanel, nextPanel))
  }
}

function startResize(event: MouseEvent, topPanel: HTMLElement, bottomPanel: HTMLElement) {
  event.preventDefault()
  
  const startY = event.clientY
  const startTopHeight = topPanel.offsetHeight
  const startBottomHeight = bottomPanel.offsetHeight
  
  const onMouseMove = (e: MouseEvent) => {
    const deltaY = e.clientY - startY
    const newTopHeight = startTopHeight + deltaY
    const newBottomHeight = startBottomHeight - deltaY
    
    // 最小高度限制
    const minHeight = 45
    
    if (newTopHeight >= minHeight && newBottomHeight >= minHeight) {
      topPanel.style.flex = 'none'
      topPanel.style.height = `${newTopHeight}px`
      bottomPanel.style.flex = 'none'
      bottomPanel.style.height = `${newBottomHeight}px`
      
      // 保存新的大小
      panelSizes.value.set(topPanel, newTopHeight)
      panelSizes.value.set(bottomPanel, newBottomHeight)
    }
  }
  
  const onMouseUp = () => {
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }
  
  document.body.style.cursor = 'ns-resize'
  document.body.style.userSelect = 'none'
  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}

// 暴露方法以便外部调用
defineExpose({
  refresh: initializeResizeHandles,
  redistributeSpace
})
</script>

<style scoped>
.resizable-panel-group {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

/* 动画类 - 用于平滑的高度变化 */
:deep(.collapsible-panel.animating) {
  transition: height 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

:deep(.resize-handle) {
  height: 6px;
  background: #f8f9fa;
  border-top: 1px solid #e3e5e7;
  border-bottom: 1px solid #e3e5e7;
  cursor: ns-resize;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 0.2s;
  position: relative;
  z-index: 10;
}

:deep(.resize-handle:hover) {
  background: #e9ecef;
}

:deep(.resize-indicator) {
  width: 40px;
  height: 2px;
  background: #c5cdd5;
  border-radius: 1px;
  transition: background 0.2s;
}

:deep(.resize-handle:hover .resize-indicator) {
  background: #4a9eff;
}
</style>

<template>
  <div class="outline">
    <div class="outline-item">
      <span class="outline-marker">H1</span>
      <span class="outline-text">标题 1</span>
    </div>
    <div class="outline-item outline-item-level-2">
      <span class="outline-marker">H2</span>
      <span class="outline-text">标题 2</span>
    </div>
    <div class="outline-item outline-item-level-3">
      <span class="outline-marker">H3</span>
      <span class="outline-text">标题 3</span>
    </div>
  </div>
</template>

<style scoped>
.outline {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.outline-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 13px;
}

.outline-item:hover {
  background: #e8eaed;
  transform: translateX(2px);
}

.outline-item-level-2 {
  padding-left: 20px;
}

.outline-item-level-3 {
  padding-left: 36px;
}

.outline-marker {
  font-size: 10px;
  font-weight: 600;
  color: #5f6368;
  background: #f1f3f4;
  padding: 2px 6px;
  border-radius: 3px;
}

.outline-text {
  color: #202124;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>

<template>
  <div class="tags">
    <div class="tag-item">
      <span class="tag-icon">🏷️</span>
      <span class="tag-text">工作</span>
      <span class="tag-count">12</span>
    </div>
    <div class="tag-item">
      <span class="tag-icon">🏷️</span>
      <span class="tag-text">学习</span>
      <span class="tag-count">8</span>
    </div>
  </div>
</template>

<style scoped>
.tags {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tag-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 13px;
}

.tag-item:hover {
  background: #e8eaed;
  transform: translateX(2px);
}

.tag-icon {
  font-size: 14px;
}

.tag-text {
  flex: 1;
  color: #202124;
}

.tag-count {
  font-size: 11px;
  color: #5f6368;
  background: #f1f3f4;
  padding: 2px 6px;
  border-radius: 10px;
}
</style>

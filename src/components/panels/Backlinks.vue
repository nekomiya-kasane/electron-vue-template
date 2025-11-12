<template>
  <div class="backlinks">
    <div class="backlink-item">
      <span class="backlink-icon">🔗</span>
      <span class="backlink-text">来自文档 A 的引用</span>
    </div>
    <div class="backlink-item">
      <span class="backlink-icon">🔗</span>
      <span class="backlink-text">来自文档 B 的引用</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.backlinks {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.backlink-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 13px;
}

.backlink-item:hover {
  background: #e8eaed;
  transform: translateX(2px);
}

.backlink-icon {
  font-size: 14px;
}

.backlink-text {
  flex: 1;
  color: #202124;
}
</style>

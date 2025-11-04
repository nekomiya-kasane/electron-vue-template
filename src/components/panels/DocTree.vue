<template>
  <div class="doc-tree">
    <div class="tree-item">
      <span class="tree-icon">📁</span>
      <span class="tree-label">笔记本 1</span>
    </div>
    <div class="tree-item tree-item-child">
      <span class="tree-icon">📄</span>
      <span class="tree-label">文档 1</span>
    </div>
    <div class="tree-item tree-item-child">
      <span class="tree-icon">📄</span>
      <span class="tree-label">文档 2</span>
    </div>
    <div class="tree-item">
      <span class="tree-icon">📁</span>
      <span class="tree-label">笔记本 2</span>
    </div>
  </div>
</template>

<style scoped>
.doc-tree {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.tree-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 13px;
}

.tree-item:hover {
  background: #e8eaed;
  transform: translateX(2px);
}

.tree-item-child {
  padding-left: 24px;
}

.tree-icon {
  font-size: 14px;
}

.tree-label {
  flex: 1;
  color: #202124;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}
</style>

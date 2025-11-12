<template>
    <div class="main-layout">
        <TitleBar />
        <div class="context-area">
            <ExpansibleSidebar />
            <MainArea />
            <ExpansibleSidebar />
        </div>
        <StatusBar />
    </div>
</template>

<script lang="ts" setup>
import TitleBar from './TitleBar.vue'
import ExpansibleSidebar from './ExpansibleSidebar.vue'
import MainArea from './MainArea.vue'
import StatusBar from './StatusBar.vue'
</script>

<style scoped>
.main-layout {
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100vw;
}
</style>

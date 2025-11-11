<template>
    <div class="main-layout">
        <TopBar />
        <div class="context-area">
            <ExpansibleSideBar />
            <MainArea />
            <ExpansibleSideBar />
        </div>
        <StatusBar />
    </div>
</template>

<script lang="ts" setup>
import TopBar from './TopBar.vue'
import ExpansibleSideBar from './ExpansibleSideBar.vue'
import MainArea from './MainArea.vue'
import StatusBar from './StatusBar.vue'
</script>

<style scoped>

</style>

<script setup>
import { ref, provide } from 'vue'
import { useRoute } from 'vue-router'
import Navbar from '@/components/Navbar.vue'
import Header from '@/components/Header.vue'

import '@/assets/theme.css'

const isMobileNavOpen = ref(false)
const isNavbarCollapsed = ref(false)

provide('isNavbarCollapsed', isNavbarCollapsed)

const route = useRoute()

function handleCollapseChange(value) {
  isNavbarCollapsed.value = value
}
</script>

<template>
  <router-view v-if="route.meta.hideLayout" class="standalone-page" />
  <div v-else class="app-layout">
    <Navbar :is-open="isMobileNavOpen" @close="closeMobileNav" @collapse-change="handleCollapseChange" />

    <main class="main-container theme-blue">
      <Header @toggle-menu="toggleMobileNav" />

      <div class="content-wrapper">
        <div class="content-scroll">
          <router-view />
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  width: 100vw;
  height: 100vh;
}

.main-container {
  flex: 1;
  min-width: 0;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.content-wrapper {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 0 16px 16px 16px;
}

.content-scroll {
  flex: 1;
  min-height: 0;
  display: flex;
  overflow-y: auto;
  flex-direction: column;
}

@media (max-width: 767.98px) {
  .content-wrapper {
    padding: 0 12px 12px 12px;
  }

  .content-scroll {
    border-radius: 20px;
    padding: 16px;
  }
}
</style>
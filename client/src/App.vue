<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import Navbar from '@/components/Navbar.vue'
import Header from '@/components/Header.vue'

import '@/assets/theme.css'

const isMobileNavOpen = ref(false)
const route = useRoute()

function toggleMobileNav() {
  isMobileNavOpen.value = !isMobileNavOpen.value
}

function closeMobileNav() {
  isMobileNavOpen.value = false
}
</script>

<template>
  <router-view v-if ="route.meta.hideLayout" class="standalone-page"/>
  <div v-else class="app-layout">
    <Navbar :is-open="isMobileNavOpen" @close="closeMobileNav" />

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
  overflow: hidden;
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
  overflow: hidden;
}

.content-scroll {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding-top: 20px;
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
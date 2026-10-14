<script setup>
import { ref } from 'vue'
import Navbar from '@/components/Navbar.vue'
import Header from '@/components/Header.vue'

import '@/assets/theme.css'

// --- State Coordinator ---
const isMobileNavOpen = ref(false)

function toggleMobileNav() {
  isMobileNavOpen.value = !isMobileNavOpen.value
}

function closeMobileNav() {
  isMobileNavOpen.value = false
}
</script>

<template>
  <div class="d-flex min-vh-100 w-100 overflow-hidden">
    <!-- Sidebar Navbar -->
    <Navbar :is-open="isMobileNavOpen" @close="closeMobileNav" />

    <!-- Main Container -->
    <main class="flex-grow-1 d-flex flex-column theme-blue" style="min-width: 0;">
      <!-- Header -->
      <Header @toggle-menu="toggleMobileNav" />

      <!-- Content Wrapper -->
      <div class="content-wrapper flex-grow-1 d-flex flex-column px-3 pb-3 p-md-3">
        <!-- Content Box -->
        <div class="content-scroll flex-grow-1 p-3 p-md-4">
          <router-view />
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
/* --- Content Wrapper & Box --- */
.content-wrapper {
  min-height: 0;
  overflow: hidden;
}

.content-scroll {
  background-color: #f6f5f0;
  border-radius: 25px;
  overflow-y: auto;
  overflow-x: hidden;
  height: 100%;
}

@media (max-width: 767.98px) {
  .content-scroll {
    border-radius: 24px;
  }
}
</style>
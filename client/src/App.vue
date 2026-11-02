<script setup>
import { ref, provide, watch } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'
import Navbar from '@/components/Navbar.vue'
import Header from '@/components/Header.vue'

import { useAuth } from '@/composables/useAuth'

import '@/assets/theme.css'
import { API_URL } from './utils/api'

const isMobileNavOpen = ref(false)
const isNavbarCollapsed = ref(false)

provide('isNavbarCollapsed', isNavbarCollapsed)

const route = useRoute()
const { userId, setSession } = useAuth()

// Keep the current user's details fresh, since the saved copy can be out of date
watch(userId, async (id) => {
  if (!id) return
  try {
    const { data } = await axios.get(`${API_URL}/api/users/${id}`)
    if (id === userId.value) setSession(data)   // skip if they logged out in the meantime
  } catch (error) {
    console.log('There was an error: ' + error.message)
  }
}, { immediate: true })

function handleCollapseChange(value) {
  isNavbarCollapsed.value = value
}

function toggleMobileNav() {
  isMobileNavOpen.value = !isMobileNavOpen.value
}

function closeMobileNav() {
  isMobileNavOpen.value = false
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

  padding: 15px;       
  border-radius: 25px;
  background: #5d6be4;
  box-sizing: border-box;
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
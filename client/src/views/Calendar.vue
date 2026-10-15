<script setup>
import FolderTabs from '@/components/FolderTabs.vue'

const categories = [
  { id: 'cultural', label: 'CULTURAL CLUBS', theme: 'theme-green' },
  { id: 'workshops', label: 'WORKSHOPS', theme: 'theme-orange' },
  { id: 'career', label: 'CAREER', theme: 'theme-purple' }
]
</script>

<template>
  <div class="discover-container">
    <FolderTabs :tabs="categories" class="discover-folder">
      <!-- 1. CULTURAL CLUBS CARDS -->
      <template #cultural>
        <div class="cards-track">
          <!-- placeholder sebelum komponen card kamu jadi -->
          <div class="temp-card">Bidding Workshop</div>
          <div class="temp-card">Tung Tung Tung Angklung</div>
          <div class="temp-card">Rekreasi</div>
        </div>
      </template>

      <!-- 2. WORKSHOPS CARDS -->
      <template #workshops>
        <div class="cards-track">
          <div class="temp-card">Workshop Card 1</div>
          <div class="temp-card">Workshop Card 2</div>
        </div>
      </template>

      <!-- 3. CAREER CARDS -->
      <template #career>
        <div class="cards-track">
          <div class="temp-card">Career Fair 2026</div>
        </div>
      </template>
    </FolderTabs>
  </div>
</template>

<style scoped>
.discover-container {
  padding: 24px;
}

.discover-folder {
  width: 780px;
  height: 512px;
}

.discover-folder :deep(.folder-body) {
  flex: 1;
}

.cards-track {
  display: flex;
  gap: 16px;
  height: 100%;
  width: 100%;
  align-items: center;
}

/* styling dummy sementara */
.temp-card {
  width: 100%;
  height: 100%;
  background: white;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #333;
  font-weight: bold;
}
</style>
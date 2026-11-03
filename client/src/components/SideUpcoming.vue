<script setup>
import { computed } from 'vue'
import { useActivities } from '../composables/useActivities'
import { formatSession } from '../utils/formatSession'

const MAX_ITEMS = 10 

const { activities } = useActivities()

const upcoming = computed(() => {
  const now = new Date()
  const items = []

  for (const activity of activities.value) {
    if (!activity.event) continue

    for (const entry of activity.sessions || []) {
      if (entry.going !== 'attending') continue

      const session = activity.event.sessions.find(
        s => new Date(s.startTime).getTime() === new Date(entry.startTime).getTime()
      )
      if (session && new Date(session.endTime) > now) {
        items.push({
          key: `${activity.event._id}-${session.startTime}`,
          title: activity.event.title,
          when: formatSession(session),
          venue: activity.event.venue,
          start: new Date(session.startTime)
        })
      }
    }
  }

  return items.sort((a, b) => a.start - b.start).slice(0, MAX_ITEMS)
})
</script>

<template>
  <section class="side-upcoming" aria-label="Coming up">
    <h2 class="side-title">Coming up</h2>

    <div class="side-scroll-container">
      <ul v-if="upcoming.length" class="side-list">
        <li v-for="item in upcoming" :key="item.key" class="side-item">
          <span class="side-item-title">{{ item.title }}</span>
          <span class="side-item-meta">{{ item.when }}</span>
          <span v-if="item.venue" class="side-item-meta">{{ item.venue }}</span>
        </li>
      </ul>

      <p v-else class="side-empty">Nothing yet. Events you're attending will show up here.</p>
    </div>
  </section>
</template>

<style scoped>
.side-upcoming {
  display: flex;
  flex-direction: column;
  color: var(--color-black);
  height: 100%;      
  min-height: 0;
  overflow: hidden;
}

.side-title {
  margin: 8px 0 15px;
  text-align: center;
  font: 400 20px/1.1 'HeaderFont', sans-serif;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  flex-shrink: 0;     
}

.side-scroll-container {
  flex: 1;
  min-height: 0;
  overflow-y: auto !important;
  overflow-x: hidden;
  padding-right: 3px; /* Jarak dikit biar thumb scrollbar gak nempel banget ke border luar */
  
  /* Firefox modern sleek scrollbar */
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.25) transparent;
}

/* WebKit (Chrome, Edge, Safari) modern sleek scrollbar */
.side-scroll-container::-webkit-scrollbar {
  width: 4px; /* Tipis banget persis kayak referensi */
}

.side-scroll-container::-webkit-scrollbar-track {
  background: transparent; /* Track transparan */
}

.side-scroll-container::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.25); /* Warna gelap soft */
  border-radius: 10px; /* Bentuk pil rounded */
}

.side-scroll-container::-webkit-scrollbar-thumb:hover {
  background-color: rgba(0, 0, 0, 0.4);
}

.side-list {
  display: grid;
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.side-item,
.side-empty {
  padding: 15px;
  border-radius: 15px;
  background-color: var(--color-white);
}

.side-item {
  display: grid;
  justify-items: start;
  gap: 6px;
}

.side-item-title {
  font: 400 16px/1.15 'HeaderFont', sans-serif;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  overflow-wrap: anywhere;
}

.side-item-meta {
  margin: 0;
  font-size: 11px;
  line-height: 1.6;
  overflow-wrap: anywhere;
}

.side-empty {
  margin: 0;
  font-size: 11px;
  line-height: 1.6;
}
</style>
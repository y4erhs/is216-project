<script setup>
// Side panel: the next sessions the user is attending
import { computed } from 'vue'
import { useActivities } from '../composables/useActivities'
import { formatSession } from '../utils/formatSession'

const MAX_ITEMS = 5

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

    <ul v-if="upcoming.length" class="side-list">
      <li v-for="item in upcoming" :key="item.key" class="side-item">
        <span class="side-item-title">{{ item.title }}</span>
        <span class="side-item-meta">{{ item.when }}</span>
        <span v-if="item.venue" class="side-item-meta">{{ item.venue }}</span>
      </li>
    </ul>

    <p v-else class="side-empty">Nothing yet. Events you're attending will show up here.</p>
  </section>
</template>

<style scoped>
/* Same look as the "Registered events" panel in Lobby.vue */
.side-upcoming {
  display: flex;
  flex-direction: column;
  color: var(--color-black);
}

.side-title {
  margin: 8px 0 15px;
  text-align: center;
  font: 400 20px/1.1 'HeaderFont', sans-serif;
  letter-spacing: 0.03em;
  text-transform: uppercase;
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

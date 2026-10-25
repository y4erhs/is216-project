<script setup>
import { ref, computed, onMounted } from 'vue'
import FolderTabs from '../components/FolderTabs.vue'
import EventCard from '../components/EventCard.vue'
import { useActivities } from '../composables/useActivities'
import { useAuth } from '../composables/useAuth'

const {
  activities,
  loadActivities,
  setInterested,
  setGoing,
  deleteActivity,
} = useActivities()

const { userId } = useAuth()

const loading = ref(true)
const error = ref('')
const activeTab = ref('attending')

// Filter matches
const hasSession = (a, status) => a.sessions && a.sessions.some((s) => s.going === status)
const matches = {
  interested: (a) => a.interested,
  attending: (a) => hasSession(a, 'attending'),
  attended: (a) => hasSession(a, 'attended'),
}

// Sort by the earliest session relevant to the tab
function sortKey(a, tab) {
  if (!a.event?.sessions?.length) return 0
  const times =
    tab === 'interested'
      ? a.event.sessions.map((s) => new Date(s.startTime).getTime())
      : a.sessions
          .filter((s) => s.going === tab)
          .map((s) => new Date(s.startTime).getTime())
  return times.length ? Math.min(...times) : 0
}

const byStatus = computed(() => {
  const out = {
    interested: [],
    attending: [],
    attended: []
  }
  for (const t of ['attending', 'interested', 'attended']) {
    out[t] = activities.value
      .filter((a) => a.event && matches[t](a))
      .sort((a, b) => sortKey(a, t) - sortKey(b, t))
  }
  return out
})

// Dynamic tab labels with count badges e.g. ATTENDING (3)
const tabs = computed(() => [
  { 
    id: 'attending', 
    label: `ATTENDING (${byStatus.value.attending.length})`, 
    theme: 'theme-green' 
  },
  { 
    id: 'interested', 
    label: `INTERESTED (${byStatus.value.interested.length})`, 
    theme: 'theme-orange' 
  },
  { 
    id: 'attended', 
    label: `ATTENDED (${byStatus.value.attended.length})`, 
    theme: 'theme-purple' 
  },
])

// Map database activity sessions to dictionary { [sessionKey]: 'attending' | 'attended' }
function getGoingBySession(activity) {
  if (!activity.sessions) return {}
  return activity.sessions.reduce((acc, s) => {
    const key = new Date(s.startTime).getTime()
    acc[key] = s.going
    return acc
  }, {})
}

onMounted(async () => {
  try {
    await loadActivities()
  } catch {
    error.value = 'Could not load your activity.'
  }
  loading.value = false
})
</script>

<template>
  <div class="activity-page-container">
    <h1 class="header-style page-title">MY ACTIVITY</h1>

    <p v-if="!userId" class="status-msg text-danger">
      Please log in to see your activity.
    </p>
    <p v-else-if="loading" class="status-msg text-muted">
      Loading your activities...
    </p>
    <p v-else-if="error" class="status-msg text-danger">
      {{ error }}
    </p>

    <div v-else class="folder-wrapper">
      <FolderTabs :tabs="tabs" v-model="activeTab">
        <template v-for="t in tabs" :key="t.id" #[t.id]>
          <!-- Empty State -->
          <div v-if="byStatus[t.id].length === 0" class="empty-state-box">
            <p class="empty-text">
              No {{ t.id }} events yet. Mark events from the Discover page!
            </p>
          </div>

          <!-- 3-Column Balanced Grid -->
          <div v-else class="folder-cards-grid">
            <EventCard
              v-for="a in byStatus[t.id]"
              :key="a._id"
              :event="a.event"
              :variant="t.id"
              :interested="a.interested"
              :going-by-session="getGoingBySession(a)"
              @set-interested="(val) => setInterested(a.event._id, val)"
              @set-going="(payload) => setGoing(a.event._id, payload)"
              @remove-history="deleteActivity(a.event._id)"
              @invite-friends="(id) => console.log('Invite friends for event:', id)"
            />
          </div>
        </template>
      </FolderTabs>
    </div>
  </div>
</template>

<style scoped>
.activity-page-container {
  width: 100%;
  max-width: 1140px;
  margin: 0 auto;
  padding: 24px 16px;
  box-sizing: border-box;
}

.page-title {
  color: #ffffff;
  font-family: 'HeaderFont', cursive, sans-serif;
  font-size: 32px;
  font-weight: 900;
  margin-bottom: 24px;
  letter-spacing: 1px;
}

.status-msg {
  font-family: 'TextFont', sans-serif;
  font-size: 16px;
  font-weight: 600;
}

.folder-wrapper {
  width: 100%;
}

/* 3-COLUMN RESPONSIVE GRID FOR CARDS INSIDE FOLDER */
.folder-cards-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  width: 100%;
  align-items: stretch;
}

@media (max-width: 900px) {
  .folder-cards-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 600px) {
  .folder-cards-grid {
    grid-template-columns: 1fr;
  }
}

.empty-state-box {
  padding: 48px 20px;
  text-align: center;
  width: 100%;
}

.empty-text {
  font-family: 'TextFont', sans-serif;
  font-size: 15px;
  font-weight: 700;
  color: #f1f2f7;
  margin: 0;
}
</style>
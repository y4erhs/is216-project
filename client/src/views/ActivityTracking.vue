<script setup>
import { ref, computed, onMounted } from 'vue'
import FolderTabs from '../components/FolderTabs.vue'
import EventCard from '../components/EventCard.vue'
import CardInfo from '../components/CardInfo.vue'
import { useActivities } from '../composables/useActivities'
import { useAuth } from '../composables/useAuth'

const {
  activities,
  loadActivities,
  setInterested,
  setGoing,
  saveNote,
  deleteActivity,
} = useActivities()

const { userId } = useAuth()

const loading = ref(true)
const error = ref('')
const activeTab = ref('attending')

const selectedEvent = ref(null)
const showCardInfo = ref(false)

function handleCardClick(eventObj) {
  selectedEvent.value = eventObj
  showCardInfo.value = true
}

const hasSession = (a, status) => a.sessions && a.sessions.some((s) => s.going === status)
const matches = {
  interested: (a) => a.interested,
  attending: (a) => hasSession(a, 'attending'),
  attended: (a) => hasSession(a, 'attended'),
}

function sortKey(a, tab) {
  if (!a.event?.sessions?.length) return 0
  const times =
    tab === 'interested'
      ? a.event.sessions.map((s) => new Date(s.startTime).getTime())
      : (a.sessions || [])
        .filter((s) => s.going === tab)
        .map((s) => new Date(s.startTime).getTime())
  return times.length ? Math.min(...times) : 0
}

const byStatus = computed(() => {
  const out = { interested: [], attending: [], attended: [] }
  for (const t of ['attending', 'interested', 'attended']) {
    out[t] = activities.value
      .filter((a) => a.event?.sessions?.length && matches[t](a))
      .sort((a, b) => sortKey(a, t) - sortKey(b, t))
  }
  return out
})

const tabs = computed(() => [
  { id: 'attending', label: `ATTENDING (${byStatus.value.attending.length})`, theme: 'theme-green' },
  { id: 'interested', label: `INTERESTED (${byStatus.value.interested.length})`, theme: 'theme-orange' },
  { id: 'attended', label: `ATTENDED (${byStatus.value.attended.length})`, theme: 'theme-purple' },
])

function getGoingBySession(activity) {
  if (!activity.sessions) return {}
  return activity.sessions.reduce((acc, s) => {
    acc[new Date(s.startTime).getTime()] = s.going
    return acc
  }, {})
}

function onInviteFriends(id) {
  console.log('Invite friends for event:', id)
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
    <div class="header-row">
      <h1 class="header-style page-title">MY ACTIVITY</h1>
      <BaseButton class="action-pill-btn calendar-btn">
        VIEW MY CALENDAR
      </BaseButton>
    </div>

    <p v-if="!userId" class="status-msg text-danger">
      Please log in to see your activity.
    </p>
    <p v-else-if="loading" class="status-msg text-muted">
      Loading your activities...
    </p>
    <p v-else-if="error" class="status-msg text-danger">
      {{ error }}
    </p>

    <div v-else class="activity-main-layout">
      
      <div class="folder-wrapper">
        <FolderTabs :tabs="tabs" v-model="activeTab" @tab-change="showCardInfo = false">
          <template v-for="t in tabs" :key="t.id" #[t.id]>
            
            <div v-if="showCardInfo && selectedEvent" class="card-info-wrapper">
              <CardInfo :event="selectedEvent" @close="showCardInfo = false" />
            </div>

            <template v-else>
              <div v-if="byStatus[t.id].length === 0" class="empty-state-box">
                <p class="empty-text">
                  No {{ t.id }} events yet. Mark events from the Discover page!
                </p>
              </div>

              <div v-else class="folder-cards-grid">
                <EventCard 
                  v-for="a in byStatus[t.id]" 
                  :key="a._id" 
                  :event="a.event" 
                  :variant="t.id"
                  :interested="a.interested" 
                  :note="a.note || ''" 
                  :going-by-session="getGoingBySession(a)"
                  @set-interested="(val) => setInterested(a.event._id, val)"
                  @set-going="(payload) => setGoing(a.event._id, payload)"
                  @save-note="(text) => saveNote(a.event._id, text)" 
                  @remove-history="deleteActivity(a.event._id)"
                  @invite-friends="onInviteFriends" 
                  @card-click="handleCardClick(a.event)"
                />
              </div>
            </template>

          </template>
        </FolderTabs>
      </div>

      <div class="side-box-container">
      </div>

    </div>
  </div>
</template>

<style scoped>
html, body, #app {
  height: 100vh;
  margin: 0;
  overflow: hidden;
}

.activity-page-container {
  width: 100%;
  max-width: 1350px;
  height: 100vh;
  margin: 0 auto;
  padding: 16px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-shrink: 0;
}

.page-title {
  color: #ffffff;
  font-family: 'HeaderFont', cursive, sans-serif;
  font-size: 28px;
  font-weight: 900;
  margin: 0;
  letter-spacing: 1px;
}

.calendar-btn {
  background-color: #3b33c0 !important;
  color: #ffffff !important;
  font-weight: 800;
  padding: 0 16px;
  height: 36px;
  border-radius: 9999px;
}

.activity-main-layout {
  display: flex;
  gap: 20px;
  flex: 1;
  min-height: 0;
}

.folder-wrapper {
  width: 700px;
  height: 100%;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.folder-container {
  height: 100% !important;
  display: flex;
  flex-direction: column;
}

.folder-body {
  flex: 1;
  min-height: 0;
  overflow: hidden !important;
}

.inner-folder {
  height: 100% !important;
  overflow-y: auto !important;
}

.side-box-container {
  flex: 1;
  height: calc(100% - 38px);
  margin-top: 38px;         
  background-color: var(--color-white, #ffffff);
  border-radius: 24px;
  padding: 20px;
  box-sizing: border-box;
  box-shadow: 0 4px 14px rgba(10, 29, 43, 0.08);
  overflow-y: auto;
}

.card-info-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.folder-cards-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  width: 100%;
  align-items: stretch;
}

@media (max-width: 1024px) {
  .activity-main-layout {
    flex-direction: column;
    overflow-y: auto;
  }
  .folder-wrapper {
    width: 100%;
  }
  html, body, #app {
    height: auto;
    overflow: auto;
  }
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
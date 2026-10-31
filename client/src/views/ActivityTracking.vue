
<script setup>
import { ref, computed, onMounted, inject } from 'vue'
import FolderTabs from '../components/FolderTabs.vue'
import EventCard from '../components/EventCard.vue'
import CardInfo from '../components/CardInfo.vue'
import BaseButton from '../components/BaseButton.vue'
import { useActivities } from '../composables/useActivities'
import { useAuth } from '../composables/useAuth'

const isNavbarCollapsed = inject('isNavbarCollapsed')

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

const hasSession = (a, status) =>
  a.sessions && a.sessions.some(s => s.going === status)

const matches = {
  interested: (a) => a.interested,
  attending: (a) => hasSession(a, 'attending'),
  attended: (a) => hasSession(a, 'attended'),
}

function sortKey(a, tab) {
  if (!a.event?.sessions?.length) return 0

  const times =
    tab === 'interested'
      ? a.event.sessions.map(s => new Date(s.startTime).getTime())
      : (a.sessions || [])
          .filter(s => s.going === tab)
          .map(s => new Date(s.startTime).getTime())

  return times.length ? Math.min(...times) : 0
}

const byStatus = computed(() => {
  const out = {
    interested: [],
    attending: [],
    attended: [],
  }

  for (const t of ['attending', 'interested', 'attended']) {
    out[t] = activities.value
      .filter(a => a.event?.sessions?.length && matches[t](a))
      .sort((a, b) => sortKey(a, t) - sortKey(b, t))
  }

  return out
})

const tabs = computed(() => [
  {
    id: 'attending',
    label: `ATTENDING (${byStatus.value.attending.length})`,
    theme: 'theme-green',
  },
  {
    id: 'interested',
    label: `INTERESTED (${byStatus.value.interested.length})`,
    theme: 'theme-orange',
  },
  {
    id: 'attended',
    label: `ATTENDED (${byStatus.value.attended.length})`,
    theme: 'theme-purple',
  },
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

    <!-- PAGE HEADER -->
    <div class="header-row">
      <h1 class="header-style page-title">MY ACTIVITY</h1>

      <BaseButton class="action-pill-btn calendar-btn">
        VIEW MY CALENDAR
      </BaseButton>
    </div>

    <!-- LOADING / ERROR STATES -->
    <p v-if="!userId" class="status-msg text-danger">
      Please log in to see your activity.
    </p>

    <p v-else-if="loading" class="status-msg text-muted">
      Loading your activities...
    </p>

    <p v-else-if="error" class="status-msg text-danger">
      {{ error }}
    </p>

    <!-- MAIN CONTENT -->
    <div v-else class="activity-main-layout">

      <!-- LEFT: FOLDERS -->
      <div class="folder-wrapper">

        <FolderTabs
          :tabs="tabs"
          v-model="activeTab"
          @tab-change="showCardInfo = false"
        >

          <template v-for="t in tabs" :key="t.id" #[t.id]>

            <!-- CARD INFO -->
            <div
              v-if="showCardInfo && selectedEvent"
              class="card-info-wrapper"
            >
              <CardInfo
                :event="selectedEvent"
                @close="showCardInfo = false"
              />
            </div>

            <!-- FOLDER CONTENT -->
            <template v-else>

              <div class="folder-content-area">

                <!-- EMPTY STATE -->
                <div
                  v-if="byStatus[t.id].length === 0"
                  class="empty-state-box"
                >
                  <p class="empty-text">
                    No {{ t.id }} events yet.
                    Mark events from the Discover page!
                  </p>
                </div>

                <!-- EVENT CARDS -->
                <div
                  v-else
                  class="folder-cards-scroll-area"
                >
                  <div
                    class="folder-cards-grid"
                    :class="{
                      'navbar-collapsed': isNavbarCollapsed
                    }"
                  >

                    <EventCard
                      v-for="a in byStatus[t.id]"
                      :key="a._id"
                      :event="a.event"
                      :variant="t.id"
                      :interested="a.interested"
                      :note="a.note || ''"
                      :going-by-session="getGoingBySession(a)"
                      @set-interested="
                        val => setInterested(a.event._id, val)
                      "
                      @set-going="
                        payload => setGoing(a.event._id, payload)
                      "
                      @save-note="
                        text => saveNote(a.event._id, text)
                      "
                      @remove-history="
                        deleteActivity(a.event._id)
                      "
                      @invite-friends="onInviteFriends"
                      @card-click="handleCardClick(a.event)"
                    />

                  </div>
                </div>

              </div>
            </template>

          </template>
        </FolderTabs>
      </div>

      <!-- RIGHT: SIDE BOX -->
      <div class="side-box-container">
      </div>

    </div>
  </div>
</template>

<style scoped>
/* PAGE */
.activity-page-container {
  width: 100%;
  max-width: 1450px;
  height: 100vh;
  max-height: 100vh;
  margin: 0 auto;
  padding-left: 5px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* HEADER */
.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  flex-shrink: 0;
}

.page-title {
  color: #ffffff;
  font-family: 'HeaderFont', cursive, sans-serif;
  font-size: 25px;
  font-weight: 900;
  margin: 0;
  letter-spacing: 1px;
  padding-top: 0 !important;
}

.calendar-btn {
  background-color: #3b33c0 !important;
  color: #ffffff !important;
  font-weight: 800;
  padding: 0 16px;
  height: 36px;
  border-radius: 9999px;
}

/* MAIN LAYOUT */
.activity-main-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 200px;
  gap: 20px;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  align-items: stretch;
}

/* FOLDER WRAPPER */
/* FOLDER WRAPPER */
.folder-wrapper {
    width: 100%;
    height: 100%;
    min-width: 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

/* FOLDER TABS */
.folder-wrapper :deep(.folder-container) {
    flex: 1;
    width: 100%;
    height: 100%;
    min-height: 0;
    min-width: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.folder-wrapper :deep(.folder-body) {
    flex: 1;
    height: 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.folder-wrapper :deep(.inner-folder) {
    flex: 1;
    width: 100%;
    height: 100%;
    min-height: 0;
    min-width: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

/*
  FOLDER TABS
  These styles apply if the corresponding classes
  exist inside FolderTabs.vue.
*/
.folder-container {
  height: 100% !important;
  min-height: 0;
  max-height: 100% !important;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.folder-body {
  flex: 1;
  height: 0;
  min-height: 0;
  overflow: hidden !important;
  display: flex;
  flex-direction: column;
}

.inner-folder {
  flex: 1;
  height: 0 !important;
  min-height: 0;
  max-height: 100% !important;
  overflow: hidden !important;
  display: flex;
  flex-direction: column;
}

/* FOLDER CONTENT */
.folder-content-area {
  flex: 1;
  min-height: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* SCROLLABLE EVENT AREA */
.folder-cards-scroll-area {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
}

/* EVENT GRID */
.folder-cards-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  width: 100%;
  align-content: start;
  transition: grid-template-columns 0.3s ease;
}

.folder-cards-grid.navbar-collapsed {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

/* RESPONSIVE GRID */
@media (max-width: 1200px) {
  .folder-cards-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .folder-cards-grid.navbar-collapsed {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .folder-cards-grid,
  .folder-cards-grid.navbar-collapsed {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 600px) {
  .folder-cards-grid,
  .folder-cards-grid.navbar-collapsed {
    grid-template-columns: 1fr;
  }
}

/* EMPTY STATE */
.empty-state-box {
  flex: 1;
  min-height: 0;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 48px 20px;
  text-align: center;
}

.empty-text {
  font-family: 'TextFont', sans-serif;
  font-size: 15px;
  font-weight: 700;
  color: #f1f2f7;
  margin: 0;
}

/* RIGHT SIDEBAR BOX */
.side-box-container {
  height: calc(100% - 38px);
  margin-top: 38px;
  background-color: var(--color-white, #ffffff);
  border-radius: 25px;
  padding: 20px;
  box-sizing: border-box;
  box-shadow: 0 4px 14px rgba(10, 29, 43, 0.08);
  overflow-y: auto;
  min-width: 0;
}

/* CARD INFO */
.card-info-wrapper {
    flex: 1;
    width: 100%;
    height: 100%;
    min-height: 0;
    min-width: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}
</style>

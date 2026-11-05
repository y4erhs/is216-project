
<script setup>
import { ref, computed, onMounted, onBeforeUnmount, inject } from 'vue'
import { useRouter } from 'vue-router'
import FolderTabs from '../components/FolderTabs.vue'
import EventCard from '../components/EventCard.vue'
import CardInfo from '../components/CardInfo.vue'
import SideUpcoming from '../components/SideUpcoming.vue'
import BaseButton from '../components/BaseButton.vue'
import { useActivities } from '../composables/useActivities'
import { useAuth } from '../composables/useAuth'
import { vAutoScrollbar } from '../directives/autoScrollbar'

const router = useRouter()
const isNavbarCollapsed = inject('isNavbarCollapsed')
const showUpcomingMobile = ref(false)

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

// Match Discover's responsive breakpoint.
const isMobile = ref(false)

function updateScreenSize() {
  isMobile.value = window.innerWidth <= 768
}

// Open or toggle CardInfo.
function handleCardClick(eventObj) {
  const currentId = selectedEvent.value?._id || selectedEvent.value?.id
  const clickedId = eventObj?._id || eventObj?.id

  if (showCardInfo.value && currentId === clickedId) {
    closeCardInfo()
    return
  }

  selectedEvent.value = eventObj
  showCardInfo.value = true
}

function closeCardInfo() {
  showCardInfo.value = false
  selectedEvent.value = null
}

// Activity status filters.
const hasSession = (a, status) =>
  a.sessions && a.sessions.some(s => s.going === status)

const matches = {
  interested: a => a.interested,
  attending: a => hasSession(a, 'attending'),
  attended: a => hasSession(a, 'attended'),
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

const activeEvents = computed(() => {
  return byStatus.value[activeTab.value] || []
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

// Get activity data for the selected event.
const selectedActivity = computed(() => {
  if (!selectedEvent.value) return null

  return activities.value.find(
    a =>
      (a.event?._id || a.event?.id) ===
      (selectedEvent.value._id || selectedEvent.value.id)
  )
})

const isSelectedEventAttending = computed(() => {
  const act = selectedActivity.value

  if (!act || !act.sessions) return false

  return act.sessions.some(s => s.going === 'attending')
})

function onInviteFriends(id) {
  console.log('Invite friends for event:', id)
  router.push('/lobby')
}

function handleTabChange() {
  closeCardInfo()
}

onMounted(async () => {
  updateScreenSize()
  window.addEventListener('resize', updateScreenSize)

  try {
    await loadActivities()
  } catch {
    error.value = 'Could not load your activity.'
  }

  loading.value = false
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateScreenSize)
})
</script>

<template>
  <div class="activity-page-container">

    <!-- PAGE HEADER -->
    <div class="header-row">
      <h1 class="header-style page-title">MY ACTIVITY</h1>

      <BaseButton
        class="calendar-btn theme-purple"
        variant="primary"
        @click="$router.push('/calendar')"
      >
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
          @tab-change="handleTabChange"
        >
          <div class="home-folder-content">

            <!-- DESKTOP: CardInfo replaces the event list -->
            <div
              v-if="showCardInfo && selectedEvent && !isMobile"
              class="card-info-wrapper"
            >
              <CardInfo
                :event="selectedEvent"
                :is-attending="isSelectedEventAttending"
                :initial-note="selectedActivity?.note || ''"
                @close="closeCardInfo"
                @save-note="text => saveNote(selectedEvent._id || selectedEvent.id, text)"
              />
            </div>

            <!-- EVENT LIST: visible on mobile -->
            <div v-else class="folder-content-area">

              <!-- EMPTY STATE -->
              <div
                v-if="activeEvents.length === 0"
                class="empty-state-box"
              >
                <p class="empty-text">
                  No {{ activeTab }} events yet.
                  Mark events from the Discover page!
                </p>
              </div>

              <!-- EVENT GRID -->
              <div
                v-else
                class="folder-cards-scroll-area"
                v-auto-scrollbar
              >
                <div
                  class="folder-cards-grid"
                  :class="{ 'navbar-collapsed': isNavbarCollapsed }"
                >

                  <div
                    v-for="a in activeEvents"
                    :key="a._id"
                    class="activity-event-item"
                  >

                    <!-- MOBILE: CardInfo replaces only the selected card -->
                    <CardInfo
                      v-if="
                        isMobile &&
                        showCardInfo &&
                        (selectedEvent?._id || selectedEvent?.id) ===
                        (a.event?._id || a.event?.id)
                      "
                      :event="selectedEvent"
                      :is-attending="isSelectedEventAttending"
                      :initial-note="selectedActivity?.note || ''"
                      @close="closeCardInfo"
                      @save-note="text => saveNote(selectedEvent._id || selectedEvent.id, text)"
                    />

                    <!-- NORMAL EVENT CARD -->
                    <EventCard
                      v-else
                      :event="a.event"
                      :variant="activeTab"
                      :interested="a.interested"
                      :note="a.note || ''"
                      :going-by-session="getGoingBySession(a)"
                      @set-interested="val => setInterested(a.event._id, val)"
                      @set-going="payload => setGoing(a.event._id, payload)"
                      @save-note="text => saveNote(a.event._id, text)"
                      @remove-history="deleteActivity(a.event._id)"
                      @invite-friends="onInviteFriends"
                      @card-click="handleCardClick(a.event)"
                    />

                  </div>

                </div>
              </div>
            </div>

          </div>
        </FolderTabs>
      </div>

      <!-- RIGHT: SIDE BOX -->
      <div class="side-box-container">

        <button
          type="button"
          class="upcoming-mobile-toggle"
          @click="showUpcomingMobile = !showUpcomingMobile"
          :aria-expanded="showUpcomingMobile"
        >
          <span class="side-box-title">UPCOMING PLANS</span>

          <span class="upcoming-chevron">
            {{ showUpcomingMobile ? '-' : '+' }}
          </span>
        </button>

        <div
          class="upcoming-content"
          :class="{ 'is-open': showUpcomingMobile }"
        >
          <SideUpcoming />
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
/* =========================================
   PAGE
========================================= */

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

.upcoming-mobile-toggle {
  display: none;
}

.upcoming-content {
  width: 100%;
  height: 100%;
}

/* =========================================
   HEADER
========================================= */

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
  width: 200px;
  min-width: 200px;
  flex-shrink: 0;
  box-sizing: border-box;
}

/* =========================================
   MAIN LAYOUT
========================================= */

.activity-main-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 200px;
  gap: 20px;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  align-items: stretch;
}

/* =========================================
   FOLDER WRAPPER
========================================= */

.folder-wrapper {
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

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
  flex: 1 !important;
  height: 0 !important;
  min-height: 0 !important;
  display: flex;
  flex-direction: column;
  overflow: hidden !important;
}

.folder-wrapper :deep(.inner-folder) {
  flex: 1 !important;
  width: 100%;
  height: 100% !important;
  min-height: 0;
  max-height: 100% !important;
  display: flex;
  flex-direction: column;
  overflow-y: auto !important;
  overflow-x: hidden !important;
  padding: 0 6px;
}

/* =========================================
   FOLDER CONTENT
========================================= */

.home-folder-content {
  flex: 1;
  min-height: 0;
  min-width: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.folder-content-area {
  flex: 1;
  min-height: 0;
  min-width: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* =========================================
   CARD INFO — DESKTOP
========================================= */

.card-info-wrapper {
  flex: 1;
  width: 100%;
  height: 100%;
  min-height: 0;
  min-width: 0;
  display: flex;
  overflow: hidden;
}

/* =========================================
   EVENT GRID
========================================= */

.folder-cards-scroll-area {
  flex: 1;
  min-height: 0;
  min-width: 0;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-gutter: stable both-edges;
}

.folder-cards-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  width: 100%;
  align-content: start;
  transition: grid-template-columns 0.3s ease;
  margin: 15px 0;
}

.folder-cards-grid.navbar-collapsed {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

/* Each event owns its own slot */
.activity-event-item {
  display: flex;
  flex-direction: column;
  align-self: start;
  width: 100%;
  min-width: 0;
  height: fit-content;
}

/* Inline CardInfo uses the same width as its event slot */
.activity-event-item > :deep(.event-detail-box) {
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

/* =========================================
   EMPTY STATE
========================================= */

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

/* =========================================
   RIGHT SIDEBAR
========================================= */

.side-box-container {
  width: 100%;
  height: 100%;
  margin-top: 0;
  background-color: var(--color-grey);
  border-radius: 25px;
  padding: 16px 7px 2px 15px;
  box-sizing: border-box;
  box-shadow: 0 4px 14px rgba(10, 29, 43, 0.08);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
}

/* =========================================
   MOBILE & TABLET
========================================= */

@media (max-width: 991.98px) {

  /* PAGE HEIGHT */

  .activity-page-container {
    height: 100dvh;
    max-height: 100dvh;
    padding-left: 0;
    overflow: hidden;
  }

  /* HEADER */

  .header-row {
    margin-bottom: 10px;
  }

  .page-title {
    padding-left: 8px;
    font-size: 22px;
  }

  .calendar-btn {
    width: auto;
    min-width: 0;
    height: 35px;
    padding: 0 12px;
    font-size: 11px;
    white-space: nowrap;
    margin-right: 8px;
  }

  /* STACK LAYOUT */

  .activity-main-layout {
    display: flex;
    flex-direction: column;
    flex: 1 1 0;
    min-height: 0;
    overflow: hidden;
    gap: 12px;
  }

  /* UPCOMING PLANS */

  .side-box-container {
    order: -1;
    flex: 0 0 auto;
    width: 100%;
    height: auto;
    padding: 4px 15px;
    border-radius: 18px;
  }

  .side-box-title {
    font-family: 'HeaderFont';
    color: var(--color-dark-grey);
  }

  .upcoming-mobile-toggle {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 5px 0;
    border: none;
    background: transparent;
    font-family: 'HeaderFont', sans-serif !important;
    font-size: 12px;
    cursor: pointer;
  }

  .upcoming-chevron {
    font-size: 20px;
    line-height: 1;
    color: var(--color-dark-grey);
    padding-top: 4px;
  }

  .upcoming-content {
    height: 0;
    max-height: 0;
    overflow: hidden;
    transition: height 0.3s ease, max-height 0.3s ease;
  }

  .upcoming-content.is-open {
    height: 220px;
    max-height: 220px;
  }

  .upcoming-content.is-open :deep(.side-upcoming) {
    height: 100%;
    min-height: 0;
  }

  /* FOLDER TAKES REMAINING HEIGHT */

  .folder-wrapper {
    flex: 1 1 0;
    height: auto;
    min-height: 0;
  }

  /* KEEP TABS VISIBLE */

.folder-wrapper :deep(.tabs-header) {
  overflow-x: auto;
  flex-wrap: nowrap;
  padding-bottom: 0 !important;
  margin-bottom: -1px;
}

.folder-wrapper :deep(.tabs-header > *) {
  margin-bottom: 0 !important;
}

.folder-wrapper :deep(.folder-container) {
  gap: 0 !important;
}

  .folder-wrapper :deep(.inner-folder) {
    overflow: hidden !important;
    padding: 0;
  }

  .folder-wrapper :deep(.folder-body) {
    flex: 1 1 0 !important;
    width: 100%;
    height: 0 !important;
    min-width: 0;
    min-height: 0 !important;
    overflow: hidden !important;
  }



  /* FOLDER CONTENT */

  .folder-wrapper .home-folder-content,
  .folder-wrapper .folder-content-area {
    flex: 1 1 0;
    width: 100%;
    height: 0;
    min-width: 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  /* EVENT SCROLL AREA */

  .folder-wrapper .folder-cards-scroll-area {
    flex: 1 1 0;
    width: 100%;
    height: 0;
    min-width: 0;
    min-height: 0;
    overflow-y: auto;
    overflow-x: hidden;
    box-sizing: border-box;
  }

  /* ONE COLUMN ON PHONE */

  .folder-wrapper .folder-cards-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) !important;
    gap: 12px;
    width: 100%;
    min-width: 0;
    align-content: start;
    box-sizing: border-box;
    margin: 10px 0;
  }

  .folder-wrapper .activity-event-item {
    width: 100%;
    min-width: 0;
    max-width: 100%;
    box-sizing: border-box;
  }
}

/* =========================================
   TABLET: TWO EVENT COLUMNS
========================================= */

@media (min-width: 768px) and (max-width: 991.98px) {

  .folder-wrapper .folder-cards-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
  }

.folder-wrapper :deep(.tabs-header) {
  overflow-x: auto;
  flex-wrap: nowrap;
  padding-bottom: 0 !important;
  margin-bottom: -1px;
}

.folder-wrapper :deep(.tabs-header > *) {
  margin-bottom: 0 !important;
}

.folder-wrapper :deep(.folder-container) {
  gap: 0 !important;
}

  .folder-wrapper :deep(.inner-folder) {
    overflow: hidden !important;
    padding: 0;
  }

  .folder-wrapper :deep(.folder-body) {
    flex: 1 1 0 !important;
    width: 100%;
    height: 0 !important;
    min-width: 0;
    min-height: 0 !important;
    overflow: hidden !important;
  }
}
</style>

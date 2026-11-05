<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import axios from 'axios'

import EventCard from '../components/EventCard.vue'
import BaseButton from '../components/BaseButton.vue'
import FolderTabs from '../components/FolderTabs.vue'
import BaseInput from '../components/BaseInput.vue'
import CardInfo from '../components/CardInfo.vue'
import SideUpcoming from '../components/SideUpcoming.vue'

import { useActivities } from '../composables/useActivities'
import { useAuth } from '../composables/useAuth'
import { INTERESTS, interestTheme } from '../utils/interests'
import { API_URL } from '../utils/api'
import { vAutoScrollbar } from '../directives/autoScrollbar'

const {
    activityMap,
    loadActivities,
    setInterested,
    setGoing,
    saveNote
} = useActivities()
const { userId } = useAuth()

const ONE_DAY_MS = 24 * 60 * 60 * 1000
const REFRESH_DELAY_MS = 1500

const recommendations = ref([])
const allEvents = ref([])   // this month's and later events, for the All and interest tabs
const feedType = ref('weekly')
const loading = ref(false)
const allLoading = ref(false)
const updating = ref(false)
const showUpcomingMobile = ref(false)

// Date filters
const fromDate = ref('')
const toDate = ref('')
const appliedFromDate = ref('')
const appliedToDate = ref('')

// Interest folder color mapping
const interestThemeOrder = [
    'theme-orange',
    'theme-yellow',
    'theme-green',
    'theme-purple'
]

const myInterests = ref([])

const interestTabs = computed(() => [
    {
        id: 'all',
        label: 'All',
        theme: 'theme-light'
    },
    {
        id: 'for-you',
        label: 'For you',
        theme: 'theme-grey'
    },
    ...INTERESTS
        .filter(interest => myInterests.value.includes(interest.id))
        .map((interest, index) => ({
            id: interest.id,
            label: interest.label,
            theme: interestThemeOrder[index % interestThemeOrder.length]
        }))
])

async function loadMyInterests() {
    try {
        const response = await axios.get(`${API_URL}/api/users/${userId.value}/preferences`)
        myInterests.value = response.data
    } catch (error) {
        console.log('There was an error: ' + error.message)
    }
}

const activeInterest = ref('all')

// Load recommendations from backend
async function loadRecommendations() {
    loading.value = true

    const url = `${API_URL}/api/recommendations/user/${userId.value}?feedType=${feedType.value}`

    try {
        let response = await axios.get(url)

        if (response.data.length === 0) {
            await axios.post(
                `${API_URL}/api/recommendations/generate`,
                {
                    userId: userId.value,
                    feedType: feedType.value
                }
            )

            response = await axios.get(url)
        }

        recommendations.value = response.data

    } catch (error) {
        console.log('There was an error: ' + error.message)
    } finally {
        loading.value = false
    }
}

// Load the events for the All and interest tabs
async function loadAllEvents() {
    allLoading.value = true

    try {
        const thisMonth = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Singapore' }).slice(0, 7)
        const response = await axios.get(`${API_URL}/api/events`, { params: { from: `${thisMonth}-01` } })
        allEvents.value = response.data
    } catch (error) {
        console.log('There was an error: ' + error.message)
    } finally {
        allLoading.value = false
    }
}

// Apply date filters
function applyFilters() {
    if (
        fromDate.value &&
        toDate.value &&
        fromDate.value > toDate.value
    ) {
        alert('The FROM date cannot be later than the TO date.')
        return
    }

    appliedFromDate.value = fromDate.value
    appliedToDate.value = toDate.value
}

// Clear date filters
function clearFilters() {
    fromDate.value = ''
    toDate.value = ''
    appliedFromDate.value = ''
    appliedToDate.value = ''
}

// Get event dates from event/session data
function getEventDates(event) {
    const dates = []

    if (event?.sessions?.length) {
        event.sessions.forEach(session => {
            const date =
                session.startTime ||
                session.startDate ||
                session.date

            if (date) {
                dates.push(new Date(date))
            }
        })
    }

    const directDate =
        event?.startDate ||
        event?.startTime ||
        event?.date

    if (directDate) {
        dates.push(new Date(directDate))
    }

    return dates.filter(date => !Number.isNaN(date.getTime()))
}

// Check whether event matches date filters
function matchesDateFilter(event) {
    const dates = getEventDates(event)

    if (dates.length === 0) return true

    const from = appliedFromDate.value
        ? new Date(`${appliedFromDate.value}T00:00:00`)
        : null

    const to = appliedToDate.value
        ? new Date(`${appliedToDate.value}T23:59:59`)
        : null

    return dates.some(date => {
        if (from && date < from) return false
        if (to && date > to) return false
        return true
    })
}

function matchesInterestFilter(event) {
    return (event?.tags || []).includes(activeInterest.value)
}

const filteredCards = computed(() => {
    if (activeInterest.value === 'for-you') {
        return recommendations.value
            .filter(rec => rec.event && matchesDateFilter(rec.event))
            .map(rec => ({ key: rec._id, event: rec.event, score: rec.score, reason: rec.reasons?.[0] || '' }))
    }

    return allEvents.value
        .filter(event => matchesDateFilter(event) &&
            (activeInterest.value === 'all' || matchesInterestFilter(event)))
        .map(event => ({ key: event._id, event, score: null, reason: '' }))
})

const cardsLoading = computed(() =>
    activeInterest.value === 'for-you' ? loading.value : allLoading.value)

function picksAreOld() {
    if (recommendations.value.length === 0) return false

    const newest = Math.max(...recommendations.value.map(rec => new Date(rec.createdAt).getTime()))
    return Date.now() - newest > ONE_DAY_MS
}

async function regenerateRecommendations() {
    updating.value = true

    try {
        await axios.post(
            `${API_URL}/api/recommendations/generate`,
            {
                userId: userId.value,
                feedType: feedType.value
            }
        )

        const url = `${API_URL}/api/recommendations/user/${userId.value}?feedType=${feedType.value}`

        const response = await axios.get(url)
        recommendations.value = response.data

    } catch (error) {
        console.log('There was an error: ' + error.message)
    } finally {
        updating.value = false

        if (refreshAgain) {
            refreshAgain = false
            regenerateRecommendations()
        }
    }
}

let refreshTimer = null
let refreshAgain = false

async function lessLikeThis(eventId) {
    const rec = recommendations.value.find(item => item.event?._id === eventId)
    if (!rec) return

    recommendations.value = recommendations.value.filter(item => item._id !== rec._id)

    try {
        await axios.put(`${API_URL}/api/recommendations/${rec._id}/less-like`, { userId: userId.value })
    } catch (error) {
        console.log('There was an error: ' + error.message)
        recommendations.value = [...recommendations.value, rec].sort((a, b) => b.score - a.score)
        return
    }

    clearTimeout(refreshTimer)
    refreshTimer = setTimeout(() => {
        if (updating.value) refreshAgain = true
        else regenerateRecommendations()
    }, REFRESH_DELAY_MS)
}

onBeforeUnmount(() => clearTimeout(refreshTimer))

onMounted(async () => {
    loadActivities()
    loadAllEvents()
    loadMyInterests()

    await loadRecommendations()

    const interestsChanged = localStorage.getItem('interestsChanged') === 'true'
    if (interestsChanged) localStorage.removeItem('interestsChanged')

    if (interestsChanged || picksAreOld()) regenerateRecommendations()
})

const selectedEvent = ref(null)
const showCardInfo = ref(false)

function handleCardClick(event) {
    selectedEvent.value = event
    showCardInfo.value = true
}

</script>

<template>
    <div class="home-page-container">

        <div class="discover-container">

            <!-- PAGE HEADER + FILTERS -->
            <div class="discover-header">

                <h5 class="discover-title">
                    DISCOVER
                </h5>

                <div class="discover-controls">

                    <router-link to="/profile" class="edit-interest-link">
                        + EDIT INTEREST
                    </router-link>

                    <div class="date-filter">
                        <BaseInput v-model="fromDate" type="date" placeholder="FROM" />
                    </div>

                    <div class="date-filter">
                        <BaseInput v-model="toDate" type="date" placeholder="TO" />
                    </div>

                    <BaseButton class="theme-green date-filter-buttons" variant="primary" @click="applyFilters">
                        APPLY
                    </BaseButton>

                    <BaseButton class="date-filter-buttons clear-btn" variant="outline-main" @click="clearFilters">
                        CLEAR
                    </BaseButton>

                    <BaseButton class="calendar-btn theme-purple" variant="primary" @click="$router.push('/calendar')">
                        VIEW MY CALENDAR
                    </BaseButton>
                </div>
            </div>

            <!-- MAIN CONTENT -->
            <div class="discover-main-layout">

                <!-- LEFT: INTEREST FOLDERS -->
                <div class="folder-wrapper">

                    <FolderTabs :tabs="interestTabs" v-model="activeInterest" default-active="all"
                        :show-mobile-pills="true" @tab-change="showCardInfo = false">
                        @tab-change="showCardInfo = false">

                        <div class="home-folder-content">

                            <!-- CARD INFO -->
                            <div v-if="showCardInfo && selectedEvent" class="card-info-wrapper">
                                <CardInfo :event="selectedEvent"
                                    :is-attending="Object.values(activityMap[selectedEvent._id || selectedEvent.id]?.sessions || {}).includes('attending')"
                                    @close="showCardInfo = false"
                                    :initial-note="activityMap[selectedEvent._id || selectedEvent.id]?.note || ''"
                                    @save-note="text => saveNote(selectedEvent._id || selectedEvent.id, text)" />
                            </div>

                            <!-- EVENT GRID -->
                            <div v-else class="folder-content-area">

                                <div v-if="cardsLoading" class="folder-status-state">
                                    <p>Finding events for you...</p>
                                </div>

                                <div v-else-if="filteredCards.length === 0" class="folder-status-state">
                                    <p class="empty-text">
                                        No events found. Try another interest or adjust your filters!
                                    </p>
                                </div>

                                <div v-else class="folder-cards-scroll-area auto-scrollbar" v-auto-scrollbar
                                    :class="{ updating: updating }">

                                    <div class="folder-cards-grid">

                                        <EventCard v-for="card in filteredCards" :key="card.key" :event="card.event"
                                            :score="card.score" :reason="card.reason" show-hide
                                            :interested="activityMap[card.event._id]?.interested || false"
                                            :going-by-session="activityMap[card.event._id]?.sessions || {}"
                                            @set-interested="v => setInterested(card.event._id, v)"
                                            @set-going="p => setGoing(card.event._id, p)" @less-like-this="lessLikeThis"
                                            @card-click="handleCardClick" />

                                    </div>
                                </div>

                            </div>
                        </div>

                    </FolderTabs>

                </div>

                <!-- SIDE BOX -->
                <div class="side-box-container">

                    <!-- Mobile collapse button -->
                    <button class="upcoming-mobile-toggle" @click="showUpcomingMobile = !showUpcomingMobile"
                        :aria-expanded="showUpcomingMobile">
                        <span class="side-box-title">UPCOMING PLANS</span>

                        <span class="upcoming-chevron">
                            {{ showUpcomingMobile ? '-' : '+' }}
                        </span>
                    </button>

                    <!-- Existing upcoming events component -->
                    <div class="upcoming-content" :class="{ 'is-open': showUpcomingMobile }">
                        <SideUpcoming />
                    </div>

                </div>

            </div>

            <!-- UPDATING MESSAGE -->
            <p v-if="updating" class="updating-message">
                Updating your picks...
            </p>

        </div>
    </div>
</template>

<style scoped>
/* =========================================
   MAIN PAGE (1 SCREEN VIEW)
========================================= */

.home-page-container {
    width: 100%;
    max-width: 1450px;
    height: 100vh;
    max-height: 100vh;
    margin: 0 auto;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.discover-container {
    flex: 1;
    min-height: 0;
    min-width: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

/* =========================================
   DISCOVER HEADER
========================================= */

.discover-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 15px;
    margin-bottom: 12px;
    flex-shrink: 0;
    min-width: 0;
}

.discover-title {
    margin: 0;
    padding-left: 8px;
    color: #fff;
    font: 400 25px/1.1 'HeaderFont', sans-serif;
    text-transform: uppercase;
}

.discover-controls {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 9px;
    min-width: 0;
}

.discover-controls :deep(.btn-custom) {
    min-height: 35px;
    height: 35px;
    box-sizing: border-box;
    white-space: nowrap;
}

.edit-interest-link {
    color: #f1f2f7;
    font-family: 'TextFont', sans-serif;
    font-size: 11px;
    font-weight: 800;
    text-decoration: none;
    white-space: nowrap;
    margin-right: 5px;
    transition: opacity .2s ease;
}

.edit-interest-link:hover {
    opacity: .7;
    color: #fff;
}

.calendar-btn {
    width: 200px;
    min-width: 200px;
    flex-shrink: 0;
    box-sizing: border-box;
}

/* =========================================
   DATE FILTERS
========================================= */

.date-filter {
    width: 125px;
    flex-shrink: 0;
}

.date-filter-buttons {
    width: 110%;
}

.clear-btn {
    border-color: var(--color-white);
    color: var(--color-white);
}

/* =========================================
   MAIN CONTENT LAYOUT
========================================= */

.discover-main-layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 200px;
    gap: 20px;
    flex: 1;
    min-height: 0;
    overflow: hidden;
    align-items: stretch;
    /* Auto sync height kiri dan kanan */
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
    height: 100% !important;
    min-height: 0;
    max-height: 100% !important;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.folder-wrapper :deep(.folder-body) {
    flex: 1 !important;
    height: 0 !important;
    min-height: 0 !important;
    overflow: hidden !important;
    display: flex;
    flex-direction: column;
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
   CARD INFO
========================================= */

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

.card-info-wrapper :deep(.event-detail-box) {
    flex: 1;
    width: 100%;
    height: 100%;
    min-height: 0;
    min-width: 0;
}

/* =========================================
   EVENT CARDS
========================================= */

.folder-cards-scroll-area {
    flex: 1;
    min-height: 0;
    min-width: 0;
    overflow-y: visible;
    overflow-x: hidden;
    transition: opacity .2s ease;
    scrollbar-gutter: stable both-edges;

}

.folder-cards-scroll-area.updating {
    opacity: .5;
}

.folder-cards-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
    width: 100%;
    align-content: start;
    margin: 15px 0;
}

/* =========================================
   EMPTY / LOADING STATES
========================================= */

.folder-status-state {
    flex: 1;
    min-height: 0;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    text-align: center;
    padding: 30px 20px;
    box-sizing: border-box;
    color: #f1f2f7;
    font-family: 'TextFont', sans-serif;
    font-size: 14px;
}

.folder-status-state p {
    margin: 0;
}

.empty-text {
    font-weight: 700;
}

/* =========================================
   SIDE BOX (Height matches folder-body exactly)
========================================= */

.side-box-container {
    width: 100%;
    height: 100%;
    min-height: 0;
    background-color: var(--color-grey);
    border-radius: 25px;
    padding: 16px 7px 2px 15px;
    box-sizing: border-box;
    box-shadow: 0 4px 14px rgba(10, 29, 43, .08);
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
   UPDATING MESSAGE
========================================= */

.updating-message {
    color: #f1f2f7;
    font-size: 12px;
    margin: 6px 0 0;
    flex-shrink: 0;
}

@media (max-width: 991.98px) {

    /* =================================
       MAIN PAGE — PHONE HEIGHT
    ================================= */

    .home-page-container {
        height: 100dvh;
        min-height: 0;
        max-height: 100dvh;
        overflow: hidden;
    }

    .discover-container {
        display: flex;
        flex-direction: column;
        flex: 1 1 0;
        min-height: 0;
        overflow: hidden;
    }


    /* =================================
   DISCOVER HEADER + DATE FILTERS
================================= */

    .discover-header {
        display: flex;
        flex-direction: column;
        align-items: stretch;
        gap: 10px;
        width: 100%;
    }

    .discover-title {
        padding-left: 8px;
        font-size: 22px;
    }

    .discover-controls {
        display: grid;
        grid-template-columns: 1.5fr 1.5fr 1fr 1fr;
        align-items: center;
        gap: 6px;
        width: 100%;
    }

    /* Hide desktop-only controls */
    .edit-interest-link,
    .calendar-btn {
        display: none;
    }

    /* FROM + TO take 3/5 combined */
    .date-filter {
        width: 100%;
        min-width: 0;
    }

    /* Apply + Clear share remaining 2/5 */
    .date-filter-buttons {
        width: 100%;
        min-width: 0;
        padding-left: 2px;
        padding-right: 2px;
        font-size: 11px;
        white-space: nowrap;
    }

    /* Keep date inputs within their columns */
    .discover-controls :deep(input) {
        width: 100%;
        min-width: 0;
        box-sizing: border-box;
        font-size: 11px;
    }

    .discover-controls :deep(.btn-custom) {
        width: 100%;
        min-width: 0;
        height: 35px;
        min-height: 35px;
        padding-left: 3px;
        padding-right: 3px;
        font-size: 11px;
    }

    /* =================================
       MAIN CONTENT
    ================================= */

    .discover-main-layout {
        display: flex;
        flex-direction: column;
        flex: 1 1 0;
        min-height: 0;
        overflow: hidden;
        gap: 12px;
    }

    /* =================================
       UPCOMING PLANS
    ================================= */

    .side-box-container {
        order: -1;
        flex: 0 0 auto;
        width: 100%;
        height: auto;
        min-height: 0;
        padding: 4px 15px;
        box-sizing: border-box;
        border-radius: 18px;
        overflow: hidden;
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

    /* =================================
       FOLDER — REMAINING HEIGHT
    ================================= */

    .folder-wrapper {
        order: 0;
        width: 100%;
        height: auto;
        flex: 1 1 0;
        min-width: 0;
        min-height: 0;
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }

    .folder-wrapper :deep(.folder-container) {
        display: flex;
        flex-direction: column !important;
        align-items: stretch !important;
        gap: 10px;
        width: 100%;
        height: 100% !important;
        flex: 1 1 0;
        min-height: 0;
        overflow: hidden;
    }

    /* Hide desktop tabs */
    .folder-wrapper :deep(.tabs-header) {
        display: none !important;
    }

    /* Folder body */
    .folder-wrapper :deep(.folder-body) {
        flex: 1 1 0 !important;
        width: 100%;
        height: 0 !important;
        min-width: 0;
        min-height: 0 !important;
        overflow: hidden !important;
        border-radius: 25px !important;
    }

    /* Inner folder */
    .folder-wrapper :deep(.inner-folder) {
        flex: 1 1 0 !important;
        width: 100%;
        height: 100% !important;
        min-width: 0;
        min-height: 0;
        max-height: 100% !important;
        display: flex;
        flex-direction: column;
        overflow: hidden !important;
        padding: 0 !important;
    }

    /* =================================
       FOLDER CONTENT
    ================================= */

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

    /* =================================
       EVENT CARD SCROLL
    ================================= */

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

    /* One column on mobile */
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

    .folder-wrapper .folder-cards-grid>* {
        width: 100%;
        min-width: 0;
        max-width: 100%;
        box-sizing: border-box;
    }

    .updating-message {
        flex-shrink: 0;
    }
}

/* =========================================
   MEDIUM: TABLET — 2 EVENT COLUMNS
========================================= */

@media (min-width: 768px) and (max-width: 991.98px) {
    .folder-wrapper .folder-cards-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        gap: 12px;
    }
}
</style>
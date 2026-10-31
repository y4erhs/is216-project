<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'

import EventCard from '../components/EventCard.vue'
import BaseButton from '../components/BaseButton.vue'
import FolderTabs from '../components/FolderTabs.vue'
import BaseInput from '../components/BaseInput.vue'
import CardInfo from '../components/CardInfo.vue'

import { useActivities } from '../composables/useActivities'
import { useAuth } from '../composables/useAuth'

const {
    activityMap,
    loadActivities,
    setInterested,
    setGoing,
    saveNote
} = useActivities()
const { userId } = useAuth()

const recommendations = ref([])
const feedType = ref('weekly')
const loading = ref(false)
const updating = ref(false)

// Date filters
const fromDate = ref('')
const toDate = ref('')
const appliedFromDate = ref('')
const appliedToDate = ref('')

// Interest folder color mapping
const categoryThemeMap = {
    'tech': 'theme-green',
    'arts': 'theme-orange',
    'culture': 'theme-yellow',
    'community-service': 'theme-purple',
    'sports-outdoors': 'theme-red',
    'career': 'theme-purple',
    'overseas': 'theme-orange',
    'networking': 'theme-green',
    'workshops': 'theme-purple',
    'food': 'theme-red',
    'wellness': 'theme-green',
    'talks': 'theme-yellow'
}

// NEED TO SET MAX 5
const interestCategories = [
    'Tech',
    'Arts',
    'Culture',
    'Community Service',
]

const interestTabs = ref([
    {
        id: 'all',
        label: 'All',
        theme: 'theme-grey'
    },
    ...interestCategories.map(category => {
        const id = category.toLowerCase().replace(/\s+/g, '-')

        return {
            id,
            label: category,
            theme: categoryThemeMap[id] || 'theme-grey'
        }
    })
])

const activeInterest = ref('all')

// Load recommendations from backend
async function loadRecommendations() {
    loading.value = true

    const url = `http://localhost:8000/api/recommendations/user/${userId.value}?feedType=${feedType.value}`

    try {
        let response = await axios.get(url)

        if (response.data.length === 0) {
            await axios.post(
                'http://localhost:8000/api/recommendations/generate',
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

// Switch between daily and weekly feeds
function switchFeed(type) {
    if (feedType.value === type) return

    feedType.value = type
    loadRecommendations()
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

// Check whether event matches selected interest tab
function matchesInterestFilter(event) {
    if (activeInterest.value === 'all') return true

    const selectedTab = interestTabs.value.find(
        tab => tab.id === activeInterest.value
    )

    if (!selectedTab) return true

    const eventInterests = [
        ...(Array.isArray(event?.interests) ? event.interests : []),
        ...(Array.isArray(event?.categories) ? event.categories : []),
        ...(Array.isArray(event?.tags) ? event.tags : []),
        event?.category,
        event?.interest
    ]
        .filter(Boolean)
        .map(value => String(value).toLowerCase())

    const selectedLabel = selectedTab.label.toLowerCase()

    return eventInterests.some(value =>
        value.includes(selectedLabel) ||
        selectedLabel.includes(value)
    )
}

// Filter recommendations based on active tab and dates
const filteredRecommendations = computed(() => {
    return recommendations.value.filter(rec => {
        if (!rec.event) return false

        return (
            matchesDateFilter(rec.event) &&
            matchesInterestFilter(rec.event)
        )
    })
})

// Regenerate recommendations
async function regenerateRecommendations() {
    updating.value = true

    try {
        await axios.post(
            'http://localhost:8000/api/recommendations/generate',
            {
                userId: userId.value,
                feedType: feedType.value
            }
        )

        const url = `http://localhost:8000/api/recommendations/user/${userId.value}?feedType=${feedType.value}`

        const response = await axios.get(url)
        recommendations.value = response.data

    } catch (error) {
        console.log('There was an error: ' + error.message)
    } finally {
        updating.value = false
    }
}

// Initial loading
onMounted(async () => {
    loadActivities()

    await loadRecommendations()

    if (localStorage.getItem('interestsChanged') === 'true') {
        localStorage.removeItem('interestsChanged')
        regenerateRecommendations()
    }
})

const selectedEvent = ref(null)
const showCardInfo = ref(false)

function handleCardClick(event) {
    selectedEvent.value = event
    showCardInfo.value = true
}

function handleRegister(url) {
    if (url) {
        window.open(url, '_blank', 'noopener,noreferrer')
    }
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

                    <BaseButton class="calendar-btn theme-dark-blue" variant="primary">
                        VIEW MY CALENDAR
                    </BaseButton>
                </div>
            </div>

            <!-- MAIN CONTENT -->
            <div class="discover-main-layout">

                <!-- LEFT: INTEREST FOLDERS -->
                <div class="folder-wrapper">

                    <FolderTabs :tabs="interestTabs" v-model="activeInterest" default-active="all"
                        @tab-change="showCardInfo = false">

                        <div class="home-folder-content">

                            <!-- CARD INFO -->
                            <div v-if="showCardInfo && selectedEvent" class="card-info-wrapper">
                                <CardInfo :event="selectedEvent" @close="showCardInfo = false"
                                    @save-note="text => saveNote(selectedEvent._id || selectedEvent.id, text)"
                                    @register="handleRegister" />
                            </div>

                            <!-- EVENT GRID -->
                            <div v-else class="folder-content-area">

                                <div v-if="loading" class="folder-status-state">
                                    <p>Finding events for you...</p>
                                </div>

                                <div v-else-if="filteredRecommendations.length === 0" class="folder-status-state">
                                    <p class="empty-text">
                                        No events found. Try another interest or adjust your filters!
                                    </p>
                                </div>

                                <div v-else class="folder-cards-scroll-area" :class="{ updating: updating }">

                                    <div class="folder-cards-grid">

                                        <EventCard v-for="rec in filteredRecommendations" :key="rec._id"
                                            :event="rec.event" :score="rec.score" :reason="rec.reasons?.[0] || ''"
                                            show-hide :interested="activityMap[rec.event._id]?.interested || false"
                                            :going-by-session="activityMap[rec.event._id]?.sessions || {}"
                                            @set-interested="v => setInterested(rec.event._id, v)"
                                            @set-going="p => setGoing(rec.event._id, p)"
                                            @card-click="handleCardClick" />

                                    </div>
                                </div>

                            </div>
                        </div>

                    </FolderTabs>

                </div>

                <!-- WHITE SIDE BOX -->
                <div class="side-box-container">
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
   MAIN PAGE
========================================= */

.home-page-container {
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
    gap: 16px;
    margin-top: 18px;
    margin-bottom: 15px;
    flex-shrink: 0;
    min-width: 0;
}

.discover-title {
    color: #fff;
    font-family: 'HeaderFont', sans-serif;
    font-size: 22px;
    font-weight: 800;
    margin: 0;
    white-space: nowrap;
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

/* FolderTabs container */
.folder-wrapper :deep(.folder-container) {
    height: 100% !important;
    min-height: 0;
    max-height: 100% !important;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.folder-wrapper :deep(.folder-body) {
    flex: 1;
    height: 0;
    min-height: 0;
    overflow: hidden !important;
    display: flex;
    flex-direction: column;
}

.folder-wrapper :deep(.inner-folder) {
    flex: 1;
    height: 0 !important;
    min-height: 0;
    max-height: 100% !important;
    overflow: hidden !important;
    display: flex;
    flex-direction: column;
}

/* =========================================
   FOLDER CONTENT
========================================= */

.home-folder-content {
    flex: 1;
    min-height: 0;
    min-width: 0;
    width: 100%;
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
    overflow-y: auto;
    overflow-x: hidden;
    transition: opacity .2s ease;
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
   RIGHT SIDEBAR
========================================= */

.discover-sidebar {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    min-width: 0;
    overflow: hidden;
}

/* =========================================
   WHITE SIDE BOX
========================================= */

.side-box-container {
    flex: 1;
    min-height: 0;
    width: 100%;
    height: calc(100% - 38px);
    margin-top: 38px;
    background-color: var(--color-white, #fff);
    border-radius: 25px;
    padding: 20px;
    box-sizing: border-box;
    box-shadow: 0 4px 14px rgba(10, 29, 43, .08);
    overflow-y: auto;
}

/* =========================================
   UPDATING MESSAGE
========================================= */

.updating-message {
    color: #f1f2f7;
    font-size: 12px;
    margin: 8px 0 0;
    flex-shrink: 0;
}

/* =========================================
   RESPONSIVE
========================================= */

@media (max-width: 1200px) {
    .folder-cards-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
}

@media (max-width: 900px) {
    .discover-main-layout {
        grid-template-columns: minmax(0, 1fr) 180px;
        gap: 14px;
    }
}

@media (max-width: 700px) {
    .discover-header {
        align-items: flex-start;
        flex-wrap: wrap;
    }

    .discover-controls {
        flex-wrap: wrap;
        justify-content: flex-start;
    }

    .discover-main-layout {
        grid-template-columns: 1fr;
        grid-template-rows: minmax(0, 1fr) auto;
        overflow-y: auto;
    }

    .discover-sidebar {
        height: 220px;
    }

    .folder-feed-header {
        flex-direction: row;
        align-items: center;
        height: auto;
        padding: 8px 0;
    }

    .folder-cards-grid {
        grid-template-columns: 1fr;
    }
}

@media (max-width: 450px) {
    .discover-controls {
        gap: 7px;
    }

    .date-filter {
        width: 100%;
    }

    .folder-feed-header {
        flex-wrap: wrap;
    }
}
</style>
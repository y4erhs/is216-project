<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import axios from 'axios'
import { useRoute, useRouter } from 'vue-router'

import InterestChips from './InterestChips.vue'
import EventCard from './EventCard.vue'
import CardInfo from './CardInfo.vue'
import BaseButton from './BaseButton.vue'
import BaseInput from './BaseInput.vue'

import { useActivities } from '../composables/useActivities'
import { useAuth } from '../composables/useAuth'
import { interestLabel } from '../utils/interests'
import { API_URL } from '../utils/api'

const { activityMap, loadActivities, setInterested, setGoing, saveNote } = useActivities()
const route = useRoute()
const router = useRouter()

// Search keyword
const keyword = ref(route.query.q || '')

// Dates
const today = new Date().toLocaleDateString('en-CA', {
    timeZone: 'Asia/Singapore'
})

const fromDate = ref(today)
const toDate = ref('')

// Events and categories
const categories = ref([])
const results = ref([])
const searching = ref(false)
const hasSearched = ref(false)

// Selected category / tab
const selectedChip = ref('for-you')
const myInterests = ref([])
const selectedEvent = ref(null)

// Theme colors for category pills
const interestThemeOrder = [
    'theme-orange',
    'theme-yellow',
    'theme-green',
    'theme-purple'
]

// Build horizontal category navigation
const categoryTabs = computed(() => [
    {
        id: 'all',
        label: 'All',
        theme: 'theme-light'
    },
    {
        id: 'for-you',
        label: 'For You',
        theme: 'theme-grey'
    },
    ...categories.value.map((category, index) => ({
        id: category,
        label: interestLabel(category),
        theme: interestThemeOrder[index % interestThemeOrder.length]
    }))
])

const emit = defineEmits(['search-active'])

const { userId } = useAuth()
const scores = ref({})

// Get AI scores from saved recommendations
async function loadScores() {
    try {
        const response = await axios.get(
            `${API_URL}/api/recommendations/user/${userId.value}`
        )

        const map = {}

        for (const rec of response.data) {
            map[rec.event._id] = rec.score
        }

        scores.value = map
    } catch (error) {
        console.log('There was an error: ' + error.message)
    }
}

// Highest score first
const sortedResults = computed(() =>
    [...results.value].sort(
        (a, b) => (scores.value[b._id] ?? -1) - (scores.value[a._id] ?? -1)
    )
)

// Load all available event tags for category navigation
async function loadCategories() {
    try {
        const response = await axios.get(`${API_URL}/api/events`)

        const byLower = {}

        for (const tag of response.data.flatMap(event => event.tags || [])) {
            if (!tag) continue

            const key = tag.toLowerCase()

            if (!byLower[key] || tag[0] !== tag[0].toLowerCase()) {
                byLower[key] = tag
            }
        }

        categories.value = Object.values(byLower).sort(
            (a, b) => a.localeCompare(b)
        )
    } catch (error) {
        console.log('There was an error: ' + error.message)
    }
}

// Prevent older searches from overwriting newer results
let latestSearch = 0
const noInterests = ref(false)

// Search using selected category, interests, dates and keyword
async function searchEvents() {
    const searchId = ++latestSearch

    hasSearched.value = true
    selectedEvent.value = null

    const q = keyword.value.trim()

    if ((route.query.q || '') !== q) {
        router.replace({
            path: '/search',
            query: q ? { q } : {}
        })
    }

    emit('search-active', true)
    noInterests.value = false

    const params = {}

    if (q) {
        params.q = q
    }

    // For You uses the user's saved interests
    if (selectedChip.value === 'for-you') {
        if (myInterests.value.length === 0) {
            noInterests.value = true
            results.value = []
            searching.value = false
            return
        }

        params.tags = myInterests.value.join(',')
    }

    // All does not apply a tag filter
    // Any other selected pill filters by that category
    else if (selectedChip.value !== 'all') {
        params.tags = selectedChip.value
    }

    if (fromDate.value) params.from = fromDate.value
    if (toDate.value) params.to = toDate.value

    searching.value = true

    try {
        const response = await axios.get(`${API_URL}/api/events`, {
            params
        })

        if (searchId !== latestSearch) return

        results.value = response.data
    } catch (error) {
        if (searchId !== latestSearch) return

        console.log('There was an error: ' + error.message)
    }

    if (searchId === latestSearch) {
        searching.value = false
    }
}

// Select a category or tab
function selectChip(value) {
    selectedChip.value = value
    searchEvents()
}

// Update dates
function updateFromDate(value) {
    fromDate.value = value
    searchEvents()
}

function updateToDate(value) {
    toDate.value = value
    searchEvents()
}

// Clear all filters
function clearFilters() {
    latestSearch++

    keyword.value = ''
    selectedEvent.value = null

    router.replace({ path: '/search' })

    selectedChip.value = 'for-you'

    fromDate.value = today
    toDate.value = ''

    results.value = []
    searching.value = false
    noInterests.value = false
    hasSearched.value = false

    emit('search-active', false)
}

// A new search from the top bar searches everything
function searchFromTopBar() {
    selectedChip.value = 'all'
    searchEvents()
}

// Initial loading
onMounted(() => {
    loadCategories()
    loadScores()
    loadActivities()

    if (route.query.q) {
        searchFromTopBar()
    }
})

// Listen for new searches from the top search bar
watch(() => route.query.q, (q) => {
    if ((q || '') === keyword.value.trim()) return

    keyword.value = q || ''
    searchFromTopBar()
})

// Re-run For You search when saved interests are loaded or changed
watch(myInterests, () => {
    if (hasSearched.value && selectedChip.value === 'for-you') {
        searchEvents()
    }
})
</script>

<template>
    <div class="search-page">

        <!-- PAGE HEADER + FILTERS -->
        <div class="search-header">

            <h5 class="search-title">
                FIND EVENTS
            </h5>

            <div class="search-controls">

                <!-- From Date -->
                <div class="date-filter">
                    <BaseInput v-model="toDate" type="date" placeholder="FROM" />
                </div>

                <!-- To Date -->
                <div class="date-filter">
                    <BaseInput v-model="toDate" type="date" placeholder="TO" />
                </div>

                <!-- Search -->
                <BaseButton class="theme-green date-filter-buttons" variant="primary" @click="searchEvents">
                    SEARCH
                </BaseButton>

                <!-- Clear -->
                <BaseButton class="date-filter-buttons clear-btn" variant="outline-main" @click="clearFilters">
                    CLEAR
                </BaseButton>

            </div>
        </div>


        <!-- Hidden InterestChips: loads saved interests for For You -->
        <div class="interest-data-loader">
            <InterestChips show-all :selected="selectedChip" @select="selectChip"
                @interests-loaded="myInterests = $event" />
        </div>

        <!-- Horizontal Category Navigation -->
        <div class="mobile-category-nav">

            <BaseButton v-for="tab in categoryTabs" :key="tab.id"
                :variant="selectedChip === tab.id ? 'primary' : 'outline-main'" :class="[
                    'category-pill',
                    tab.theme,
                    { active: selectedChip === tab.id }
                ]" @click="selectChip(tab.id)">
                {{ tab.label }}
            </BaseButton>
        </div>

        <!-- One Event's Details -->
        <CardInfo v-if="selectedEvent" :event="selectedEvent" @close="selectedEvent = null"
            @save-note="text => saveNote(selectedEvent._id, text)" />

        <!-- Results -->
        <div v-else-if="hasSearched">

            <p v-if="searching" class="status-text">
                Searching...
            </p>

            <p v-else-if="noInterests" class="status-text">
                You haven't picked any interests yet.
                <router-link to="/profile">Add some</router-link>
                to see events for you.
            </p>

            <p v-else-if="results.length === 0" class="status-text">
                No events match your search.
            </p>

            <div v-else>

                <p class="status-text">
                    {{ results.length }} event(s) found
                </p>

                <div class="row g-3">

                    <div class="col-md-6" v-for="event in sortedResults" :key="event._id">
                        <EventCard :event="event" :from-date="fromDate"
                            :interested="activityMap[event._id]?.interested || false"
                            :going-by-session="activityMap[event._id]?.sessions || {}"
                            @set-interested="v => setInterested(event._id, v)" @set-going="p => setGoing(event._id, p)"
                            @card-click="selectedEvent = $event" :score="scores[event._id] ?? null" />
                    </div>

                </div>
            </div>
        </div>

    </div>
</template>

<style scoped>
.search-page {
    display: grid;
    gap: 15px;
    padding: 0 5px;
    color: var(--color-white);
}

/* =========================================
   SEARCH HEADER + DATE FILTERS
========================================= */

.search-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 15px;
    min-width: 0;
}

.search-title {
    margin: 0;
    color: #fff;
    font: 400 25px/1.1 'HeaderFont', sans-serif;
    text-transform: uppercase;
    white-space: nowrap;
}

.search-controls {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 9px;
    min-width: 0;
}

.search-controls :deep(.btn-custom) {
    min-height: 35px;
    height: 35px;
    box-sizing: border-box;
    white-space: nowrap;
}

/* Date inputs */
.date-filter {
    width: 125px;
    flex-shrink: 0;
}

/* Search and Clear buttons */
.date-filter-buttons {
    width: 90px;
    flex-shrink: 0;
}

.clear-btn {
    border-color: var(--color-white);
    color: var(--color-white);
}

.status-text {
    margin: 0 0 12px;
    color: var(--color-white);
}

.status-text a {
    color: var(--color-white);
}

/* Hidden interest loader */
.interest-data-loader {
    display: none;
}

/* Horizontal category navigation */
.mobile-category-nav {
    display: flex;
    align-items: center;
    gap: 5px;

    width: 100%;
    box-sizing: border-box;

    margin-bottom: 8px;
    padding: 8px 2px 0;

    overflow-x: auto;
    overflow-y: hidden;

    flex: 0 0 auto;
    white-space: nowrap;

    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;
}

.mobile-category-nav::-webkit-scrollbar {
    display: none;
}

/* Category pills */
.category-pill {
    flex: 0 0 auto;
    white-space: nowrap;
    font-size: 11px;
}

/* Outline pill styling */
.category-pill.btn-outline-main {
    border: 1px solid white !important;
    color: var(--color-white);
}


@media (max-width: 991px) {

    .filter-card {
        padding: 15px 0;
    }
    /* Stack title and filters vertically */
    .search-header {
        display: flex;
        flex-direction: column;
        align-items: stretch;
        gap: 12px;
        width: 100%;
    }

    .search-title {
        font-size: 22px;
    }

    /* Filters occupy the full available width */
    .search-controls {
        display: grid;
        grid-template-columns: 1.5fr 1.5fr 1fr 1fr;
        align-items: center;
        gap: 6px;
        width: 100%;
    }

    .date-filter {
        width: 100%;
        min-width: 0;
    }

    .date-filter-buttons {
        width: 100%;
        min-width: 0;
        padding-left: 3px;
        padding-right: 3px;
        font-size: 11px;
    }

    .search-controls :deep(input) {
        width: 100%;
        min-width: 0;
        box-sizing: border-box;
        font-size: 11px;
    }

    .search-controls :deep(.btn-custom) {
        width: 100%;
        min-width: 0;
        height: 35px;
        min-height: 35px;
        padding-left: 3px;
        padding-right: 3px;
        font-size: 11px;
    }
}
</style>

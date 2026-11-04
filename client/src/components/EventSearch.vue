<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import axios from 'axios'
import { useRoute, useRouter } from 'vue-router'
import InterestChips from './InterestChips.vue'
import EventCard from './EventCard.vue'
import CardInfo from './CardInfo.vue'
import BaseButton from './BaseButton.vue'
import { useActivities } from '../composables/useActivities'
import { useAuth } from '../composables/useAuth'
import { interestLabel } from '../utils/interests'
import { API_URL } from '../utils/api'

const { activityMap, loadActivities, setInterested, setGoing, saveNote } = useActivities()
const route = useRoute()
const router = useRouter()

// The top search bar sends its text as ?q=
const keyword = ref(route.query.q || '')
const category = ref('')
const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Singapore' })
const fromDate = ref(today)
const toDate = ref('')

const categories = ref([])
const results = ref([])
const searching = ref(false)
const hasSearched = ref(false)

const selectedChip = ref('for-you') // the page opens on the "For you" picks
const myInterests = ref([])
const selectedEvent = ref(null)   // the card opened for details

const emit = defineEmits(['search-active'])

const { userId } = useAuth()
const scores = ref({})                    // { eventId: score }

// Get the AI scores from the student's saved recommendations
async function loadScores() {
    try {
        const response = await axios.get(`${API_URL}/api/recommendations/user/${userId.value}`)
        const map = {}
        for (const rec of response.data) {
            map[rec.event._id] = rec.score
        }
        scores.value = map
    } catch (error) {
        console.log('There was an error: ' + error.message)
    }
}

// Highest score first; events without a score go last
const sortedResults = computed(() =>
    [...results.value].sort((a, b) => (scores.value[b._id] ?? -1) - (scores.value[a._id] ?? -1))
)

// Build the category dropdown from all event tags
async function loadCategories() {
    try {
        const response = await axios.get(`${API_URL}/api/events`)
        // "Tech" and "tech" are the same category, so keep one of them (prefer the capitalised one)
        const byLower = {}
        for (const tag of response.data.flatMap(e => e.tags)) {
            const key = tag.toLowerCase()
            if (!byLower[key] || tag[0] !== tag[0].toLowerCase()) byLower[key] = tag
        }
        categories.value = Object.values(byLower).sort((a, b) => a.localeCompare(b))
    } catch (error) {
        console.log('There was an error: ' + error.message)
    }
}

// Each search gets a number, so an older, slower reply can't overwrite a newer one
let latestSearch = 0
const noInterests = ref(false)

// Search using whatever filters are filled in
async function searchEvents() {
    const searchId = ++latestSearch
    hasSearched.value = true
    selectedEvent.value = null

    // Keep the address (and the top search bar) matching the keyword
    const q = keyword.value.trim()
    if ((route.query.q || '') !== q) router.replace({ path: '/search', query: q ? { q } : {} })

    emit('search-active', true)
    noInterests.value = false
    const params = {}
    if (keyword.value.trim()) params.q = keyword.value.trim()
    if (category.value) {
        params.tags = category.value
    } else if (selectedChip.value === 'for-you') {
        // no interests means nothing is "for you", not everything
        if (myInterests.value.length === 0) {
            noInterests.value = true
            results.value = []
            searching.value = false
            return
        }
        params.tags = myInterests.value.join(',')
    } else if (selectedChip.value !== 'all') {
        params.tags = selectedChip.value
    }
    if (fromDate.value) params.from = fromDate.value
    if (toDate.value) params.to = toDate.value

    searching.value = true
    try {
        const response = await axios.get(`${API_URL}/api/events`, { params })
        if (searchId !== latestSearch) return
        results.value = response.data
    } catch (error) {
        if (searchId !== latestSearch) return
        console.log('There was an error: ' + error.message)
    }
    searching.value = false
}

// Tapping a chip always searches (even the one already selected) and replaces the category filter
function selectChip(value) {
    selectedChip.value = value
    category.value = ''
    searchEvents()
}

// Picking a category replaces the chip filter
function selectCategory() {
    selectedChip.value = 'all'
    searchEvents()
}

function clearFilters() {
    latestSearch++
    keyword.value = ''
    selectedEvent.value = null
    router.replace({ path: '/search' })
    category.value = ''
    selectedChip.value = 'for-you'
    fromDate.value = today
    toDate.value = ''
    searching.value = false
    noInterests.value = false
    hasSearched.value = false
    emit('search-active', false)
}

// A new search from the top bar looks through everything, not just the chip that was selected
function searchFromTopBar() {
    selectedChip.value = 'all'
    category.value = ''
    searchEvents()
}

onMounted(() => {
    loadCategories()
    loadScores()
    loadActivities()
    if (route.query.q) searchFromTopBar()
})

watch(() => route.query.q, (q) => {
    if ((q || '') === keyword.value.trim()) return   // this page's own search changed the address
    keyword.value = q || ''
    searchFromTopBar()
})

// Interests loading or changing only re-runs a search that's already showing
watch(myInterests, () => {
    if (hasSearched.value) searchEvents()
})
</script>

<template>
    <div class="search-page">
        <h1 class="page-title">Find events</h1>

        <!-- Filters -->
        <div class="filter-card row g-2 align-items-end mx-0">
            <div class="col-6 col-md-3">
                <label class="form-label small" for="search-category">Category</label>
                <select id="search-category" class="form-select" v-model="category" v-on:change="selectCategory">
                    <option value="">All</option>
                    <option v-for="c in categories" v-bind:key="c" v-bind:value="c">{{ interestLabel(c) }}</option>
                </select>
            </div>

            <div class="col-6 col-md-3">
                <label class="form-label small" for="search-from">From</label>
                <input id="search-from" type="date" class="form-control" v-model="fromDate" v-on:change="searchEvents">
            </div>

            <div class="col-6 col-md-3">
                <label class="form-label small" for="search-to">To</label>
                <input id="search-to" type="date" class="form-control" v-model="toDate" v-on:change="searchEvents">
            </div>

            <div class="col-6 col-md-3 d-flex gap-2">
                <BaseButton class="theme-green" variant="primary" v-on:click="searchEvents">Search</BaseButton>
                <BaseButton variant="outline-main" v-on:click="clearFilters">Clear</BaseButton>
            </div>
        </div>

        <div class="chips">
            <InterestChips
                show-all
                v-bind:selected="selectedChip"
                v-on:select="selectChip"
                v-on:interests-loaded="myInterests = $event"
            />
        </div>

        <!-- One event's details -->
        <CardInfo
            v-if="selectedEvent"
            :event="selectedEvent"
            @close="selectedEvent = null"
            @save-note="text => saveNote(selectedEvent._id, text)"
        />

        <!-- Results (only after a search) -->
        <div v-else-if="hasSearched">
            <p v-if="searching" class="status-text">Searching...</p>

            <p v-else-if="noInterests" class="status-text">
                You haven't picked any interests yet. <router-link to="/profile">Add some</router-link> to see events for you.
            </p>

            <p v-else-if="results.length === 0" class="status-text">
                No events match your search.
            </p>

            <div v-else>
                <p class="status-text">{{ results.length }} event(s) found</p>
                <div class="row g-3">
                    <div class="col-md-6" v-for="event in sortedResults" v-bind:key="event._id">
                        <EventCard
                            :event="event"
                            :from-date="fromDate"
                            :interested="activityMap[event._id]?.interested || false"
                            :going-by-session="activityMap[event._id]?.sessions || {}"
                            @set-interested="(v) => setInterested(event._id, v)"
                            @set-going="(p) => setGoing(event._id, p)"
                            @card-click="selectedEvent = $event"
                            :score="scores[event._id] ?? null"
                        />
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
    padding: 0 15px 15px;
    color: var(--color-white);
}

.page-title {
    margin: 0;
    color: var(--color-white);
    font-family: 'HeaderFont';
    font-size: 25px;
    text-transform: uppercase;
}

.filter-card {
    padding: 15px;
    border-radius: 25px;
    background-color: var(--color-white);
    color: var(--color-black);
}

.chips :deep(.text-muted) {
    color: var(--color-white) !important;
}

.status-text {
    margin: 0 0 12px;
    color: var(--color-white);
}

.status-text a {
    color: var(--color-white);
}
</style>

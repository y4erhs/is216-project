<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import axios from 'axios'
import InterestChips from './InterestChips.vue'
import EventCard from './EventCard.vue'
import { useActivities } from '../composables/useActivities'
import { useAuth } from '../composables/useAuth'

const { activityMap, loadActivities, setInterested, setGoing } = useActivities()

const keyword = ref('')
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

const emit = defineEmits(['search-active'])

const { userId } = useAuth()
const scores = ref({})                    // { eventId: score }

// Get the AI scores from the student's saved recommendations
async function loadScores() {
    try {
        const response = await axios.get(`http://localhost:8000/api/recommendations/user/${userId.value}`)
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
        const response = await axios.get('http://localhost:8000/api/events')
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
        const response = await axios.get('http://localhost:8000/api/events', { params })
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
    category.value = ''
    selectedChip.value = 'for-you'
    fromDate.value = today
    toDate.value = ''
    searching.value = false
    noInterests.value = false
    hasSearched.value = false
    emit('search-active', false)
}

onMounted(() => {
    loadCategories()
    loadScores()
    loadActivities()
})

// Interests loading or changing only re-runs a search that's already showing
watch(myInterests, () => {
    if (hasSearched.value) searchEvents()
})
</script>

<template>
    <div class="container py-3">
        <h4 class="mb-3 text-dark">Find events</h4>

        <!-- Filters -->
        <div class="row g-2 align-items-end mb-3">
            <div class="col-12 col-md-4">
                <label class="form-label small text-muted">Keyword</label>
                <input
                    type="text"
                    class="form-control"
                    placeholder="e.g. python, hackathon, SMU BIA"
                    v-model="keyword"
                    v-on:keyup.enter="searchEvents"
                >
            </div>

            <div class="col-6 col-md-2">
                <label class="form-label small text-muted">Category</label>
                <select class="form-select" v-model="category" v-on:change="selectCategory">
                    <option value="">All</option>
                    <option v-for="c in categories" v-bind:key="c" v-bind:value="c">{{ c }}</option>
                </select>
            </div>

            <div class="col-6 col-md-2">
                <label class="form-label small text-muted">From</label>
                <input type="date" class="form-control" v-model="fromDate" v-on:change="searchEvents">
            </div>

            <div class="col-6 col-md-2">
                <label class="form-label small text-muted">To</label>
                <input type="date" class="form-control" v-model="toDate" v-on:change="searchEvents">
            </div>

            <div class="col-6 col-md-2 d-flex gap-2">
                <button class="btn btn-primary w-100" v-on:click="searchEvents">Search</button>
                <button class="btn btn-outline-secondary" v-on:click="clearFilters">Clear</button>
            </div>
        </div>

        <div class="mb-3">
            <InterestChips
                show-all
                v-bind:selected="selectedChip"
                v-on:select="selectChip"
                v-on:interests-loaded="myInterests = $event"
            />
        </div>

        <!-- Results (only after a search) -->
        <div v-if="hasSearched">
            <p v-if="searching" class="text-muted">Searching...</p>

            <p v-else-if="noInterests" class="text-muted">
                You haven't picked any interests yet. <router-link to="/profile">Add some</router-link> to see events for you.
            </p>

            <p v-else-if="results.length === 0" class="text-muted">
                No events match your search.
            </p>

            <div v-else>
                <p class="small text-muted">{{ results.length }} event(s) found</p>
                <div class="row g-3">
                    <div class="col-md-6" v-for="event in sortedResults" v-bind:key="event._id">
                        <EventCard
                            :event="event"
                            :from-date="fromDate"
                            :interested="activityMap[event._id]?.interested || false"
                            :going-by-session="activityMap[event._id]?.sessions || {}"
                            @set-interested="(v) => setInterested(event._id, v)"
                            @set-going="(p) => setGoing(event._id, p)"
                            :score="scores[event._id] ?? null"
                        />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
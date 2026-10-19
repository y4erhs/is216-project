<script setup>
import { ref, onMounted, watch } from 'vue'
import axios from 'axios'
import InterestChips from './InterestChips.vue'
import EventCard from './EventCard.vue'
import { useActivities } from '../composables/useActivities'

const { activityMap, loadActivities, setInterested, setGoing } = useActivities()

const keyword = ref('')
const category = ref('')
const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Singapore' })
const fromDate = ref(today)
const toDate = ref('')

const categories = ref([])
const results = ref([])
const searching = ref(false)

const props = defineProps({
    chip: { type: String, default: 'for-you' },
    interests: { type: Array, default: () => [] }
})

const selectedChip = ref('all')
const myInterests = ref([])

// Build the category dropdown from all event tags
async function loadCategories() {
    try {
        const response = await axios.get('http://localhost:8000/api/events')
        const allTags = response.data.flatMap(e => e.tags)
        categories.value = [...new Set(allTags)].sort()
    } catch (error) {
        console.log('There was an error: ' + error.message)
    }
}

// Search using whatever filters are filled in
async function searchEvents() {
    searching.value = true
    const params = {}
    if (keyword.value.trim()) params.q = keyword.value.trim()
    if (category.value) {
        params.tags = category.value
    } else if (selectedChip.value === 'for-you') {
        if (myInterests.value.length > 0) params.tags = myInterests.value.join(',')
    } else if (selectedChip.value !== 'all') {
        params.tags = selectedChip.value
    }
    if (fromDate.value) params.from = fromDate.value
    if (toDate.value) params.to = toDate.value

    try {
        const response = await axios.get('http://localhost:8000/api/events', { params })
        results.value = response.data
    } catch (error) {
        console.log('There was an error: ' + error.message)
    }
    searching.value = false
}

function clearFilters() {
    keyword.value = ''
    category.value = ''
    fromDate.value = today
    toDate.value = ''
    searchEvents()
}

onMounted(() => {
    loadCategories()
    searchEvents()
    loadActivities()
})

watch([selectedChip, myInterests], searchEvents)
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
                <select class="form-select" v-model="category" v-on:change="searchEvents">
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
                v-on:select="selectedChip = $event"
                v-on:interests-loaded="myInterests = $event"
            />
        </div>

        <!-- Results -->
        <p v-if="searching" class="text-muted">Searching...</p>

        <p v-else-if="results.length === 0" class="text-muted">
            No events match your search.
        </p>

        <div v-else>
            <p class="small text-muted">{{ results.length }} event(s) found</p>

            <div class="row g-3">
                <div class="col-md-6" v-for="event in results" v-bind:key="event._id">
                    <EventCard
    :event="event"
    :from-date="fromDate"
    :interested="activityMap[event._id]?.interested || false"
    :going-by-session="activityMap[event._id]?.sessions || {}"
    @set-interested="(v) => setInterested(event._id, v)"
    @set-going="(p) => setGoing(event._id, p)"
/>
                </div>
            </div>
        </div>
    </div>
</template>
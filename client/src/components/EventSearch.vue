<script setup>
    import {ref, onMounted, watch} from 'vue'
    import axios from 'axios'
    import InterestChips from './InterestChips.vue'

    const keyword = ref('')
    const category = ref('')
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Singapore' })
    const fromDate = ref(today)
    const toDate = ref('')

    const categories = ref([])
    const results = ref([])
    const searching = ref(false) 
    
    const props = defineProps({
        chip: {
            type:String,
            default:'for-you'
        },
        interests: {
            type:Array,
            default: () => []
        }
    })

    const selectedChip = ref('all')
    const myInterests = ref([])

    // Build the category dropdown from all event tags
    async function loadCategories() {
        try {
            const response = await axios.get("http://localhost:8000/api/events")
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
            const response = await axios.get("http://localhost:8000/api/events", { params })
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

    // Show a session's date and time in Singapore time
    function formatSession(session) {
        const start = new Date(session.startTime)
        const end = new Date(session.endTime)
        const day = start.toLocaleDateString('en-SG', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Asia/Singapore' })
        const time = (d) => d.toLocaleTimeString('en-SG', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Singapore' })
        return `${day} · ${time(start)}–${time(end)}`
    }

    onMounted(() => {
        loadCategories()
        searchEvents()
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
                    <div class="card h-100 shadow-sm rounded-4">
                        <div class="card-body">
                            <div class="d-flex justify-content-between small mb-2">
                                <span class="text-primary">{{ formatSession(event.sessions[0]) }}</span>
                                <span class="text-muted">{{ event.tags.join(' · ') }}</span>
                            </div>
                            <h5 class="card-title mb-1 text-dark">{{ event.title }}</h5>
                            <p class="small text-muted mb-1">{{ event.organiser }} · {{ event.venue }}</p>
                            <p class="small text-muted mb-0" v-if="event.sessions.length > 1">
                                +{{ event.sessions.length - 1 }} more session(s)
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>


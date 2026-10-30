<script setup>
    import {ref, onMounted} from 'vue'
    import axios from 'axios'
    import EventCard from '../components/EventCard.vue';
    import BaseButton from '../components/BaseButton.vue';
    import EventSearch from '../components/EventSearch.vue';
    import { useActivities } from '../composables/useActivities';
    import { useAuth } from '../composables/useAuth';
    const { activityMap, loadActivities, setInterested, setGoing } = useActivities();

    const { userId } = useAuth()

    const recommendations = ref([])
    const feedType = ref('weekly')
    const loading = ref(false)
    const updating = ref(false)
    const isSearching = ref(false)

    async function loadRecommendations() {
        loading.value = true
        let url = "http://localhost:8000/api/recommendations/user/" + userId.value + "?feedType=" + feedType.value

        try {
            let response = await axios.get(url)
            // Nothing generated yet, so generate a feed, then load it again
            if (response.data.length === 0) {
                await axios.post("http://localhost:8000/api/recommendations/generate", {
                    userId: userId.value,
                    feedType: feedType.value
                })
                response = await axios.get(url)
            }
            recommendations.value = response.data
        } catch (error) {
            console.log('There was an error: ' + error.message)
        }
        loading.value = false
    }

    function switchFeed(type) {
        feedType.value = type
        loadRecommendations()
    }


    onMounted(async () => {
        loadActivities()
        await loadRecommendations()

        // Interests were edited since last time, so refresh the feed
        if (localStorage.getItem('interestsChanged') === 'true') {
            localStorage.removeItem('interestsChanged')
            regenerateRecommendations()
        }
    })

    async function regenerateRecommendations() {
        updating.value = true
        try {
            await axios.post("http://localhost:8000/api/recommendations/generate", {
                userId: userId.value,
                feedType: feedType.value
            })

            let url = "http://localhost:8000/api/recommendations/user/" + userId.value + "?feedType=" + feedType.value
            let response = await axios.get(url)
            recommendations.value = response.data
        } catch (error) {
            console.log('There was an error: ' + error.message)
        }
        updating.value = false
    }
</script>

<template>
    <EventSearch v-on:search-active="isSearching = $event"/>
    <div v-if="!isSearching">
        <div class="d-flex justify-content-between align-items-center mt-4 mb-3">
            <h5 class="mb-0 text-dark">Picked for your {{ feedType === 'daily' ? 'day' : 'week' }}</h5>
            <div>
                <BaseButton class="btn btn-sm"
                    v-bind:class="feedType === 'daily' ? 'btn-custom' : 'btn-outline-main'"
                    v-on:click="switchFeed('daily')">Today</BaseButton>
                <BaseButton class="btn btn-sm ms-1"
                    v-bind:class="feedType === 'weekly' ? 'btn-custom' : 'btn-outline-main'"
                    v-on:click="switchFeed('weekly')">This week</BaseButton>
            </div>
        </div>

        <p v-if="updating" class="small text-muted mb-2">
            ✨ Updating your picks...
        </p>

        <p v-if="loading" class="text-muted">Finding events for you...</p>

        <p v-else-if="recommendations.length === 0" class="text-muted">
            No recommendations right now. Check back soon!
        </p>

        <div v-else class="row g-3" v-bind:style="updating ? 'opacity: 0.5' : ''">
            <div class="col-md-6" v-for="rec in recommendations" v-bind:key="rec._id">
                <EventCard
                    v-bind:event="rec.event"
                    v-bind:score="rec.score"
                    v-bind:reason="rec.reasons?.[0] || ''"
                    show-hide
                    :interested="activityMap[rec.event._id]?.interested || false"
                    :going-by-session="activityMap[rec.event._id]?.sessions || {}"
                    @set-interested="(v) => setInterested(rec.event._id, v)"
                    @set-going="(p) => setGoing(rec.event._id, p)"
                />
            </div>
        </div>
    </div>
</template>

<style scoped>


</style>
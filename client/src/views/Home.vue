<script setup>
    import {ref, onMounted, computed} from 'vue'
    import axios from 'axios'
    import InterestChips from '../components/InterestChips.vue'
    import RecommendationCards from '../components/RecommendationCards.vue';
import BaseButton from '../components/BaseButton.vue';

    //change after login and sign up done
    const userId = '6acd9e65046b9013f579fc79'
    const plannerStatus = ref({})

    const recommendations = ref([])
    const feedType = ref('weekly')
    const loading = ref(false)
    const updating = ref(false)

    const selectedChip = ref('for-you')
    const filteredRecommendations = computed(() => {
        if (selectedChip.value == 'for-you') {
            return recommendations.value
        }
        return recommendations.value.filter(r => r.event.tags.includes(selectedChip.value))
    })

    async function loadRecommendations() {
        loading.value = true
        let url = "http://localhost:8000/api/recommendations/user/" + userId + "?feedType=" + feedType.value

        try {
            let response = await axios.get(url)
            // Nothing generated yet, so generate a feed, then load it again
            if (response.data.length === 0) {
                await axios.post("http://localhost:8000/api/recommendations/generate", {
                    userId: userId,
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

    function hideRecommendation(id, lessLikeThis) {}
    function toggleStatus(event) {}

    onMounted(loadRecommendations)

    async function regenerateRecommendations() {
        updating.value = true
        try {
            await axios.post("http://localhost:8000/api/recommendations/generate", {
                userId: userId,
                feedType: feedType.value
            })

            let url = "http://localhost:8000/api/recommendations/user/" + userId + "?feedType=" + feedType.value
            let response = await axios.get(url)
            recommendations.value = response.data
        } catch (error) {
            console.log('There was an error: ' + error.message)
        }
        updating.value = false
    }
</script>

<template>
    <InterestChips v-on:select="selectedChip = $event" v-on:interests-updated="regenerateRecommendations"/>
    <div class="d-flex justify-content-between align-items-center mt-4 mb-3">
        <h5 class="mb-0 text-dark">Picked for your {{ feedType === 'daily' ? 'day' : 'week' }}</h5>
        <div>
            <BaseButton class="btn btn-sm rounded-pill"
                v-bind:class="feedType === 'daily' ? 'btn-primary' : 'btn-outline-secondary'"
                v-on:click="switchFeed('daily')">Today</BaseButton>
            <BaseButton class="btn btn-sm rounded-pill ms-1"
                v-bind:class="feedType === 'weekly' ? 'btn-primary' : 'btn-outline-secondary'"
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
        <div class="col-md-6" v-for="rec in filteredRecommendations" v-bind:key="rec._id">
            <RecommendationCards 
                v-bind:recommendation="rec" 
                v-bind:status="plannerStatus[rec.event._id] || ''"
                v-on:hide="hideRecommendation(rec._id, false)"
                v-on:less-like-this="hideRecommendation(rec._id, true)"
                v-on:toggle-status="toggleStatus(rec.event)"
            />
        </div>
    </div>
</template>

<style scoped>


</style>
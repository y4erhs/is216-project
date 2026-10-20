<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import BaseButton from './BaseButton.vue'

// RMB TO CHANGE AFT LOGIN AND SIGN UP IS DONE
const userId = '6acd9e65046b9013f579fc79'

const allInterests = ref([])       // every tag that events use
const selectedInterests = ref([])  // the ticked boxes
const saving = ref(false)
const message = ref('')

async function loadData() {
    try {
        const prefs = await axios.get(`http://localhost:8000/api/users/${userId}/preferences`)
        selectedInterests.value = [...prefs.data]

        const events = await axios.get('http://localhost:8000/api/events')
        const tags = events.data.flatMap(e => e.tags)
        // include current interests too, so they can still be unticked
        allInterests.value = [...new Set([...tags, ...prefs.data])].sort()
    } catch (error) {
        console.log('There was an error: ' + error.message)
    }
}

async function saveInterests() {
    saving.value = true
    message.value = ''
    try {
        await axios.put(`http://localhost:8000/api/users/${userId}`, {
            preferences: selectedInterests.value
        })
        message.value = 'Interests saved!'
        localStorage.setItem('interestsChanged', 'true')
    } catch (error) {
        message.value = 'Could not save. Try again.'
        console.log('There was an error: ' + error.message)
    }
    saving.value = false
}

onMounted(loadData)
</script>

<template>
    <div>
        <h5 class="text-dark mb-3">Your interests</h5>

        <div class="d-flex flex-wrap gap-3 mb-3">
            <div class="form-check" v-for="interest in allInterests" v-bind:key="interest">
                <input class="form-check-input" type="checkbox"
                    v-bind:id="'interest-' + interest"
                    v-bind:value="interest"
                    v-model="selectedInterests">
                <label class="form-check-label text-dark" v-bind:for="'interest-' + interest">{{ interest }}</label>
            </div>
        </div>

        <BaseButton v-bind:disabled="saving" v-on:click="saveInterests">
            {{ saving ? 'Saving...' : 'Save' }}
        </BaseButton>
        <span v-if="message" class="small text-muted ms-2">{{ message }}</span>
    </div>
</template>
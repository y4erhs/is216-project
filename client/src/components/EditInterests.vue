<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import BaseButton from './BaseButton.vue'
import { useAuth } from '../composables/useAuth'
import { INTERESTS, interestLabel } from '../utils/interests'
import { API_URL } from '../utils/api'


const { userId } = useAuth()

const allInterests = INTERESTS.map(i => i.id)     // the only interests users can pick
const selectedInterests = ref([])  // the ticked boxes
const saving = ref(false)
const message = ref('')

async function loadData() {
    try {
        const prefs = await axios.get(`${API_URL}/api/users/${userId.value}/preferences`)
        // drop old interests that aren't on the list any more
        selectedInterests.value = prefs.data.filter(i => allInterests.includes(i))
    } catch (error) {
        console.log('There was an error: ' + error.message)
    }
}

async function saveInterests() {
    saving.value = true
    message.value = ''
    try {
        await axios.put(`${API_URL}/api/users/${userId.value}`, {
            interests: selectedInterests.value
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
                <label class="form-check-label text-dark" v-bind:for="'interest-' + interest">{{ interestLabel(interest) }}</label>
            </div>
        </div>

        <BaseButton v-bind:disabled="saving" v-on:click="saveInterests">
            {{ saving ? 'Saving...' : 'Save' }}
        </BaseButton>
        <span v-if="message" class="small text-muted ms-2">{{ message }}</span>
    </div>
</template>
<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuth } from '../composables/useAuth'

const API_URL = 'http://localhost:8000'
const { userId } = useAuth()

const connected = ref(false)
const googleEmail = ref(null)
const loading = ref(true)
const message = ref('')

const embedUrl = computed(() =>
    `https://calendar.google.com/calendar/embed?src=${encodeURIComponent(googleEmail.value)}&ctz=Asia%2FSingapore&mode=WEEK`
)

async function loadStatus() {
    loading.value = true
    try {
        const res = await fetch(`${API_URL}/auth/google/status?userId=${userId.value}`)
        const data = await res.json()
        connected.value = data.connected
        googleEmail.value = data.googleEmail
    } catch (err) {
        message.value = 'Could not check Google Calendar status.'
    } finally {
        loading.value = false
    }
}

onMounted(loadStatus)
</script>

<template>
    <p v-if="loading" class="text-muted">Loading calendar...</p>
    <p v-else-if="message" class="text-muted">{{ message }}</p>
    <iframe
    v-else-if="connected && googleEmail"
    :src="embedUrl"
    style="border: 0; width: 100%; height: 600px; border-radius: 20px;"
></iframe>
    <p v-else class="text-muted">
        Google Calendar isn't linked yet. <router-link to="/profile">Link it in Profile & Settings</router-link>.
    </p>
</template>

<style scoped>

</style>

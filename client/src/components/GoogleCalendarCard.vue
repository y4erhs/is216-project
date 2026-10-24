<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const props = defineProps({
    userId: { type: String, required: true }
})

const API_URL = 'http://localhost:8000'
const route = useRoute()
const router = useRouter()

const connected = ref(false)
const connectedAt = ref(null)
const loading = ref(true)
const message = ref('')

async function loadStatus() {
    loading.value = true
    try {
        const res = await fetch(`${API_URL}/auth/google/status?userId=${props.userId}`)
        const data = await res.json()
        connected.value = data.connected
        connectedAt.value = data.connectedAt
    } catch (err) {
        message.value = 'Could not check Google Calendar status.'
    } finally {
        loading.value = false
    }
}

function connect() {
    // leaves your site and goes to Google's permission screen
    window.location.href = `${API_URL}/auth/google?userId=${props.userId}`
}

async function disconnect() {
    if (!confirm('Disconnect Google Calendar? Events already added will stay in your Google Calendar.')) {
        return
    }
    const res = await fetch(`${API_URL}/auth/google?userId=${props.userId}`, { method: 'DELETE' })
    if (res.ok) {
        connected.value = false
        connectedAt.value = null
        message.value = 'Google Calendar disconnected.'
    } else {
        message.value = 'Could not disconnect. Please try again.'
    }
}

function formatDate(date) {
    return new Date(date).toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' })
}

onMounted(() => {
    // show a message after coming back from Google
    const result = route.query.google
    if (result === 'connected') message.value = 'Google Calendar connected!'
    if (result === 'denied') message.value = 'Connection cancelled.'
    if (result === 'error') message.value = 'Something went wrong. Please try again.'

    // clean ?google=... out of the address bar
    if (result) router.replace({ query: {} })

    loadStatus()
})
</script>

<template>
    <div class="google-card">
        <h3>Google Calendar</h3>

        <p v-if="loading">Checking connection...</p>

        <template v-else-if="connected">
            <span class="badge-linked">Linked</span>
            <p>Connected on {{ formatDate(connectedAt) }}. Sessions you mark as attending are added automatically.</p>
            <button @click="disconnect">Disconnect</button>
        </template>

        <template v-else>
            <p>Connect your Google Calendar so events you attend are added automatically.</p>
            <button @click="connect">Connect Google Calendar</button>
        </template>

        <p v-if="message" class="message">{{ message }}</p>
    </div>
</template>

<style scoped>
h3 {
    color:black
}
p {
    color: black;
}
.google-card {
    padding: 20px;
    border-radius: 12px;
    background: white;
}
.badge-linked {
    display: inline-block;
    padding: 4px 10px;
    border-radius: 999px;
    background: #e6f4ea;
    color: #1e7e34;
    font-size: 0.85rem;
}
.message {
    margin-top: 10px;
    font-size: 0.9rem;
}
</style>
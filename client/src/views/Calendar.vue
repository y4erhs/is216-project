<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuth } from '../composables/useAuth'
import GoogleCalendarCard from '@/components/GoogleCalendarCard.vue'

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
  <div class="calendar-page">
    <div class="calendar-main">
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
    </div>

    <aside class="calendar-side">
      <div class="side-spacer"></div>
      <GoogleCalendarCard />
    </aside>
  </div>
</template>

<style scoped>
    .calendar-page {
    display: flex;
    gap: 16px;
    }

    .calendar-main {
    flex: 1;          /* takes all the leftover space */
    min-width: 0;     /* lets it shrink so the side column isn't pushed off */
    }

    .calendar-side {
    width: 320px;
    flex-shrink: 0;   /* keeps the side column at 320px */
    display: flex;
    flex-direction: column;
    gap: 16px;
    }

    .side-spacer {
    flex: 1;          /* fills the top, pushing the card to the bottom */
    }

    /* On smaller screens, stack the side column under the calendar */
    @media (max-width: 992px) {
    .calendar-page { flex-direction: column; }
    .calendar-side { width: 100%; }
    }

</style>

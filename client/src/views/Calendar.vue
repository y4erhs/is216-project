<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuth } from '../composables/useAuth'
import GoogleCalendarCard from '@/components/GoogleCalendarCard.vue'
import PlanForm from '@/components/PlanForm.vue'
import ScheduleAlerts from '@/components/ScheduleAlerts.vue'

const API_URL = 'http://localhost:8000'
const { userId } = useAuth()

const connected = ref(false)
const googleEmail = ref(null)
const loading = ref(true)
const message = ref('')
const showPlanForm = ref(false)
const calendarKey = ref(0)   // changing this reloads the calendar
const alertsKey = ref(0)   // changing this reloads the alerts

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

function refreshAll() {
  calendarKey.value++
  alertsKey.value++
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
        :key="calendarKey"
        :src="embedUrl"
        style="border: 0; width: 100%; height: 600px; border-radius: 20px;"
      ></iframe>
      <p v-else class="text-muted">
        Google Calendar isn't linked yet. <router-link to="/profile">Link it in Profile & Settings</router-link>.
      </p>
    </div>

    <aside class="calendar-side">
    <template v-if="!showPlanForm">
      <button type="button" class="btn-make-plan" @click="showPlanForm = true">
        Make your own plan!
      </button>
      <ScheduleAlerts class="side-alerts" :user-id="userId" :refresh-key="alertsKey" />
      <GoogleCalendarCard
        :user-id="userId"
        @synced="refreshAll"
        @settings-changed="alertsKey++"
      />
    </template>

    <PlanForm
      v-else
      :user-id="userId"
      @close="showPlanForm = false"
      @created="refreshAll"
    />
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

    .btn-make-plan {
      background-color: var(--color-green);
      color: var(--color-dark-green);
      border: none;
      border-radius: 9999px;
      padding: 14px;
      font-weight: 700;
      letter-spacing: 1px;
      text-transform: uppercase;
      cursor: pointer;
    }

    .side-alerts {
      flex: 1;            /* fills the space, so the Google card stays at the bottom */
      min-height: 0;
      overflow-y: auto;   /* scrolls if there are lots of alerts */
    }

</style>

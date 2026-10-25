<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import '../assets/theme.css'
import BaseButton from '../components/BaseButton.vue';
import { computed } from 'vue'

const props = defineProps({
    userId: { type: String, required: true }
})

const API_URL = 'http://localhost:8000'
const route = useRoute()
const router = useRouter()

const connected = ref(false)
const connectedAt = ref(null)
const googleEmail = ref(null)
const loading = ref(true)
const message = ref('')

const embedUrl = computed(() =>
    `https://calendar.google.com/calendar/embed?src=${encodeURIComponent(googleEmail.value)}&ctz=Asia%2FSingapore&mode=WEEK`
)

async function loadStatus() {
    loading.value = true
    try {
        const res = await fetch(`${API_URL}/auth/google/status?userId=${props.userId}`)
        const data = await res.json()
        connected.value = data.connected
        connectedAt.value = data.connectedAt
        googleEmail.value = data.googleEmail
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
        googleEmail.value = null
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
        <!-- CONNECT CALENDAR -->
        <div class="calendar-card">
          <div class="calendar-header">
            <span class="calendar-title">Your connected calendar</span>
            <button type="button" class="btn-manage" @click="connect">Manage</button>
          </div>

          <div class="calendar-provider">
              <i class="bi bi-calendar-event fs-5"></i>
            <div class="cal-provider-info">
              <div class="cal-name">Google Calendar</div>
              <div class="cal-email" v-if="googleEmail">{{ googleEmail }}</div>
            </div>
          </div>

          <p v-if="loading">Checking connection...</p>

          <template v-else-if="connected">
            <div class="cal-badge">
                Linked · Preview connection
            </div>

            <div class="cal-sync-info">
                <p>Connected on {{ formatDate(connectedAt) }}.</p>
                <p>Sessions you mark as attending are added automatically.</p>
            </div>

            <div class="cal-toggle-row">
                <span>Include personal commitments</span>
                <label class="toggle-switch">
                <input type="checkbox" v-model="includePersonal" />
                <span class="slider"></span>
                </label>
            </div>

           <div class="cal-actions">
            <BaseButton type="button" class="theme-purple">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
                stroke-linecap="round" stroke-linejoin="round">
                <polyline points="23 4 23 10 17 10"></polyline>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
              </svg>
              Sync now
            </BaseButton>
            <BaseButton type="button" class="theme-purple" @click="disconnect">Unlink</BaseButton>
           </div>
         </template>

         <template v-else>
            <div class="cal-badge">
                Unlinked
            </div>
            <BaseButton type="button" class="theme-purple" @click="connect">Link</BaseButton>
         </template>
        </div>
</template>

<style scoped>
.profile-container {
  color: var(--color-black);
}

.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.page-title {
  color: var(--color-white);
  font-family: 'HeaderFont';
  font-size: 25px;
}

.save-btn {
  background-color: var(--color-dark-blue);
}

.profile-grid {
  display: grid;
  grid-template-columns: 360px 1fr;
  gap: 15px;
  align-items: start;
}

@media (max-width: 991px) {
  .profile-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 767px) {
  .profile-grid {
    grid-template-columns: 1fr;
  }
}

.left-column {
  display: flex;
  flex-direction: column;
  gap: 15px;
  width: 100%;
}

.calendar-card {
  background-color: var(--color-white);
  border-radius: 25px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  box-sizing: border-box;
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.calendar-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-black);
}

.btn-manage {
  background: none;
  border: none;
  color: var(--color-blue);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
}

.calendar-provider {
  display: flex;
  align-items: center;
  gap: 12px;
}

.bi {
  color: var(--color-dark-blue);
  margin: 0 10px;
}

.cal-provider-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.cal-name {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-black);
}

.cal-email {
  font-size: 12px;
  color: #64748b;
}

.cal-badge {
  display: inline-flex;
  align-items: center;
  background-color: var(--color-green);
  color: var(--color-dark-green);
  font-size: 12px;
  font-weight: 600;
  padding: 5px 12px 1px 12px;
  border-radius: 9999px;
  width: fit-content;
}

.cal-sync-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
  font-size: 12px;
  color: #64748b;
}

.cal-sync-info p {
  margin: 0;
}

.cal-toggle-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-black);
  padding: 4px 0;
}

.cal-actions {
  display: flex;
  gap: 10px;
}

.btn-cal-action:hover {
  background-color: #f8fafc;
}

.cal-disclaimer {
  margin: 0;
  font-size: 11px;
  color: #94a3b8;
  line-height: 1.4;
}

.profile-card {
  background-color: var(--color-white);
  border-radius: 25px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 15px;
}

.profile-header-visual {
  position: relative;
  width: 100%;
  margin-bottom: 35px;
}

.avatar {
  background-color: var(--color-green);
  width: 80px;
  height: 80px;
  border-radius: 20px;
  font-size: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-top: 14px;
  position: absolute;
  left: 20px;
  bottom: -30px;
  overflow: hidden;
}

.profile-banner {
  aspect-ratio: 5 / 2;
  background-color: var(--color-dark-green);
  border-radius: 20px;
}

.user-info p {
  margin: 0;
  margin-left: 15px;
}

.username {
  opacity: 70%;
}

.stats-row {
  display: flex;
  flex-direction: row;
  gap: 35px;
  margin-left: 15px;
}

.stat-number {
  font-size: 30px;
}

.stat-label {
  opacity: 70%;
}

.dropdowns {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 15px;
}

.two-col-inputs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin: 15px;
  margin-top: 0;
  align-items: start;
}

.badges-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.badge-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 0 15px 20px 15px;
}

.badge-title {
  font-family: 'TextFont', sans-serif;
  font-size: 12px;
  font-weight: 700;
  color: var(--color-black);
}

.badge-pills {
  display: flex;
  gap: 8px;
  align-items: center;
}

.badge-pill {
  display: inline-block;
  height: 22px;
  border-radius: 9999px;
  background-color: var(--color-grey);
  padding: 5px 12px 18px 12px;
  font-size: 11px;
}

.settings-card {
  display: flex;
  flex-direction: column;
  background-color: var(--color-white);
  border-radius: 25px;
  padding: 20px;
  gap: 10px;
}

.settings-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.8px;
  color: #8c9ba5;
  border-bottom: 1px solid #f1f5f9;
}

.header-col-switches {
  display: flex;
  gap: 24px;
  width: 120px;
  justify-content: space-around;
  text-align: center;
}

.settings-item-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.setting-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.setting-title {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: var(--color-black, #1e293b);
}

.setting-desc {
  margin: 0;
  font-size: 12px;
  color: #7b8794;
}

.setting-switches {
  display: flex;
  align-items: center;
  gap: 24px;
  width: 120px;
  justify-content: space-around;
}

/* CUSTOM SWITCH */
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
  cursor: pointer;
  margin: 0;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
  margin: 0;
}

.slider {
  position: absolute;
  inset: 0;
  background-color: var(--color-grey);
  border-radius: 9999px;
  transition: background-color 0.25s ease;
}

.slider::before {
  content: "";
  position: absolute;
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: #ffffff;
  border-radius: 50%;
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.toggle-switch input:checked+.slider {
  background-color: var(--color-orange);
}

.toggle-switch input:checked+.slider::before {
  transform: translateX(20px);
}
</style>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuth } from '../composables/useAuth'
import PlanForm from '@/components/PlanForm.vue'
import ScheduleAlerts from '@/components/ScheduleAlerts.vue'
import PlansList from '@/components/PlansList.vue'
import { API_URL } from '../utils/api'
import BaseButton from '@/components/BaseButton.vue'

const { userId } = useAuth()

const connected = ref(false)
const googleEmail = ref(null)
const loading = ref(true)
const message = ref('')
const showPlanForm = ref(false)
const editingPlan = ref(null)
const calendarKey = ref(0)
const alertsKey = ref(0)
const isAlertsCollapsed = ref(false) // State buat ngecek lg ke-collapse atau gak

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

function openPlanForm(plan = null) {
  editingPlan.value = plan
  showPlanForm.value = true
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
        style="border: 0; width: 100%; height: 100%; border-radius: 20px;"
      ></iframe>
      <p v-else class="text-muted">
        Google Calendar isn't linked yet. <router-link to="/profile">Link it in Profile & Settings</router-link>.
      </p>
    </div>

    <aside class="calendar-side">
      <template v-if="!showPlanForm">
        <div class="action-buttons-row">
          <BaseButton type="button" class="theme-green action-btn" @click="openPlanForm()">
            Make your own plan!
          </BaseButton>
          <router-link to="/profile" class="base-btn-wrapper">
            <BaseButton type="button" class="theme-purple action-btn" title="Link/Manage Calendar">
              Link Calendar
            </BaseButton>
          </router-link>
        </div>

        <!-- Tambahin class :class="{ 'is-collapsed': isAlertsCollapsed }" -->
        <div class="half-section collapsible-section" :class="{ 'is-collapsed': isAlertsCollapsed }">
          <ScheduleAlerts class="side-alerts" :user-id="userId" :refresh-key="alertsKey" @collapse="isAlertsCollapsed = $event" />
        </div>
        <div class="half-section">
          <PlansList :user-id="userId" :refresh-key="alertsKey" @edit="openPlanForm" @changed="refreshAll" @replied="alertsKey++" />
        </div>
      </template>

      <PlanForm
        v-else
        :user-id="userId"
        :plan="editingPlan"
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
      height: calc(100vh - 120px);
      max-height: calc(100vh - 120px);
      box-sizing: border-box;
      overflow: hidden;
    }

    .calendar-main {
      flex: 1;
      min-width: 0;
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .calendar-side {
      width: 280px;
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      gap: 12px;
      height: 100%;
      min-height: 0;
      overflow: hidden;
    }

    .action-buttons-row {
      display: flex;
      gap: 8px;
      flex-shrink: 0;
    }

    .action-btn {
      flex: 1;
      width: 100%;
      min-height: 38px;
      font-size: 10px;
      padding: 6px 8px;
      justify-content: center;
      text-align: center;
      white-space: nowrap;
    }

    .base-btn-wrapper {
      flex: 1;
      text-decoration: none;
      display: flex;
    }

    .half-section {
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      background: var(--color-grey, #f0f1f7);
      border-radius: 25px;
      padding: 10px;
      transition: flex 0.2s ease; /* Biar transisi ciutnya smooth */
    }

    /* KUNCI: Pas di-collapse, box luarnya lgsg ikut ciut seukuran header doang! */
    .half-section.is-collapsed {
      flex: 0 0 auto !important;
    }

    .side-alerts {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
    }

    @media (max-width: 992px) {
      .calendar-page { 
        flex-direction: column; 
        height: auto;
        max-height: none;
        overflow: visible;
      }
      .calendar-side { width: 100%; height: auto; }
      .calendar-main { height: 500px; }
    }
</style>
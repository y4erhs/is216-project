<script setup>
import { ref, watch, onMounted } from 'vue'
import { API_URL } from '../utils/api'

const props = defineProps({
  userId: { type: String, required: true },
  refreshKey: { type: Number, default: 0 }
})
const emit = defineEmits(['collapse']) // Tambahin emit ini

const TIME_ZONE = 'Asia/Singapore'

const alerts = ref([])
const loading = ref(true)
const error = ref('')
const openIndex = ref(null)
const isCollapsed = ref(false)

function toggleCollapse() {
  isCollapsed.value = !isCollapsed.value
  emit('collapse', isCollapsed.value) // Kirim status ke Calendar.vue
}

async function loadAlerts() {
  loading.value = true
  error.value = ''
  try {
    const res = await fetch(`${API_URL}/api/schedule/conflicts?userId=${props.userId}`)
    const data = await res.json()
    if (!res.ok) throw new Error(data.message)
    alerts.value = data.alerts
  } catch (err) {
    error.value = 'Could not check your schedule.'
  } finally {
    loading.value = false
  }
}

function formatDay(date) {
  return new Date(date).toLocaleDateString('en-SG', {
    weekday: 'short', day: 'numeric', month: 'short', timeZone: TIME_ZONE
  })
}

function formatTime(date) {
  return new Date(date).toLocaleTimeString('en-SG', {
    hour: 'numeric', minute: '2-digit', timeZone: TIME_ZONE
  })
}

function label(item) {
  if (item.kind === 'event') return item.status === 'attending' ? 'attending' : 'saved'
  return item.status === 'creator' ? 'your plan' : 'invited'
}

function summary(alert) {
  const [a, b] = alert.items
  if (alert.type === 'overlap') {
    return `"${a.title}" overlaps with "${b.title}" on ${formatDay(alert.overlapStart)}, ${formatTime(alert.overlapStart)}–${formatTime(alert.overlapEnd)}.`
  }
  if (alert.gapMinutes === 0) {
    return `"${a.title}" and "${b.title}" are back-to-back on ${formatDay(b.start)}.`
  }
  return `Only ${alert.gapMinutes} min between "${a.title}" and "${b.title}" on ${formatDay(b.start)}.`
}

function toggle(i) {
  openIndex.value = openIndex.value === i ? null : i
}

watch(() => props.refreshKey, loadAlerts)
onMounted(loadAlerts)
</script>

<template>
  <div class="alerts-container" :class="{ collapsed: isCollapsed }">
    <!-- Panggil fungsi toggleCollapse di header -->
    <div class="alerts-header" @click="toggleCollapse">
      <h2 class="alerts-title">
        Clashes <span class="alerts-num" v-if="alerts.length">({{ alerts.length }})</span>
      </h2>
      <button type="button" class="collapse-btn" :aria-label="isCollapsed ? 'Expand clashes' : 'Collapse clashes'">
        <svg class="info-chev" :class="{ open: !isCollapsed }" width="12" height="8" viewBox="0 0 12 8" aria-hidden="true">
          <path d="M1 1.5 6 6.5l5-5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
    </div>

    <div v-show="!isCollapsed" class="alerts-scroll-area">
      <div class="alerts">
        <p v-if="loading" class="alerts-note">Checking your schedule...</p>
        <p v-else-if="error" class="alerts-note">{{ error }}</p>
        <p v-else-if="alerts.length === 0" class="alerts-note">No clashes in the next 7 days.</p>

        <template v-else>
          <div v-for="(alert, i) in alerts" :key="i" class="alert-card" :class="alert.type">
            <div class="alert-title">
              <i class="bi bi-exclamation-triangle"></i>
              {{ alert.type === 'overlap' ? 'Schedule overlap' : 'Tight timing' }}
            </div>

            <p class="alert-text">{{ summary(alert) }}</p>

            <ul v-if="openIndex === i" class="alert-details">
              <li v-for="item in alert.items" :key="item.kind + item.id + item.start">
                <strong>{{ item.title }}</strong> ({{ label(item) }})<br />
                {{ formatDay(item.start) }}, {{ formatTime(item.start) }}–{{ formatTime(item.end) }}
              </li>
            </ul>

            <button type="button" class="alert-link" @click="toggle(i)">
              {{ openIndex === i ? 'Hide details' : 'Review & resolve' }}
            </button>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.alerts-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.alerts-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  padding: 5px;
  flex-shrink: 0;
}

.alerts-title {
  margin: 0;
  color: var(--color-black);
  font-family: 'HeaderFont';
  font-size: 20px;
  text-transform: uppercase;
}
.collapse-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  color: var(--color-black);
}

.info-chev {
  transition: transform 0.2s ease;
  transform: rotate(180deg);
}

.info-chev.open {
  transform: rotate(0deg);
}

.alerts-scroll-area {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 4px;
  margin-top: 5px;
}

.alerts {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.alerts-note {
  margin: 0;
  background-color: var(--color-white);
  border-radius: 18px;
  padding: 14px 16px;
  font-size: 13px;
  color: #64748b;
}

.alert-card {
  border-radius: 18px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  color: #5e0e0e;
}

.alert-card.overlap {
  background-color: #f8c9c4;
}

.alert-card.tight {
  background-color: #fbd3bf;
}

.alert-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 700;
}

.alert-title .bi {
  margin: 0;
}

.alert-text {
  margin: 0;
  font-size: 12px;
  line-height: 1.4;
}

.alert-details {
  margin: 0;
  padding-left: 16px;
  font-size: 12px;
  line-height: 1.5;
}

.alert-link {
  align-self: flex-end;
  background: none;
  border: none;
  padding: 0;
  font-size: 12px;
  font-weight: 600;
  text-decoration: underline;
  color: var(--color-dark-red);
  cursor: pointer;
}
</style>
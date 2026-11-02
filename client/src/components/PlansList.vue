<script setup>
// "Your plans": upcoming plans you made (edit, delete) or were invited to (accept, decline)
import { ref, watch, onMounted } from 'vue'
import axios from 'axios'
import { API_URL } from '../utils/api'

const props = defineProps({
  userId: { type: String, required: true },
  refreshKey: { type: Number, default: 0 }   // changes when a plan is created or synced
})
const emit = defineEmits(['edit', 'changed', 'replied'])

const TIME_ZONE = 'Asia/Singapore'

const plans = ref([])
const loading = ref(true)
const error = ref('')
const notice = ref('')
const confirmingId = ref(null)   // the plan showing "Delete this plan?"
const busyId = ref(null)

async function loadPlans() {
  try {
    const { data } = await axios.get(`${API_URL}/api/plans`, { params: { userId: props.userId } })
    plans.value = data
    error.value = ''
  } catch (err) {
    error.value = 'Could not load your plans.'
  } finally {
    loading.value = false
  }
}

const isMine = (plan) => plan.creator?._id === props.userId
const hasId = (list, id) => (list || []).some(person => (person._id || person) === id)

function myReply(plan) {
  if (hasId(plan.accepted, props.userId)) return 'accepted'
  if (hasId(plan.declined, props.userId)) return 'declined'
  return null
}

function replySummary(plan) {
  const noReply = plan.invitees.length - plan.accepted.length - plan.declined.length
  return `${plan.accepted.length} going · ${plan.declined.length} declined · ${noReply} no reply`
}

function formatWhen(plan) {
  const start = new Date(plan.startTime)
  const day = start.toLocaleDateString('en-SG', { weekday: 'short', day: 'numeric', month: 'short', timeZone: TIME_ZONE })
  if (plan.allDay) return `${day} · All day`

  const time = (date) => date.toLocaleTimeString('en-SG', { hour: 'numeric', minute: '2-digit', timeZone: TIME_ZONE })
  return `${day} · ${time(start)}–${time(new Date(plan.endTime))}`
}

async function respond(plan, response) {
  busyId.value = plan._id
  notice.value = ''
  try {
    await axios.put(`${API_URL}/api/plans/${plan._id}/respond`, { userId: props.userId, response })
    await loadPlans()
    emit('replied')   // a declined plan stops causing clash alerts
  } catch (err) {
    notice.value = err.response?.data?.message || 'Could not save your reply.'
  } finally {
    busyId.value = null
  }
}

async function deletePlan(plan) {
  busyId.value = plan._id
  notice.value = ''
  try {
    const { data } = await axios.delete(`${API_URL}/api/plans/${plan._id}`, { params: { userId: props.userId } })
    confirmingId.value = null
    if (data.warning) notice.value = data.warning
    await loadPlans()
    emit('changed')
  } catch (err) {
    notice.value = err.response?.data?.message || 'Could not delete the plan.'
  } finally {
    busyId.value = null
  }
}

onMounted(loadPlans)
watch(() => [props.userId, props.refreshKey], loadPlans)
</script>

<template>
  <section class="plans" aria-label="Your plans">
    <h2 class="plans-title">Your plans</h2>

    <p v-if="loading" class="plans-note">Loading...</p>
    <p v-else-if="error" class="plans-note" role="alert">{{ error }}</p>
    <p v-else-if="plans.length === 0" class="plans-note">No upcoming plans yet.</p>

    <p v-if="notice" class="plans-notice" role="status">{{ notice }}</p>

    <article v-for="plan in plans" :key="plan._id" class="plan-item">
      <h3 class="plan-title">{{ plan.title }}</h3>
      <p class="plan-meta">{{ formatWhen(plan) }}</p>
      <p v-if="plan.location" class="plan-meta">{{ plan.location }}</p>
      <p v-if="plan.lobby" class="plan-meta">Lobby: {{ plan.lobby.name }}</p>

      <!-- Plans you made -->
      <template v-if="isMine(plan)">
        <p v-if="plan.invitees.length" class="plan-meta">{{ replySummary(plan) }}</p>

        <div v-if="confirmingId === plan._id" class="plan-actions">
          <span class="plan-confirm">Delete this plan?</span>
          <button type="button" class="plan-btn plan-btn-danger" :disabled="busyId === plan._id" @click="deletePlan(plan)">Yes, delete</button>
          <button type="button" class="plan-btn" @click="confirmingId = null">Keep</button>
        </div>
        <div v-else class="plan-actions">
          <button type="button" class="plan-btn" @click="emit('edit', plan)">Edit</button>
          <button type="button" class="plan-btn" @click="confirmingId = plan._id">Delete</button>
        </div>
      </template>

      <!-- Plans you were invited to -->
      <template v-else>
        <p class="plan-meta">From {{ plan.creator?.displayName || plan.creator?.username || 'a friend' }}</p>
        <div class="plan-actions" role="group" :aria-label="`Reply to ${plan.title}`">
          <button
            type="button"
            class="plan-btn"
            :class="{ 'plan-btn-on': myReply(plan) === 'accepted' }"
            :aria-pressed="myReply(plan) === 'accepted'"
            :disabled="busyId === plan._id"
            @click="respond(plan, 'accepted')"
          >Accept</button>
          <button
            type="button"
            class="plan-btn"
            :class="{ 'plan-btn-off': myReply(plan) === 'declined' }"
            :aria-pressed="myReply(plan) === 'declined'"
            :disabled="busyId === plan._id"
            @click="respond(plan, 'declined')"
          >Decline</button>
        </div>
      </template>
    </article>
  </section>
</template>

<style scoped>
.plans {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.plans-title {
  margin: 0;
  color: var(--color-white);
  font-family: 'HeaderFont';
  font-size: 18px;
  text-transform: uppercase;
}

.plans-note,
.plans-notice {
  margin: 0;
  padding: 14px 16px;
  border-radius: 18px;
  background-color: var(--color-white);
  color: #64748b;
  font-size: 13px;
}

.plans-notice {
  color: var(--color-black);
}

.plan-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 14px 16px;
  border-radius: 18px;
  background-color: var(--color-white);
  color: var(--color-black);
}

.plan-title {
  margin: 0 0 2px;
  font-size: 14px;
  font-weight: 700;
  overflow-wrap: anywhere;
}

.plan-meta {
  margin: 0;
  color: #64748b;
  font-size: 12px;
  overflow-wrap: anywhere;
}

.plan-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}

.plan-confirm {
  width: 100%;
  font-size: 12px;
  font-weight: 700;
}

.plan-btn {
  padding: 6px 14px 4px;
  border: 0;
  border-radius: 999px;
  background-color: var(--color-grey);
  color: var(--color-black);
  font-size: 12px;
  cursor: pointer;
}

.plan-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.plan-btn-on {
  background-color: var(--color-green);
  font-weight: 700;
}

.plan-btn-off {
  background-color: var(--color-orange);
  font-weight: 700;
}

.plan-btn-danger {
  background-color: var(--color-dark-red);
  color: var(--color-white);
}
</style>

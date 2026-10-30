<script setup>
import { ref, onMounted } from 'vue'

const props = defineProps({
  userId: { type: String, required: true }
})
const emit = defineEmits(['close', 'created'])

const API_URL = 'http://localhost:8000'

// form fields
const title = ref('')
const allDay = ref(false)
const start = ref('')
const end = ref('')
const location = ref('')
const description = ref('')

// friends
const friends = ref([])
const selectedIds = ref([])

const saving = ref(false)
const error = ref('')

async function loadFriends() {
  try {
    const res = await fetch(`${API_URL}/api/friends/${props.userId}/accepted`)
    if (!res.ok) return   // 404 means no friends yet
    const data = await res.json()

    // each record has both people; keep the one that isn't this user
    friends.value = data.map(f => {
      const other = String(f.requester._id) === props.userId ? f.receiver : f.requester
      return { id: String(other._id), username: other.username }
    })
  } catch (err) {
    // friends are optional, so the form still works without them
  }
}

function toggleFriend(id) {
  if (selectedIds.value.includes(id)) {
    selectedIds.value = selectedIds.value.filter(x => x !== id)
  } else {
    selectedIds.value.push(id)
  }
}

function onAllDayChange() {
  // inputs switch between date and date-time, so clear old values
  start.value = ''
  end.value = ''
}

async function submit() {
  error.value = ''

  if (!title.value.trim()) {
    error.value = 'Please add a title.'
    return
  }
  if (!start.value) {
    error.value = 'Please pick a start.'
    return
  }
  if (!allDay.value && !end.value) {
    error.value = 'Please pick an end time.'
    return
  }
  if (!allDay.value && new Date(end.value) <= new Date(start.value)) {
    error.value = 'End time must be after start time.'
    return
  }

  const body = {
    userId: props.userId,
    title: title.value.trim(),
    allDay: allDay.value,
    // all-day: plain "YYYY-MM-DD"; timed: convert to a full date-time with timezone
    start: allDay.value ? start.value : new Date(start.value).toISOString(),
    end: allDay.value ? (end.value || start.value) : new Date(end.value).toISOString(),
    location: location.value,
    description: description.value,
    inviteeIds: selectedIds.value
  }

  saving.value = true
  try {
    const res = await fetch(`${API_URL}/api/plans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    const data = await res.json()

    if (!res.ok) {
      error.value = data.message || 'Could not create plan.'
      return
    }

    if (data.warning) alert(data.warning)   // e.g. Google not linked
    emit('created', data.plan)
    emit('close')
  } catch (err) {
    error.value = 'Could not reach the server. Please try again.'
  } finally {
    saving.value = false
  }
}

onMounted(loadFriends)
</script>

<template>
  <div class="plan-card">
    <div class="plan-header">
      <h3 class="plan-heading">Make your own plan!</h3>
      <button type="button" class="btn-close-plan" @click="emit('close')" aria-label="Close">✕</button>
    </div>

    <label class="field">
      <span>Event title</span>
      <input v-model="title" type="text" />
    </label>

    <div class="toggle-row">
      <span style="color: black;">All day</span>
      <label class="toggle-switch">
        <input type="checkbox" v-model="allDay" @change="onAllDayChange" />
        <span class="slider"></span>
      </label>
    </div>

    <label class="field">
      <span>{{ allDay ? 'Start date' : 'Start time' }}</span>
      <input v-model="start" :type="allDay ? 'date' : 'datetime-local'" />
    </label>

    <label class="field">
      <span>{{ allDay ? 'End date (optional)' : 'End time' }}</span>
      <input v-model="end" :type="allDay ? 'date' : 'datetime-local'" />
    </label>

    <label class="field">
      <span>Location</span>
      <input v-model="location" type="text" />
    </label>

    <label class="field">
      <span>Description</span>
      <textarea v-model="description" rows="3"></textarea>
    </label>

    <div class="field">
      <span>Invite friends!</span>
      <p v-if="friends.length === 0" class="hint">No friends to invite yet.</p>
      <div v-else class="friend-row">
        <button
          v-for="f in friends"
          :key="f.id"
          type="button"
          class="friend"
          :class="{ selected: selectedIds.includes(f.id) }"
          :title="f.username"
          @click="toggleFriend(f.id)"
        >
          <span class="friend-circle">{{ f.username.charAt(0).toUpperCase() }}</span>
          <span class="friend-name">{{ f.username }}</span>
        </button>
      </div>
    </div>

    <p v-if="error" class="error">{{ error }}</p>

    <button type="button" class="btn-add" :disabled="saving" @click="submit">
      {{ saving ? 'Adding...' : 'Add to calendar' }}
    </button>
  </div>
</template>

<style scoped>
.plan-card {
  background-color: var(--color-white);
  border-radius: 25px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-sizing: border-box;
}

.plan-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.plan-heading {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--color-black);
}

.btn-close-plan {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #64748b;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.field > span {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-black);
}

.field input,
.field textarea {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 8px 12px;
  font-size: 14px;
  font-family: inherit;
}

.field textarea {
  resize: vertical;
}

.toggle-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  font-weight: 600;
}

.hint {
  margin: 0;
  font-size: 12px;
  color: #64748b;
}

.friend-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.friend {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.friend-circle {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background-color: var(--color-grey);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  border: 3px solid transparent;
  box-sizing: border-box;
}

.friend.selected .friend-circle {
  border-color: var(--color-orange);
}

.friend-name {
  font-size: 11px;
  color: #64748b;
  max-width: 50px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.error {
  margin: 0;
  font-size: 13px;
  color: #dc2626;
}

.btn-add {
  background-color: var(--color-green);
  color: var(--color-dark-green);
  border: none;
  border-radius: 9999px;
  padding: 12px;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
  cursor: pointer;
}

.btn-add:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* toggle switch (same as GoogleCalendarCard) */
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

.toggle-switch input:checked + .slider {
  background-color: var(--color-orange);
}

.toggle-switch input:checked + .slider::before {
  transform: translateX(20px);
}
</style>
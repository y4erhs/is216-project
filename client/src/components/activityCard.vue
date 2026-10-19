<script setup>
import { ref, computed, watch } from 'vue'
import BaseButton from './BaseButton.vue'
import BaseInput from './BaseInput.vue'
import { formatSession, sessionKey } from '../utils/formatSession'

const props = defineProps({
    activity: { type: Object, required: true },
    tab: { type: String, required: true }   // 'interested' | 'attending' | 'attended'
})
const emit = defineEmits(['set-interested', 'set-going', 'save-note', 'remove'])

const event = computed(() => props.activity.event)

const note = ref(props.activity.note || '')
watch(() => props.activity.note, (v) => { note.value = v || '' })

const sortedSessions = computed(() =>
    [...event.value.sessions].sort((a, b) => sessionKey(a) - sessionKey(b))
)

// { [startTimeMs]: 'attending' | 'attended' }
const goingBySession = computed(() => Object.fromEntries(
    props.activity.sessions.map(s => [sessionKey(s), s.going])
))

// default session: on the Attending/Attended tabs, the earliest session marked with that status;
// otherwise the next upcoming session (or the last one if all have ended)
const defaultSession = computed(() => {
    if (props.tab !== 'interested') {
        const marked = sortedSessions.value.find(s => goingBySession.value[sessionKey(s)] === props.tab)
        if (marked) return marked
    }
    return sortedSessions.value.find(s => new Date(s.endTime) > new Date())
        ?? sortedSessions.value[sortedSessions.value.length - 1]
})

// the user can switch session with the dropdown
const pickedKey = ref(null)
const shownSession = computed(() =>
    sortedSessions.value.find(s => sessionKey(s) === pickedKey.value) ?? defaultSession.value
)

// status of the session currently shown
const going = computed(() => goingBySession.value[sessionKey(shownSession.value)] ?? 'none')

const hasStarted = computed(() => new Date(shownSession.value.startTime) <= new Date())
const hasEnded   = computed(() => new Date(shownSession.value.endTime) < new Date())

const attendingDisabled = computed(() => hasEnded.value && going.value !== 'attending')
const attendedDisabled  = computed(() => !hasStarted.value && going.value !== 'attended')

// clicking the active one again turns it off
function toggleGoing(value) {
    emit('set-going', {
        sessionStart: shownSession.value.startTime,
        status: going.value === value ? 'none' : value
    })
}

// show each session's status in the dropdown
const statusLabel = (s) =>
    ({ attending: ' · ✓ Attending', attended: ' · ★ Attended' }[goingBySession.value[sessionKey(s)]] ?? '')

// removes the event from every tab (and deletes the note)
function remove() {
    if (window.confirm('Remove this event from all your tabs? Your note will be deleted too.')) {
        emit('remove')
    }
}
</script>

<template>
    <div class="card h-100 shadow-sm rounded-4">
        <div class="card-body d-flex flex-column gap-2">
            <div class="d-flex justify-content-between small">
                <span class="text-primary">{{ formatSession(shownSession) }}</span>
                <span class="text-muted">{{ event.tags.join(' · ') }}</span>
            </div>

            <h5 class="card-title mb-0 text-dark">{{ event.title }}</h5>
            <p class="small text-muted mb-0">{{ event.organiser }} · {{ event.venue }}</p>

            <select
                v-if="event.sessions.length > 1"
                class="form-select form-select-sm"
                :value="sessionKey(shownSession)"
                @change="pickedKey = Number($event.target.value)"
            >
                <option v-for="s in sortedSessions" :key="sessionKey(s)" :value="sessionKey(s)">
                    {{ formatSession(s) }}{{ statusLabel(s) }}
                </option>
            </select>

            <div class="d-flex flex-wrap gap-2">
                <BaseButton
                    :class="activity.interested ? '' : 'btn-outline-main'"
                    @click="emit('set-interested', !activity.interested)"
                >
                    {{ activity.interested ? '♥ Interested' : '♡ Interested' }}
                </BaseButton>

                <BaseButton
                    :class="going === 'attending' ? '' : 'btn-outline-main'"
                    :disabled="attendingDisabled"
                    :title="attendingDisabled ? 'This session has already ended' : ''"
                    @click="toggleGoing('attending')"
                >
                    {{ going === 'attending' ? '✓ Attending' : '+ Attending' }}
                </BaseButton>

                <BaseButton
                    :class="going === 'attended' ? '' : 'btn-outline-main'"
                    :disabled="attendedDisabled"
                    :title="attendedDisabled ? 'Available once this session starts' : ''"
                    @click="toggleGoing('attended')"
                >
                    {{ going === 'attended' ? '★ Attended' : '☆ Attended' }}
                </BaseButton>
            </div>

            <BaseInput
                v-model="note"
                type="textarea"
                :rows="2"
                label="My notes"
                placeholder="e.g. bring laptop, meet at the SCIS1 lobby"
            />
            <div class="d-flex justify-content-between">
                <BaseButton class="btn-outline-main" @click="remove">
                    Remove
                </BaseButton>
                <BaseButton :disabled="note === (activity.note || '')" @click="emit('save-note', note)">
                    Save note
                </BaseButton>
            </div>
        </div>
    </div>
</template>
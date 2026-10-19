<script setup>
import { computed, ref } from 'vue'
import BaseButton from './BaseButton.vue'
import { formatSession, sessionKey } from '../utils/formatSession'

const props = defineProps({
    event: { type: Object, required: true },
    interested: { type: Boolean, default: false },
    goingBySession: { type: Object, default: () => ({}) }, // { [startTimeMs]: 'attending' | 'attended' }
    fromDate: { type: String, default: '' }                // 'YYYY-MM-DD', the search "from" date
})
const emit = defineEmits(['set-interested', 'set-going'])

// 'YYYY-MM-DD' of a timestamp in Singapore time
const sgDay = (d) => new Date(d).toLocaleDateString('en-CA', { timeZone: 'Asia/Singapore' })

const sortedSessions = computed(() =>
    [...props.event.sessions].sort((a, b) => sessionKey(a) - sessionKey(b))
)

// default: first session on/after the "from" date, else the last one
const defaultSession = computed(() => {
    const from = props.fromDate || sgDay(new Date())
    return sortedSessions.value.find(s => sgDay(s.startTime) >= from)
        ?? sortedSessions.value[sortedSessions.value.length - 1]
})

// the user can switch session with the dropdown
const pickedKey = ref(null)
const shownSession = computed(() =>
    sortedSessions.value.find(s => sessionKey(s) === pickedKey.value) ?? defaultSession.value
)

// status of the session currently shown
const going = computed(() => props.goingBySession[sessionKey(shownSession.value)] ?? 'none')

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
</script>

<template>
    <div class="card h-100 shadow-sm rounded-4">
        <div class="card-body d-flex flex-column">
            <div class="d-flex justify-content-between small mb-2">
                <span class="text-primary">{{ formatSession(shownSession) }}</span>
                <span class="text-muted">{{ event.tags.join(' · ') }}</span>
            </div>

            <h5 class="card-title mb-1 text-dark">{{ event.title }}</h5>
            <p class="small text-muted mb-1">{{ event.organiser }} · {{ event.venue }}</p>

            <select
                v-if="event.sessions.length > 1"
                class="form-select form-select-sm mb-2"
                :value="sessionKey(shownSession)"
                @change="pickedKey = Number($event.target.value)"
            >
                <option v-for="s in sortedSessions" :key="sessionKey(s)" :value="sessionKey(s)">
                    {{ formatSession(s) }}
                </option>
            </select>

            <div class="d-flex flex-wrap gap-2 mt-auto pt-2">
                <BaseButton
                    :class="interested ? '' : 'btn-outline-main'"
                    @click="emit('set-interested', !interested)"
                >
                    {{ interested ? '♥ Interested' : '♡ Interested' }}
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
        </div>
    </div>
</template>
<script setup>
    import {ref, computed, onMounted} from 'vue'
    import axios from 'axios'

    const props = defineProps({
        recommendation: {
            type: Object,
            required: true
        }, 
        status: {
            type: String,
            default: ''
        }
    })

    const emit = defineEmits(['toggle-status', 'hide', 'less-like-this'])

    const event = computed(() => props.recommendation.event)

    const firstSession = computed(() => event.value.sessions[0])
    const dateLabel = computed(() => {
        const start = new Date(firstSession.value.startTime)
        const end = new Date(firstSession.value.endTime)
        const day = start.toLocaleDateString('en-SG', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Asia/Singapore' })
        const time = (d) => d.toLocaleTimeString('en-SG', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Singapore' })
        return `${day} · ${time(start)}–${time(end)}`.toUpperCase()
    })

    const seatsLeft = computed(() => {
        if (event.value.slots == null) {
            return null
        }
        return event.value.slots - event.value.signUpCount
    })
</script>

<template>
    <div class="card h-100 shadow-sm rounded-4 overflow-hidden">
        <div class="position-relative">
            <img v-if="event.image" :src="event.image" class="card-img-top" style="height: 160px; object-fit: cover;" :alt="event.title">
            <div v-else class="bg-light" style="height: 160px;"></div>
            <span class="badge rounded-pill bg-success-subtle text-success position-absolute top-0 start-0 m-2">
                {{ recommendation.score }}% match
            </span>
        </div>
        <div class="card-body d-flex flex-column">
            <div class="d-flex justify-content-between small mb-2">
                <span class="text-primary">{{ dateLabel }}</span>
                <span class="text-muted">{{ event.tags.join(' · ') }}</span>
            </div>
            <h5 class="card-title mb-2">{{ event.title }}</h5>
            <p class="card-text text-muted small mb-3">
                {{ event.venue }}
                <span v-if="seatsLeft !== null"> · {{ seatsLeft }} seats left</span>
            </p>
            <div class="d-flex justify-content-between align-items-center mt-auto">
                <button class="btn btn-sm btn-outline-secondary rounded-3" v-on:click="emit('toggle-status')">
                    <span v-if="status === 'attending'">✓ Attending</span>
                    <span v-else-if="status === 'interested'">♡ Interested</span>
                    <span v-else>+ Add to planner</span>
                </button>
                <div class="small text-muted">
                    <a href="#" class="text-muted text-decoration-none" v-on:click.prevent="emit('hide')">Hide</a>
                    ·
                    <a href="#" class="text-muted text-decoration-none" v-on:click.prevent="emit('less-like-this')">Less like this</a>
                </div>
            </div>
        </div>
    </div>
</template>
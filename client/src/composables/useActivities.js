import { ref, computed, unref } from 'vue'
import axios from 'axios'
import { useAuth } from './useAuth'

const API = 'http://localhost:8000/api/activities'
const activities = ref([])   // raw list from GET, events populated

export function useActivities() {
    const { userId } = useAuth()

    // { [eventId]: { interested, sessions: { [startTimeMs]: 'attending' | 'attended' } } }
    const activityMap = computed(() => Object.fromEntries(
        activities.value.filter(a => a.event).map(a => [a.event._id, {
            interested: a.interested,
            sessions: Object.fromEntries(
                a.sessions.map(s => [new Date(s.startTime).getTime(), s.going])
            )
        }])
    ))

    async function loadActivities() {
        const { data } = await axios.get(`${API}/${unref(userId)}`)
        activities.value = data
    }

    async function send(eventId, body) {
        try {
            await axios.put(`${API}/${unref(userId)}/${eventId}`, body)
        } catch (err) {
            console.error('Activity update failed:', err.response?.data?.message, body)
            throw err
        }
        await loadActivities()
    }

    const setInterested = (eventId, interested) => send(eventId, { interested })
    const setGoing = (eventId, { sessionStart, status }) => send(eventId, { sessionStart, going: status })
    const saveNote = (eventId, note) => send(eventId, { note })

    async function deleteActivity(eventId) {
        await axios.delete(`${API}/${unref(userId)}/${eventId}`)
        await loadActivities()
    }

    return { activities, activityMap, loadActivities, setInterested, setGoing, saveNote, deleteActivity }
}
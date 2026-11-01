import { ref, computed } from 'vue'

// TEMPORARY: pretend this user is logged in until the real login page exists.
const DEV_USER = { _id: '6acd9e65046b9013f579fc79' }

function normalise(raw) {
    const u = raw?.user || raw
    const id = u?._id || u?.id
    return id ? { ...u, _id: id } : null
}

function readStoredUser() {
    try {
        return normalise(JSON.parse(localStorage.getItem('user') || 'null')) || DEV_USER
    } catch {
        return DEV_USER
    }
}

const user = ref(readStoredUser())

export function useAuth() {
    const userId = computed(() => user.value?._id || null)
    const isLoggedIn = computed(() => !!userId.value)

    // call this from the login page after a successful login
    function setSession(userData) {
        const u = normalise(userData)
        if (!u) return
        user.value = u
        localStorage.setItem('user', JSON.stringify(u))
    }

    function logout() {
        user.value = null
        localStorage.removeItem('user')
    }

    return { user, userId, isLoggedIn, setSession, logout }
}
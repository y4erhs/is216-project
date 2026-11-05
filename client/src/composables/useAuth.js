import { ref, computed } from 'vue'

function normalise(raw) {
    const u = raw?.user || raw
    const id = u?._id || u?.id
    return id ? { ...u, _id: id } : null
}

// The signed pass from the server, sent with every request (see utils/authRequests.js)
export const getToken = () => localStorage.getItem('token')

function readStoredUser() {
    try {
        // saved from before login tokens existed, so they need to log in again
        if (!getToken()) localStorage.removeItem('user')
        return normalise(JSON.parse(localStorage.getItem('user') || 'null'))
    } catch {
        return null
    }
}

const user = ref(readStoredUser())

export function useAuth() {
    const userId = computed(() => user.value?._id || null)
    const isLoggedIn = computed(() => !!userId.value)

    // call this from the login page after a successful login
    function setSession(userData, token) {
        const u = normalise(userData)
        if (!u) return
        if (token) localStorage.setItem('token', token)
        user.value = u
        localStorage.setItem('user', JSON.stringify(u))
    }

    function logout() {
        user.value = null
        localStorage.removeItem('user')
        localStorage.removeItem('token')
    }

    return { user, userId, isLoggedIn, setSession, logout }
}
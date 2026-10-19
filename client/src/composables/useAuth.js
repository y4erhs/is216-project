import { ref, computed } from 'vue'

// TEMPORARY: pretend this user is logged in until the real login page exists.
// Delete this line (and the "|| DEV_USER" below) once login is built.
const DEV_USER = { _id: '6acd9e65046b9013f579fc79' }

function readStoredUser() {
    try {
        return JSON.parse(localStorage.getItem('user') || 'null') || DEV_USER
    } catch {
        return DEV_USER
    }
}

const user = ref(readStoredUser())

export function useAuth() {
    const userId = computed(() => user.value?._id || null)
    const isLoggedIn = computed(() => !!user.value)

    // call this from the login page after a successful login
    function setSession(userData) {
        user.value = userData
        localStorage.setItem('user', JSON.stringify(userData))
    }

    function logout() {
        user.value = null
        localStorage.removeItem('user')
    }

    return { user, userId, isLoggedIn, setSession, logout }
}
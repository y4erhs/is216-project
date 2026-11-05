import { ref, computed } from 'vue';
import axios from 'axios';
import { defineStore } from 'pinia';

const STORAGE_KEY = "campus_event_auth"
// look up and store user data inside browser's local storage

// make sure user doesnt get logged out on refresh
function loadAuth() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        const parsed = raw ? JSON.parse(raw) : null 

        if (!parsed || typeof parsed !== "object") 
            return { user: null}

        
        const username = typeof parsed.username === "string" ? parsed.username : null
        return username ? { user: { username } } : { user: null }
        
    } catch {
        return { user: null }
    }
}

function saveAuth({user}) {
    if (!user?.username) return
    localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ username: user.username || "user" })
    )
    

}

export const useAuthStore = defineStore('auth', () => {
    const loaded = loadAuth()
    const user = ref(loaded.user)
    const loading = ref(false)
    const error = ref(null)

    const isLoggedIn = computed(() => !!user.value)

    async function login(username, password) {
        loading.value = true
        error.value = null
        console.log("1. LOGIN FUNCTION WAS CLICKED AND STARTED");

        try {
            const userInput = { username, password }
            const response = await axios.post('http://localhost:8000/api/users/login', userInput)
            console.log("2. SERVER REPLIED SUCCESSFULLY");

            const data = response.data


            user.value = { username: data.username || "user" }

            saveAuth({ user: user.value })
            console.log("3. SAVED TO LOCAL STORAGE");

        } catch (e) {
            error.value = e.response?.data?.message || 'Login failed'
            console.error("4. LOGIN FAILED BECAUSE:", e);
        } finally {
            loading.value = false
        }
    }
    function logout() {
        user.value = null
        localStorage.removeItem(STORAGE_KEY)
    }
    function clearError() {
        error.value = null
    }
    return { user, loading, error, isLoggedIn, login, logout, clearError}
})
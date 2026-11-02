<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import NotificationBell from '../components/NotificationBell.vue'
import { useAuth } from '../composables/useAuth'
import { userAvatarUrl, userInitials, userName } from '../utils/userDisplay'

const router = useRouter();
const route = useRoute();
// --- Emits ---
const emit = defineEmits(['toggle-menu'])

// --- State ---
const searchQuery = ref('')

// --- Current user ---
const { user } = useAuth()
const avatarUrl = computed(() => userAvatarUrl(user.value))
const avatarFailed = ref(false)   // show the initials if the picture can't load
watch(avatarUrl, () => { avatarFailed.value = false })

// Open the search page with what was typed
function runSearch() {
    const q = searchQuery.value.trim()
    router.push({ path: '/search', query: q ? { q } : {} })
}

// Keep the box matching the search page, and clear it after leaving
watch(() => [route.path, route.query.q], () => {
    searchQuery.value = route.path === '/search' ? (route.query.q || '') : ''
}, { immediate: true })

// --- Notification ---
function onNotification(item) {
  if (item.type === 'friend_request') {
    router.push({ path: '/friends', query: { tab: 'requests' } })
  } else if (item.type === 'friend_accepted') {
    router.push('/friends')
  } else if (['lobby_deleted', 'lobby_removed','lobby_invite',"lobby_joined_via_link","lobby_member_responded","lobby_event_pitched","lobby_plan_another"].includes(item.type)) {
    router.push('/lobby') 
  } else if (['plan_invite', 'plan_cancelled'].includes(item.type)) {
    router.push('/calendar')
  } else if (['upcoming_event', 'event_reminder'].includes(item.type)) {
    router.push(`/activity-tracking`)
  } else if(item.type === 'group_register'){
    router.push('/activity-tracking')
  }
  else {
    // FALLBACK FOR DEMO: Routes to discover if no ID is present
    router.push('/') 
  }
}

// --- Computed Dates ---
const currentDate = computed(() => {
    const today = new Date()
    return today.toLocaleDateString('en-GB', {
        weekday: 'short',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    })
})

const shortDate = computed(() => {
    const today = new Date()
    return today.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    })
})

const mobileDate = computed(() => {
    const today = new Date()
    return today.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short'
    })
})
</script>

<template>
    <header class="topbar-container d-flex justify-content-between align-items-center px-3 px-md-3 pt-3 pb-3 gap-2">

        <!-- Mobile Hamburger Toggle (only visible on mobile) -->
        <button class="btn-hamburger d-md-none" type="button" @click="emit('toggle-menu')">
            <i class="bi bi-list"></i>
        </button>

        <!-- Search Bar -->
        <div class="search-pill d-flex align-items-center gap-2 px-3 py-2 flex-grow-1 me-1 me-md-3">
            <button type="button" class="search-icon search-btn" aria-label="Search" @click="runSearch">
                <i class="bi bi-search"></i>
            </button>

            <input type="text" class="search-input flex-grow-1 d-none d-md-block" v-model="searchQuery"
                placeholder="Search events" aria-label="Search events" @keyup.enter="runSearch" />

            <input type="text" class="search-input flex-grow-1 d-block d-md-none" v-model="searchQuery"
                placeholder="Search events" aria-label="Search events" @keyup.enter="runSearch" />

        </div>

        <!-- Actions & Profile -->
        <div class="right-pills d-flex align-items-center gap-2 flex-shrink-0">

            <!-- Date Pill -->
            <div class="pill-badge date-pill text-nowrap">
                <span class="d-none d-lg-inline date-text">{{ currentDate }}</span>
                <span class="d-none d-md-inline d-lg-none date-text">{{ shortDate }}</span>
                <span class="d-inline d-md-none date-text">{{ mobileDate }}</span>
            </div>

            <!-- Notification Pill -->
            <NotificationBell @open-item="onNotification" />

            <!-- Avatar Pill -->
            <div class="pill-badge avatar-pill" :title="userName(user)">
                <img v-if="avatarUrl && !avatarFailed" :src="avatarUrl" alt="" @error="avatarFailed = true" />
                <span v-else>{{ userInitials(user) }}</span>
            </div>

        </div>

    </header>
</template>

<style scoped>
/* --- Container --- */
.topbar-container {
    width: 100%;
}



/* --- Hamburger Button --- */
.btn-hamburger {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    border: none;
    background-color: var(--color-white);
    color: var(--color-black);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    flex-shrink: 0;
    cursor: pointer;
    box-shadow: 0 4px 15px rgba(10, 29, 43, 0.04);
}

/* --- Search Bar --- */
.search-btn {
    padding: 0;
    border: 0;
    background: none;
    color: inherit;
    cursor: pointer;
}

.search-pill {
    min-width: 0;
    height: 40px;
    background-color: var(--color-white);
    border-radius: 25px;
    box-shadow: 0 4px 15px rgba(10, 29, 43, 0.04);
    flex-shrink: 1;
    transition: all 0.2s ease;
    max-width: 400px;
}

.search-icon {
    display: flex;
    align-items: center;
    font-size: 14px;
    color: var(--color-black);
}

.bell-icon{
    padding-top: 5px;
    padding-right: 1px;
}

.bi-search {
    padding-top: 6px;
}

.search-input {
    min-width: 0;
    width: 100%;
    border: none;
    background: transparent;
    outline: none;
    font-size: 13px;
    color: var(--color-black);
    padding-top: 6px;
    font-weight: 600;
}

.search-input::placeholder {
    color: var(--color-black);
    opacity: 60%;
    font-size: 13px;
    font-weight: 600;
}

/* --- Base Pill Badge --- */
.pill-badge {
    height: 40px;
    background-color: var(--color-dark-blue);
    border-radius: 25px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 15px rgba(10, 29, 43, 0.04);
}

/* --- Date Pill --- */
.date-pill {
    white-space: nowrap;
    flex-shrink: 0;
    padding: 8px 16px;
    font-size: 13px;
    color: var(--color-white, #ffffff);
}

.date-text {
    padding-top: 3px;
}

/* --- Notification Pill --- */
.icon-pill {
    width: 40px;
    height: 40px;
    position: relative;
    cursor: pointer;
    font-size: 15px;
}

.notif-pill {
    background-color: #150184;
}

.notif-dot {
    position: absolute;
    top: 9px;
    right: 10px;
    width: 7px;
    height: 7px;
    background-color: var(--color-blue, #4c74fa);
    border-radius: 50%;
    border: 1.5px solid #ffffff;
}

/* --- Avatar Pill --- */
.avatar-pill img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.avatar-pill {
    position: relative;
    overflow: hidden;
    width: 40px;
    height: 40px;
    background-color: #e0e7ff;
    color: #4338ca;
    font-weight: 700;
    font-size: 12px;
    padding-top: 3px;
}

/* --- Mobile Responsiveness --- */
@media (max-width: 767.98px) {
    .search-pill {
        padding-left: 10px !important;
        padding-right: 10px !important;
    }

    .date-pill {
        font-size: 12px;
    }
}
</style>
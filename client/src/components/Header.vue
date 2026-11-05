<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import NotificationBell from '../components/NotificationBell.vue'
import { useAuth } from '../composables/useAuth'
import { useUserStore } from '@/stores/userStore'
import { userAvatarUrl, userInitials, userName } from '../utils/userDisplay'

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

// --- Emits ---
const emit = defineEmits(['toggle-menu'])

// --- State ---
const searchQuery = ref('')

// --- Current user ---
const { user } = useAuth()
const avatarUrl = computed(() => userAvatarUrl(user.value))
const avatarFailed = ref(false)
watch(avatarUrl, () => { avatarFailed.value = false })

function runSearch() {
    const q = searchQuery.value.trim()
    router.push({ path: '/search', query: q ? { q } : {} })
}

watch(() => [route.path, route.query.q], () => {
    searchQuery.value = route.path === '/search' ? (route.query.q || '') : ''
}, { immediate: true })

function onNotification(item) {
    if (item.type === 'friend_request') {
        router.push({ path: '/friends', query: { tab: 'requests' } })
    } else if (item.type === 'friend_accepted') {
        router.push('/friends')
    } else if (['lobby_deleted', 'lobby_removed', 'lobby_invite', "lobby_joined_via_link", "lobby_member_responded", "lobby_event_pitched", "lobby_plan_another"].includes(item.type)) {
        router.push('/lobby')
    } else if (['plan_invite', 'plan_cancelled', 'plan_updated', 'plan_response'].includes(item.type)) {
        router.push('/calendar')
    } else if (['upcoming_event', 'event_reminder'].includes(item.type)) {
        router.push(`/activity-tracking`)
    } else if (item.type === 'group_register') {
        router.push('/activity-tracking')
    } else {
        router.push('/')
    }
}

const currentDate = computed(() => {
    const today = new Date()
    return today.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })
})

const shortDate = computed(() => {
    const today = new Date()
    return today.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
})

const mobileDate = computed(() => {
    const today = new Date()
    return today.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
})

const showMenuBox = ref(false);

function toggleMenuBox() {
    showMenuBox.value = !showMenuBox.value;
}

const handleLogout = () => {
    userStore.logout();
    router.push('/login');
};
</script>

<template>
    <header class="topbar-container d-flex justify-content-between align-items-center px-3 px-md-3 pt-3 pb-3 gap-2">

        <!-- Mobile Hamburger Toggle -->
        <button class="btn-hamburger d-lg-none" type="button" @click="emit('toggle-menu')">
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

        <div class="right-pills d-flex align-items-center gap-2 flex-shrink-0">

            <div class="pill-badge date-pill text-nowrap">
                <span class="d-none d-lg-inline date-text">{{ currentDate }}</span>
                <span class="d-none d-md-inline d-lg-none date-text">{{ shortDate }}</span>
                <span class="d-inline d-md-none date-text">{{ mobileDate }}</span>
            </div>

            <NotificationBell @open-item="onNotification" />

        </div>
    </header>
</template>

<style scoped>
.topbar-container {
    width: 100%;
}

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

.pill-badge {
    height: 40px;
    background-color: var(--color-dark-blue);
    border-radius: 25px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 15px rgba(10, 29, 43, 0.04);
}

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

.avatar-pill {
    position: relative;
    width: 40px;
    height: 40px;
    background-color: #e0e7ff;
    color: #4338ca;
    font-weight: 700;
    font-size: 12px;
    cursor: pointer;
}

.avatar-content {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    border-radius: 25px;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    padding-top: 3px;
}

.avatar-content img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

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
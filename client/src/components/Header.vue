<script setup>
import { ref, computed } from 'vue'

// --- Emits ---
const emit = defineEmits(['toggle-menu'])

// --- State ---
const searchQuery = ref('')

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
    <header class="topbar-container d-flex justify-content-between align-items-center px-3 px-md-4 pt-3 pb-2 gap-2">

        <!-- Mobile Hamburger Toggle (only visible on mobile) -->
        <button class="btn-hamburger d-md-none" type="button" @click="emit('toggle-menu')">
            <i class="bi bi-list"></i>
        </button>

        <!-- Search Bar -->
        <div class="search-pill d-flex align-items-center gap-2 px-3 py-2 flex-grow-1 me-1 me-md-3">
            <span class="search-icon">
                <i class="bi bi-search"></i>
            </span>

            <input type="text" class="search-input flex-grow-1 d-none d-md-block" v-model="searchQuery"
                placeholder="Search events, friends or opportunities" />

            <input type="text" class="search-input flex-grow-1 d-block d-md-none" v-model="searchQuery"
                placeholder="Search..." />

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
            <div class="pill-badge icon-pill notif-pill">
                <span class="bell-icon">
                    <i class="bi bi-bell-fill text-white"></i>
                </span>
                <span class="notif-dot"></span>
            </div>

            <!-- Avatar Pill -->
            <div class="pill-badge avatar-pill">
                <span>PH</span>
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
    border-radius: 50%;
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
.search-pill {
    min-width: 0;
    height: 40px;
    background-color: var(--color-white);
    border-radius: 9999px;
    box-shadow: 0 4px 15px rgba(10, 29, 43, 0.04);
    flex-shrink: 1;
    transition: all 0.2s ease;
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
}

.search-input::placeholder {
    color: var(--color-black);
    opacity: 60%;
    font-size: 13px;
}

.shortcut-badge {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.6);
    background-color: rgba(255, 255, 255, 0.12);
    padding: 2px 6px;
    border-radius: 6px;
    white-space: nowrap;
}

/* --- Base Pill Badge --- */
.pill-badge {
    height: 40px;
    background-color: var(--color-dark-blue);
    border-radius: 9999px;
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
    font-weight: 500;
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
.avatar-pill {
    width: 40px;
    height: 40px;
    background-color: #e0e7ff;
    color: #4338ca;
    font-weight: 700;
    font-size: 12px;
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
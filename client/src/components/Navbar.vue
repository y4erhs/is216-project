<script setup>
import { ref } from 'vue'
import '../assets/theme.css'

import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'

import logo from '@/assets/logo.png'

// --- Props & Emits ---
defineProps({
    isOpen: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['close'])

// --- State ---
const isCollapsed = ref(false)
</script>

<template>
    <aside :class="{ 'collapsed': isCollapsed, 'mobile-open': isOpen }">

        <!-- Header & Toggle -->
        <div class="header px-2">
            <div v-if="!isCollapsed" class="logo-section d-flex align-items-center gap-2">
                <img :src="logo" class="logo" style="width: 32px; height: 32px;" />
                <p class="logo-text">Campus <br> Compass</p>
            </div>

            <button class="toggle-btn hamburger d-none d-md-flex" @click="isCollapsed = !isCollapsed">
                {{ isCollapsed ? '☰' : '✕' }}
            </button>

            <button class="toggle-btn d-md-none" @click="emit('close')">
                <i class="bi bi-x-lg fs-5"></i>
            </button>
        </div>

        <!-- Campus Info -->
        <div v-if="!isCollapsed" class="campus px-2">
            <p class="your-campus m-0">YOUR CAMPUS</p>
            <p class="mb-0">Singapore Management University</p>
        </div>

        <!-- Navigation Menu -->
        <div class="menu" @click="emit('close')">
            <RouterLink to="/" class="tab-pill theme-light-blue" :title="isCollapsed ? 'Discover' : ''">
                <div class="pill-icon">
                    <span class="menu-icon"></span>
                </div>
                <span v-if="!isCollapsed" class="pill-neck"></span>
                <div v-if="!isCollapsed" class="pill-label">
                    <span>Discover</span>
                </div>
            </RouterLink>

            <RouterLink to="/calendar" class="tab-pill theme-light-blue" :title="isCollapsed ? 'My Calendar' : ''">
                <div class="pill-icon">
                    <i class="bi bi-calendar-event fs-5"></i>
                </div>
                <span v-if="!isCollapsed" class="pill-neck"></span>
                <div v-if="!isCollapsed" class="pill-label">
                    <span>My Calendar</span>
                </div>
            </RouterLink>

            <RouterLink to="/groups" class="tab-pill theme-light-blue" :title="isCollapsed ? 'Friends & Groups' : ''">
                <div class="pill-icon">
                    <i class="bi bi-people fs-5"></i>
                </div>
                <span v-if="!isCollapsed" class="pill-neck"></span>
                <div v-if="!isCollapsed" class="pill-label">
                    <span>Friends & Groups</span>
                </div>
            </RouterLink>

            <RouterLink to="/events" class="tab-pill theme-light-blue" :title="isCollapsed ? 'My Activity' : ''">
                <div class="pill-icon">
                    <i class="bi bi-lightning fs-5"></i>
                </div>
                <span v-if="!isCollapsed" class="pill-neck"></span>
                <div v-if="!isCollapsed" class="pill-label">
                    <span>My Activity</span>
                </div>
            </RouterLink>

            <RouterLink to="/profile" class="tab-pill theme-light-blue" :title="isCollapsed ? 'Profile & alerts' : ''">
                <div class="pill-icon">
                    <i class="bi bi-person-circle fs-5"></i>
                </div>
                <span v-if="!isCollapsed" class="pill-neck"></span>
                <div v-if="!isCollapsed" class="pill-label">
                    <span>Profile & Alerts</span>
                </div>
            </RouterLink>
        </div>

        <!-- User Profile Footer -->
        <div class="user-profile mt-auto pt-3 border-top">
            <div class="avatar-badge">PH</div>
            <div v-if="!isCollapsed" class="user-info">
                <span class="user-name">Profile Here</span>
                <span class="user-desc">Software Engineering · Y2</span>
            </div>
        </div>

    </aside>
</template>

<style scoped>
/* --- Sidebar Base --- */
aside {
    width: 250px;
    min-height: 100vh;
    padding: 12px;
    background-color: #f1f2f7;
    color: #0a1d2b;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    font-size: 13px;
    transition: width 0.25s ease, transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 1050;
}

aside.collapsed {
    width: 75px;
    padding: 12px 8px;
    align-items: center;
}

aside.collapsed .header,
aside.collapsed .tab-pill,
aside.collapsed .user-profile {
    justify-content: center;
    width: 100%;
}

/* --- Header Section --- */
.header {
    display: flex;
    align-items: center;
    gap: 10px;
    justify-content: space-between;
    margin-bottom: 20px;
}

.logo-section {
    display: flex;
    align-items: center;
}

.logo-text {
    margin: 0;
    font-weight: 600;
    font-size: 13px;
    line-height: 1.2;
}

.toggle-btn {
    background: transparent;
    border: none;
    font-size: 14px;
    cursor: pointer;
    padding: 4px 6px;
    border-radius: 6px;
    color: #0a1d2b;
    display: flex;
    align-items: center;
    justify-content: center;
}

.hamburger {
    font-size: 20px;
    width: 42px;
}

.toggle-btn:hover {
    background-color: #dee4f4;
}

/* --- Campus Info --- */
.campus {
    margin-bottom: 16px;
}

.your-campus {
    opacity: 60%;
    font-size: x-small;
}

/* --- Menu Links --- */
.menu {
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: 100%;
}

.tab-pill {
    display: inline-flex;
    align-items: center;
    text-decoration: none;
    color: #0a1d2b;
    font-weight: 600;
    transition: transform 0.15s ease;
    position: relative;
}

.tab-pill:hover {
    transform: translateX(3px);
}

.pill-icon {
    width: 42px;
    height: 42px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: transparent;
    flex-shrink: 0;
    transition: background-color 0.2s ease;
}

.menu-icon {
    width: 20px;
    height: 20px;
    display: inline-block;
    background-color: var(--color-black, #0a1d2b);
    -webkit-mask: url('@/assets/logo.png') no-repeat center / contain;
    mask: url('@/assets/logo.png') no-repeat center / contain;
    transition: background-color 0.2s ease;
}

.tab-pill.router-link-active .menu-icon {
    background-color: var(--text);
}

.pill-neck {
    width: 7px;
    height: 18px;
    margin: 0 -1px;
    z-index: 2;
    position: relative;
    flex-shrink: 0;
    background-color: transparent;
    transition: background-color 0.2s ease;
}

.pill-neck::before {
    content: '';
    position: absolute;
    top: -6px;
    left: 0;
    width: 100%;
    height: 6px;
    border-bottom-left-radius: 3px;
    border-bottom-right-radius: 3px;
    transition: box-shadow 0.2s ease;
}

.pill-neck::after {
    content: '';
    position: absolute;
    bottom: -6px;
    left: 0;
    width: 100%;
    height: 6px;
    border-top-left-radius: 3px;
    border-top-right-radius: 3px;
    transition: box-shadow 0.2s ease;
}

.pill-label {
    min-height: 42px;
    padding: 0 16px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    background-color: transparent;
    flex-grow: 1;
    transition: background-color 0.2s ease;
}

.pill-label span {
    line-height: 1.2;
    font-size: 13px;
}

/* --- Active State --- */
.tab-pill.router-link-active .pill-icon,
.tab-pill.router-link-active .pill-neck,
.tab-pill.router-link-active .pill-label {
    background-color: var(--bg);
}

.tab-pill.router-link-active .pill-neck::before {
    box-shadow: 0 4px 0 0 var(--bg);
}

.tab-pill.router-link-active .pill-neck::after {
    box-shadow: 0 -4px 0 0 var(--bg);
}

.tab-pill.router-link-active {
    color: var(--text, #0a1d2b) !important;
}

/* --- Theme Modifiers --- */
.theme-green {
    --bg: var(--color-green, #d6fe5f);
    --text: var(--color-black, #0a1d2b);
}

.theme-orange {
    --bg: var(--color-orange, #ff7c50);
    --text: var(--color-black, #0a1d2b);
}

.theme-blue {
    --bg: var(--color-blue, #4c74fa);
    --text: var(--color-white, #f1f2f7);
}

.theme-red {
    --bg: var(--color-red, #e83224);
    --text: var(--color-white, #f1f2f7);
}

/* --- User Profile --- */
.user-profile {
    display: flex;
    align-items: center;
    gap: 10px;
}

.avatar-badge {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background-color: #e0e7ff;
    color: #4338ca;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 13px;
    flex-shrink: 0;
}

.user-info {
    display: flex;
    flex-direction: column;
}

.user-name {
    font-size: 13px;
    font-weight: 600;
    color: #0f172a;
}

.user-desc {
    font-size: 11px;
    color: #64748b;
}

/* --- Mobile Responsiveness --- */
@media (max-width: 767.98px) {
    aside {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw !important;
        height: 100vh;
        padding: 20px 16px;
        transform: translateX(-100%);
    }

    aside.mobile-open {
        transform: translateX(0);
    }

    .pill-label span {
        font-size: 15px;
    }
}
</style>
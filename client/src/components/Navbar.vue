<script setup>
import { onMounted, onBeforeUnmount } from 'vue'
import { useFriendRequests } from '../composables/useFriendRequests'
import { computed, ref, watch } from "vue";
import { useAuth } from "../composables/useAuth";
import { userAvatarUrl, userInitials, userName, userSubtitle } from "../utils/userDisplay";
import { useUserStore } from "../stores/userStore";
import { useRouter } from "vue-router";
import "../assets/theme.css";
import BaseButton from './BaseButton.vue'

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

import logo from "@/assets/logo.png";

defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
});

const { user } = useAuth();
const userStore = useUserStore();
const router = useRouter();

const avatarUrl = computed(() => userAvatarUrl(user.value));
const avatarFailed = ref(false);
watch(avatarUrl, () => { avatarFailed.value = false; });

const reqs = useFriendRequests();

const isCollapsed = ref(
  window.innerWidth >= 992 && window.innerWidth < 1200
);

const largeScreenQuery = window.matchMedia(
  '(min-width: 992px) and (max-width: 1199.98px)'
);

function handleScreenChange(event) {
  isCollapsed.value = event.matches;
}

onMounted(() => {
  reqs.load();

  largeScreenQuery.addEventListener('change', handleScreenChange);
});

onBeforeUnmount(() => {
  largeScreenQuery.removeEventListener('change', handleScreenChange);
});

const showMenuBox = ref(false);

const emit = defineEmits(["close", "collapse-change"]);

watch(isCollapsed, (value) => {
  if (value) {
    showMenuBox.value = false;
  }
  emit("collapse-change", value);
});

function toggleMenuBox() {
  showMenuBox.value = !showMenuBox.value;
}

function handleProfileClick() {
  showMenuBox.value = false;

  if (window.innerWidth >= 992) {
    isCollapsed.value = true;
  } else {
    emit('close');
  }
}

const confirmingLogout = ref(false);

function handleLogout() {
  showMenuBox.value = false;
  confirmingLogout.value = true;
}

function cancelLogout() {
  confirmingLogout.value = false;
}

function confirmLogout() {
  userStore.logout();
  confirmingLogout.value = false;
  router.push('/login');
}
</script>

<template>
  <aside :class="{ collapsed: isCollapsed, 'mobile-open': isOpen }">
    <div class="header px-2">
      <div v-if="!isCollapsed" class="logo-section d-flex align-items-center gap-2">
        <img :src="logo" class="logo" style="height: 50px" />
      </div>

      <button class="toggle-btn hamburger d-none d-lg-flex" @click="isCollapsed = !isCollapsed">
        {{ isCollapsed ? "☰" : "X" }}
      </button>

      <button class="toggle-btn d-lg-none" @click="emit('close')">
        <i class="bi bi-x-lg fs-5"></i>
      </button>
    </div>

    <div v-if="!isCollapsed" class="campus px-2">
      <p class="your-campus header-style m-0">YOUR CAMPUS</p>
      <p class="mb-0 header-style">Singapore Management University</p>
    </div>

    <div class="menu">
      <RouterLink to="/" class="tab-pill theme-grey" :title="isCollapsed ? 'Discover' : ''" @click="emit('close')">
        <div class="pill-icon">
          <i class="bi bi-compass fs-5"></i>
        </div>
        <span v-if="!isCollapsed" class="pill-neck"></span>
        <div v-if="!isCollapsed" class="pill-label">
          <span class="header-style">Discover</span>
        </div>
      </RouterLink>

      <RouterLink to="/activity-tracking" class="tab-pill theme-grey" :title="isCollapsed ? 'Activity Tracking' : ''"
        @click="emit('close')">
        <div class="pill-icon">
          <i class="bi bi-clipboard-check fs-5"></i>
        </div>
        <span v-if="!isCollapsed" class="pill-neck"></span>
        <div v-if="!isCollapsed" class="pill-label">
          <span class="header-style">Activity Tracking</span>
        </div>
      </RouterLink>

      <RouterLink to="/calendar" class="tab-pill theme-grey" :title="isCollapsed ? 'My Calendar' : ''"
        @click="emit('close')">
        <div class="pill-icon">
          <i class="bi bi-calendar-event fs-5"></i>
        </div>
        <span v-if="!isCollapsed" class="pill-neck"></span>
        <div v-if="!isCollapsed" class="pill-label">
          <span class="header-style">My Calendar</span>
        </div>
      </RouterLink>

      <RouterLink to="/lobby" class="tab-pill theme-grey" :title="isCollapsed ? 'My Lobbies' : ''"
        @click="emit('close')">
        <div class="pill-icon">
          <i class="bi bi-people fs-5"></i>
        </div>
        <span v-if="!isCollapsed" class="pill-neck"></span>
        <div v-if="!isCollapsed" class="pill-label">
          <span class="header-style">My Lobbies</span>
        </div>
      </RouterLink>


      <RouterLink to="/friends" class="tab-pill theme-grey" :title="isCollapsed ? 'Friends' : ''"
        @click="emit('close')">
        <div class="pill-icon position-relative">
          <i class="bi bi-person-plus fs-5"></i>
          <span v-if="reqs.state.incoming.length" class="req-badge" style="pointer-events: none">
            {{ reqs.state.incoming.length }}
          </span>
        </div>

        <span v-if="!isCollapsed" class="pill-neck"></span>

        <div v-if="!isCollapsed" class="pill-label">
          <span class="header-style">Friends</span>
        </div>
      </RouterLink>
    </div>

    <div class="user-profile-wrapper mt-auto pt-3 border-top position-relative">
      <div class="user-profile" @click="toggleMenuBox">
        <div class="avatar-badge">
          <img v-if="avatarUrl && !avatarFailed" :src="avatarUrl" alt="" @error="avatarFailed = true" />
          <template v-else>{{ userInitials(user) }}</template>
        </div>
        <div v-if="!isCollapsed" class="user-info">
          <span class="user-name" :title="userName(user)">{{ userName(user) }}</span>
          <span v-if="userSubtitle(user)" class="user-desc" :title="userSubtitle(user)">{{ userSubtitle(user) }}</span>
        </div>
      </div>

      <!-- Tambahin class dynamic :class="{ 'collapsed-popup': isCollapsed }" -->
      <div v-if="showMenuBox" class="popup-menu-box shadow-sm" :class="{ 'collapsed-popup': isCollapsed }">
        <RouterLink to="/profile" class="popup-item header-style" @click="handleProfileClick">
          profile & settings
        </RouterLink>
        <a href="#" class="popup-item header-style logout"
          @click.prevent="handleLogout(); showMenuBox = false">logout</a>
      </div>
    </div>
  </aside>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="confirmingLogout" class="overlay" role="alertdialog" aria-modal="true" aria-labelledby="logout-title"
        @click.self="cancelLogout">
        <div class="dialog">
          <h3 id="logout-title" class="dialog-title">Log Out?</h3>

          <p>Are you sure you want to log out of your account?</p>

          <div class="dialog-actions">
            <BaseButton class="theme-blue" type="button" @click="cancelLogout">
              Cancel
            </BaseButton>

            <BaseButton class="theme-green" type="button" @click="confirmLogout">
              Yes, Log Out
            </BaseButton>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
aside {
  width: 220px;
  height: calc(100vh - 30px);
  padding: 16px 12px;
  background-color: var(--color-white, #ffffff);
  color: #0a1d2b;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  font-size: 13px;
  transition:
    width 0.25s cubic-bezier(0.4, 0, 0.2, 1),
    transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1050;
  margin: 15px 0 15px 15px;
  border-radius: 25px;
  overflow-x: hidden;
  overflow-y: auto;
  position: relative;
}

.header {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: space-between;
  margin-bottom: 20px;
  width: 100%;
  box-sizing: border-box;
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
  font-family: "HeaderFont";
}

.toggle-btn {
  background: transparent;
  border: none;
  font-size: 16px;
  cursor: pointer;
  border-radius: 8px;
  color: #0a1d2b;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s ease;
  flex-shrink: 0;
}

.hamburger {
  width: 36px;
  height: 36px;
  padding-top: 6px;
  font-size: 20px;
}

.toggle-btn:hover {
  background-color: #d1dbec;
}

.campus {
  margin-bottom: 16px;
}

.your-campus {
  opacity: 60%;
  font-size: x-small;
}

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
  transition:
    transform 0.15s ease,
    background-color 0.2s ease;
  position: relative;
  border-radius: 10px;
  width: 100%;
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
  -webkit-mask: url("@/assets/logo.png") no-repeat center / contain;
  mask: url("@/assets/logo.png") no-repeat center / contain;
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
  content: "";
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
  content: "";
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

.user-profile-wrapper {
  position: relative;
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 4px;
  border-radius: 10px;
  transition: background-color 0.2s ease;
}

.user-profile:hover {
  background-color: #f1f5f9;
}

.popup-menu-box {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 0;
  width: 100%;
  min-width: 150px;
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  z-index: 1060;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.popup-menu-box.collapsed-popup {
  position: fixed;
  left: 30px;
  bottom: 80px;
  width: 180px;
}

.popup-item {
  text-decoration: none;
  color: #0a1d2b;
  font-size: 13px;
  padding: 10px 12px 6px 12px;
  border-radius: 8px;
  transition: background-color 0.15s ease;
}

.popup-item:hover {
  background-color: var(--color-grey);
  color: #0a1d2b;
}

.avatar-badge {
  position: relative;
  overflow: hidden;
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
  padding-top: 6px;
}

.avatar-badge img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.user-name {
  font-size: 13px;
  font-weight: 600;
  color: #0f172a;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-desc {
  font-size: 11px;
  color: #64748b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

aside.collapsed {
  width: 66px !important;
  padding: 16px 8px;
  align-items: center;
}

aside.collapsed .header {
  justify-content: center !important;
  margin-bottom: 20px;
  padding: 0 !important;
}

aside.collapsed .menu {
  align-items: center;
}

aside.collapsed .tab-pill {
  justify-content: center !important;
  width: 42px;
}

aside.collapsed .tab-pill:hover {
  transform: none;
}

aside.collapsed .user-profile {
  justify-content: center !important;
  width: 100%;
}

.req-badge {
  position: absolute;
  top: 2px;
  right: 2px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 8px;
  background: var(--color-blue, #4c74fa);
  color: #fff;
  font-size: 10px;
  line-height: 16px;
  text-align: center;
}

/* CUSTOM MODAL OVERLAY STYLING */
.overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: grid;
  place-items: center;
  padding: 15px;
  background: rgba(31, 42, 68, 0.65);
}

.dialog {
  display: grid;
  gap: 12px;
  width: min(440px, 100%);
  padding: 20px;
  border-radius: 25px;
  background-color: var(--color-white);
  color: var(--color-black);
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
}

.dialog-title {
  margin: 0;
  font-family: 'HeaderFont', sans-serif;
  font-size: 20px;
  text-transform: uppercase;
}

.dialog p {
  margin: 0;
  line-height: 1.4;
  font-size: 13px;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 991.98px) {
  aside {
    position: fixed;
    top: 12px;
    left: 12px;
    bottom: 12px;
    width: calc(100vw - 24px) !important;

    height: 100% !important;
    height: 100dvh !important;
    max-height: calc(100vh - 24px);
    max-height: calc(100dvh - 24px);

    margin: 0 !important;
    padding: 20px 16px;
    border-radius: 20px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    transform: translateX(calc(-100% - 20px));
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  aside.mobile-open {
    transform: translateX(0);
  }

  .pill-label span {
    font-size: 15px;
  }
}

/* LARGE: collapsed navbar occupies its reserved space;
   expanded navbar overlays the page */
@media (min-width: 992px) and (max-width: 1199.98px) {
  aside {
    position: absolute;
    top: 15px;
    left: 15px;
    bottom: 15px;
    height: auto;
    margin: 0;
  }
}
</style>
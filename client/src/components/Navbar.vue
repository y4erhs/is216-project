<script setup>
import { ref } from "vue";
import "../assets/theme.css";

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

import logo from "@/assets/logo.png";

defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["close"]);

const isCollapsed = ref(false);
</script>

<template>
  <aside :class="{ collapsed: isCollapsed, 'mobile-open': isOpen }">
    <div class="header px-2">
      <div
        v-if="!isCollapsed"
        class="logo-section d-flex align-items-center gap-2"
      >
        <img :src="logo" class="logo" style="height: 50px" />
      </div>

      <button
        class="toggle-btn hamburger d-none d-md-flex"
        @click="isCollapsed = !isCollapsed"
      >
        {{ isCollapsed ? "☰" : "X" }}
      </button>

      <button class="toggle-btn d-md-none" @click="emit('close')">
        <i class="bi bi-x-lg fs-5"></i>
      </button>
    </div>

    <div v-if="!isCollapsed" class="campus px-2">
      <p class="your-campus header-style m-0">YOUR CAMPUS</p>
      <p class="mb-0 header-style">Singapore Management University</p>
    </div>

    <div class="menu" @click="emit('close')">
      <RouterLink
        to="/"
        class="tab-pill theme-grey"
        :title="isCollapsed ? 'Discover' : ''"
      >
        <div class="pill-icon">
          <i class="bi bi-compass fs-5"></i>
        </div>
        <span v-if="!isCollapsed" class="pill-neck"></span>
        <div v-if="!isCollapsed" class="pill-label">
          <span class="header-style">Discover</span>
        </div>
      </RouterLink>

      <RouterLink
        to="/calendar"
        class="tab-pill theme-grey"
        :title="isCollapsed ? 'My Calendar' : ''"
      >
        <div class="pill-icon">
          <i class="bi bi-calendar-event fs-5"></i>
        </div>
        <span v-if="!isCollapsed" class="pill-neck"></span>
        <div v-if="!isCollapsed" class="pill-label">
          <span class="header-style">My Calendar</span>
        </div>
      </RouterLink>

      <RouterLink
        to="/lobby"
        class="tab-pill theme-grey"
        :title="isCollapsed ? 'My Lobbies' : ''"
      >
        <div class="pill-icon">
          <i class="bi bi-people fs-5"></i>
        </div>
        <span v-if="!isCollapsed" class="pill-neck"></span>
        <div v-if="!isCollapsed" class="pill-label">
          <span class="header-style">My Lobbies</span>
        </div>
      </RouterLink>

      <RouterLink
        to="/activity-tracking"
        class="tab-pill theme-grey"
        :title="isCollapsed ? 'Activity Tracking' : ''"
      >
        <div class="pill-icon">
          <i class="bi bi-clipboard-check fs-5"></i>
        </div>
        <span v-if="!isCollapsed" class="pill-neck"></span>
        <div v-if="!isCollapsed" class="pill-label">
          <span class="header-style">Activity Tracking</span>
        </div>
      </RouterLink>

      <RouterLink
        to="/profile"
        class="tab-pill theme-grey"
        :title="isCollapsed ? 'Profile & alerts' : ''"
      >
        <div class="pill-icon">
          <i class="bi bi-person-circle fs-5"></i>
        </div>
        <span v-if="!isCollapsed" class="pill-neck"></span>
        <div v-if="!isCollapsed" class="pill-label">
          <span class="header-style">Profile & Settings</span>
        </div>
      </RouterLink>
    </div>

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
  padding-top: 6px;
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

@media (max-width: 767.98px) {
  aside {
    position: fixed;
    top: 12px;
    left: 12px;
    bottom: 12px;
    width: calc(100vw - 24px) !important;
    height: calc(100vh - 24px) !important;
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
</style>

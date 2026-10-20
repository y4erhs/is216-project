<script setup>
import { ref } from 'vue'
import '../assets/theme.css'

import BaseButton from '../components/BaseButton.vue';
import BaseInput from '../components/BaseInput.vue';
import EditInterests from '../components/EditInterests.vue';

const setting1Push = ref(true)
const setting1Email = ref(true)

// profile form state
const selectedCourse = ref('Software Engineering (BSc)')
const selectedYear = ref('Year 2')
const selectedGrad = ref('2029')

// options dropdown
const courses = [
  'Accountancy (BAcc)',
  'Business Management (BBM)',
  'Computer Science (BSc)',
  'Computing & Law (BSc)',
  'Economics (BSc)',
  'Information Systems (BSc)',
  'Integrative Studies (BIS)',
  'Laws (LLB)',
  'Social Science (BSocSc)',
  'Software Engineering (BSc)'
]
const yearOptions = ['Year 1', 'Year 2', 'Year 3', 'Year 4']
const gradOptions = ['2027', '2028', '2029', '2030']

</script>

<template>
  <div class="profile-container">

    <div class="top-bar">
      <h1 class="page-title">PROFILE & ALERTS</h1>
      <BaseButton class="save-btn">SAVE CHANGES</BaseButton>
    </div>

    <!-- MAIN GRID -->
    <div class="profile-grid">

      <!-- PROFILE -->
      <div class="left-column">

        <div class="profile-card">
          <div class="profile-header-visual">
            <div class="profile-banner"></div>
            <div class="avatar">
              <p class="header-style">MA</p>
            </div>
          </div>

          <div class="user-info mt-3">
            <p class="full-name header-style">Makayla Aileen</p>
            <p class="username">@AIIEEN</p>
            <div class="stats-row">
              <div class="stats-item">
                <div class="stat-number header-style">13</div>
                <div class="stat-label">EVENTS ATTENDED</div>
              </div>
              <div class="stats-item">
                <div class="stat-number header-style">51</div>
                <div class="stat-label">FRIENDS</div>
              </div>
            </div>
          </div>

          <div class="dropdowns">
            <BaseInput type="select" label="Course" v-model="selectedCourse" :options="courses" />
          </div>

          <div class="two-col-inputs">
            <BaseInput type="select" label="Year of Study" v-model="selectedYear" :options="yearOptions" />
            <BaseInput type="select" label="Graduation" v-model="selectedGrad" :options="gradOptions" />
          </div>

          <div class="badges-section mt-3">
            <div class="badge-group">
              <span class="badge-title">Your Clubs</span>
              <div class="badge-pills">
                <span class="badge-pill">SMUKI</span>
                <span class="badge-pill">Odyssey</span>
                <span class="badge-pill">Obscura</span>
                <BaseButton variant="small">+</BaseButton>
              </div>
            </div>

            <div class="badge-group mt-2">
              <span class="badge-title">Interests</span>
              <div class="badge-pills">
                <span class="badge-pill">Cultural Clubs</span>
                <span class="badge-pill">Arts</span>
                <span class="badge-pill">Music</span>
                <BaseButton variant="small">+</BaseButton>
              </div>
            </div>
          </div>
        </div>

        <!-- CONNECT CALENDAR -->
        <div class="calendar-card">
          <div class="calendar-header">
            <span class="calendar-title">Your connected calendar</span>
            <button type="button" class="btn-manage">Manage</button>
          </div>

          <div class="calendar-provider">
              <i class="bi bi-calendar-event fs-5"></i>
            <div class="cal-provider-info">
              <div class="cal-name">Google Calendar</div>
              <div class="cal-email">leniscool@gmail.com</div>
            </div>
          </div>

          <div class="cal-badge">
            Linked · Preview connection
          </div>

          <div class="cal-sync-info">
            <p>Last sync shown: 7 Oct, 8:42 AM</p>
            <p>2 personal calendars · Free / busy used for planning</p>
          </div>

          <div class="cal-toggle-row">
            <span>Include personal commitments</span>
            <label class="toggle-switch">
              <input type="checkbox" v-model="includePersonal" />
              <span class="slider"></span>
            </label>
          </div>

          <div class="cal-actions">
            <BaseButton type="button" class="theme-purple">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
                stroke-linecap="round" stroke-linejoin="round">
                <polyline points="23 4 23 10 17 10"></polyline>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
              </svg>
              Sync now
            </BaseButton>
            <BaseButton type="button" class="theme-purple">Unlink</BaseButton>
          </div>

          <p class="cal-disclaimer">
            Connection and sync status are illustrative. No live calendar integration is connected in this design.
          </p>
        </div>

      </div>

      <!-- SETTINGS -->
      <div class="settings-card">

        <div class="settings-header-row">
          <span class="header-col-title">ALERT TYPE</span>
          <div class="header-col-switches">
            <span>PUSH</span>
            <span>EMAIL</span>
          </div>
        </div>

        <div class="settings-item-row">
          <div class="setting-info">
            <p class="setting-title">Setting Title</p>
            <p class="setting-desc">Short description/example</p>
          </div>
          <div class="setting-switches">
            <!-- Switch 1: PUSH -->
            <label class="toggle-switch">
              <input type="checkbox" v-model="setting1Push" />
              <span class="slider"></span>
            </label>
            <!-- Switch 2: EMAIL -->
            <label class="toggle-switch">
              <input type="checkbox" v-model="setting1Email" />
              <span class="slider"></span>
            </label>
          </div>
        </div>

        <div class="settings-item-row">
          <EditInterests />
        </div>
      </div>

    </div>

  </div>
</template>

<style scoped>
.profile-container {
  color: var(--color-black);
}

.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.page-title {
  color: var(--color-white);
  font-family: 'HeaderFont';
  font-size: 25px;
}

.save-btn {
  background-color: var(--color-dark-blue);
}

.profile-grid {
  display: grid;
  grid-template-columns: 360px 1fr;
  gap: 15px;
  align-items: start;
}

@media (max-width: 991px) {
  .profile-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 767px) {
  .profile-grid {
    grid-template-columns: 1fr;
  }
}

.left-column {
  display: flex;
  flex-direction: column;
  gap: 15px;
  width: 100%;
}

.calendar-card {
  background-color: var(--color-white);
  border-radius: 25px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  box-sizing: border-box;
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.calendar-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-black);
}

.btn-manage {
  background: none;
  border: none;
  color: var(--color-blue);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
}

.calendar-provider {
  display: flex;
  align-items: center;
  gap: 12px;
}

.bi {
  color: var(--color-dark-blue);
  margin: 0 10px;
}

.cal-provider-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.cal-name {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-black);
}

.cal-email {
  font-size: 12px;
  color: #64748b;
}

.cal-badge {
  display: inline-flex;
  align-items: center;
  background-color: var(--color-green);
  color: var(--color-dark-green);
  font-size: 12px;
  font-weight: 600;
  padding: 5px 12px 1px 12px;
  border-radius: 9999px;
  width: fit-content;
}

.cal-sync-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
  font-size: 12px;
  color: #64748b;
}

.cal-sync-info p {
  margin: 0;
}

.cal-toggle-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-black);
  padding: 4px 0;
}

.cal-actions {
  display: flex;
  gap: 10px;
}

.btn-cal-action:hover {
  background-color: #f8fafc;
}

.cal-disclaimer {
  margin: 0;
  font-size: 11px;
  color: #94a3b8;
  line-height: 1.4;
}

.profile-card {
  background-color: var(--color-white);
  border-radius: 25px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 15px;
}

.profile-header-visual {
  position: relative;
  width: 100%;
  margin-bottom: 35px;
}

.avatar {
  background-color: var(--color-green);
  width: 80px;
  height: 80px;
  border-radius: 20px;
  font-size: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-top: 14px;
  position: absolute;
  left: 20px;
  bottom: -30px;
  overflow: hidden;
}

.profile-banner {
  aspect-ratio: 5 / 2;
  background-color: var(--color-dark-green);
  border-radius: 20px;
}

.user-info p {
  margin: 0;
  margin-left: 15px;
}

.username {
  opacity: 70%;
}

.stats-row {
  display: flex;
  flex-direction: row;
  gap: 35px;
  margin-left: 15px;
}

.stat-number {
  font-size: 30px;
}

.stat-label {
  opacity: 70%;
}

.dropdowns {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 15px;
}

.two-col-inputs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin: 15px;
  margin-top: 0;
  align-items: start;
}

.badges-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.badge-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 0 15px 20px 15px;
}

.badge-title {
  font-family: 'TextFont', sans-serif;
  font-size: 12px;
  font-weight: 700;
  color: var(--color-black);
}

.badge-pills {
  display: flex;
  gap: 8px;
  align-items: center;
}

.badge-pill {
  display: inline-block;
  height: 22px;
  border-radius: 9999px;
  background-color: var(--color-grey);
  padding: 5px 12px 18px 12px;
  font-size: 11px;
}

.settings-card {
  display: flex;
  flex-direction: column;
  background-color: var(--color-white);
  border-radius: 25px;
  padding: 20px;
  gap: 10px;
}

.settings-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.8px;
  color: #8c9ba5;
  border-bottom: 1px solid #f1f5f9;
}

.header-col-switches {
  display: flex;
  gap: 24px;
  width: 120px;
  justify-content: space-around;
  text-align: center;
}

.settings-item-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.setting-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.setting-title {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: var(--color-black, #1e293b);
}

.setting-desc {
  margin: 0;
  font-size: 12px;
  color: #7b8794;
}

.setting-switches {
  display: flex;
  align-items: center;
  gap: 24px;
  width: 120px;
  justify-content: space-around;
}

/* CUSTOM SWITCH */
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
  cursor: pointer;
  margin: 0;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
  margin: 0;
}

.slider {
  position: absolute;
  inset: 0;
  background-color: var(--color-grey);
  border-radius: 9999px;
  transition: background-color 0.25s ease;
}

.slider::before {
  content: "";
  position: absolute;
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: #ffffff;
  border-radius: 50%;
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.toggle-switch input:checked+.slider {
  background-color: var(--color-orange);
}

.toggle-switch input:checked+.slider::before {
  transform: translateX(20px);
}
</style>

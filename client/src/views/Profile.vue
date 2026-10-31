<script setup>
import { ref } from 'vue'
import '../assets/theme.css'

import BaseButton from '../components/BaseButton.vue';
import BaseInput from '../components/BaseInput.vue';
import CategoryPill from '@/components/CategoryPill.vue'


const setting1Push = ref(true)
const setting1Email = ref(true)
const includePersonal = ref(true)

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
const clubs = ['SMUKI', 'Odyssey', 'Project Obscura']

// State buat Interests & Floating Dropdown
const categories = ref(['Tech', 'Career', 'Arts'])
const showInterestDropdown = ref(false)

// List semua opsi interest yang bisa dipilih
const allAvailableInterests = [
  'Tech', 'Arts', 'Cultural Clubs', 'Community Service',
  'Sports and Outdoors', 'Career', 'Overseas Activities',
  'Networking Event', 'Skills Upgrading Workshop', 'Food', 'Wellness', 'Guest Lectures'
]

function toggleInterest(cat) {
  if (categories.value.includes(cat)) {
    categories.value = categories.value.filter(item => item !== cat)
  } else {
    categories.value.push(cat)
  }
}
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
            <!-- CLUBS -->
            <div class="badge-group">
              <span class="badge-title">Your Clubs</span>
              <div class="badge-row">
                <CategoryPill v-for="(club, index) in clubs" :key="index" :category="club" type="club" />
                <BaseButton variant="small">+</BaseButton>
              </div>
            </div>

            <!-- INTERESTS (WITH FLOATING MULTISELECT DROPDOWN) -->
            <div class="badge-group mt-2" style="position: relative;">
              <span class="badge-title">Interests</span>
              <div class="badge-row">
                <CategoryPill v-for="(cat, index) in categories" :key="index" :category="cat" />

                <div style="position: relative; display: inline-block;">
                  <BaseButton variant="small" @click="showInterestDropdown = !showInterestDropdown">+</BaseButton>

                  <!-- Floating Dropdown Box -->
                  <div v-if="showInterestDropdown" class="floating-dropdown">
                    <p class="dropdown-header">Select Interests</p>
                    <div v-for="item in allAvailableInterests" :key="item" class="dropdown-item"
                      @click="toggleInterest(item)">
                      <input class="checkboxes" type="checkbox" :checked="categories.includes(item)"
                        @click.stop="toggleInterest(item)" />
                      <span>{{ item }}</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
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
            <label class="toggle-switch">
              <input type="checkbox" v-model="setting1Push" />
              <span class="slider"></span>
            </label>
            <label class="toggle-switch">
              <input type="checkbox" v-model="setting1Email" />
              <span class="slider"></span>
            </label>
          </div>
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

.badge-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}

.checkboxes {
  appearance: none;
  /* Buat ilangin style bawaan browser yang jelek */
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  border: 1.5px solid #cbd5e1;
  border-radius: 4px;
  background-color: #ffffff;
  cursor: pointer;
  display: grid;
  place-content: center;
  transition: all 0.2s ease;
  margin: 0;
}

.checkboxes:checked {
  background-color: var(--color-blue);
  border-color: var(--color-blue);
}

.checkboxes:checked::before {
  content: "";
  width: 4px;
  height: 8px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
  margin-bottom: 2px;
}

/* FLOATING DROPDOWN STYLING */
.floating-dropdown {
  position: absolute;
  top: 35px;
  left: 0;
  width: 220px;
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  border: 1px solid #e2e8f0;
  padding: 8px 0;
  z-index: 100;
  max-height: 200px;
  overflow-y: auto;
}

.dropdown-header {
  font-size: 11px;
  font-weight: 700;
  color: #94a3b8;
  padding: 4px 12px;
  margin: 0 0 4px 0;
  letter-spacing: 0.5px;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  font-size: 12px;
  color: #1e293b;
  cursor: pointer;
  transition: background-color 0.15s;
}

.dropdown-item:hover {
  background-color: #f1f5f9;
}

.dropdown-item input[type="checkbox"] {
  cursor: pointer;
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
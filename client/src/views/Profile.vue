<script setup>
import { ref } from 'vue'
import '../assets/theme.css'

import BaseButton from '../components/BaseButton.vue';
import BaseInput from '../components/BaseInput.vue';

// profile form state
const selectedSchool = ref('Software Engineering (BSc)')
const selectedYear = ref('Year 2')
const selectedGrad = ref('2029')

// options dropdown
const schoolOptions = [
  'School of Computing and Information Systems',
  'School of Business',
  'School of Law',
  'School of Accountancy',
  'School of Social Sciences',
  'School of Economics',
  'College of Integrated Studies',
  'College of Graduate Research Studies '

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

    <div class="profile-grid">

      <!-- PROFILE CARD -->
      <div class="profile-card">

        <!-- PROFILE HEADER -->
        <div class="profile-header-visual">
          <div class="profile-banner"></div>
          <div class="avatar">
            <p class="header-style">MA</p>
          </div>
        </div>

        <!-- USER INFO -->
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

        <!-- DROPDPOWNS -->
        <div class="dropdowns">
          <BaseInput type="select" label="School" v-model="selectedSchool" :options="schoolOptions" />
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

      <div class="reminder-card">
        test
        <div class="reminder-box">test</div>
        <div class="reminder-box">test</div>
        <div class="reminder-box">test</div>
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
  grid-template-columns: 350px 1fr;
  gap: 15px;
  align-items: start;
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
  height: 132px;
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

.reminder-card {
  display: flex;
  flex-direction: column;
  background-color: var(--color-white);
  border-radius: 25px;
  padding: 15px;
  gap: 10px;
}

.reminder-box {
  background-color: var(--color-grey);
  border-radius: 25px;
  min-height: 125px;
}
</style>

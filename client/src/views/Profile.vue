<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import axios from 'axios'
import '../assets/theme.css'

import BaseButton from '../components/BaseButton.vue'
import BaseInput from '../components/BaseInput.vue'
import ProfileCard from '../components/ProfileCard.vue'
import { useUserStore } from '../stores/userStore'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { INTERESTS, MAX_INTERESTS } from '../utils/interests'
import { REMINDER_OPTIONS } from '../utils/reminders'
import { COURSES } from '../utils/courses'
import { API_URL } from '../utils/api'
import GoogleCalendarCard from '@/components/GoogleCalendarCard.vue'

const userStore = useUserStore()
const router = useRouter()
const { userId, setSession } = useAuth()

const profile = ref(null)
const eventsAttended = ref(0)
const friendCount = ref(0)
const profileError = ref('')

const avatarFailed = ref(false)
const bannerFailed = ref(false)

const bannerInputFile = ref(null)
const avatarInputFile = ref(null)

const newBannerFile = ref(null)
const newAvatarFile = ref(null)

const bannerPreview = ref(null)
const avatarPreview = ref(null)

async function loadProfile() {
  try {
    const { data } = await axios.get(`${API_URL}/api/users/${userId.value}`)
    profile.value = data

    const major = data.major || ''
    selectedCourse.value = courses.find(course => course === major || course.startsWith(`${major} (`)) || major
    selectedYear.value = /^\d+$/.test(data.year) ? `Year ${data.year}` : data.year || ''
    selectedGrad.value = data.graduationYear || ''
    clubs.value = [...(data.ccas || [])]
    
    // Mark as initialized so auto-save won't fire on initial load
    isInitialized.value = true
  } catch (error) {
    profileError.value = 'Could not load your profile. Please refresh and try again.'
    console.log('There was an error: ' + error.message)
  }
}

async function loadStats() {
  try {
    const { data } = await axios.get(`${API_URL}/api/activities/${userId.value}`)
    eventsAttended.value = data.filter(activity =>
      activity.sessions.some(session => session.going === 'attended')).length
  } catch (error) {
    console.log('There was an error: ' + error.message)
  }

  try {
    const { data } = await axios.get(`${API_URL}/api/friends/${userId.value}/accepted`)
    friendCount.value = data.length
  } catch (error) {
    if (error.response?.status !== 404) console.log('There was an error: ' + error.message)
  }
}

onMounted(() => {
  loadProfile()
  loadStats()
  loadInterests()
  loadAlertSettings()
})

const ALERT_ROWS = [
  { key: 'upcomingEvents', title: 'Upcoming events', desc: 'Events you\'re attending in the next 24 hours' },
  { key: 'lobbyActivity', title: 'Lobby activity', desc: 'Invites, replies, pitched events and group registration' },
  { key: 'plans', title: 'Plans', desc: 'Plan invites, replies, changes and cancellations' }
]
const alertSettings = ref({ upcomingEvents: true, lobbyActivity: true, plans: true, remindMinutesBefore: 15 })
const alertMessage = ref('')

async function loadAlertSettings() {
  try {
    const { data } = await axios.get(`${API_URL}/api/notifications/preferences?userId=${userId.value}`)
    alertSettings.value = data
  } catch (error) {
    console.log('There was an error: ' + error.message)
  }
}

async function saveAlertSetting(key, value) {
  const previous = alertSettings.value[key]
  alertSettings.value[key] = value
  alertMessage.value = ''
  try {
    await axios.put(`${API_URL}/api/notifications/preferences?userId=${userId.value}`, { [key]: value })
    alertMessage.value = 'Settings saved!'
  } catch (error) {
    alertSettings.value[key] = previous
    alertMessage.value = 'Could not save setting.'
    console.log('There was an error: ' + error.message)
  }
}

// Execute Logout action
const executeLogout = () => {
  userStore.logout()
  confirmingLogout.value = false
  router.push('/login')
}

const selectedCourse = ref('')
const selectedYear = ref('')
const selectedGrad = ref('')

const courses = COURSES
const yearOptions = ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5']
const gradOptions = ['2027', '2028', '2029', '2030']
const clubs = ref([])
const newClub = ref('')
const showClubDropdown = ref(false)

const categories = ref([])
const savedInterests = ref([])
const saveMessage = ref('')
const saving = ref(false)
const showInterestDropdown = ref(false)
const isInitialized = ref(false)

const allAvailableInterests = INTERESTS

async function loadInterests() {
  try {
    const response = await axios.get(`${API_URL}/api/users/${userId.value}/preferences`)
    categories.value = response.data
    savedInterests.value = [...response.data]
  } catch (error) {
    console.log('There was an error: ' + error.message)
  }
}

function addClub() {
  const name = newClub.value.trim()
  if (name && !clubs.value.some(club => club.toLowerCase() === name.toLowerCase())) {
    clubs.value.push(name)
    newClub.value = ''
    triggerAutoSave()
  }
}

function removeClub(name) {
  clubs.value = clubs.value.filter(club => club !== name)
  triggerAutoSave()
}

function toggleInterest(cat) {
  saveMessage.value = ''
  if (categories.value.includes(cat)) {
    categories.value = categories.value.filter(item => item !== cat)
  } else if (categories.value.length >= MAX_INTERESTS) {
    saveMessage.value = `You can pick up to ${MAX_INTERESTS} interests.`
    return
  } else {
    categories.value.push(cat)
  }
  triggerAutoSave()
}

const triggerBannerInput = () => bannerInputFile.value.click()
const triggerAvatarInput = () => avatarInputFile.value.click()

const handleBannerSelection = (event) => {
  const file = event.target.files[0]
  if (file) {
    newBannerFile.value = file
    bannerPreview.value = URL.createObjectURL(file)
    triggerAutoSave()
  }
}

const handleAvatarSelection = (event) => {
  const file = event.target.files[0]
  if (file) {
    newAvatarFile.value = file
    avatarPreview.value = URL.createObjectURL(file)
    triggerAutoSave()
  }
}

const saveImages = async () => {
  if (!newBannerFile.value && !newAvatarFile.value) return

  const formData = new FormData()
  if (newBannerFile.value) formData.append('bannerImage', newBannerFile.value)
  if (newAvatarFile.value) formData.append('profileImage', newAvatarFile.value)

  await userStore.updateProfileImages(userId.value, formData)
  newBannerFile.value = null
  newAvatarFile.value = null
}

// Auto-save debouncer / watcher execution
let saveTimeout = null
function triggerAutoSave() {
  if (!isInitialized.value) return
  clearTimeout(saveTimeout)
  saveTimeout = setTimeout(async () => {
    saving.value = true
    saveMessage.value = 'Saving...'
    try {
      await saveImages()
      const { data } = await axios.put(`${API_URL}/api/users/${userId.value}`, {
        major: selectedCourse.value,
        year: selectedYear.value,
        graduationYear: selectedGrad.value,
        ccas: clubs.value,
        interests: categories.value
      })

      const interestsChanged = [...categories.value].sort().join() !== [...savedInterests.value].sort().join()
      if (interestsChanged) localStorage.setItem('interestsChanged', 'true')
      savedInterests.value = [...categories.value]

      profile.value = { ...profile.value, avatar: data.avatar, banner: data.banner }
      setSession(data || data.user)
      saveMessage.value = 'All changes saved automatically!'
      setTimeout(() => { saveMessage.value = '' }, 2500)
    } catch (error) {
      saveMessage.value = `Could not save: ${error.response?.data?.message || error.message}`
      console.log('There was an error: ' + error.message)
    } finally {
      saving.value = false
    }
  }, 500)
}

// Watch dropdown fields to trigger auto-save instantly on change
watch([selectedCourse, selectedYear, selectedGrad], () => {
  triggerAutoSave()
})

const confirmingDelete = ref(false)
const confirmingLogout = ref(false)
const deleting = ref(false)

const executeDelete = async () => {
  deleting.value = true
  try {
    const userId = userStore.currentUser?.id || userStore.currentUser?._id
    await userStore.deleteUser(userId)
    confirmingDelete.value = false
    router.push('/login')
  } catch (err) {
    console.error('Failed to delete account:', err)
    alert(err.message || 'Something went wrong while deleting your account.')
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <div class="profile-container">

    <div class="top-bar">
      <h1 class="page-title">PROFILE & ALERTS</h1>
      <div class="top-actions">
        <BaseButton class="theme-red" @click="confirmingDelete = true">DELETE ACCOUNT</BaseButton>
        <BaseButton class="logout-btn" variant="outline-main" @click="confirmingLogout = true">LOG OUT</BaseButton>
        <span v-if="saving" class="auto-save-indicator">Saving...</span>
      </div>
    </div>

    <!-- MAIN GRID -->
    <div class="profile-grid">

      <!-- PROFILE -->
      <div class="left-column">
        <ProfileCard
          :profile="profile"
          :profileError="profileError"
          :eventsAttended="eventsAttended"
          :friendCount="friendCount"
          v-model:selectedCourse="selectedCourse"
          :courses="courses"
          v-model:selectedYear="selectedYear"
          :yearOptions="yearOptions"
          v-model:selectedGrad="selectedGrad"
          :gradOptions="gradOptions"
          :clubs="clubs"
          v-model:newClub="newClub"
          v-model:showClubDropdown="showClubDropdown"
          :categories="categories"
          :allAvailableInterests="allAvailableInterests"
          v-model:showInterestDropdown="showInterestDropdown"
          :saveMessage="saveMessage"
          :bannerPreview="bannerPreview"
          v-model:bannerFailed="bannerFailed"
          :avatarPreview="avatarPreview"
          v-model:avatarFailed="avatarFailed"
          @triggerBannerInput="triggerBannerInput"
          @triggerAvatarInput="triggerAvatarInput"
          @handleBannerSelection="handleBannerSelection"
          @handleAvatarSelection="handleAvatarSelection"
          @addClub="addClub"
          @removeClub="removeClub"
          @toggleInterest="toggleInterest"
        />
      </div>


      <!-- SETTINGS -->
      <div class="right-column">
        <div class="settings-card">
          <div class="settings-header-row">
            <span class="header-col-title">ALERT TYPE</span>
            <div class="header-col-switches">
              <span>IN-APP</span>
            </div>
          </div>
          <div v-for="row in ALERT_ROWS" :key="row.key" class="settings-item-row">
            <div class="setting-info">
              <p class="setting-title">{{ row.title }}</p>
              <p class="setting-desc">{{ row.desc }}</p>
            </div>
            <div class="setting-switches">
              <label class="toggle-switch">
                <input type="checkbox" :checked="alertSettings[row.key]" :aria-label="row.title"
                  @change="saveAlertSetting(row.key, $event.target.checked)" />
                <span class="slider"></span>
              </label>
            </div>
          </div>

          <div class="settings-reminder-row">
            <div class="setting-info">
              <p class="setting-title">Default reminder time</p>
              <p class="setting-desc">What Remind Me starts on. Reminders you set always go off.</p>
            </div>
            <div class="setting-reminder-input">
              <BaseInput type="select" :modelValue="alertSettings.remindMinutesBefore" :options="REMINDER_OPTIONS"
                @update:modelValue="saveAlertSetting('remindMinutesBefore', $event)" />
            </div>
          </div>

          <p v-if="alertMessage" class="save-message" role="status">{{ alertMessage }}</p>
        </div>

        <div>
          <GoogleCalendarCard />
        </div>
      </div>

    </div>

    <!-- CUSTOM DELETE ACCOUNT CONFIRMATION -->
    <Transition name="fade">
      <div v-if="confirmingDelete" class="overlay" role="alertdialog" aria-modal="true" aria-labelledby="del-title" @click.self="confirmingDelete = false">
        <div class="dialog">
          <h3 id="del-title" class="dialog-title">Delete Account?</h3>
          <p>Are you sure you want to delete your account? This action cannot be undone and you'll lose all your data and stats.</p>
          <div class="dialog-actions">
            <BaseButton class="btn-ghost" type="button" @click="confirmingDelete = false">Cancel</BaseButton>
            <BaseButton class="theme-red" type="button" :disabled="deleting" @click="executeDelete">
              {{ deleting ? 'Deleting...' : 'Yes, Delete' }}
            </BaseButton>
          </div>
        </div>
      </div>
    </Transition>

    <!-- CUSTOM LOGOUT CONFIRMATION -->
    <Transition name="fade">
      <div v-if="confirmingLogout" class="overlay" role="alertdialog" aria-modal="true" aria-labelledby="logout-title" @click.self="confirmingLogout = false">
        <div class="dialog">
          <h3 id="logout-title" class="dialog-title">Log Out?</h3>
          <p>Are you sure you want to log out of your account?</p>
          <div class="dialog-actions">
            <BaseButton class="btn-ghost" type="button" @click="confirmingLogout = false">Cancel</BaseButton>
            <BaseButton class="theme-green" type="button" @click="executeLogout">Yes, Log Out</BaseButton>
          </div>
        </div>
      </div>
    </Transition>

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
  padding: 10px 5px;
}

.page-title {
  color: var(--color-white);
  font-family: 'HeaderFont';
  font-size: 25px;
}

.save-message {
  margin: 8px 0 0;
  font-size: 11px;
}

.auto-save-indicator {
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  animation: pulse 1s infinite;
}

.top-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logout-btn {
  border-color: var(--color-white);
  color: var(--color-white);
}

.profile-grid {
  display: grid;
  grid-template-columns: 350px 1fr;
  gap: 15px;
  align-items: start;
}

@media (max-width: 991px) {
  .profile-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}

.left-column {
  display: flex;
  flex-direction: column;
  gap: 15px;
  width: 100%;
}

.right-column {
  display: flex;
  flex-direction: column;
  gap: 10px;
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
  gap: 24px;
  width: 120px;
  justify-content: space-around;
  text-align: end;
}

.settings-item-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.settings-reminder-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.setting-reminder-input {
  width: 180px;
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
  flex-shrink: 0;
  justify-content: end;
}

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

/* CUSTOM MODAL OVERLAY STYLING */
.overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
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
</style>
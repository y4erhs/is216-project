<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import '../assets/theme.css'

import BaseButton from '../components/BaseButton.vue';
import BaseInput from '../components/BaseInput.vue';
import CategoryPill from '@/components/categoryPill.vue'
import { useUserStore } from '../stores/userStore'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { INTERESTS, MAX_INTERESTS } from '../utils/interests'
import { userImageUrl } from '../utils/userDisplay'
import { REMINDER_OPTIONS } from '../utils/reminders'
import { COURSES } from '../utils/courses'
import { API_URL } from '../utils/api'


const userStore = useUserStore()
const router = useRouter()
const { userId, setSession } = useAuth()


// The logged-in user's details and stats, from the API
const profile = ref(null)
const eventsAttended = ref(0)
const friendCount = ref(0)
const profileError = ref('')

// Images that fail to load show the initials / plain banner instead
const avatarFailed = ref(false)
const bannerFailed = ref(false)

// updating images
// References for hidden file inputs
const bannerInputFile = ref(null)
const avatarInputFile = ref(null)

// Raw files ready to be uploaded
const newBannerFile = ref(null)
const newAvatarFile = ref(null)

// Local previews
const bannerPreview = ref(null)
const avatarPreview = ref(null)


const profileName = computed(() =>
  profile.value?.displayName || profile.value?.fullName || profile.value?.username || '')

const initials = computed(() =>
  profileName.value.split(' ').map(word => word[0]).slice(0, 2).join('').toUpperCase())


async function loadProfile() {
  try {
    const { data } = await axios.get(`${API_URL}/api/users/${userId.value}`)
    profile.value = data

    // older accounts store "Software Engineering" or 2; the dropdowns use "Software Engineering (BSc)" and "Year 2"
    const major = data.major || ''
    selectedCourse.value = courses.find(course => course === major || course.startsWith(`${major} (`)) || major
    selectedYear.value = /^\d+$/.test(data.year) ? `Year ${data.year}` : data.year || ''
    selectedGrad.value = data.graduationYear || ''
    clubs.value = [...(data.ccas || [])]
  } catch (error) {
    profileError.value = 'Could not load your profile. Please refresh and try again.'
    console.log('There was an error: ' + error.message)
  }
}

async function loadStats() {
  try {
    const { data } = await axios.get(`${API_URL}/api/activities/${userId.value}`)
    // one event counts once, even if they went to several of its sessions
    eventsAttended.value = data.filter(activity =>
      activity.sessions.some(session => session.going === 'attended')).length
  } catch (error) {
    console.log('There was an error: ' + error.message)
  }

  try {
    const { data } = await axios.get(`${API_URL}/api/friends/${userId.value}/accepted`)
    friendCount.value = data.length
  } catch (error) {
    // the API answers 404 when the user has no friends yet, so the count stays 0
    if (error.response?.status !== 404) console.log('There was an error: ' + error.message)
  }
}

onMounted(() => {
  loadProfile()
  loadStats()
  loadInterests()
  loadAlertSettings()
})

// Alerts the user can switch off. These save as soon as they're changed.
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
    alertMessage.value = 'Changes saved!'
  } catch (error) {
    alertSettings.value[key] = previous
    alertMessage.value = 'Could not save. Please try again.'
    console.log('There was an error: ' + error.message)
  }
}

const includePersonal = ref(true)

const handleLogout = () => {
  userStore.logout()
  router.push('/login') // Redirect to login after logging out
}

// profile form state
const selectedCourse = ref('')
const selectedYear = ref('')
const selectedGrad = ref('')

// options dropdown
const courses = COURSES
const yearOptions = ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5']
const gradOptions = ['2027', '2028', '2029', '2030']
const clubs = ref([])
const newClub = ref('')
const showClubDropdown = ref(false)

// State buat Interests & Floating Dropdown
const categories = ref([])
const savedInterests = ref([])   // what's in the database, to tell if they changed
const saveMessage = ref('')
const saving = ref(false)
const showInterestDropdown = ref(false)

// List semua opsi interest yang bisa dipilih
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
  }
  newClub.value = ''
}

function removeClub(name) {
  clubs.value = clubs.value.filter(club => club !== name)
}

function toggleInterest(cat) {
  saveMessage.value = ''
  if (categories.value.includes(cat)) {
    categories.value = categories.value.filter(item => item !== cat)
  } else if (categories.value.length >= MAX_INTERESTS) {
    saveMessage.value = `You can pick up to ${MAX_INTERESTS} interests.`
  } else {
    categories.value.push(cat)
  }
}

// Triggers file dialogs
const triggerBannerInput = () => bannerInputFile.value.click()
const triggerAvatarInput = () => avatarInputFile.value.click()

// Handle Banner file choice
const handleBannerSelection = (event) => {
  const file = event.target.files[0]
  if (file) {
    newBannerFile.value = file
    bannerPreview.value = URL.createObjectURL(file) // Instant UI preview
  }
}

// Handle Avatar file choice
const handleAvatarSelection = (event) => {
  const file = event.target.files[0]
  if (file) {
    newAvatarFile.value = file
    avatarPreview.value = URL.createObjectURL(file) // Instant UI preview
  }
}

// Submit to backend
const saveImages = async () => {
  if (!newBannerFile.value && !newAvatarFile.value) return

  const formData = new FormData()
  if (newBannerFile.value) formData.append('bannerImage', newBannerFile.value)
  if (newAvatarFile.value) formData.append('profileImage', newAvatarFile.value)

  // Call store action passing userId and formData
  await userStore.updateProfileImages(userId.value, formData)
  newBannerFile.value = null
  newAvatarFile.value = null
}

async function saveProfile() {
  addClub()   // a club typed in but not added yet still counts
  saving.value = true
  saveMessage.value = ''
  try {
    await saveImages()   // first, so the response below has the new pictures
    const { data } = await axios.put(`${API_URL}/api/users/${userId.value}`, {
      major: selectedCourse.value,
      year: selectedYear.value,
      graduationYear: selectedGrad.value,
      ccas: clubs.value,
      interests: categories.value
    })

    // Discover refreshes its recommendations only if the interests changed
    const interestsChanged = [...categories.value].sort().join() !== [...savedInterests.value].sort().join()
    if (interestsChanged) localStorage.setItem('interestsChanged', 'true')
    savedInterests.value = [...categories.value]

    profile.value = { ...profile.value, avatar: data.avatar, banner: data.banner }
    setSession(data)   // the sidebar shows the new course, year and picture straight away
    saveMessage.value = 'Changes saved!'
    showInterestDropdown.value = false
    showClubDropdown.value = false
  } catch (error) {
    saveMessage.value = `Could not save: ${error.response?.data?.message || error.message}`
    console.log('There was an error: ' + error.message)
  } finally {
    saving.value = false
  }
}

const deleting = ref(false)

const confirmDelete = async () => {
  // Always good to double-check with a confirm dialog
  const isConfirmed = window.confirm(
    'Are you sure you want to delete your account? This action cannot be undone.'
  )
  
  if (!isConfirmed) return

  deleting.value = true
  try {
    // Assuming you have access to the logged-in user's ID
    const userId = userStore.currentUser?.id || userStore.currentUser?._id
    
    await userStore.deleteUser(userId)
    
    // Redirect user to login or home page after successful deletion
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
        <BaseButton class="logout-btn" variant="outline-main" @click="handleLogout">LOG OUT</BaseButton>
        <BaseButton class="save-btn" :disabled="saving" @click="saveProfile">
          {{ saving ? 'SAVING...' : 'SAVE CHANGES' }}
        </BaseButton>
      </div>
    </div>

    <!-- MAIN GRID -->
    <div class="profile-grid">

      <!-- PROFILE -->
      <div class="left-column">

        <div class="profile-card">
          <div class="profile-header-visual">
            <div class="banner-container" @click="triggerBannerInput">
              <div class="profile-banner">
                <img v-if="bannerPreview || userImageUrl(profile?.banner) && !bannerFailed" 
                :src=" bannerPreview || userImageUrl(profile.banner)" alt=""
                  @error="bannerFailed = true" />
                <div class="edit-banner-overlay">
                  <span class="edit-text">Edit Banner</span>
                </div>
              </div>
              <input type="file" ref="bannerInputFile" @change="handleBannerSelection" accept="image/*" class="d-none" />
            </div>

            <div class="avatar-container" @click="triggerAvatarInput">
              <div class="avatar">
                <img v-if=" avatarPreview || userImageUrl(profile?.avatar) && !avatarFailed" 
                :src=" avatarPreview || userImageUrl(profile.avatar)" alt=""
                  @error="avatarFailed = true" />
                <p v-else class="header-style">{{ initials }}</p>
              </div>
              <div class="edit-avatar-overlay">
                  <span class="edit-text">Edit</span>
                </div>
              <input type="file" ref="avatarInputFile" @change="handleAvatarSelection" accept="image/*" class="d-none" />
            </div>
          </div>

          <div class="user-info mt-3">
            <p v-if="profileError" class="profile-error" role="alert">{{ profileError }}</p>
            <p class="full-name header-style">{{ profileName }}</p>
            <p class="username"> @{{ profile?.username }}</p>
            <div class="stats-row">
              <div class="stats-item">
                <div class="stat-number header-style">{{ eventsAttended }}</div>
                <div class="stat-label">EVENTS ATTENDED</div>
              </div>
              <div class="stats-item">
                <div class="stat-number header-style">{{ friendCount }}</div>
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

                <div style="position: relative; display: inline-block;">
                  <BaseButton variant="small" @click="showClubDropdown = !showClubDropdown">+</BaseButton>

                  <!-- Floating Dropdown Box -->
                  <div v-if="showClubDropdown" class="floating-dropdown">
                    <p class="dropdown-header">Your Clubs</p>
                    <div class="club-add">
                      <input v-model="newClub" class="club-input" type="text" maxlength="40" placeholder="Add a club"
                        aria-label="Add a club" @keyup.enter="addClub" />
                      <BaseButton variant="small" @click="addClub">+</BaseButton>
                    </div>
                    <div v-for="club in clubs" :key="club" class="dropdown-item" @click="removeClub(club)">
                      <input class="checkboxes" type="checkbox" checked @click.stop="removeClub(club)" />
                      <span>{{ club }}</span>
                    </div>
                  </div>
                </div>
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
                    <div v-for="item in allAvailableInterests" :key="item.id" class="dropdown-item"
                      @click="toggleInterest(item.id)">
                      <input class="checkboxes" type="checkbox" :checked="categories.includes(item.id)"
                        @click.stop="toggleInterest(item.id)" />
                      <span>{{ item.label }}</span>
                    </div>
                  </div>
                </div>

              </div>
              <p v-if="saveMessage" class="save-message" role="status">{{ saveMessage }}</p>
            </div>
          </div>
        </div>
      </div>
      

      <!-- SETTINGS -->
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
      
    </div>
      <div class="page-bottom">
        <BaseButton class="delete-btn" :disabled="deleting" @click="confirmDelete">
          {{ deleting ? 'DELETING...' : 'DELETE ACCOUNT' }}
        </BaseButton>
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

.page-bottom {
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.delete-btn {
  background-color: var(--color-red);
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

.club-add {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 2px 12px 6px;
}

.club-input {
  flex: 1;
  min-width: 0;
  height: 28px;
  padding: 2px 10px 0;
  border: 1px solid var(--color-grey);
  border-radius: 999px;
  color: var(--color-black);
  font-size: 12px;
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

.save-btn {
  background-color: var(--color-dark-blue);
}

.profile-grid {
  display: grid;
  grid-template-columns: 360px 1fr;
  gap: 15px;
  align-items: start;
}

/* The sidebar takes up room on tablets, so two columns would be squeezed */
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

.banner-container {
  position: relative;
  cursor: pointer;
  overflow: hidden;
  width: 100%;
}

.edit-banner-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(23, 19, 19, 0.4); 
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0; /* Hidden by default */
  transition: opacity 0.2s ease-in-out; /* Smooth fade-in effect */
  border-radius: 21px;
  pointer-events: none; /* Allows clicks to pass through overlay */
}

.edit-banner-overlay .edit-text {
  color: var(--color-white);
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 0.9rem;
  
}

/* Trigger overlay on hover */
.banner-container:hover .edit-banner-overlay {
  opacity: 1;
}

.avatar-container {
  position: absolute;
  left: 20px;
  bottom: -30px;
  width: 80px;
  height: 80px;
  cursor: pointer;
  border-radius: 20px;
  overflow: hidden;
}

.edit-avatar-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(23, 19, 19, 0.4); 
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0; /* Hidden by default */
  transition: opacity 0.2s ease-in-out; /* Smooth fade-in effect */
  border-radius: 20px;
  pointer-events: none; /* Prevents blocking clicks */
}

.edit-avatar-overlay .edit-text {
  color: var(--color-white);
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  
}

.avatar-container:hover .edit-avatar-overlay {
  opacity: 1;
}

.avatar {
  background-color: var(--color-green);
  width: 100%;
  height: 100%;
  border-radius: 20px;
  font-size: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  position: relative;
  
}

/* For when initials show as fallback instead of an image */
.avatar p.header-style {
  margin: 0;
  font-size: 30px;
  color: var(--color-white);
}

.avatar img {
  position: absolute;
  width: 100%;
  height: 100%;
  object-fit: cover;
  top: 0;
  left: 0;
}

.profile-banner {
  aspect-ratio: 5 / 2;
  background-color: var(--color-dark-green);
  border-radius: 20px;
  overflow: hidden;
}

.profile-banner img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-error {
  color: var(--color-dark-red);
  font-size: 11px;
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
<script setup>
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'

import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { useUserStore } from '@/stores/userStore';

import BaseButton from '../components/BaseButton.vue'
import FolderTabs from '../components/FolderTabs.vue'
import BaseInput from '../components/BaseInput.vue'
import '../assets/theme.css'
import { INTERESTS, MAX_INTERESTS } from '../utils/interests'
import { COURSES } from '../utils/courses'
import { API_URL } from '../utils/api'

// CREATE ACCOUNT DATA
const fullName = ref('');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');


// Signing up with Google: the email is verified and there's no password, so no Account step
const googleCode = ref('')

const allCategories = [
  { id: 'create-acc', label: 'ACCOUNT', theme: 'theme-green' },
  { id: 'edit-profile', label: 'PROFILE', theme: 'theme-orange' },
  { id: 'interests', label: 'INTERESTS', theme: 'theme-purple' }
]
const courses = COURSES

const years = ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5']

const activeTab = ref('create-acc')
const selectedCourse = ref('')
const selectedYear = ref('')
const displayName = ref('')
const username = ref('')

// Image previews and defaults
const profileImage = ref(null)
const imagePreview = ref(null)
const bannerPreview = ref(null)
const bannerImage = ref(null)

// check if it is uploaded
const defaultBanner = ref('')

//generate initials from display name if no avatar img
const ProfileInitials = computed(() => {
  if (!displayName.value) {
    return '?'
  }
  const parts = displayName.value.trim().split(' ')
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return parts[0].substring(0, 2).toUpperCase()

})

// Upload and preview profile picture
const handleFileUpload = (event) => {
  const file = event.target.files[0]
  if (file) {
    profileImage.value = file
    imagePreview.value = URL.createObjectURL(file)
  }
}

// Upload and preview banner image
const handleBannerUpload = (event) => {
  const file = event.target.files[0]
  if (file) {
    bannerImage.value = file
    bannerPreview.value = URL.createObjectURL(file)
  }
}

const availableInterests = INTERESTS

const selectedInterests = ref([])

// const toggleInterest = (id) => {
//   if (selectedInterests.value.includes(id)) {
//     selectedInterests.value = selectedInterests.value.filter(item => item !== id)
//   } else {
//     selectedInterests.value.push(id)
//   }
// }

const categories = computed(() =>
  googleCode.value ? allCategories.filter(tab => tab.id !== 'create-acc') : allCategories
)

const userStore = useUserStore();
const route = useRoute();
const router = useRouter();

function continueWithGoogle() {
  window.location.href = `${API_URL}/auth/google/signin`
}

// Back from Google with a new account: start on the Profile step with their details
onMounted(async () => {
  const code = route.query.googleCode
  if (!code) return

      try {
        const { data } = await axios.get(`${API_URL}/auth/google/signin/signup-info`, { params: { code } })
        email.value = data.email
        fullName.value = data.name
        displayName.value = data.name
        activeTab.value = 'edit-profile'
        googleCode.value = code
      } catch (error) {
        errorMsg.value = error.response?.data?.message || 'Google sign-up failed. Please try again.'
      }
      router.replace('/signup')
    })
    const errorMsg = ref('')
  
    // Validation for Create Account
    const handleCreateAccount = async () => {
      errorMsg.value = ''

  if (!fullName.value || !email.value || !password.value || !confirmPassword.value) {
    errorMsg.value = 'Please fill in all required fields.'
    return
  }

      // check if email is an smu email
      if (!email.value.trim().endsWith('@smu.edu.sg')) {
        errorMsg.value = 'Email must end with @smu.edu.sg'
        return
      }

      try {
        console.log("Checking store instance:", userStore)
        const isTaken = await userStore.checkEmail(email.value)
        
        if (isTaken) {
          errorMsg.value = "This email is already registered. Please use another email."
          return
        }
      } catch (error) {
        console.error('Full error details:', error)
        errorMsg.value = error.response?.data?.message || 'Failed to verify email. Please try again.'
        return
      }

  // check if password is 8 characters and includes at least 1 number, 1 special char and capital letter
  if (password.value.length < 8) {
    errorMsg.value = 'Password must be at least 8 characters'
    return
  }

  const hasCapital = /[A-Z]/.test(password.value)
  const hasNumber = /\d/.test(password.value)
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password.value)

  if (!hasCapital || !hasNumber || !hasSpecial) {
    errorMsg.value = 'Password must include at least 1 capital letter, 1 number, and 1 special character.'
    return
  }

  if (password.value !== confirmPassword.value) {
    errorMsg.value = 'Passwords do not match!'
    return
  }

  activeTab.value = 'edit-profile'
}

const handleCreateProfile = async () => {
  errorMsg.value = ''
  if (!displayName.value || !username.value || !selectedCourse.value || !selectedYear.value) {
    errorMsg.value = 'Please fill in all required fields.'
    return
  }

  //username is already taken

  try {
    const isTaken = await userStore.checkUsername(username.value)

    if (isTaken) {
      errorMsg.value = "This username is already taken. Please choose another username."
      return
    }

    activeTab.value = 'interests'
  } catch (error) {
    console.error('Full error details:', error)
    errorMsg.value = error.response?.data?.message || 'Failed to verify username. Please try again.'
  }

}

const handleSubmit = async () => {
  console.log("SUBMIT BUTTON CLICKED!");
  try {
    // 1. Create and populate the FormData object first
    const formData = new FormData();
    formData.append('fullName', fullName.value);
    formData.append('email', email.value.trim());
    if (googleCode.value) {
      formData.append('googleCode', googleCode.value);
    } else {
      formData.append('password', password.value);
    }
    formData.append('displayName', displayName.value);
    formData.append('username', username.value);
    formData.append('major', selectedCourse.value);
    formData.append('year', selectedYear.value);
    formData.append('interests', JSON.stringify(selectedInterests.value));

    if (profileImage.value) {
      formData.append('profileImage', profileImage.value);
    }
    if (bannerImage.value) {
      formData.append('bannerImage', bannerImage.value);
    }

    await userStore.register(formData);
    router.push('/');

  } catch (error) {
    console.error('Failed to connect:', error.message || error);
    errorMsg.value = error.response?.data?.message || error.message || 'Registration failed';

  }
}
</script>

<template>
  <div class="page-wrapper">
    <FolderTabs :tabs="categories" v-model="activeTab">
      <template #create-acc>
        <div class="cards-list">
          <!-- create account event cards -->
          <div>
            <h1 class="section-title"> CREATE AN ACCOUNT </h1>
            <form @submit.prevent="handleCreateAccount">
              <input type="text" v-model="fullName" placeholder="Full Name">
              <input type="email" v-model="email" placeholder="Email">
              <input type="password" v-model="password" placeholder="Password">
              <input type="password" v-model="confirmPassword" placeholder="Confirm Password"
                @keyup.enter="handleCreateAccount">

              <p v-if="errorMsg" class="form-error">{{ errorMsg }}</p>

              <div class="form-actions">
                <BaseButton type="submit" class="auth-btn">REGISTER</BaseButton>
                <span>Or</span>
                <BaseButton type="button" class="auth-btn" @click="continueWithGoogle">
                  <img src="/google-green-icon.png" style="width: 16px; height: 16px;"> CONTINUE WITH GOOGLE
                </BaseButton>
              </div>

              <div class="log-in">
                <p>Have an account? <router-link to="/login">Log in</router-link></p>
              </div>
            </form>
          </div>
        </div>
      </template>

      <template #edit-profile>
        <div class="cards-list profile-cards-list">
          <!-- LEFT COLUMN -->
          <div class="left-column">
            <div class="profile-preview-card">
              <!-- Banner & Avatar Header -->
              <div class="profile-header-visual">
                <div class="profile-banner-preview">
                  <img v-if="bannerPreview" :src="bannerPreview || defaultBanner" alt="Banner" class="banner-img" />
                  <span v-else class="banner-placeholder"></span>
                </div>
                <div class="avatar">
                  <img v-if="imagePreview" :src="imagePreview || defaultAvatar" alt="Avatar" class="avatar-img" />
                  <span v-else class="avatar-initials">{{ ProfileInitials }}</span>
                </div>
              </div>

              <!-- User Info -->
              <div class="user-info mt-3">
                <p class="full-name header-style">{{ displayName || 'name' }}</p>
                <p class="username">@{{ username || 'USERNAME' }}</p>
                <div class="stats-row">
                  <div class="stats-item">
                    <div class="stat-number header-style">0</div>
                    <div class="stat-label">EVENTS ATTENDED</div>
                  </div>
                  <div class="stats-item">
                    <div class="stat-number header-style">0</div>
                    <div class="stat-label">FRIENDS</div>
                  </div>
                </div>
              </div>

              <!-- Meta Data -->
              <div class="meta-row">
                <div>
                  <span class="meta-title">Course</span>
                  <span class="meta-val">{{ selectedCourse || 'Course' }}</span>
                </div>
                <div>
                  <span class="meta-title">Year of Study</span>
                  <span class="meta-val"> {{ selectedYear || 'Your Year' }}</span>
                </div>
              </div>

              <!-- Tags -->
              <div class="tags-section">
                <p class="tags-label">Clubs</p>
                <div class="pill-row">
                  <span class="pill orange"></span>
                  <span class="pill red"></span>
                  <span class="pill green"></span>
                </div>
              </div>

              <div class="tags-section">
                <p class="tags-label">Interests</p>
                <div class="pill-row">
                  <span class="pill purple"></span>
                  <span class="pill red"></span>
                  <span class="pill blue"></span>
                </div>
              </div>
            </div>
          </div>

          <!-- RIGHT COLUMN (Form Controls) -->
          <div class="right-section">
            <h1 class="section-title">CREATE PROFILE</h1>
            <form @submit.prevent="handleCreateProfile">
              <input type="text" v-model="displayName" placeholder="Display Name">
              <input type="text" v-model="username" placeholder="Username">

              <span class="dropdown-section">
                <BaseInput class="select-course theme-dark-red" type="select" v-model="selectedCourse" :options="courses"
                  placeholder="Your course" />
                <BaseInput class="select-year theme-dark-red" type="select" v-model="selectedYear" :options="years"
                  placeholder="Year of Study" />
              </span>

              <div class="upload-row">
                <div class="file-upload-container">
                  <label class="upload-label">Upload Profile Picture</label>
                  <label class="custom-file-upload">
                    Choose File
                    <input type="file" accept="image/*" @change="handleFileUpload" class="file-input" />
                  </label>
                  <p class="img-description">Image ratio of 1:1</p>
                </div>

                <div class="file-upload-container">
                  <label class="upload-label">Upload banner</label>
                  <label class="custom-file-upload">
                    Choose File
                    <input type="file" accept="image/*" @change="handleBannerUpload" class="file-input" />
                  </label>
                  <p class="img-description">Image ratio of 5:2</p>
                </div>
              </div>

              <p v-if="errorMsg" class="form-error">{{ errorMsg }}</p>

              <div class="form-actions folder-footer">
                <BaseButton type="submit" class="auth-btn">NEXT</BaseButton>
              </div>
            </form>
          </div>
        </div>
      </template>

      <template #interests>
        <div class="cards-list interest-list">
          <!-- interest event cards -->
          <h1 class="section-title"> CHOOSE UP TO {{ MAX_INTERESTS }} INTERESTS </h1>
          <div class="folder-scroll-container">
            <div class="interest-grid">
              <div v-for="interest in availableInterests" :key="interest.id" class="card interest-card">
                <img :src="interest.image" class="card-img-top interest-card-img" alt="...">
                <div class="card-body p-2">
                  <p class="card-text mb-0">
                    <label class="w-100 d-flex align-items-center gap-2 mb-0">
                      <input type="checkbox" :value="interest.id" v-model="selectedInterests"
                        :disabled="selectedInterests.length >= MAX_INTERESTS && !selectedInterests.includes(interest.id)">
                      <span> {{ interest.label }} </span>
                    </label>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div class="interest-footer">
            <p v-if="errorMsg" class="form-error">{{ errorMsg }}</p>
            <BaseButton type="button" class="auth-btn" @click="handleSubmit">FINISH SIGN UP</BaseButton>
          </div>
        </div>
      </template>
    </FolderTabs>
  </div>

</template>

<style scoped>
/* Container for all the Folder Tabs */
.page-wrapper {
  --folder-height: 600px;   /* one height for every tab, tune this single number */
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 20px;
}

/* Allow the wrapper to take up more space */
.page-wrapper>* {
  width: 90%;
  max-width: 800px;
  height: min(var(--folder-height), calc(100vh - 100px)); 
  position: relative; 
}

:deep(.inner-folder) {
  overflow-y: auto !important;
  overflow-x: hidden !important;
}

:deep(.folder-tabs-container),
:deep(.cards-list),
:deep(.tab-content) {
  width: 100% !important;
  max-width: 100% !important;
}

:deep(.cards-list) {
  flex: 1;
  min-height: 0;
}

.cards-list {
  display: flow-root;
  position: relative;
  margin: 15px 0;
}



.section-title {
  font-family: 'HeaderFont', sans-serif !important;
  color: var(--color-white);
  text-align: center;
  font-size: 30px;
  margin: 20px 0 0px;
}

.form-error {
  margin: 0;
  color: var(--color-yellow);
  font-size: 12px;
}

.form-error + .form-actions {
  margin-top: -6px;  
}

form {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  width: 100%;
  margin-top: 20px;
  color: var(--color-white);
}

.form-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  width: 100%;
  margin-top: 12px;
}

/* room at the bottom so content never sits under the footer button */

/* NEXT / FINISH SIGN UP: bottom-right corner of the folder */
.form-actions.folder-footer {
  position: absolute;
  right: 10px;
  bottom: 10px;
  width: auto;
  margin: 0;
}

.folder-footer .auth-btn {
  width: auto;
  min-width: 150px;
  max-width: none;
}

input[type="text"],
input[type="email"],
input[type="password"] {
  border: none;
  border-bottom: 2px solid var(--color-white);
  background: transparent;
  outline: none;
  padding: 10px 0 5px 0;
  color: var(--color-white);
  width: 40%;
  max-width: 500px;
  font-size: 16px;
  box-sizing: border-box;
  transition: border-color 0.2s ease;
}

input::placeholder {
  color: var(--color-white);
  opacity: 0.8;

}

input:focus {
  border-bottom-color: var(--color-white);
}

.auth-btn {
  width: 40%;
  max-width: 500px;
}

.log-in {
  text-align: center;
}

.log-in p {
  margin: 0;
  margin-top: 10px;
}

.log-in a {
  color: var(--color-green);
}

.log-in a:hover {
  color: var(--color-green);
  opacity: 0.75;
}

.profile-cards-list {
  display: flex !important;
  flex-direction: row !important;
  gap: 2rem !important;
  align-items: stretch !important;
  width: 100%;
}

.left-column {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.profile-preview-card {
  background-color: var(--color-white) !important;
  border-radius: 25px;
  display: flex;
  flex-direction: column;
  justify-content: start;
  padding: 15px;
  color: #2b3a4a;
  height: 100%;
}

.profile-header-visual {
  position: relative;
  width: 100%;
  margin-bottom: 35px;
}

.profile-banner-preview {
  aspect-ratio: 5 / 2;
  background-color: var(--color-dark-green);
  border-radius: 20px;
  overflow: hidden;
}

/* Style for when no banner is uploaded */
.banner-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6c757d;
  font-weight: 600;
  font-size: 0.9rem;
  background-color: #e2e8f0;
}

.banner-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar {
  background-color: var(--color-green);
  width: 80px;
  height: 80px;
  border-radius: 50%;
  font-size: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  left: 20px;
  bottom: -30px;
  overflow: hidden;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;

}

/* Style for the text initials inside the avatar box */
.avatar-initials {
  font-size: 1.5rem;
  font-weight: 800;
  color: #2b3a4a;
  text-transform: uppercase;
  margin-top: 10px;
}

.user-info p {
  margin: 0;
  margin-left: 15px;
}

.username {
  opacity: 70%;
  font-size: 0.85rem;
  margin-top: 2px !important;
}

.stats-row {
  display: flex;
  gap: 2rem;
  margin: 15px 15px 5px 15px;
}

.stat-number {
  font-size: 1.4rem;
  font-weight: 800;
  line-height: 1;
}

.stat-label {
  font-size: 0.6rem;
  color: #718096;
  font-weight: 700;
  letter-spacing: 0.5px;
}

/* Meta Data (Major & Year) */
.meta-row {
  display: flex;
  justify-content: space-between;
  padding: 0 15px;
  margin-bottom: 10px;
}

.meta-title {
  display: block;
  font-size: 0.65rem;
  color: #a0aec0;
}

.meta-val {
  display: block;
  font-size: 0.75rem;
  font-weight: 700;
}

/* Tags and Pills */
.tags-section {
  padding: 0 15px;
  margin-bottom: 8px;
}

.tags-label {
  font-size: 0.7rem;
  font-weight: 700;
  margin: 0 0 4px 0;
  color: #2b3a4a;
}

.pill-row {
  display: flex;
  gap: 6px;
}

.pill {
  height: 16px;
  border-radius: 10px;
}

.pill.orange {
  background-color: #ff8a65;
  width: 50px;
}

.pill.red {
  background-color: #e53935;
  width: 60px;
}

.pill.green {
  background-color: #c0ca33;
  width: 35px;
}

.pill.purple {
  background-color: #ba68c8;
  width: 55px;
}

.pill.blue {
  background-color: #3f51b5;
  width: 40px;
}

/* RIGHT COLUMN (Form Section) */
.right-section {
  flex: 1.2;
  display: flex;
  flex-direction: column;
  margin-right: 20px;
}

/* profile fields + button fill the column (account tab keeps them at 40%) */
.right-section form {
  align-items: stretch;
  flex: 1;               /* fills the column height so the footer can sit at the bottom */
}


.right-section input[type="text"] {
  width: 100%;
  max-width: none;
}

/* course selection styles */
.select-course {
  width: 100%;
}

.select-year {
  width: 100%;
}

/* Dropdown section */
.dropdown-section {
  margin: 10px 0;
  display: flex;
  flex-direction: row; 
  gap: 12px;
}


/* File Upload Containers */
.file-upload-container,
.input-group {
  display: flex;
  flex-direction: column;
}

.upload-row {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  flex-direction: row;          
}

.upload-row .file-upload-container {
  flex: 1 1 0;               
  min-width: 160px;          
}

.upload-label {
  font-size: 0.85rem;
  margin-bottom: 0.3rem;
  color: var(--color-white);
}

.img-description {
  font-size: 11px;
  margin-top: 5px;
  opacity: 0.6;
}

/* style for file uploads button */
.custom-file-upload {
  display: inline-block;
  background-color: var(--color-dark-red);
  color: var(--color-white);
  border-radius: 25px;
  padding: 8px 15px 4px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.8rem;
  width: fit-content;
  text-align: center;
}

.file-input {
  display: none;
  /* hide default button */
}


.interest-list {
  display: flex !important;
  flex-direction: column !important;
}

.folder-scroll-container {
  flex: 1 1 auto;          
  min-height: 0;
  overflow-y: auto;
  padding-right: 8px;
  margin: 16px 0;
}

.interest-footer {
  margin-top: auto;        
  display: flex;
  align-items: center;    
  gap: 16px;
  padding: 0 10px 10px 0;
}

.interest-footer .form-error {
  flex: 1;                 
  min-width: 0;
  text-align: left;
}

.interest-footer .auth-btn {
  width: auto;
  min-width: 150px;
  max-width: none;
  flex-shrink: 0;
  margin-left: auto;       
}

.interest-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 10px;
  width: 100%;
}

.interest-card {
  width: 100%;
  font-size: 0.85rem;
  border-radius: 15px;
}

.interest-card-img {
  object-fit: cover;
  border-radius: 15px 15px 0 0;
}

.interest-card input[type="checkbox"] {
  appearance: none;
  -webkit-appearance: none;
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  margin: 0;
  border: 2px solid var(--color-dark-purple);
  border-radius: 6px;
  background-color: var(--color-white);
  background-repeat: no-repeat;
  background-position: center;
  background-size: 12px;
  cursor: pointer;
  transition: background-color 0.15s ease, opacity 0.15s ease;
}

.interest-card input[type="checkbox"]:checked {
  background-color: var(--color-dark-purple);
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M2.5 6.5l2.5 2.5 4.5-5.5'/%3E%3C/svg%3E");
}

.interest-card input[type="checkbox"]:focus-visible {
  outline: 2px solid var(--color-dark-purple);
  outline-offset: 2px;
}

.interest-card input[type="checkbox"]:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}


/* Tablets and phones: one column that fills the screen */
@media (max-width: 767px) {
  .page-wrapper {
    align-items: flex-start;
    padding: 16px;
  }

  .page-wrapper>* {
    width: 100%;
    height: auto;          /* phones: let the content decide, no fixed folder height */
  }

  .section-title {
    font-size: 1.6rem;
  }

  form {
    margin: 16px auto;
  }

  input[type="text"],
  input[type="email"],
  input[type="password"],
  .auth-btn {
    width: 100%;
  } 

  .form-actions.folder-footer {
    position: static;
    width: 100%;
    margin-top: 12px;
  }

  .folder-footer .auth-btn {
    width: 100%;
  }

  .profile-cards-list {
    flex-direction: column !important;
    gap: 1rem !important;
  }

  .left-column,
  .right-section {
    width: 100%;
    flex: none;
  }

  .folder-scroll-container {
    max-height: none;
    padding-right: 0;
  }

  .interest-footer {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
    padding: 0;
  }

  .interest-footer .auth-btn {
    width: 100%;
    margin-left: 0;
  }

  .interest-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
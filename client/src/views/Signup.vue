<script setup>
    import 'bootstrap/dist/css/bootstrap.min.css'
    import 'bootstrap/dist/js/bootstrap.bundle.min.js'

    import { ref, computed } from 'vue'
    import { useRouter } from 'vue-router'
    import BaseButton from '../components/BaseButton.vue'
    import FolderTabs from '../components/FolderTabs.vue'
    import BaseInput from '../components/BaseInput.vue'
    import '../assets/theme.css'

    // CREATE ACCOUNT DATA
    const fullName = ref('');
    const email = ref('');
    const password = ref('');
    const confirmPassword = ref('');


    const categories = [
  { id: 'create-acc', label: 'ACCOUNT', theme: 'theme-green' },
  { id: 'edit-profile', label: 'PROFILE', theme: 'theme-orange' },
  { id: 'interests', label: 'INTERESTS', theme: 'theme-purple' }
  ]
    const schools = ['School of Business', 'School of Accountancy', 'School of Economics', 
    'School of Information Systems and Computer Science',
    'School of Law', 'College of Integrative Studies', 'School of Social Sciences']
  
    const years = ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5']
  
    const activeTab = ref('create-acc')
    const selectedSchool = ref('')
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

    const availableInterests = [
      { id: 'tech', label: 'Tech' },
      { id: 'arts', label: 'Arts' },
      { id: 'culture', label: 'Cultural Clubs' },
      { id: 'community-service', label: 'Community Service' },
      { id: 'sports-outdoors', label: 'Sports and Outdoors' },
      { id: 'career', label: 'Career' },
      { id: 'overseas', label: 'Overseas Activities' },
      { id: 'networking', label: 'Networking Event' },
      { id: 'workshops', label: 'Skills Upgrading Workshop' },
      { id: 'food', label: 'Food' },
      { id: 'wellness', label: 'Wellness' },
      { id: 'talks', label: 'Guest Lectures' }
    ]

    const selectedInterests = ref([])

    const toggleInterest = (id) => {
      if (selectedInterests.value.includes(id)) {
        selectedInterests.value = selectedInterests.value.filter(item => item !== id)
      } else {
        selectedInterests.value.push(id)
      }
    }

    const router = useRouter();
  
    const handleSubmit = async () => {
      try {
        // gather all form data from the three steps
        const completeUserData = {
          fullName: fullName.value,
          email: email.value,
          password: password.value,
          displayName: displayName.value,
          username: username.value,
          school: selectedSchool.value,
          year: selectedYear.value,
          interests: selectedInterests.value,
          profileImage: profileImage.value,
          bannerImage: bannerImage.value
        }
        // Submit your data to backend / API here
        console.log('Submitting selected interests:', selectedInterests.value)

        // Example API request:
        // await axios.post('/api/user/interests', { interests: selectedInterests.value })

        // 3. Navigate to home.vue upon success
        router.push('/home') 
        // Note: Use router.push({ name: 'Home' }) if you are using named routes
      } catch (error) {
        console.error('Submission failed:', error)
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
            <h1> CREATE AN ACCOUNT </h1>
            <form action="">
                <input type="text" v-model='fullName' placeholder="Full Name">
                <input type="email" v-model='email' placeholder="Email">
                <input type="password" v-model='password' placeholder="Password">
                <input type="password" v-model='confirmPassword' placeholder="Confirm Password"><br>
                
                <BaseButton type="submit" class="auth-btn" @click.prevent="activeTab = 'edit-profile'" >REGISTER</BaseButton>
                <span>Or</span>
                <BaseButton type="button" class="auth-btn"> <img src="/google-green-icon.png" style="width: 16px; height: 16px;">  CONTINUE WITH GOOGLE</BaseButton>
                <div class="log-in">
                  <p>Have an account? <router-link to="/login"> Log in</router-link></p>
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
            <span v-else class="avatar-intials">{{ ProfileInitials }}</span>
          </div>
        </div>

        <!-- User Info -->
        <div class="user-info mt-3">
          <p class="full-name header-style">{{ displayName || 'name'}}</p>
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
            <span class="meta-title">Faculty</span>
            <span class="meta-val">{{ selectedSchool || 'Your Faculty' }}</span>
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
      <h1>CREATE PROFILE</h1>
      <form action="">
        <input type="text" v-model="displayName" placeholder="Display Name">
        <input type="text" v-model="username" placeholder="Username">

        <BaseInput
            class="select-school"
            type="select"  
            v-model="selectedSchool" 
            :options="schools" 
            placeholder="Select your school"
        />

        <BaseInput
            class="select-year"
            type="select"  
            v-model="selectedYear" 
            :options="years" 
            placeholder="Select your Year of Study"
        />

        <div class="file-upload-container">
          <label class="upload-label">Upload Profile Picture</label>
          <label class="custom-file-upload">
            Choose File
            <input type="file" accept="image/*" @change="handleFileUpload" class="file-input" />
          </label>
        </div>

        <div class="file-upload-container">
          <label class="upload-label">Upload banner</label>
          <label class="custom-file-upload">
            Choose File
            <input type="file" accept="image/*" @change="handleBannerUpload" class="file-input" />
          </label>
        </div>

        <BaseButton type="submit" class="auth-btn" @click.prevent="activeTab = 'interests'">NEXT</BaseButton>
      </form>
    </div>
  </div>
</template>

    <template #interests>
      <div class="cards-list">
        <!-- interest event cards -->
        <h1 class="interest-title"> CHOOSE YOUR INTERESTS </h1>
        <div class="folder-scroll-container">
          <div class="interest-grid">
            <div 
            v-for="interest in availableInterests"
            :key="interest.id"
            class="card interest-card"
            >
            <img src="/test-img.jpeg" class="card-img-top interest-card-img" alt="...">
            <div class="card-body p-2">
              <p class="card-text mb-0">
                <label class="w-100 d-flex align-items-center gap-2 mb-0">
                  <input type="checkbox" :value="interest.id" v-model="selectedInterests">
                  <span> {{interest.label}} </span>
                </label>
              </p>
            </div>
          </div>
          <BaseButton type="submit" class="final-btn" @click="handleSubmit" >FINISH SIGN UP</BaseButton>
          </div>
        </div>
      </div>
    </template>
  </FolderTabs>
</div>

</template>

<style scoped>

/* Container for all the Folder Tabs */
.page-wrapper {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    padding: 20px;
}

/* Allow the wrapper to take up more space */
.page-wrapper > * {
    width: 90%;
    max-width: 900px; 
}

/* Force FolderTabs and its internal card lists to respect the new wider size */
:deep(.folder-tabs-container), 
:deep(.cards-list),
:deep(.tab-content) {
    width: 100% !important;
    max-width: 100% !important;
}

:deep(h1) {
    font-family: 'HeaderFont', sans-serif !important;
    color: var(--color-white);
    text-align: center;
    font-size: 2.2rem; /* Optional: make the header text larger to match */
}

form {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin: 40px auto;
    color: var(--color-white);
    gap: 16px;
    width: 100%;
}

input[type="text"],
input[type="email"],
input[type="password"] {
  border: none;
  border-bottom: 2px solid var(--color-white);
  background: transparent;
  outline: none;
  padding: 10px 0;
  color: var(--color-white);
  width: 70%; /* Adjust input line width inside the larger folder */
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
  width: 70%;
  max-width: 500px;
}

.log-in {
  margin-top: 16px;
  text-align: center;
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
    align-items: flex-start !important;
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
  justify-content: center;
  padding: 15px;
  color: #2b3a4a;
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
  padding: 0 !important;
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

.pill.orange { background-color: #ff8a65; width: 50px; }
.pill.red { background-color: #e53935; width: 60px; }
.pill.green { background-color: #c0ca33; width: 35px; }
.pill.purple { background-color: #ba68c8; width: 55px; }
.pill.blue { background-color: #3f51b5; width: 40px; }

/* RIGHT COLUMN (Form Section) */
.right-section {
  flex: 1.2;
  display: flex;
  flex-direction: column;
}

.right-section h1 {
  font-size: 1.6rem;
  font-weight: 900;
  margin-top: 0;
  margin-bottom: 1.2rem;
  letter-spacing: 0.5px;
}

.right-section form {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  margin: 0;
  width: 100%;
  align-items: stretch !important;
}

/* Text Inputs matching the underline style */
.right-section input[type="text"] {
  background: transparent;
  border: none;
  border-bottom: 2px solid var(--color-white);
  color: var(--color-white);
  padding: 0.4rem 0;
  font-size: 0.95rem;
  outline: none;
  width: 100%;
}

/* school selection styles */
.select-school {
  width: 100%;
}

.select-year {
  width: 100%;
}

.right-section input[type="text"]::placeholder {
  color: var(--color-white);
  opacity: 0.75;
}


/* File Upload Containers */
.file-upload-container, .input-group {
  display: flex;
  flex-direction: column;
}

.upload-label {
  font-size: 0.85rem;
  margin-bottom: 0.3rem;
  color: #ffffff;
}

/* style for file uploads button */
.custom-file-upload {
  display: inline-block;
  background-color: #801d18;
  color: #ffffff;
  padding: 0.5rem 1.8rem;
  border-radius: 20px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.8rem;
  width: fit-content;
  text-align: center;
}

.file-input {
  display: none; /* hide default button */
}


/* interests Folder tab */
.interest-title{
  margin-bottom: 20px;
}

.folder-scroll-container {
  max-height: 400px;
  overflow-y: auto;
  padding-right: 8px;

}

.interest-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 10px;
  width: 100%;
  margin-bottom: 20px;
}

.interest-card {
  width: 100%;
  font-size: 0.85rem;
}

.interest-card-img {
  /* height: 65px; */
  object-fit: cover;
}

/* final submit button */
.final-btn {
  width: 70%;
  max-width: 500px;
  display: flex;
  justify-content: center;
}

</style>
<script setup>
    import 'bootstrap/dist/css/bootstrap.min.css'
    import 'bootstrap/dist/js/bootstrap.bundle.min.js'

    import { ref } from 'vue'
    import BaseButton from '../components/BaseButton.vue'
    import FolderTabs from '../components/FolderTabs.vue'
    import '../assets/theme.css'

    const categories = [
  { id: 'create-acc', label: 'CREATE ACCOUNT', theme: 'theme-green' },
  { id: 'edit-profile', label: 'CREATE PROFILE', theme: 'theme-orange' },
  { id: 'interests', label: 'CHOOSE INTERESTS', theme: 'theme-purple' }
  ]
    const schools = ['School of Business', 'School of Accountancy', 'School of Economics', 
    'School of Information Systems and Computer Science',
    'School of Law', 'College of Integrative Studies', 'School of Social Sciences']
  
  const activeTab = ref('create-acc')

  const availableInterests = [
  { id: 'tech', label: 'Tech' },
  { id: 'arts-culture', label: 'Arts and Culture' },
  { id: 'outdoor-activity', label: 'Outdoor Activity' },
  { id: 'community-service', label: 'Community Service' },
  { id: 'sports', label: 'Sports' }
]

// Tracks the IDs of selected cards
const selectedInterests = ref([])

const toggleInterest = (id) => {
  if (selectedInterests.value.includes(id)) {
    // Remove if already selected
    selectedInterests.value = selectedInterests.value.filter(item => item !== id)
  } else {
    // Add if not selected
    selectedInterests.value.push(id)
  }
}

const profileImage = ref(null)
const imagePreview = ref(null)

const handleFileUpload = (event) => {
  const file = event.target.files[0]
  if (file) {
    profileImage.value = file
    // Creates a temporary URL to preview the image immediately
    imagePreview.value = URL.createObjectURL(file)
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
                <input type="text" placeholder="Full Name">
                <input type="email" placeholder="Email">
                <input type="password" placeholder="Password">
                <input type="password" placeholder="Confirm Password"><br>
                
                <BaseButton type="submit" class="auth-btn" @click.prevent="activeTab = 'edit-profile'" >REGISTER</BaseButton>
                <span class="or-text">Or</span>
                <BaseButton type="button" class="auth-btn"> <img src="/google-green-icon.png" style="width: 16px; height: 16px;">  CONTINUE WITH GOOGLE</BaseButton>
                <div class="log-in">
                  <p>Have an account? <router-link to="/login"> Log in</router-link></p>
                </div>
            </form>
         </div>
      </div>
    </template>

    <template #edit-profile>
      <div class="cards-list">
        <!-- profile cards -->
         <h1>CREATE PROFILE</h1>
         <form action="">
                <input type="text" placeholder="Display Name">
                <input type="text" placeholder="Username">
                <select name="Select Course" id="" >
                    <option disabled selected hidden>Select your school</option>
                    <option v-for="school in schools">{{ school }}</option>
                </select>
                <!-- Image Upload Input -->
                <div class="file-upload-container">
                  <label class="upload-label">Upload Profile Picture</label>
                    <input 
                      type="file" 
                      accept="image/*" 
                      @change="handleFileUpload"
                      class="file-input"
                    >
                </div>
                <!-- Optional: Show a preview if an image was selected -->
                <div v-if="imagePreview" class="mt-3">
                  <img :src="imagePreview" alt="Preview" class="rounded-circle" style="width: 80px; height: 80px; object-fit: cover;" />
                </div>
                <BaseButton type="submit" class="next-btn"@click.prevent="activeTab = 'interests'">NEXT</BaseButton>
            </form>
      </div>
    </template>

    <template #interests>
      <div class="cards-list">
        <!-- interest event cards -->
        <h1> CHOOSE YOUR INTERESTS </h1>
      <div class="interest-grid">
        <div 
      v-for="interest in availableInterests"
      :key="interest.id"
      class="card mb-3" 
      style="width: 18rem;">
        <img src="/test-img.jpeg" class="card-img-top" alt="...">
        <div class="card-body">
          <p class="card-text">
            <label class="w-100">
              <input type="checkbox" :value="interest.id" v-model="selectedInterests">
              {{interest.label}}
            </label>
            
          </p>
        </div>
      </div>
      </div>
      </div>
    </template>
  </FolderTabs>
</div>

</template>

<style scoped>
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
    max-width: 900px; /* Make this as wide as you want the folder to be */
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
.interest-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 50px;
  width: 100%;
}

</style>
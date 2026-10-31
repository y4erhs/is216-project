<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'

import BaseButton from '../components/BaseButton.vue'
import FolderTabs from '../components/FolderTabs.vue'
import BaseInput from '../components/BaseInput.vue'
 import '../assets/theme.css'

const route = useRoute()
const router = useRouter()

const password = ref('')
const errorMsg = ref('')
const successMsg = ref('')
const isSubmitted = ref(false)

const categories = [{ id: 'reset-password', label: 'RESET', theme: 'theme-orange' },]

const handleResetPassword = async () => {
  try {
    errorMsg.value = ''
    successMsg.value = ''
    isSubmitted.value = true

    // Grab the token from the URL parameters (/reset-password/:token)
    const token = route.params.token

    const response = await axios.post(`http://localhost:8000/api/users/reset-password/${token}`, {
      password: password.value
    })

    successMsg.value = response.data.message
    
    // Redirect back to login after 2 seconds
    setTimeout(() => {
      router.push('/')
    }, 2000)

  } catch (error) {
    errorMsg.value = error.response?.data?.message || 'Failed to reset password.'
    isSubmitted.value = false
  }
}
</script>

<template>
    <div class="page-wrapper">
    <FolderTabs :tabs="categories" v-model="activeTab">
    <template #reset-password>
      <div class="cards-list">
        <!-- reset password event cards -->
         <div>
            <h1> RESET PASSWORD </h1>
            <form @submit.prevent="handleResetPassword">
                <div>
                <input type="password" v-model='password' placeholder="Enter new Password">
                </div>
                <p v-if="errorMsg" class="text-danger small">{{ errorMsg }}</p>
                <p v-if="successMsg" class="text-success small">{{ successMsg }}</p>

                <BaseButton type="submit" class="auth-btn" :disabled="isSubmitted">{{ isSubmitted ? 'Resetting...' : 'Update Password' }}</BaseButton>
            </form>
            <div class="log-in">
                <router-link to="/login" class="text-decoration-none">Back to Login</router-link>
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

</style>
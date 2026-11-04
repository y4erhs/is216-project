<script setup>
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'

import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '../stores/userStore'

import axios from 'axios'
import BaseButton from '../components/BaseButton.vue'
import FolderTabs from '../components/FolderTabs.vue'
import '../assets/theme.css'
import { API_URL } from '../utils/api'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()


onMounted(() => {
  document.documentElement.style.overflow = 'hidden'
  document.body.style.overflow = 'hidden'
  document.body.style.height = '100%'
  finishGoogleLogin()
})

onUnmounted(() => {
  document.documentElement.style.overflow = ''
  document.body.style.overflow = ''
  document.body.style.height = ''
})

const activeTab = ref('login')


const categories = [
  { id: 'login', label: 'LOGIN', theme: 'theme-blue' },
  { id: 'reset', label: 'PASSWORD RESET', theme: 'theme-purple' }
]

const username = ref('')
const password = ref('')
const errorMsg = ref('')

const GOOGLE_ERRORS = {
  not_smu: 'Please use your SMU Google account (@smu.edu.sg).',
  cancelled: 'Google sign-in was cancelled.',
  failed: 'Google sign-in failed. Please try again.'
}

function continueWithGoogle() {
  // Remember where they were going, since the trip to Google leaves this page
  if (route.query.redirect) sessionStorage.setItem('loginRedirect', route.query.redirect)
  window.location.href = `${API_URL}/auth/google/signin`
}

// Back from Google: log in with the one-time code, or show what went wrong
async function finishGoogleLogin() {
  if (route.query.googleError) {
    errorMsg.value = GOOGLE_ERRORS[route.query.googleError] || GOOGLE_ERRORS.failed
    router.replace('/login')
    return
  }
  if (!route.query.googleCode) return

  try {
    await userStore.loginWithGoogle(route.query.googleCode)
    const redirect = sessionStorage.getItem('loginRedirect')
    sessionStorage.removeItem('loginRedirect')
    router.replace(redirect || '/')
  } catch (error) {
    errorMsg.value = error.response?.data?.message || GOOGLE_ERRORS.failed
    router.replace('/login')
  }
}

const handleLogin = async () => {
  try {
    await userStore.login({
      username: username.value,
      password: password.value
    })
    console.log("Login successful!")
    router.push(route.query.redirect || '/')
  } catch (error) {
    console.error('Login failed:', error)

    errorMsg.value = userStore.error
  }
}

const resetEmail = ref('')
const isSent = ref(false)
const resetMessage = ref('')
const resetError = ref('')

const handleSendReset = async () => {
  try {
    resetError.value = ''
    resetMessage.value = ''

    const response = await axios.post(`${API_URL}/api/users/forgot-password`, {
      email: resetEmail.value
    })

    isSent.value = true
    resetMessage.value = response.data.message
  } catch (error) {
    resetError.value = error.response?.data?.message || 'Failed to send reset link.'
  }
}
</script>

<template>
  <div class="page-wrapper">
    <div class="main-page-art">
      <img src="/main-page-art.svg" alt="">
    </div>
    
    <div class="rotated-folder">
      <FolderTabs
        :tabs="categories"
        v-model="activeTab"
      >
        <template #login>
          <div class="log-in">
            <form @submit.prevent="handleLogin">
              <div class="cc-logo">
                <img src="/main-logo.svg" alt="">
              </div>
              <h1>WELCOME BACK!</h1>
                <input
                  id="username"
                  type="text"
                  placeholder="Username"
                  v-model="username"
                />
                <input
                  id="password"
                  type="password"
                  placeholder="Password"
                  v-model="password"
                  @keyup.enter="handleLogin"
                />

                <p v-if="errorMsg" style="color: #e63c25;">{{ errorMsg }}</p>

                <div class="pwd-reset">
                  <p> Forgor password? Loser.</p>
                  jk, <a class="click-here" href="#" @click.prevent="activeTab = 'reset'">click here</a>
                </div>
                
              <BaseButton type="button" class=" w-100 login-btn" @click="handleLogin">
                LOG IN
              </BaseButton>
              <span class="or-text">Or</span>
              <BaseButton type="button" class="w-100 login-btn" @click="continueWithGoogle"> <img src="/google-icon.png" style="width: 16px; height: 16px;">  CONTINUE WITH GOOGLE</BaseButton>
              <div class="sign-up">
                <p>Don't have an account? <router-link to="/signup"> Sign up</router-link></p>
              </div>
            </form>
          </div>
        </template>

        <template #reset>
          <div class="log-in">
            <form @submit.prevent="handleSendReset">
              <div class="cc-logo">
                <img src="/main-logo.svg" alt="">
              </div>
              <h1>PASSWORD RESET</h1>

              <input
                id="email"
                type="email"
                placeholder="Enter Email"
                v-model="resetEmail"
                required
                @keyup.enter="handleSendReset"
              />

              <!-- Feedback messages -->
              <p v-if="resetError" style="color: #fc5d5d; font-size: 13px; margin-top: 5px;">{{ resetError }}</p>
              <p v-if="resetMessage" style="color: #51cf66; font-size: 13px; margin-top: 5px;">{{ resetMessage }}</p>

              <BaseButton type="submit" class="w-100 pwd-link-btn">
                {{ isSent ? 'RESEND LINK' : 'SEND PASSWORD RESET LINK' }}
              </BaseButton>
              <a class="go-back" href="#" @click.prevent="activeTab = 'login'">Back to Login</a>
            </form>
          </div>
        </template>
      </FolderTabs>
    </div>
  </div>
</template>

<style scoped>
.page-wrapper {
  --edge-gap: 10px;    
  position: fixed;
  inset: 0;
  height: 100vh;
  height: 100dvh;
  background-color: var(--color-white);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  overflow: hidden;
  z-index: 999;
  box-sizing: border-box;
}
.main-page-art {
  transform: translateX(135px);
}

.rotated-folder {
  transform: translate(calc(-1 * var(--edge-gap)), -50%) rotate(-90deg) translateX(50%);
  transform-origin: 100% 100%;
  display: flex;
  align-items: center;
  justify-content: center;

}
.cc-logo {
  display: flex;
  justify-content: center;
  color: var(--color-orange);
  
}
.log-in {
  font-size: 13px;          
  transform-origin: center center;
  color: var(--color-white);
  padding: 36px 24px; 
  width: 90vh;
  height: 420px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
}

h1 {
  font-family: 'HeaderFont', sans-serif !important;
  font-size: 28px;
  margin: 0 0 16px 0;
  text-align: center;
}

form {
  display: flex;
  flex-direction: column;
  gap: 1px;
  
  width: 280px; 
  max-width: 100%;

  transform: rotate(90deg);
  transform-origin: center center;
  box-sizing: border-box;
  
}

input {
  border: none;
  border-bottom: 2px solid var(--color-white);
  background: transparent;
  outline: none;
  padding: 6px 0;
  color: var(--color-white);
  width: 100%;
  font-size: 13px;
  font-weight: 600;
  box-sizing: border-box;
  transition: border-color 0.2s ease;

  caret-color: var(--color-white);
}

input:-webkit-autofill,
input:-webkit-autofill:hover, 
input:-webkit-autofill:focus, 
input:-webkit-autofill:active {
  -webkit-box-shadow: 0 0 0 30px transparent inset !important;
  -webkit-text-fill-color: var(--color-white) !important;
  transition: background-color 5000s ease-in-out 0s;
}

input::placeholder {
    color: var(--color-white);
    opacity: 0.8;
}


input:focus {
  border-bottom-color: var(--color-white);
}

.pwd-link-btn {
  margin-top: 8px;
  color: var(--color-white);
}

.log-in .login-btn,
.log-in .pwd-link-btn {
  font-size: 13px;
}
.pwd-reset {
  text-align: right;
  font-size: 13px;
  padding-top: 10px;
  color: #7d89f4;
}

.pwd-reset p {
  margin: 0;
}

.login-btn {
  margin-top: 8px;
}
.or-text {
  margin-top: 8px;
  text-align: center;
  
}

.click-here {
  color: var(--color-white);
}

.click-here:hover {
  color: var(--color-white);
  opacity: 0.75;
}

.sign-up {
  margin-top: 16px;
  text-align: center;
}

.sign-up a {
  color: var(--color-white);
}

.sign-up a:hover {
  color: var(--color-white);
  opacity: 0.75;

}

.sign-up p {
  margin-top: 16px;
  text-align: center;
  color: #7d89f4;
  font-weight: bold;
}


.go-back {
  color: var(--color-white);
  margin-top: 16px;
  text-align: center;
}

.go-back:hover {
  color: var(--color-white);
  opacity: 0.75;
}

@media (max-width: 991px) {
  .page-wrapper {
    justify-content: center;
    align-items: flex-start;
    padding: 16px;
    overflow-y: auto;
  }

  .main-page-art {
    display: none;
  }

  .rotated-folder {
    transform: none;
    width: 100%;
    max-width: 480px;
    margin: 0 auto;
  }

  .log-in {
    width: 100%;
    height: auto;
    padding: 24px 16px;
  }

  form {
    width: 100%;
    transform: none;
  }
}
</style>
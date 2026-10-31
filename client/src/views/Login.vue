<script setup>
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'

import { ref, onMounted, onUnmounted } from 'vue'
import BaseButton from '../components/BaseButton.vue'
import FolderTabs from '../components/FolderTabs.vue'
import '../assets/theme.css'

onMounted(() => {
  document.documentElement.style.overflow = 'hidden'
  document.body.style.overflow = 'hidden'
  document.body.style.height = '100%'
})

onUnmounted(() => {
  document.documentElement.style.overflow = ''
  document.body.style.overflow = ''
  document.body.style.height = ''
})

const activeTab = ref('login')

const categories = [
  { id: 'login', label: 'LOGIN', theme: 'theme-blue' },
  { id: 'reset', label: 'PASSWORD RESET', theme: 'theme-orange' }
]


// for password reset link:
const isSent = ref(false);

const handleSendReset = () => {
  isSent.value = true;
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
            <form @submit.prevent>
              <div class="cc-logo">
                <img src="/main-logo.svg" alt="">
              </div>
              <h1>WELCOME BACK!</h1>
                <input
                  id="username"
                  type="text"
                  placeholder="Username"
                />
                <input
                  id="password"
                  type="password"
                  placeholder="Password"
                />
                <div class="pwd-reset">
                  <p> Forgor password? Loser.</p>
                  jk, <a class="click-here" href="#" @click.prevent="activeTab = 'reset'">click here</a>
                </div>
                
              <BaseButton type="button" class=" w-100 login-btn" <router-link to="/signup"> >
                LOG IN
              </BaseButton>
              <span class="or-text">Or</span>
              <BaseButton type="button" class="w-100 login-btn"> <img src="/google-icon.png" style="width: 16px; height: 16px;">  CONTINUE WITH GOOGLE</BaseButton>
              <div class="sign-up">
                <p>Don't have an account? <router-link to="/signup"> Sign up</router-link></p>
              </div>
            </form>
          </div>
        </template>

        <template #reset>
          <div class="log-in">
            <form @submit.prevent>
              <div class="cc-logo">
                <img src="/main-logo.svg" alt="">
              </div>
              <h1>PASSWORD RESET</h1>
                <input
                  id="email"
                  type="email"
                  placeholder="Enter Email"
                />
                
              <BaseButton type="button" class=" w-100 pwd-link-btn" @click = "handleSendReset">
                {{ isSent ? 'RESEND LINK' : 'SEND PASSWORD RESET LINK' }}
              </BaseButton>
              <a class="go-back" href="#" @click.prevent="activeTab = 'login'"> Back to Login</a>
            </form>
          </div>
        </template>
      </FolderTabs>
    </div>
  </div>
</template>

<style scoped>
.page-wrapper {
  position: fixed;
  inset: 0;
  width: 100vw;
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
  transform: translateX(140px) rotate(-90deg);
  transform-origin: center center;
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
  letter-spacing: 0.5px;
  text-align: center;
}

/* 
  Since 'form' is rotated 90deg inside a -90deg folder:
  - Form's 'width' dictates its visually rendered 'height'.
  - Form's 'height' (or max-width) dictates its visually rendered 'width'.
*/
form {
  display: flex;
  flex-direction: column;
  gap: 1px;
  
  /* Set explicit width to fit inside the folder tab height limit */
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
  font-size: 15px;
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

.pwd-link-btn {
  margin-top: 8px;
  color: var(--color-white);
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

/* .log-in a {
  color: var(--color-green);
}
.log-in a:hover {
  color: var(--color-green);
  opacity: 0.75;
} */
</style>
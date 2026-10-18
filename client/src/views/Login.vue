<script setup>
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'

import { onMounted, onUnmounted } from 'vue'
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

const categories = [
  { id: 'cultural', label: 'CULTURAL CLUBS', theme: 'theme-blue' },
  { id: 'workshops', label: 'WORKSHOPS', theme: 'theme-orange' },
  { id: 'career', label: 'CAREER', theme: 'theme-purple' }
]
</script>

<template>
  <div class="page-wrapper">
    <div class="rotated-folder">
      <FolderTabs
        :tabs="categories"
        defaultActive="cultural"
      >
        <template #cultural>
          <div class="sign-in">
            <h1>Sign In</h1>

            <form @submit.prevent>
              <div class="input-group-custom">
                <label for="username">Username</label>
                <input
                  id="username"
                  type="text"
                />
              </div>

              <div class="input-group-custom">
                <label for="password">Password</label>
                <input
                  id="password"
                  type="password"
                />
              </div>

              <BaseButton class="w-100 signin-btn" variant="primary">
                SIGN IN
              </BaseButton>
            </form>
          </div>
        </template>

        <template #workshops>
          <div></div>
        </template>

        <template #career>
          <div></div>
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

.rotated-folder {
  transform: translateX(165px) rotate(-90deg);
  transform-origin: center center;
  display: flex;
  align-items: center;
  justify-content: center;
}


.sign-in {
  transform:  rotate(90deg);
  transform-origin: center center;
  background-color: var(--color-blue);
  color: var(--color-white);
  padding: 36px px;
  border-radius: 20px;
  width: 90vh;
  min-height: 380px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

h1 {
  font-family: 'TextFont', cursive, sans-serif;
  font-size: 32px;
  font-weight: bold;
  margin: 0 0 24px 0;
  letter-spacing: 0.5px;
}

form {
  display: flex;
  flex-direction: column;
  gap: 18px;
  width: 100%;
}

.input-group-custom {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
b
.input-group-custom label {
  font-family: 'TextFont', sans-serif;
  font-size: 13px;
  color: var(--color-white);
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

input:focus {
  border-bottom-color: var(--color-white);
}

.signin-btn {
  margin-top: 8px;
}
</style>
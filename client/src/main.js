// src/main.js
import { createApp } from 'vue'
import App from '@/App.vue'

// Router (if you have a router folder)
import router from './router'

// Pinia store (if you have a stores folder)
import { createPinia } from 'pinia'

// 
import BaseButton from '@/components/BaseButton.vue'
import BaseInput from '@/components/BaseInput.vue'

// Optional: global styles
import './assets/main.css'
import './assets/theme.css'

const app = createApp(App)

app.component('BaseButton', BaseButton)
app.component('BaseInput', BaseInput)

app.use(router)
app.use(createPinia())

app.mount('#app')

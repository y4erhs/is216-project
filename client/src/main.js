// src/main.js
import { createApp } from 'vue'
import App from '@/App.vue'

// Router (if you have a router folder)
import router from './router'

// Pinia store (if you have a stores folder)
import { createPinia } from 'pinia'

// Optional: global styles
import './assets/main.css'

const app = createApp(App)

app.use(router)
app.use(createPinia())

app.mount('#app')

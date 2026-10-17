import { createRouter, createWebHistory } from 'vue-router'

import Home from '@/views/Home.vue'
import Login from '@/views/Login.vue'
import Signup from '@/views/Signup.vue'
import Profile from '@/views/Profile.vue'
import Events from '@/views/Events.vue'
import Calendar from '@/views/Calendar.vue'
import Lobby from '@/views/Lobby.vue'

const routes = [
  { path: '/', 
    name: 'Home', 
    component: Home },

  { path: '/login', 
    name: 'Login', 
    component: Login,
    meta: {hideLayout: true } },

  { path: '/signup', 
    name: 'Signup', 
    component: Signup,
    meta: {hideLayout: true }},

  { path: '/profile', 
    name: 'Profile', 
    component: Profile },

  { path: '/events', 
    name: 'Events', 
    component: Events },

  { path: '/calendar', 
    name: 'Calendar', 
    component: Calendar },

  { path: '/lobby', 
    name: 'Lobby', 
    component: Lobby },
]

const router = createRouter({
  history: createWebHistory(), 
  routes,
})

export default router
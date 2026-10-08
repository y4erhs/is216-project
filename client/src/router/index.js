import { createRouter, createWebHistory } from 'vue-router'

import Home from '@/views/Home.vue'
import Login from '@/views/Login.vue'
import Signup from '@/views/Signup.vue'
import Profile from '@/views/Profile.vue'
import Events from '@/views/Events.vue'
import Calendar from '@/views/Calendar.vue'
import Groups from '@/views/Groups.vue'

const routes = [
  { path: '/', name: 'Home', component: Home },
  { path: '/login', name: 'Login', component: Login },
  { path: '/signup', name: 'Signup', component: Signup },
  { path: '/profile', name: 'Profile', component: Profile },
  { path: '/events', name: 'Events', component: Events },
  { path: '/calendar', name: 'Calendar', component: Calendar },
  { path: '/groups', name: 'Groups', component: Groups },
]

const router = createRouter({
  history: createWebHistory(), 
  routes,
})

export default router
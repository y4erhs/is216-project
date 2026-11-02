import { createRouter, createWebHistory } from "vue-router";

import Home from "@/views/Home.vue";
import Login from "@/views/Login.vue";
import Signup from "@/views/Signup.vue";
import Profile from "@/views/Profile.vue";
import Calendar from "@/views/Calendar.vue";
import LobbyHub from "@/views/Lobbyhub.vue";
import tracking from "@/views/ActivityTracking.vue";
import ResetPassword from "@/views/ResetPassword.vue"
import { useAuth } from "@/composables/useAuth";

const routes = [
  { path: "/", name: "Home", component: Home },

  {
    path: "/login",
    name: "Login",
    component: Login,
    meta: { hideLayout: true, public: true },
  },

  {
    path: "/signup",
    name: "Signup",
    component: Signup,
    meta: { hideLayout: true, public: true },
  },

  { path: "/profile", name: "Profile", component: Profile },

  { path: "/calendar", name: "Calendar", component: Calendar },

  { path: '/lobby/:lobbyId?', component: () => import('../views/Lobbyhub.vue') },
  { path: '/friends', component: () => import('../views/Friends.vue') },
  { path: '/search', name: 'Search', component: () => import('../components/EventSearch.vue') },

  { path: "/activity-tracking", name: "Activty Tracking", component: tracking },

  {
    path: '/reset-password/:token',
    name: 'ResetPassword',
    component: ResetPassword,
    meta: { hideLayout: true, public: true }
  }

];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Logged-out users can only see the public pages; remember where they were going
router.beforeEach((to) => {
  const { isLoggedIn } = useAuth();

  if (!to.meta.public && !isLoggedIn.value) {
    return { path: "/login", query: { redirect: to.fullPath } };
  }
  if (isLoggedIn.value && (to.path === "/login" || to.path === "/signup")) {
    return { path: "/" };
  }
});

export default router;

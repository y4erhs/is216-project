import { createRouter, createWebHistory } from "vue-router";

import Home from "@/views/Home.vue";
import Login from "@/views/Login.vue";
import Signup from "@/views/Signup.vue";
import Profile from "@/views/Profile.vue";
import Calendar from "@/views/Calendar.vue";
import LobbyHub from "@/views/LobbyHub.vue";
import tracking from "@/views/ActivityTracking.vue";

const routes = [
  { path: "/", name: "Home", component: Home },

  {
    path: "/login",
    name: "Login",
    component: Login,
    meta: { hideLayout: true },
  },

  {
    path: "/signup",
    name: "Signup",
    component: Signup,
    meta: { hideLayout: true },
  },

  { path: "/profile", name: "Profile", component: Profile },

  { path: "/calendar", name: "Calendar", component: Calendar },

  { path: "/lobby", name: "Lobby", component: LobbyHub },

  { path: "/activity-tracking", name: "Activty Tracking", component: tracking },

  {
    path: "/sandbox",
    name: "testing",
    component: () => import("../views/sandbox.vue"),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;

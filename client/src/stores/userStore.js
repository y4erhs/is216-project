import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import axios from 'axios';

const STORAGE_KEY = 'user';

export const useUserStore = defineStore('user', () => {
  // State
  const currentUser = ref(JSON.parse(localStorage.getItem(STORAGE_KEY)) || null);
  const loading = ref(false);
  const error = ref(null);

  // Computed
  const isLoggedIn = computed(() => !!currentUser.value);

  // Actions
  async function login(credentials) {
    loading.value = true;
    error.value = null;
    console.log("1. LOGIN FUNCTION WAS CLICKED AND STARTED");

    try {
      // Support both passing an object {username, password} or separate arguments
      const userInput = typeof credentials === 'object' ? credentials : { username: credentials.username, password: credentials.password };
      
      const response = await axios.post('http://localhost:8000/api/users/login', userInput);
      console.log("2. SERVER REPLIED SUCCESSFULLY");

      const data = response.data;

      // Extract user info safely
      currentUser.value = { 
        username: data.username || data.user?.username || userInput.username,
        fullName: data.fullName || data.user?.fullName,
        displayName: data.displayName || data.user?.displayName,
        email: data.email || data.user?.email,
        avatar: data.avatar || data.user?.avatar,
        banner: data.banner || data.user?.banner,
        school: data.school || data.user?.school,
        year: data.year || data.user?.year,
        interests: data.interests || data.user?.interests
      };

      // Save to local storage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentUser.value));
      console.log("3. SAVED TO LOCAL STORAGE");

      return data;
    } catch (e) {
      error.value = e.response?.data?.message || e.message || 'Login failed';
      console.error("4. LOGIN FAILED BECAUSE:", e);
      throw error.response?.data || e.message;
    } finally {
      loading.value = false;
    }
  }

  async function register(formData) {
    loading.value = true;
    error.value = null;
    try {
      const response = await axios.post('http://localhost:8000/api/users/register', formData);
      currentUser.value = { username: response.data.username || formData.get?.('username') };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentUser.value));
      return response.data;
    } catch (err) {
      error.value = err.response?.data?.message || err.message || 'Registration failed';
      throw err.response?.data || err.message;
    } finally {
      loading.value = false;
    }
  }

  function logout() {
    currentUser.value = null;
    localStorage.removeItem(STORAGE_KEY);
  }

  function clearError() {
    error.value = null;
  }

  return { 
    currentUser, 
    user: currentUser, // Alias so components looking for 'user' or 'currentUser' both work
    loading, 
    error, 
    isLoggedIn, 
    login, 
    register,
    logout, 
    clearError 
  };
});
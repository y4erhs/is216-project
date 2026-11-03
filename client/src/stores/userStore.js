import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import axios from 'axios';
import { useAuth } from '../composables/useAuth';
import { API_URL } from '../utils/api';

const STORAGE_KEY = 'user';

export const useUserStore = defineStore('user', () => {
  // State
  const currentUser = ref(JSON.parse(localStorage.getItem(STORAGE_KEY)) || null);
  const loading = ref(false);
  const error = ref(null);

  // Computed
  const isLoggedIn = computed(() => !!currentUser.value);

  // Actions
  function setUser(user) {
    currentUser.value = user;
    useAuth().setSession(user);
  }

  async function login(credentials) {
    loading.value = true;
    error.value = null;
    console.log("1. LOGIN FUNCTION WAS CLICKED AND STARTED");

    try {
      // Support both passing an object {username, password} or separate arguments
      const userInput = typeof credentials === 'object' ? credentials : { username: credentials.username, password: credentials.password };
      
      const response = await axios.post(`${API_URL}/api/users/login`, userInput);
      console.log("2. SERVER REPLIED SUCCESSFULLY");

      const data = response.data;

      // Saves to local storage and tells every page who is logged in
      setUser(data.user || data);
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

  // Finishes "Continue with Google" for an existing user
  async function loginWithGoogle(code) {
    const response = await axios.post(`${API_URL}/auth/google/signin/exchange`, { code });
    setUser(response.data.user);
    return response.data;
  }

  async function register(formData) {
    loading.value = true;
    error.value = null;
    try {
      const response = await axios.post(`${API_URL}/api/users/register`, formData);
      setUser(response.data);   // a new user is logged in straight away
      return response.data;
    } catch (err) {
      error.value = err.response?.data?.message || err.message || 'Registration failed';
      throw err.response?.data || err.message;
    } finally {
      loading.value = false;
    }
  }

  async function checkUsername(username) {
    try {
      const response = await axios.get(`${API_URL}/api/users/check-username/${username}`);
      
      console.log("SERVER CHECK-USERNAME RESPONSE:", response.data);
      return response.data.exists; 
    } catch (err) {
      console.error('Failed to check username:', err);
      throw err.response?.data || err.message;
    }
  }

  async function checkEmail(email) {
    try {
      const response = await axios.get(`${API_URL}/api/users/check-email/${email}`);
      
      console.log("SERVER CHECK-EMAIL RESPONSE:", response.data);
      return response.data.exists; 
    } catch (err) {
      console.error('Failed to check email:', err);
      throw err.response?.data || err.message;
    }
  }

  function logout() {
    currentUser.value = null;
    localStorage.removeItem(STORAGE_KEY);
    useAuth().logout();
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
    loginWithGoogle,
    register,
    checkUsername,
    checkEmail,
    logout, 
    clearError 
  };

  
});
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
  function setUser(user, token) {
    currentUser.value = user;
    useAuth().setSession(user, token);
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
      setUser(data.user || data, data.token);
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
    setUser(response.data.user, response.data.token);
    return response.data;
  }

  async function register(formData) {
    loading.value = true;
    error.value = null;
    try {
      const response = await axios.post(`${API_URL}/api/users/register`, formData);
      const { token, ...user } = response.data;
      setUser(user, token);   // a new user is logged in straight away
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

  // updating pfp and banner
  async function updateProfileImages(userId, formData) {
  try {
    loading.value = true;
    const response = await axios.put(`${API_URL}/api/users/${userId}/images`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    // Update with new image URLs returned from server
    if (currentUser.value) {
      currentUser.value = response.data.user || response.data;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentUser.value));
    }

    return response.data;
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to update images';
    throw err;
  } finally {
    loading.value = false;
  }
}

async function deleteUser(userId) {
  try {
    loading.value = true;
    
    // Call your backend delete route
    await axios.delete(`${API_URL}/api/users/${userId}`);

    // Clear local storage / authentication state
    currentUser.value = null;
    localStorage.removeItem(STORAGE_KEY); // Removes 'user'
    
    
    useAuth().logout();

    return true;
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to delete account';
    throw err;
  } finally {
    loading.value = false;
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
    deleteUser,
    updateProfileImages,
    logout,
    clearError 
  };

  
});
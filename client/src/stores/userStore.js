import { defineStore } from 'pinia';
import axios from 'axios';

export const useUserStore = defineStore('user', {
  state: () => ({
    currentUser: null,
  }),
  actions: {
    async register(formData) {
      try {
        // Axios automatically handles multipart/form-data headers when passed a FormData object
        const response = await axios.post('http://localhost:8000/api/users/register', formData);
        
        // Save user data or token to store state if needed
        this.currentUser = response.data.userId;
        return response.data;
      } catch (error) {
        throw error.response?.data || error.message;
      }
    },

    async login(credentials) {
      try {
        const response = await axios.post('http://localhost:8000/api/users/login', credentials);
        this.currentUser = response.data.user;
        localStorage.setItem('token', response.data.token);
        return response.data;
      } catch (error) {
        throw error.response?.data || error.message;
      }
    }
  }
});
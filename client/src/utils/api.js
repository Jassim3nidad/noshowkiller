// src/utils/api.js
// Central Axios instance — all API calls go through this.
// Base URL is set from the environment variable so it works
// in both development (localhost:5000) and production (Render URL).

import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000, // 10 second timeout
});

// Request interceptor — useful for adding auth tokens later
api.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

// Response interceptor — normalize error messages
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.response?.data?.errors?.[0]?.message ||
      'Something went wrong. Please try again.';
    return Promise.reject(new Error(message));
  }
);

export default api;

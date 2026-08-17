import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { useToast } from '../components/Common/Toast';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const { showToast } = useToast();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch profile on initial load if token exists in localStorage
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        setToken(storedToken);
        try {
          const res = await api.get('/auth/profile');
          setUser(res.data.data);
        } catch (error) {
          console.error('Initial profile fetch failed:', error);
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  /**
   * Logs in a user.
   */
  const login = async (email, password, rememberMe = false) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      const { user: userData, token: accessToken } = res.data.data;
      
      setUser(userData);
      setToken(accessToken);
      
      // Always store token in localStorage so API interceptors and page refreshes work smoothly
      localStorage.setItem('token', accessToken);

      showToast(res.data.message || 'Logged in successfully!', 'success');
      return { success: true };
    } catch (error) {
      const msg = error.response?.data?.message || 'Login failed. Please check credentials.';
      showToast(msg, 'error');
      return { success: false, error: msg };
    }
  };

  /**
   * Authenticates with Google ID token credential.
   */
  const loginWithGoogle = async (credential) => {
    try {
      const res = await api.post('/auth/google', { credential });
      const { user: userData, token: accessToken } = res.data.data;

      setUser(userData);
      setToken(accessToken);
      localStorage.setItem('token', accessToken);

      showToast(res.data.message || 'Logged in via Google successfully!', 'success');
      return { success: true };
    } catch (error) {
      const msg = error.response?.data?.message || 'Google authentication failed. Please try again.';
      showToast(msg, 'error');
      return { success: false, error: msg };
    }
  };

  /**
   * Registers a new user.
   */
  const register = async (fullName, email, password, confirmPassword) => {
    try {
      const res = await api.post('/auth/register', { fullName, email, password, confirmPassword });
      const { user: userData, token: accessToken } = res.data.data;
      
      setUser(userData);
      setToken(accessToken);
      localStorage.setItem('token', accessToken);

      showToast(res.data.message || 'Account created successfully!', 'success');
      return { success: true };
    } catch (error) {
      let msg = 'Registration failed.';
      if (error.response?.data?.errors && error.response.data.errors.length > 0) {
        msg = error.response.data.errors.map(e => e.message || e.msg).join(', ');
      } else if (error.response?.data?.message) {
        msg = error.response.data.message;
      } else if (error.message) {
        msg = `Network/CORS Error: ${error.message}`;
      }
      showToast(msg, 'error');
      return { success: false, error: msg };
    }
  };

  /**
   * Logs out the user.
   */
  const logout = async () => {
    try {
      await api.post('/auth/logout');
      setUser(null);
      setToken(null);
      localStorage.removeItem('token');
      showToast('Logged out successfully.', 'success');
    } catch (error) {
      console.error('Logout error:', error);
      setUser(null);
      setToken(null);
      localStorage.removeItem('token');
      showToast('Logged out.', 'success');
    }
  };

  /**
   * Updates user credentials.
   */
  const updateProfile = async (data) => {
    try {
      const res = await api.put('/auth/profile', data);
      setUser(res.data.data);
      showToast('Profile updated successfully!', 'success');
      return { success: true };
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to update profile.';
      showToast(msg, 'error');
      return { success: false, error: msg };
    }
  };

  /**
   * Changes password.
   */
  const changePassword = async (currentPassword, newPassword, confirmPassword) => {
    try {
      await api.put('/auth/change-password', {
        currentPassword,
        newPassword,
        confirmPassword
      });
      showToast('Password changed successfully!', 'success');
      return { success: true };
    } catch (error) {
      const errors = error.response?.data?.errors;
      const msg = errors && errors.length > 0
        ? errors[0].message
        : (error.response?.data?.message || 'Failed to change password.');
      showToast(msg, 'error');
      return { success: false, error: msg };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        loginWithGoogle,
        register,
        logout,
        updateProfile,
        changePassword,
        isAuthenticated: !!user
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

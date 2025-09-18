import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import BackendKeepAlive from '../services/BackendKeepAlive';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://dismaman-app-1.preview.emergentagent.com';
console.log('🌐 Backend URL configuré:', BACKEND_URL);

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  is_premium?: boolean;
  trial_end_date?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  forceLogoutFlag: number; // New flag to force re-renders
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterCredentials {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// API Instance with automatic token handling
const api = axios.create({
  baseURL: BACKEND_URL + '/api',
  timeout: 30000, // Increased timeout for mobile
});

// Global keep-alive instance
const keepAlive = new BackendKeepAlive(BACKEND_URL);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    accessToken: null,
    refreshToken: null,
    forceLogoutFlag: 0,
  });

  // Setup axios interceptors
  useEffect(() => {
    const requestInterceptor = api.interceptors.request.use(
      async (config) => {
        // Get fresh token from AsyncStorage instead of closure
        const token = await AsyncStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          console.log('🔐 Token attached to request:', token.substring(0, 20) + '...');
        } else {
          console.warn('⚠️ No token found for request');
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    const responseInterceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            await refreshAccessToken();
            // Retry the original request with new token
            const newToken = await AsyncStorage.getItem('access_token');
            if (newToken) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return api(originalRequest);
            }
          } catch (refreshError) {
            // If refresh fails, logout user
            await logout();
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.request.eject(requestInterceptor);
      api.interceptors.response.eject(responseInterceptor);
    };
  }, []); // Remove dependency on authState.accessToken to avoid recreation

  // Initialize auth state on app start
  useEffect(() => {
    console.log('🔐 AuthProvider initializing...');
    
    // Démarrer le keep-alive dès le lancement de l'app
    keepAlive.startKeepAlive();
    console.log('💓 Backend keep-alive started');
    
    // Forcer une initialisation rapide - timeout plus court
    const initTimeout = setTimeout(() => {
      console.log('⏰ Auth init timeout - forcing logout state');
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false, // Force to false to show login
        accessToken: null,
        refreshToken: null,
        forceLogoutFlag: 0,
      });
    }, 10000); // 10s timeout au lieu de plus long
    
    // Simplified initialization - avoid complex force reset
    initializeAuth()
      .then(() => {
        clearTimeout(initTimeout);
      })
      .catch((error) => {
        clearTimeout(initTimeout);
        console.error('🚨 Auth initialization failed, fallback to login screen:', error);
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false, // Force to false on any error
          accessToken: null,
          refreshToken: null,
          forceLogoutFlag: 0,
        });
      });
    
    // Cleanup au démontage
    return () => {
      clearTimeout(initTimeout);
      keepAlive.stopKeepAlive();
    };
  }, []);
  
  const forceAuthReset = async () => {
    console.log('🔄 Force clearing all cached authentication data...');
    try {
      // Clear AsyncStorage tokens
      await Promise.all([
        AsyncStorage.removeItem('access_token'),
        AsyncStorage.removeItem('refresh_token'),
      ]);
      
      // Reset state - IMPORTANT: Set isLoading to false after clearing
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false, // Changed to false so app shows login screen
        accessToken: null,
        refreshToken: null,
      });
      
      console.log('✅ Auth reset complete - ready for login');
    } catch (error) {
      console.error('💥 Error during auth reset:', error);
      // Even on error, ensure loading is false
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        accessToken: null,
        refreshToken: null,
      });
    }
  };

  const initializeAuth = async () => {
    try {
      console.log('🔄 Initializing authentication...');
      
      const [accessToken, refreshToken] = await Promise.all([
        AsyncStorage.getItem('access_token'),
        AsyncStorage.getItem('refresh_token'),
      ]);

      console.log('📱 Tokens found:', { hasAccess: !!accessToken, hasRefresh: !!refreshToken });

      if (accessToken && refreshToken) {
        setAuthState(prev => ({
          ...prev,
          accessToken,
          refreshToken,
        }));

        try {
          // Extended verification timeout for cold start
          console.log('🔐 Verifying token...');
          const response = await Promise.race([
            api.get('/auth/me', {
              headers: { Authorization: `Bearer ${accessToken}` },
              timeout: 45000 // Extended to 45s for cold start
            }),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Auth verification timeout')), 45000)
            )
          ]);

          console.log('✅ Token valid, user authenticated');
          setAuthState(prev => ({
            ...prev,
            user: response.data,
            isAuthenticated: true,
            isLoading: false,
          }));
        } catch (error) {
          console.log('❌ Token invalid, clearing auth data');
          await clearAuthData();
        }
      } else {
        console.log('📭 No tokens found, user needs to login');
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          isAuthenticated: false,
        }));
      }
    } catch (error) {
      console.error('💥 Auth initialization error:', error);
      // CRITICAL: Always ensure loading is false
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false, // FORCE COMPLETE
        accessToken: null,
        refreshToken: null,
      });
    }
  };

  const login = async (credentials: LoginCredentials) => {
    try {
      console.log('🔐 Starting login process...');
      setAuthState(prev => ({ ...prev, isLoading: true }));

      // PRE-WARM le serveur avant le login critique
      const preWarmed = await keepAlive.preWarmServer();
      if (preWarmed) {
        console.log('🔥 Server pre-warmed, proceeding with login');
      } else {
        console.log('⚠️ Pre-warm failed, continuing anyway');
      }

      const response = await api.post('/auth/token', credentials);
      const { access_token, refresh_token, user } = response.data;

      // Store tokens
      await Promise.all([
        AsyncStorage.setItem('access_token', access_token),
        AsyncStorage.setItem('refresh_token', refresh_token),
      ]);

      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false,
        accessToken: access_token,
        refreshToken: refresh_token,
      });
    } catch (error: any) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      
      if (error.response?.status === 401) {
        throw new Error('Email ou mot de passe incorrect');
      } else if (error.response?.status >= 500) {
        throw new Error('Erreur serveur. Veuillez réessayer plus tard.');
      } else if (error.code === 'NETWORK_ERROR') {
        throw new Error('Pas de connexion internet');
      } else {
        throw new Error(error.response?.data?.detail || 'Erreur de connexion');
      }
    }
  };

  const register = async (credentials: RegisterCredentials) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));

      const response = await api.post('/auth/register', credentials);
      const { access_token, refresh_token, user } = response.data;

      // Store tokens
      await Promise.all([
        AsyncStorage.setItem('access_token', access_token),
        AsyncStorage.setItem('refresh_token', refresh_token),
      ]);

      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false,
        accessToken: access_token,
        refreshToken: refresh_token,
      });
    } catch (error: any) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      
      if (error.response?.status === 400 && error.response.data?.detail?.includes('already registered')) {
        throw new Error('Un compte existe déjà avec cet email');
      } else if (error.response?.status >= 500) {
        throw new Error('Erreur serveur. Veuillez réessayer plus tard.');
      } else if (error.code === 'NETWORK_ERROR') {
        throw new Error('Pas de connexion internet');
      } else {
        throw new Error(error.response?.data?.detail || 'Erreur lors de l\'inscription');
      }
    }
  };

  const refreshAccessToken = async () => {
    try {
      const refreshToken = await AsyncStorage.getItem('refresh_token');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await axios.post(
        `${BACKEND_URL}/api/auth/refresh?refresh_token=${refreshToken}`,
        {},
        { timeout: 45000 } // Extended for cold start
      );

      const { access_token } = response.data;
      await AsyncStorage.setItem('access_token', access_token);

      setAuthState(prev => ({
        ...prev,
        accessToken: access_token,
      }));

      // Get updated user info
      const userResponse = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${access_token}` }
      });

      setAuthState(prev => ({
        ...prev,
        user: userResponse.data,
        isAuthenticated: true,
        isLoading: false,
      }));
    } catch (error) {
      console.error('Token refresh failed:', error);
      await clearAuthData();
      throw error;
    }
  };

  const logout = async () => {
    try {
      console.log('🚪 Logout initiated...');
      await clearAuthData();
      console.log('✅ Logout completed - should redirect to login');
      
      // Trigger a forced re-render by updating a key state
      setAuthState(prevState => ({
        ...prevState,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        accessToken: null,
        refreshToken: null,
      }));
      
    } catch (error) {
      console.error('❌ Error during logout:', error);
    }
  };

  const clearAuthData = async () => {
    try {
      console.log('🧹 Clearing authentication data...');
      
      // Clear tokens from AsyncStorage
      await Promise.all([
        AsyncStorage.removeItem('access_token'),
        AsyncStorage.removeItem('refresh_token'),
      ]);
      
      // Reset state immediately with force flag increment to trigger all re-renders
      setAuthState(prevState => ({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        accessToken: null,
        refreshToken: null,
        forceLogoutFlag: prevState.forceLogoutFlag + 1, // Increment to force re-renders
      }));
      
      console.log('✅ Auth reset complete - ready for login');
      
    } catch (error) {
      console.error('💥 Error clearing auth data:', error);
      // Even if clearing fails, set the state to logged out with force flag
      setAuthState(prevState => ({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        accessToken: null,
        refreshToken: null,
        forceLogoutFlag: prevState.forceLogoutFlag + 1,
      }));
    }
  };

  const value: AuthContextType = {
    ...authState,
    login,
    register,
    logout,
    refreshAccessToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Export the configured API instance for use in other components
export { api };
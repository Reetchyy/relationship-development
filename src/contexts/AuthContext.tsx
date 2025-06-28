import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';

interface User {
  id: string;
  email: string;
  created_at: string;
}

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  location_city: string;
  location_country: string;
  occupation?: string;
  education_level?: string;
  bio?: string;
  profile_photo_url?: string;
  is_verified: boolean;
  is_active: boolean;
  cultural_backgrounds?: any[];
  personality_assessments?: any[];
  user_preferences?: any[];
}

interface AuthState {
  user: User | null;
  profile: Profile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

type AuthAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; profile: Profile } }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_PROFILE'; payload: Partial<Profile> }
  | { type: 'SET_USER_DATA'; payload: { user: User; profile: Profile } };

const initialState: AuthState = {
  user: null,
  profile: null,
  isAuthenticated: false,
  isLoading: true,
};

const AuthContext = createContext<{
  state: AuthState;
  dispatch: React.Dispatch<AuthAction>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<Profile>) => void;
  completeRegistration: (userData: any) => Promise<void>;
  checkAuthStatus: () => Promise<void>;
} | undefined>(undefined);

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'LOGIN_SUCCESS':
    case 'SET_USER_DATA':
      return {
        ...state,
        user: action.payload.user,
        profile: action.payload.profile,
        isAuthenticated: true,
        isLoading: false,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        profile: null,
        isAuthenticated: false,
        isLoading: false,
      };
    case 'UPDATE_PROFILE':
      return {
        ...state,
        profile: state.profile ? { ...state.profile, ...action.payload } : null,
      };
    default:
      return state;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check authentication status on app load
  const checkAuthStatus = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await apiService.getCurrentUser();
      
      if (response.user && response.profile) {
        dispatch({
          type: 'SET_USER_DATA',
          payload: {
            user: response.user,
            profile: response.profile
          }
        });
      } else {
        dispatch({ type: 'LOGOUT' });
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      dispatch({ type: 'LOGOUT' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await apiService.login({ email, password });
      
      if (response.user && response.profile) {
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: {
            user: response.user,
            profile: response.profile
          }
        });
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      dispatch({ type: 'LOGOUT' });
    }
  };

  const updateProfile = (data: Partial<Profile>) => {
    dispatch({ type: 'UPDATE_PROFILE', payload: data });
  };

  const completeRegistration = async (userData: any) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const tempPassword = 'temporary-password';
      
      // First register the user
      const registerResponse = await apiService.register({
        email: userData.email,
        password: tempPassword,
        firstName: userData.firstName,
        lastName: userData.lastName,
      });
      
      // Then immediately log them in to get the access token
      const loginResponse = await apiService.login({
        email: userData.email,
        password: tempPassword
      });
      
      if (loginResponse.user && loginResponse.profile) {
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: {
            user: loginResponse.user,
            profile: loginResponse.profile
          }
        });
      } else {
        throw new Error('Failed to authenticate after registration');
      }
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      state, 
      dispatch, 
      login, 
      logout, 
      updateProfile, 
      completeRegistration,
      checkAuthStatus 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
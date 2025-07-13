import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { apiService } from '../services/api';
import { supabase } from '../lib/supabase';
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

  // Set up auth state change listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 Auth state changed:', event, session?.user?.id);
        
        if (event === 'SIGNED_OUT' || !session) {
          dispatch({ type: 'LOGOUT' });
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          // Refresh user data when auth state changes
          await checkAuthStatus();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Check authentication status on app load
  const checkAuthStatus = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // First check if we have a valid session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        dispatch({ type: 'LOGOUT' });
        return;
      }
      
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
      // Handle token expiration gracefully
      if (error instanceof Error && error.message.includes('JWT expired')) {
        console.log('🔄 Token expired during auth check, will refresh automatically');
        return; // Let the auth state change handler deal with it
      }
      // Only log unexpected errors, not authentication failures
      console.error('Unexpected auth check error:', error);
      dispatch({ type: 'LOGOUT' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

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
      // Sign out from Supabase (this will trigger the auth state change)
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error);
      }
      // Also call API logout for cleanup
      await apiService.logout().catch(console.error);
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
      
      console.log('📝 Starting user registration...');
      
      // Register the user with the provided password
      const registerResponse = await apiService.register({
        email: userData.email,
        password: userData.password,
        firstName: userData.firstName,
        lastName: userData.lastName,
      });
      
      console.log('✅ User registered, logging in...');
      
      // Then immediately log them in to get the access token
      const loginResponse = await apiService.login({
        email: userData.email,
        password: userData.password
      });
      
      console.log('✅ User logged in, updating profile...');
      
      if (loginResponse.user && loginResponse.profile) {
        // Update the profile with additional information
        await apiService.updateProfile(loginResponse.user.id, {
          date_of_birth: userData.dateOfBirth,
          gender: userData.gender,
          location_city: userData.location.split(',')[0]?.trim() || 'Unknown',
          location_country: userData.location.split(',')[1]?.trim() || 'Unknown',
          occupation: userData.occupation,
          education_level: userData.education,
          bio: userData.bio,
        });

        console.log('✅ Profile updated, setting cultural background...');
        
        // Create cultural background if provided
        if (userData.tribe || userData.languages?.length > 0) {
          await apiService.updateCulturalBackground(loginResponse.user.id, {
            primary_tribe: userData.tribe,
            languages_spoken: userData.languages,
            religion: userData.religion,
            birth_country: userData.location.split(',')[1]?.trim() || 'Unknown',
          });
        }

        console.log('✅ Registration process complete, setting auth state...');
        
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

  // Initial auth check
  useEffect(() => {
    checkAuthStatus();
  }, []);

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
import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { api } from '../lib/api';
import toast from 'react-hot-toast';

interface User {
  id: string;
  email: string;
  user_metadata?: any;
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
  last_active_at: string;
  created_at: string;
  updated_at: string;
  cultural_backgrounds?: any[];
  personality_assessments?: any[];
  cultural_quiz_results?: any[];
  user_preferences?: any[];
}

interface AuthState {
  user: User | null;
  profile: Profile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  session: any;
}

type AuthAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: { user: User | null; profile: Profile | null; session: any } }
  | { type: 'UPDATE_PROFILE'; payload: Partial<Profile> }
  | { type: 'LOGOUT' };

const initialState: AuthState = {
  user: null,
  profile: null,
  isAuthenticated: false,
  isLoading: true,
  session: null,
};

const AuthContext = createContext<{
  state: AuthState;
  dispatch: React.Dispatch<AuthAction>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<void>;
  completeRegistration: (userData: any) => Promise<void>;
  refreshProfile: () => Promise<void>;
} | undefined>(undefined);

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'SET_USER':
      return {
        ...state,
        user: action.payload.user,
        profile: action.payload.profile,
        session: action.payload.session,
        isAuthenticated: !!action.payload.user,
        isLoading: false,
      };
    case 'UPDATE_PROFILE':
      return {
        ...state,
        profile: state.profile ? { ...state.profile, ...action.payload } : null,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        profile: null,
        session: null,
        isAuthenticated: false,
        isLoading: false,
      };
    default:
      return state;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    async function getInitialSession() {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting session:', error);
        if (mounted) {
          dispatch({ type: 'SET_LOADING', payload: false });
        }
        return;
      }

      if (session?.user && mounted) {
        await loadUserProfile(session.user, session);
      } else if (mounted) {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    }

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === 'SIGNED_IN' && session?.user) {
        await loadUserProfile(session.user, session);
      } else if (event === 'SIGNED_OUT') {
        dispatch({ type: 'LOGOUT' });
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const loadUserProfile = async (user: User, session: any) => {
    try {
      const { profile } = await api.getProfile();
      dispatch({ 
        type: 'SET_USER', 
        payload: { user, profile, session } 
      });
    } catch (error) {
      console.error('Error loading profile:', error);
      dispatch({ 
        type: 'SET_USER', 
        payload: { user, profile: null, session } 
      });
    }
  };

  const login = async (email: string, password: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      // Profile will be loaded by the auth state change listener
      toast.success('Welcome back!');
    } catch (error: any) {
      dispatch({ type: 'SET_LOADING', payload: false });
      throw new Error(error.message || 'Login failed');
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      dispatch({ type: 'LOGOUT' });
      toast.success('Logged out successfully');
    } catch (error: any) {
      console.error('Logout error:', error);
      toast.error('Logout failed');
    }
  };

  const updateProfile = async (data: Partial<Profile>) => {
    try {
      const { profile } = await api.updateProfile(data);
      dispatch({ type: 'UPDATE_PROFILE', payload: profile });
      toast.success('Profile updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
      throw error;
    }
  };

  const completeRegistration = async (userData: any) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      // Register with Supabase
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            first_name: userData.firstName,
            last_name: userData.lastName,
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        // Create profile via API
        await api.register({
          email: userData.email,
          password: userData.password,
          firstName: userData.firstName,
          lastName: userData.lastName,
          dateOfBirth: userData.dateOfBirth,
          gender: userData.gender,
          location: {
            city: userData.location?.split(',')[0]?.trim() || '',
            country: userData.location?.split(',')[1]?.trim() || ''
          },
          phone: userData.phone
        });

        // If cultural background data exists, save it
        if (userData.tribe || userData.languages?.length > 0) {
          await api.updateCulturalBackground({
            primaryTribe: userData.tribe,
            languagesSpoken: userData.languages || [],
            religion: userData.religion,
            birthCountry: userData.location?.split(',')[1]?.trim() || ''
          });
        }

        toast.success('Registration completed! Please check your email to verify your account.');
      }
    } catch (error: any) {
      dispatch({ type: 'SET_LOADING', payload: false });
      throw new Error(error.message || 'Registration failed');
    }
  };

  const refreshProfile = async () => {
    if (!state.user) return;
    
    try {
      const { profile } = await api.getProfile();
      dispatch({ type: 'UPDATE_PROFILE', payload: profile });
    } catch (error: any) {
      console.error('Error refreshing profile:', error);
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
      refreshProfile 
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
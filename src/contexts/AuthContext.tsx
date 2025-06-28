import React, { createContext, useContext, useReducer, ReactNode } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  culturalBackground: {
    tribe: string;
    languages: string[];
    religion: string;
    region: string;
  };
  isVerified: boolean;
  isAdmin: boolean;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

type AuthAction = 
  | { type: 'LOGIN_SUCCESS'; payload: User }
  | { type: 'LOGOUT' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'UPDATE_PROFILE'; payload: Partial<User> };

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
};

const AuthContext = createContext<{
  state: AuthState;
  dispatch: React.Dispatch<AuthAction>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => void;
  completeRegistration: (userData: any) => void;
} | undefined>(undefined);

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'UPDATE_PROFILE':
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.payload } : null,
      };
    default:
      return state;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const login = async (email: string, password: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    // Mock authentication - in real app, this would call your API
    setTimeout(() => {
      const mockUser: User = {
        id: '1',
        name: 'Amara Okafor',
        email: email,
        avatar: 'https://images.pexels.com/photos/3763188/pexels-photo-3763188.jpeg?auto=compress&cs=tinysrgb&w=400',
        culturalBackground: {
          tribe: 'Igbo',
          languages: ['English', 'Igbo'],
          religion: 'Christian',
          region: 'West Africa',
        },
        isVerified: true,
        isAdmin: email === 'admin@diasporaconnect.com',
      };
      dispatch({ type: 'LOGIN_SUCCESS', payload: mockUser });
    }, 1000);
  };

  const logout = () => {
    dispatch({ type: 'LOGOUT' });
  };

  const updateProfile = (data: Partial<User>) => {
    dispatch({ type: 'UPDATE_PROFILE', payload: data });
  };

  const completeRegistration = (userData: any) => {
    // Create user from registration data
    const newUser: User = {
      id: Date.now().toString(),
      name: `${userData.firstName} ${userData.lastName}`,
      email: userData.email,
      avatar: 'https://images.pexels.com/photos/3763188/pexels-photo-3763188.jpeg?auto=compress&cs=tinysrgb&w=400',
      culturalBackground: {
        tribe: userData.tribe || 'Not specified',
        languages: userData.languages || ['English'],
        religion: userData.religion || 'Not specified',
        region: 'Diaspora',
      },
      isVerified: false, // Will be verified after quiz
      isAdmin: false,
    };
    
    dispatch({ type: 'LOGIN_SUCCESS', payload: newUser });
  };

  return (
    <AuthContext.Provider value={{ state, dispatch, login, logout, updateProfile, completeRegistration }}>
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
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import api from '@/lib/api';

export interface UserType {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'instructor' | 'admin';
  isTestUser?: boolean;
  profilePicture?: string;
  bio?: string;
  education?: string;
  skills?: string[];
  resumeUrl?: string;
  xp?: number;
  streak?: number;
  maxStreak?: number;
  rank?: number;
  solvedProblems?: string[];
  attemptedProblems?: string[];
  bookmarks?: string[];
  recentlySolved?: string[];
  solveHistory?: Record<string, number>;
}

interface AuthContextType {
  user: UserType | null;
  profile: UserType | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string, role?: string, secretPassword?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
  console.log('[AuthProvider] Initializing provider state...');
  const [user, setUser] = useState<UserType | null>(null);
  const [profile, setProfile] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setUser(null);
      setProfile(null);
      setLoading(false);
      return;
    }
    try {
      const res = await api.get('/auth/profile');
      setProfile(res.data);
      if (res.data.isTestUser !== undefined) {
        localStorage.setItem('isTestApp', res.data.isTestUser ? 'true' : 'false');
      }
      setUser({
        id: res.data._id || res.data.id,
        email: res.data.email,
        name: res.data.name,
        role: res.data.role,
        profilePicture: res.data.profilePicture,
        isTestUser: res.data.isTestUser,
      });
    } catch (err) {
      console.error('[AuthContext] Refresh profile failed:', err);
      // If profile fetch fails, it might mean the token is invalid/expired
      setUser(null);
      setProfile(null);
    }
  };

  // Run once on load to populate profile if access token exists
  useEffect(() => {
    const initializeAuth = async () => {
      await refreshProfile();
      setLoading(false);
    };
    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      const { accessToken, user: userData } = res.data;
      
      localStorage.setItem('accessToken', accessToken);
      if (userData.isTestUser !== undefined) {
        localStorage.setItem('isTestApp', userData.isTestUser ? 'true' : 'false');
      }
      setProfile(userData);
      setUser({
        id: userData._id || userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        profilePicture: userData.profilePicture,
        isTestUser: userData.isTestUser,
      });
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Invalid email or password.';
      throw new Error(errorMsg);
    }
  };

  const signup = async (email: string, password: string, name: string, role: string = 'student', secretPassword?: string) => {
    try {
      await api.post('/auth/register', { name, email, password, role, secretPassword });
      // Log in automatically after registration
      await login(email, password);
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Registration failed. Try again.';
      throw new Error(errorMsg);
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.warn('Logout API warning:', err);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('isTestApp');
      setUser(null);
      setProfile(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, refreshProfile, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

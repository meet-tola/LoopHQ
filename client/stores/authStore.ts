import { create } from 'zustand'
import { User } from '@/types'

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoadingStore: boolean;
  setAuth: (user: User | null, token: string | null) => void;
  setAccessToken: (token: string | null) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoadingStore: true,

  setAuth: (user, token) => set({ 
    user, 
    accessToken: token,
    isAuthenticated: !!user && !!token, 
    isLoadingStore: false 
  }),

  setAccessToken: (token) => set((state) => ({ 
    accessToken: token,
    isAuthenticated: !!state.user && !!token 
  })),
  
  clearAuth: () => set({ 
    user: null, 
    accessToken: null,
    isAuthenticated: false, 
    isLoadingStore: false 
  }),
}))
import { api } from '../lib/axios';
import { AuthResponse, User } from '@/types';
import { LoginInput, SignupInput } from '../validators/auth';

export const AuthService = {
  async signup(data: SignupInput & { inviteToken?: string }): Promise<void> {
    await api.post('/auth/register', data);
  },

  async verifyEmail(accessToken: string): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/verify-email', { access_token: accessToken });
    return response.data;
  },

  async resendVerification(email: string): Promise<{ success: boolean; message: string }> {
    const response = await api.post<{ success: boolean; message: string }>('/auth/resend-verification', { email });
    return response.data;
  },

  async login(data: LoginInput & { inviteToken?: string }): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', data);
    return response.data;
  },

  async googleSignIn(idToken: string): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/google', { id_token: idToken });
    return response.data;
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },

  async refreshSession(): Promise<{ access_token: string; expires_at: number }> {
    const response = await api.post<{ access_token: string; expires_at: number }>('/auth/refresh');
    return response.data;
  },

  async getMe(p0: { headers: { Authorization: string; }; }): Promise<{ success: boolean; data: User }> {
    const response = await api.get<{ success: boolean; data: User }>('/auth/user');
    return response.data;
  }
};
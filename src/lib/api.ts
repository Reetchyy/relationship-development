import { supabase } from './supabase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiClient {
  private async getAuthHeaders() {
    const { data: { session } } = await supabase.auth.getSession();
    return {
      'Content-Type': 'application/json',
      ...(session?.access_token && {
        'Authorization': `Bearer ${session.access_token}`
      })
    };
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Auth endpoints
  async register(userData: any) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async login(email: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async logout() {
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }

  // Profile endpoints
  async getProfile() {
    return this.request('/profiles/me');
  }

  async updateProfile(profileData: any) {
    return this.request('/profiles/me', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  async getPublicProfile(userId: string) {
    return this.request(`/profiles/${userId}`);
  }

  async updateCulturalBackground(culturalData: any) {
    return this.request('/profiles/cultural-background', {
      method: 'PUT',
      body: JSON.stringify(culturalData),
    });
  }

  async searchProfiles(params: any) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/profiles?${queryString}`);
  }

  // Matching endpoints
  async discoverMatches(limit?: number) {
    const params = limit ? `?limit=${limit}` : '';
    return this.request(`/matching/discover${params}`);
  }

  async performMatchAction(targetUserId: string, action: 'like' | 'pass' | 'super_like') {
    return this.request('/matching/action', {
      method: 'POST',
      body: JSON.stringify({ targetUserId, action }),
    });
  }

  async getMatches(status?: string, page?: number, limit?: number) {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());
    
    const queryString = params.toString();
    return this.request(`/matching/matches${queryString ? `?${queryString}` : ''}`);
  }

  // Cultural quiz endpoints
  async submitQuizResults(quizData: any) {
    return this.request('/quiz/submit', {
      method: 'POST',
      body: JSON.stringify(quizData),
    });
  }

  async getQuizQuestions() {
    return this.request('/quiz/questions');
  }

  async getQuizResults() {
    return this.request('/quiz/results');
  }
}

export const api = new ApiClient();
export default api;
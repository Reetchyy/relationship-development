// API service for frontend to communicate with backend
const API_BASE_URL = import.meta.env.DEV ? 'http://localhost:3001/api' : '/api';

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
  code?: string;
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

class ApiService {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.loadToken();
  }

  private loadToken() {
    this.token = localStorage.getItem('supabase.auth.token');
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    return headers;
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('supabase.auth.token', token);
    } else {
      localStorage.removeItem('supabase.auth.token');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const config: RequestInit = {
      headers: this.getHeaders(),
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Auth endpoints
  async register(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) {
    return this.request<ApiResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async login(credentials: { email: string; password: string }) {
    const response = await this.request<ApiResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    if (response.session?.access_token) {
      this.setToken(response.session.access_token);
    }
    
    return response;
  }

  async logout() {
    const response = await this.request<ApiResponse>('/auth/logout', {
      method: 'POST',
    });
    this.setToken(null);
    return response;
  }

  async getCurrentUser() {
    try {
      return await this.request<ApiResponse>('/auth/me');
    } catch (error) {
      // Handle expected authentication errors gracefully
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('Invalid or expired token') || 
          errorMessage.includes('Access token required') ||
          errorMessage.includes('JWT expired') ||
          errorMessage.includes('No token provided')) {
        // Return a response indicating no authenticated user instead of throwing
        return { user: null, profile: null };
      }
      // Re-throw other unexpected errors
      throw error;
    }
  }

  // Profile endpoints
  async getProfiles(params?: {
    page?: number;
    limit?: number;
    tribe?: string;
    location_country?: string;
    age_min?: number;
    age_max?: number;
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    return this.request<PaginatedResponse<any>>(`/profiles?${searchParams}`);
  }

  async getProfile(id: string) {
    return this.request<ApiResponse>(`/profiles/${id}`);
  }

  async updateProfile(id: string, data: any) {
    return this.request<ApiResponse>(`/profiles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async updateCulturalBackground(id: string, data: any) {
    return this.request<ApiResponse>(`/profiles/${id}/cultural-background`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getProfileStats(id: string) {
    const res = this.request<ApiResponse>(`/profiles/${id}/stats`);
    console.log (res);
    return res;
  }

  // User activity endpoints
  async getUserActivities(limit?: number) {
    const params = limit ? `?limit=${limit}` : '';
    return this.request<ApiResponse>(`/user/activities${params}`);
  }

  // Match endpoints
  async getMatches(params?: {
    status?: 'all' | 'mutual' | 'pending';
    page?: number;
    limit?: number;
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    return this.request<PaginatedResponse<any>>(`/matches?${searchParams}`);
  }

  async getMatchSuggestions(limit?: number) {
    const params = limit ? `?limit=${limit}` : '';
    return this.request<ApiResponse>(`/matches/suggestions${params}`);
  }

  async performMatchAction(userId: string, action: 'like' | 'pass' | 'super_like') {
    return this.request<ApiResponse>(`/matches/${userId}/action`, {
      method: 'POST',
      body: JSON.stringify({ action }),
    });
  }

  // Chat endpoints
  async getConversations(params?: { page?: number; limit?: number }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    return this.request<PaginatedResponse<any>>(`/chat/conversations?${searchParams}`);
  }

  async getMessages(conversationId: string, params?: { page?: number; limit?: number }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    return this.request<PaginatedResponse<any>>(`/chat/conversations/${conversationId}/messages?${searchParams}`);
  }

  async sendMessage(conversationId: string, data: {
    content: string;
    message_type?: string;
    original_language?: string;
    translated_content?: any;
  }) {
    return this.request<ApiResponse>(`/chat/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async markMessageAsRead(messageId: string) {
    return this.request<ApiResponse>(`/chat/messages/${messageId}/read`, {
      method: 'PUT',
    });
  }

  // Community endpoints
  async getCommunityMembers(params?: {
    page?: number;
    limit?: number;
    tribe?: string;
    location?: string;
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    return this.request<PaginatedResponse<any>>(`/community/members?${searchParams}`);
  }

  async getEndorsements(params?: {
    page?: number;
    limit?: number;
    type?: string;
    user_id?: string;
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    return this.request<PaginatedResponse<any>>(`/community/endorsements?${searchParams}`);
  }

  async createEndorsement(data: {
    endorsed_id: string;
    endorsement_type: string;
    message: string;
  }) {
    return this.request<ApiResponse>('/community/endorsements', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getCommunityEvents(params?: {
    page?: number;
    limit?: number;
    type?: string;
    upcoming?: boolean;
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    return this.request<PaginatedResponse<any>>(`/community/events?${searchParams}`);
  }

  async createEvent(data: any) {
    return this.request<ApiResponse>('/community/events', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async joinEvent(eventId: string, attendanceStatus: string = 'going') {
    return this.request<ApiResponse>(`/community/events/${eventId}/join`, {
      method: 'POST',
      body: JSON.stringify({ attendance_status: attendanceStatus }),
    });
  }

  // Quiz endpoints
  async submitQuiz(data: {
    total_questions: number;
    correct_answers: number;
    score_percentage: number;
    category_scores?: any;
    time_taken_seconds?: number;
  }) {
    return this.request<ApiResponse>('/quiz/submit', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getQuizResults() {
    return this.request<ApiResponse>('/quiz/results');
  }

  async getQuizQuestions() {
    return this.request<ApiResponse>('/quiz/questions');
  }

  // Admin endpoints
  async getAdminStats() {
    return this.request<ApiResponse>('/admin/stats');
  }

  async getAdminUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    return this.request<PaginatedResponse<any>>(`/admin/users?${searchParams}`);
  }

  async updateUserStatus(userId: string, isActive: boolean, reason?: string) {
    return this.request<ApiResponse>(`/admin/users/${userId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ is_active: isActive, reason }),
    });
  }

  async getAdminReports(params?: { page?: number; limit?: number }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    return this.request<PaginatedResponse<any>>(`/admin/reports?${searchParams}`);
  }
}

// Export singleton instance
export const apiService = new ApiService(API_BASE_URL);
export default apiService;
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
  private refreshPromise: Promise<any> | null = null;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async getHeaders(): Promise<HeadersInit> {
    // Get fresh session from Supabase
    const { data: { session }, error } = await supabase.auth.getSession();
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (session?.access_token) {
      headers.Authorization = `Bearer ${session.access_token}`;
    }

    return headers;
  }

  private async handleAuthError(error: any): Promise<void> {
    if (error.message?.includes('JWT expired') || 
        error.message?.includes('Invalid token') ||
        error.message?.includes('Access token required')) {
      
      console.log('🔄 Token expired, attempting refresh...');
      
      // Prevent multiple simultaneous refresh attempts
      if (!this.refreshPromise) {
        this.refreshPromise = this.refreshSession();
      }
      
      try {
        await this.refreshPromise;
        console.log('✅ Session refreshed successfully');
      } catch (refreshError) {
        console.error('❌ Session refresh failed:', refreshError);
        // Force user to re-authenticate
        await supabase.auth.signOut();
        window.location.href = '/';
      } finally {
        this.refreshPromise = null;
      }
    }
  }

  private async refreshSession(): Promise<void> {
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error) {
      throw new Error(`Session refresh failed: ${error.message}`);
    }
    
    if (!data.session) {
      throw new Error('No session after refresh');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    let attempt = 0;
    const maxRetries = 2;
    
    while (attempt <= maxRetries) {
      try {
        const headers = await this.getHeaders();
        
        const response = await fetch(`${this.baseURL}${endpoint}`, {
          ...options,
          headers: {
            ...headers,
            ...options.headers,
          },
        });

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
        if (!response.ok) {
          const error = await response.json().catch(() => ({ message: 'Network error' }));
          
          // Handle authentication errors
          if (response.status === 401 && attempt < maxRetries) {
            await this.handleAuthError(error);
            attempt++;
            continue; // Retry the request
          }
          
          throw new Error(error.message || `HTTP ${response.status}`);
        }
      throw error;
        return response.json();
        
      } catch (error) {
        if (attempt >= maxRetries) {
          console.error('API request failed after retries:', error);
          throw error;
        }
        
        // If it's an auth error, try to handle it
        if (error instanceof Error && 
            (error.message.includes('401') || 
             error.message.includes('JWT') || 
             error.message.includes('token'))) {
          await this.handleAuthError(error);
          attempt++;
        } else {
          throw error;
        }
      }
    }
    
    throw new Error('Max retries exceeded');
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
    
    return response;
  }

  async logout() {
    const response = await this.request<ApiResponse>('/auth/logout', {
      method: 'POST',
    });
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
    // Get current user ID from token or make a separate call
    const userResponse = await this.getCurrentUser();
    if (!userResponse.user?.id) {
      throw new Error('User not authenticated');
    }
    
    const params = limit ? `?limit=${limit}` : '';
    return this.request<ApiResponse>(`/profiles/${userResponse.user.id}/activities${params}`);
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

  // Profile view tracking
  async trackProfileView(targetUserId: string) {
    return this.request<ApiResponse>('/profiles/track-view', {
      method: 'POST',
      body: JSON.stringify({ target_user_id: targetUserId }),
    });
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
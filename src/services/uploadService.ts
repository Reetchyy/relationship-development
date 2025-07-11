import { apiService } from './api';

export interface UploadResponse {
  message: string;
  profile_photo_url?: string;
  document?: {
    id: string;
    file_url: string;
    document_type: string;
    verification_status: string;
  };
}

class UploadService {
  private baseURL: string;

  constructor() {
    this.baseURL = import.meta.env.DEV ? 'http://localhost:3001/api/upload' : '/api/upload';
  }

  private async getAuthHeaders() {
    const token = localStorage.getItem('supabase.auth.token');
    return {
      'Authorization': token ? `Bearer ${token}` : '',
    };
  }

  private async uploadFile(endpoint: string, file: File, additionalData?: Record<string, string>): Promise<UploadResponse> {
    const headers = await this.getAuthHeaders();
    
    const formData = new FormData();
    formData.append(endpoint === 'profile-photo' ? 'profilePhoto' : endpoint === 'video' ? 'video' : 'document', file);
    
    // Add additional data if provided
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    const response = await fetch(`${this.baseURL}/${endpoint}`, {
      method: 'POST',
      headers: {
        ...headers,
        // Don't set Content-Type for FormData, let browser set it with boundary
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Upload failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  /**
   * Upload profile photo
   */
  async uploadProfilePhoto(file: File): Promise<UploadResponse> {
    if (!file.type.startsWith('image/')) {
      throw new Error('Only image files are allowed for profile photos');
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB
      throw new Error('Profile photo must be less than 5MB');
    }

    return this.uploadFile('profile-photo', file);
  }

  /**
   * Upload identity document
   */
  async uploadDocument(file: File, documentType: string = 'government_id'): Promise<UploadResponse> {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Only JPEG, PNG, and PDF files are allowed for documents');
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB
      throw new Error('Document must be less than 10MB');
    }

    return this.uploadFile('document', file, { document_type: documentType });
  }

  /**
   * Upload video (e.g., video selfie)
   */
  async uploadVideo(file: File, documentType: string = 'video_selfie'): Promise<UploadResponse> {
    if (!file.type.startsWith('video/')) {
      throw new Error('Only video files are allowed');
    }

    if (file.size > 50 * 1024 * 1024) { // 50MB
      throw new Error('Video must be less than 50MB');
    }

    return this.uploadFile('video', file, { document_type: documentType });
  }

  /**
   * Get user's uploaded documents
   */
  async getDocuments(): Promise<any[]> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${this.baseURL}/documents`, {
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to fetch documents' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.documents || [];
  }

  /**
   * Delete file
   */
  async deleteFile(publicId: string, resourceType: string = 'image'): Promise<void> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${this.baseURL}/file/${publicId}?resource_type=${resourceType}`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to delete file' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }
  }
}

export const uploadService = new UploadService();
export default uploadService;
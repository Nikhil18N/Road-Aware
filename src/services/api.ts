/**
 * API Client for Road-Aware Backend
 * Handles all HTTP requests to the Node.js/Express backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string>;
}

export interface Complaint {
  id: string;
  image_url: string;
  latitude: number;
  longitude: number;
  description?: string;
  potholes_detected?: number;
  severity?: 'Low' | 'Medium' | 'High';
  largest_pothole_area?: number;
  status: 'processing' | 'analyzed' | 'failed' | 'pending' | 'resolved';
  error_message?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
}

export interface ComplaintStats {
  total: number;
  byStatus: {
    processing: number;
    analyzed: number;
    failed: number;
    pending: number;
    resolved: number;
  };
  bySeverity: {
    Low: number;
    Medium: number;
    High: number;
  };
}

/**
 * Create a new complaint with image upload
 */
export async function createComplaint(
  imageFile: File,
  latitude: number,
  longitude: number,
  description?: string
): Promise<ApiResponse<Complaint>> {
  try {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('latitude', latitude.toString());
    formData.append('longitude', longitude.toString());
    if (description) {
      formData.append('description', description);
    }

    const response = await fetch(`${API_BASE_URL}/complaints`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || 'Failed to create complaint',
        errors: data.errors
      };
    }

    return data;
  } catch (error) {
    console.error('Error creating complaint:', error);
    return {
      success: false,
      message: 'Network error. Please check your connection.',
    };
  }
}

/**
 * Get all complaints with optional filters
 */
export async function getAllComplaints(filters?: {
  status?: string;
  severity?: string;
  limit?: number;
  offset?: number;
}): Promise<ApiResponse<{ complaints: Complaint[]; count: number }>> {
  try {
    const queryParams = new URLSearchParams();

    if (filters?.status) queryParams.append('status', filters.status);
    if (filters?.severity) queryParams.append('severity', filters.severity);
    if (filters?.limit) queryParams.append('limit', filters.limit.toString());
    if (filters?.offset) queryParams.append('offset', filters.offset.toString());

    const url = `${API_BASE_URL}/complaints${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || 'Failed to fetch complaints',
      };
    }

    return data;
  } catch (error) {
    console.error('Error fetching complaints:', error);
    return {
      success: false,
      message: 'Network error. Please check your connection.',
    };
  }
}

/**
 * Get a single complaint by ID
 */
export async function getComplaintById(id: string): Promise<ApiResponse<Complaint>> {
  try {
    const response = await fetch(`${API_BASE_URL}/complaints/${id}`);
    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || 'Complaint not found',
      };
    }

    return data;
  } catch (error) {
    console.error('Error fetching complaint:', error);
    return {
      success: false,
      message: 'Network error. Please check your connection.',
    };
  }
}

/**
 * Update complaint status (admin action)
 */
export async function updateComplaintStatus(
  id: string,
  status: string
): Promise<ApiResponse<Complaint>> {
  try {
    const response = await fetch(`${API_BASE_URL}/complaints/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || 'Failed to update status',
      };
    }

    return data;
  } catch (error) {
    console.error('Error updating status:', error);
    return {
      success: false,
      message: 'Network error. Please check your connection.',
    };
  }
}

/**
 * Get complaint statistics
 */
export async function getComplaintStats(): Promise<ApiResponse<ComplaintStats>> {
  try {
    const response = await fetch(`${API_BASE_URL}/complaints/stats`);
    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || 'Failed to fetch statistics',
      };
    }

    return data;
  } catch (error) {
    console.error('Error fetching stats:', error);
    return {
      success: false,
      message: 'Network error. Please check your connection.',
    };
  }
}

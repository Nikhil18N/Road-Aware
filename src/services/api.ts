/**
 * API Client for Road-Aware Backend
 * Handles all HTTP requests to the Node.js/Express backend
 */
import { supabase } from '@/lib/supabase';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  const headers: Record<string, string> = {};
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }
  return headers;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string>;
}

export interface Complaint {
  id: string;
  complaint_id?: string; // e.g. SMC-2026-001
  image_url: string;
  latitude: number;
  longitude: number;
  location?: string;
  landmark?: string;
  assigned_to?: string; // Worker UUID
  ward_id?: string;
  department_id?: number;
  description?: string;
  damage_type?: string; // e.g. pothole, crack
  reporter_name?: string;
  reporter_phone?: string;
  reporter_email?: string;
  potholes_detected?: number;
  severity?: 'Low' | 'Medium' | 'High' | 'Critical'; // Matches both DB (lowercase usually) and API. Let's be flexible.
  largest_pothole_area?: number;
  status: 'processing' | 'analyzed' | 'failed' | 'pending' | 'resolved' | 'rejected' | 'in_progress';
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

export interface Department {
  id: number;
  name: string;
  code: string;
  description: string;
}

export interface DepartmentStats {
  id: number;
  name: string;
  code: string;
  total_complaints: number;
  resolved_complaints: number;
  pending_complaints: number;
  avg_resolution_hours: number;
}

/**
 * Create a new complaint with image upload
 */
export async function createComplaint(
  imageFile: File,
  latitude: number,
  longitude: number,
  description?: string,
  name?: string,
  phone?: string,
  email?: string
): Promise<ApiResponse<Complaint>> {
  try {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('latitude', latitude.toString());
    formData.append('longitude', longitude.toString());
    if (description) {
      formData.append('description', description);
    }
    if (name) {
      formData.append('name', name);
    }
    if (phone) {
      formData.append('phone', phone);
    }
    if (email) {
      formData.append('email', email);
    }

    const authHeaders = await getAuthHeaders();

    const response = await fetch(`${API_BASE_URL}/complaints`, {
      method: 'POST',
      body: formData,
      headers: {
        ...authHeaders
        // Content-Type is set automatically for FormData
      }
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
  my?: boolean;
  assigned_to?: string;
  department_id?: number;
}): Promise<ApiResponse<{ complaints: Complaint[]; count: number }>> {
  try {
    const queryParams = new URLSearchParams();

    if (filters?.status) queryParams.append('status', filters.status);
    if (filters?.severity) queryParams.append('severity', filters.severity);
    if (filters?.assigned_to) queryParams.append('assigned_to', filters.assigned_to);
    if (filters?.department_id) queryParams.append('department_id', filters.department_id.toString());
    if (filters?.limit) queryParams.append('limit', filters.limit.toString());
    if (filters?.offset) queryParams.append('offset', filters.offset.toString());
    if (filters?.my) queryParams.append('my', 'true');

    const url = `${API_BASE_URL}/complaints${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const authHeaders = await getAuthHeaders();

    const response = await fetch(url, {
      headers: {
        ...authHeaders
      }
    });

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
    const authHeaders = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/complaints/${id}`, {
      headers: {
        ...authHeaders
      }
    });
    
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
    const authHeaders = await getAuthHeaders();
    
    const response = await fetch(`${API_BASE_URL}/complaints/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders
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

export async function getStats(): Promise<ApiResponse<ComplaintStats>> {
  try {
    const response = await fetch(`${API_BASE_URL}/complaints/stats`);
    const data = await response.json();
    
    if (!response.ok) return { success: false, message: 'Failed to fetch stats' };
    return data;
  } catch (error) {
    return { success: false, message: 'Network error' };
  }
}

export async function getComplaintsByContact(contact: string): Promise<ApiResponse<{complaints: Complaint[]}>> {
  try {
    const response = await fetch(`${API_BASE_URL}/complaints/contact/${contact}`);
    const data = await response.json();
    if (!response.ok) return { success: false, message: 'Failed' };
    return data;
  } catch (error) {
    return { success: false, message: 'Network error' };
  }
}

export async function getDepartments(): Promise<ApiResponse<Department[]>> {
  try {
    const response = await fetch(`${API_BASE_URL}/complaints/departments`);
    const data = await response.json();
    if (!response.ok) return { success: false, message: 'Failed to fetch departments', errors: {} };
    return data;
  } catch (error) {
    return { success: false, message: 'Network error', errors: {} };
  }
}

export async function getDepartmentAnalytics(): Promise<ApiResponse<DepartmentStats[]>> {
  try {
    const response = await fetch(`${API_BASE_URL}/complaints/analytics/departments`);
    const data = await response.json();
    if (!response.ok) return { success: false, message: 'Failed to fetch analytics', errors: {} };
    return data;
  } catch (error) {
    return { success: false, message: 'Network error', errors: {} };
  }
}

export async function assignDepartment(id: string, departmentId: number): Promise<ApiResponse<Complaint>> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/complaints/${id}/assign-department`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            ...headers
        },
        body: JSON.stringify({ department_id: departmentId }),
    });
    const data = await response.json();
    if (!response.ok) return { success: false, message: 'Failed to assign department', errors: {} };
    return data;
  } catch (error) {
    return { success: false, message: 'Network error', errors: {} };
  }
}


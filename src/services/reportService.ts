import { supabase, Report, StatusTimeline } from '@/lib/supabase';

export interface CreateReportData {
  reporter_name: string;
  reporter_phone: string;
  reporter_email?: string;
  damage_type: string;
  severity: 'low' | 'moderate' | 'critical';
  description?: string;
  location: string;
  landmark?: string;
  ward_number: number;
  gps_latitude?: number;
  gps_longitude?: number;
  image_file?: File;
}

/**
 * Upload image to Supabase Storage
 */
export const uploadImage = async (file: File, complaintId: string): Promise<string | null> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${complaintId}-${Date.now()}.${fileExt}`;
    const filePath = `reports/${fileName}`;

    const { data, error } = await supabase.storage
      .from('road-damage-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Error uploading image:', error);
      return null;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('road-damage-images')
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error('Error in uploadImage:', error);
    return null;
  }
};

/**
 * Create a new report
 */
export const createReport = async (reportData: CreateReportData): Promise<{ success: boolean; data?: Report; error?: string }> => {
  try {
    // First, get the ward_id from ward_number
    const { data: wardData, error: wardError } = await supabase
      .from('wards')
      .select('id')
      .eq('ward_number', reportData.ward_number)
      .single();

    if (wardError || !wardData) {
      return { success: false, error: 'Invalid ward number' };
    }

    // Create the report (complaint_id will be auto-generated)
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .insert({
        reporter_name: reportData.reporter_name,
        reporter_phone: reportData.reporter_phone,
        reporter_email: reportData.reporter_email,
        damage_type: reportData.damage_type,
        severity: reportData.severity,
        description: reportData.description,
        location: reportData.location,
        landmark: reportData.landmark,
        ward_id: wardData.id,
        gps_latitude: reportData.gps_latitude,
        gps_longitude: reportData.gps_longitude,
        status: 'pending',
        priority: reportData.severity === 'critical' ? 3 : reportData.severity === 'moderate' ? 2 : 1,
      })
      .select()
      .single();

    if (reportError || !report) {
      console.error('Error creating report:', reportError);
      return { success: false, error: 'Failed to create report' };
    }

    // Upload image if provided
    if (reportData.image_file) {
      const imageUrl = await uploadImage(reportData.image_file, report.complaint_id);
      if (imageUrl) {
        // Update report with image URL
        await supabase
          .from('reports')
          .update({
            image_url: imageUrl,
            image_size: `${(reportData.image_file.size / 1024).toFixed(1)} KB`
          })
          .eq('id', report.id);
      }
    }

    return { success: true, data: report };
  } catch (error) {
    console.error('Error in createReport:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
};

/**
 * Get report by complaint ID
 */
export const getReportByComplaintId = async (complaintId: string): Promise<{
  success: boolean;
  data?: Report & { ward: { ward_number: number } | null; team: { team_name: string } | null };
  timeline?: StatusTimeline[];
  error?: string
}> => {
  try {
    // Get the report
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select(`
        *,
        ward:wards(ward_number, ward_name),
        team:teams(team_name, department)
      `)
      .eq('complaint_id', complaintId.toUpperCase())
      .single();

    if (reportError || !report) {
      return { success: false, error: 'Report not found' };
    }

    // Get the timeline
    const { data: timeline, error: timelineError } = await supabase
      .from('status_timeline')
      .select('*')
      .eq('report_id', report.id)
      .order('changed_at', { ascending: true });

    if (timelineError) {
      console.error('Error fetching timeline:', timelineError);
    }

    return {
      success: true,
      data: report as any,
      timeline: timeline || []
    };
  } catch (error) {
    console.error('Error in getReportByComplaintId:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
};

/**
 * Get all reports with filters
 */
export const getAllReports = async (filters?: {
  status?: string;
  severity?: string;
  ward_number?: number;
  limit?: number;
  offset?: number;
}): Promise<{ success: boolean; data?: any[]; count?: number; error?: string }> => {
  try {
    let query = supabase
      .from('reports')
      .select(`
        *,
        ward:wards(ward_number, ward_name),
        team:teams(team_name)
      `, { count: 'exact' })
      .order('reported_at', { ascending: false });

    // Apply filters
    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }
    if (filters?.severity && filters.severity !== 'all') {
      query = query.eq('severity', filters.severity);
    }
    if (filters?.ward_number) {
      const { data: wardData } = await supabase
        .from('wards')
        .select('id')
        .eq('ward_number', filters.ward_number)
        .single();

      if (wardData) {
        query = query.eq('ward_id', wardData.id);
      }
    }

    // Pagination
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching reports:', error);
      return { success: false, error: 'Failed to fetch reports' };
    }

    return { success: true, data: data || [], count: count || 0 };
  } catch (error) {
    console.error('Error in getAllReports:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
};

/**
 * Get dashboard statistics
 */
export const getDashboardStats = async (): Promise<{
  success: boolean;
  data?: {
    total: number;
    pending: number;
    in_progress: number;
    resolved: number;
    by_type: { type: string; count: number }[];
    by_ward: { ward: string; total: number; resolved: number; pending: number }[];
  };
  error?: string;
}> => {
  try {
    // Get status counts
    const { data: statusCounts, error: statusError } = await supabase
      .from('reports')
      .select('status');

    if (statusError) {
      console.error('Error fetching status counts:', statusError);
      return { success: false, error: 'Failed to fetch statistics' };
    }

    const total = statusCounts?.length || 0;
    const pending = statusCounts?.filter(r => r.status === 'pending' || r.status === 'under_review').length || 0;
    const in_progress = statusCounts?.filter(r => r.status === 'in_progress' || r.status === 'assigned').length || 0;
    const resolved = statusCounts?.filter(r => r.status === 'resolved').length || 0;

    // Get reports by type
    const { data: byType, error: typeError } = await supabase
      .from('reports')
      .select('damage_type');

    const typeMap = new Map<string, number>();
    byType?.forEach(r => {
      typeMap.set(r.damage_type, (typeMap.get(r.damage_type) || 0) + 1);
    });

    const by_type = Array.from(typeMap.entries()).map(([type, count]) => ({
      type,
      count
    }));

    // Get reports by ward
    const { data: wardReports, error: wardError } = await supabase
      .from('reports')
      .select(`
        status,
        ward:wards(ward_number, ward_name)
      `);

    const wardMap = new Map<string, { total: number; resolved: number; pending: number }>();
    wardReports?.forEach((r: any) => {
      if (r.ward) {
        const wardKey = `Ward ${r.ward.ward_number}`;
        const current = wardMap.get(wardKey) || { total: 0, resolved: 0, pending: 0 };
        current.total += 1;
        if (r.status === 'resolved') current.resolved += 1;
        if (r.status === 'pending' || r.status === 'under_review') current.pending += 1;
        wardMap.set(wardKey, current);
      }
    });

    const by_ward = Array.from(wardMap.entries())
      .map(([ward, stats]) => ({ ward, ...stats }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    return {
      success: true,
      data: {
        total,
        pending,
        in_progress,
        resolved,
        by_type,
        by_ward
      }
    };
  } catch (error) {
    console.error('Error in getDashboardStats:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
};

/**
 * Update report status (Admin only)
 */
export const updateReportStatus = async (
  reportId: string,
  status: string,
  assignedTeamId?: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const updateData: any = { status };
    if (assignedTeamId) {
      updateData.assigned_team_id = assignedTeamId;
    }
    if (status === 'resolved') {
      updateData.resolved_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('reports')
      .update(updateData)
      .eq('id', reportId);

    if (error) {
      console.error('Error updating report status:', error);
      return { success: false, error: 'Failed to update report status' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in updateReportStatus:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
};

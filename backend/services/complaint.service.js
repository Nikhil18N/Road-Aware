const { supabase, supabaseAdmin } = require('../config/supabase');
const { calculateDistance } = require('../utils/validators');
require('dotenv').config();

const DUPLICATE_THRESHOLD = parseFloat(process.env.DUPLICATE_LOCATION_THRESHOLD) || 50;

/**
 * Create a new complaint
 * @param {Object} complaintData - Complaint data
 * @returns {Promise<Object>} Created complaint
 */
async function createComplaint(complaintData) {
  try {
    const { data, error } = await supabase
      .from('complaints')
      .insert([complaintData])
      .select()
      .single();

    if (error) {
      console.error('Database insert error:', error);
      throw new Error(`Failed to create complaint: ${error.message}`);
    }

    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('Error in createComplaint:', error);
    throw error;
  }
}

/**
 * Get all complaints with optional filters
 * @param {Object} filters - Query filters
 * @returns {Promise<Array>} Array of complaints
 */
async function getAllComplaints(filters = {}) {
  try {
    let query = supabase
      .from('complaints')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    // Apply user_id filter (for users to see own reports)
    if (filters.user_id) {
      query = query.eq('user_id', filters.user_id);
    }
    
    // Apply status filter
    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    // Apply severity filter
    if (filters.severity) {
      query = query.eq('severity', filters.severity);
    }

      // Apply assigned_to filter
      if (filters.assigned_to) {
        query = query.eq('assigned_to', filters.assigned_to);
      }

    // Apply department_id filter
    if (filters.department_id) {
      query = query.eq('department_id', filters.department_id);
    }

    // Execute the query
    const { data, error, count } = await query;

    if (error) {
      console.error('Database query error:', error);
      throw new Error(`Failed to fetch complaints: ${error.message}`);
    }

    return {
      success: true,
      data: data || [],
      count
    };
  } catch (error) {
    console.error('Error in getAllComplaints:', error);
    throw error;
  }
}

/**
 * Get complaint by ID
 * @param {string} complaintId - Complaint UUID
 * @returns {Promise<Object>} Complaint data
 */
async function getComplaintById(complaintId) {
  try {
    const { data, error } = await supabase
      .from('complaints')
      .select('*')
      .eq('id', complaintId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return {
          success: false,
          error: 'Complaint not found'
        };
      }
      console.error('Database query error:', error);
      throw new Error(`Failed to fetch complaint: ${error.message}`);
    }

    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('Error in getComplaintById:', error);
    throw error;
  }
}

/**
 * Update complaint
 * @param {string} complaintId - Complaint UUID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated complaint
 */
async function updateComplaint(complaintId, updates) {
  try {
    // Use admin client for updates to bypass RLS
    const { data, error } = await supabaseAdmin
      .from('complaints')
      .update(updates)
      .eq('id', complaintId)
      .select()
      .single();

    if (error) {
      console.error('Database update error:', error);
      throw new Error(`Failed to update complaint: ${error.message}`);
    }

    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('Error in updateComplaint:', error);
    throw error;
  }
}

/**
 * Update complaint status
 * @param {string} complaintId - Complaint UUID
 * @param {string} status - New status
 * @returns {Promise<Object>} Updated complaint
 */
async function updateComplaintStatus(complaintId, status) {
  try {
    const updates = { status };

    // If marking as resolved, add resolved timestamp
    if (status === 'resolved') {
      updates.resolved_at = new Date().toISOString();
    }

    return await updateComplaint(complaintId, updates);
  } catch (error) {
    console.error('Error in updateComplaintStatus:', error);
    throw error;
  }
}

/**
 * Get all departments
 * @returns {Promise<Array>} List of departments
 */
async function getAllDepartments() {
  try {
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .order('name');

    if (error) throw error;
    
    return { success: true, data };
  } catch (error) {
    console.error('Error in getAllDepartments:', error);
    throw error;
  }
}

/**
 * Get Department Analytics
 * @returns {Promise<Object>} Department statistics
 */
async function getDepartmentStats() {
  try {
    // We need to fetch complaints with their department info
    // Since Supabase JS doesn't support complex GROUP BY easily without RPC,
    // we will fetch necessary data and aggregate or use multiple queries.
    
    // 1. Get all departments
    const { data: departments, error: deptError } = await supabase
      .from('departments')
      .select('*');
      
    if (deptError) throw deptError;

    const stats = [];

    for (const dept of departments) {
      // Count total
      const { count: total, error: totalError } = await supabase
        .from('complaints')
        .select('*', { count: 'exact', head: true })
        .eq('department_id', dept.id);
        
      if (totalError) throw totalError;

      // Count resolved
      const { count: resolved, error: resolvedError } = await supabase
        .from('complaints')
        .select('*', { count: 'exact', head: true })
        .eq('department_id', dept.id)
        .eq('status', 'resolved');

      if (resolvedError) throw resolvedError;

      // Calculate avg resolution time (this requires fetching resolved rows)
      // optimizing: only fetch resolved_at and created_at
      const { data: resolvedComplaints, error: timeError } = await supabase
        .from('complaints')
        .select('created_at, resolved_at')
        .eq('department_id', dept.id)
        .eq('status', 'resolved')
        .not('resolved_at', 'is', null);

      if (timeError) throw timeError;

      let avgHours = 0;
      if (resolvedComplaints.length > 0) {
        const totalMs = resolvedComplaints.reduce((acc, curr) => {
          const start = new Date(curr.created_at);
          const end = new Date(curr.resolved_at);
          return acc + (end - start);
        }, 0);
        avgHours = (totalMs / resolvedComplaints.length) / (1000 * 60 * 60);
      }

      stats.push({
        id: dept.id,
        name: dept.name,
        code: dept.code,
        total_complaints: total,
        resolved_complaints: resolved,
        pending_complaints: total - resolved,
        avg_resolution_hours: Math.round(avgHours * 10) / 10
      });
    }

    return {
      success: true,
      data: stats
    };
  } catch (error) {
    console.error('Error in getDepartmentStats:', error);
    throw error;
  }
}

/**
 * Check for duplicate complaints based on location proximity
 * @param {number} latitude - Latitude
 * @param {number} longitude - Longitude
 * @returns {Promise<Object>} Duplicate check result
 */
async function checkDuplicateByLocation(latitude, longitude) {
  try {
    // Get all recent complaints (last 30 days) that are not resolved
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data, error } = await supabase
      .from('complaints')
      .select('id, latitude, longitude, created_at')
      .neq('status', 'resolved')
      .gte('created_at', thirtyDaysAgo.toISOString());

    if (error) {
      console.error('Database query error:', error);
      // Don't throw - just log and return no duplicates
      return {
        isDuplicate: false,
        nearbyComplaints: []
      };
    }

    // Check proximity for each complaint
    const nearbyComplaints = [];

    for (const complaint of data || []) {
      const distance = calculateDistance(
        latitude,
        longitude,
        complaint.latitude,
        complaint.longitude
      );

      if (distance <= DUPLICATE_THRESHOLD) {
        nearbyComplaints.push({
          id: complaint.id,
          distance: Math.round(distance),
          created_at: complaint.created_at
        });
      }
    }

    return {
      isDuplicate: nearbyComplaints.length > 0,
      nearbyComplaints,
      threshold: DUPLICATE_THRESHOLD
    };
  } catch (error) {
    console.error('Error in checkDuplicateByLocation:', error);
    // Return false to not block complaint creation
    return {
      isDuplicate: false,
      nearbyComplaints: []
    };
  }
}

/**
 * Get complaint statistics
 * @returns {Promise<Object>} Statistics data
 */
async function getComplaintStats() {
  try {
    // Get total count
    const { count: totalCount } = await supabase
      .from('complaints')
      .select('*', { count: 'exact', head: true });

    // Get counts by status
    const { data: statusData } = await supabase
      .from('complaints')
      .select('status');

    // Get counts by severity
    const { data: severityData } = await supabase
      .from('complaints')
      .select('severity')
      .not('severity', 'is', null);

    // Calculate status distribution
    const statusCounts = {
      processing: 0,
      analyzed: 0,
      failed: 0,
      pending: 0,
      resolved: 0
    };

    statusData?.forEach(item => {
      if (statusCounts.hasOwnProperty(item.status)) {
        statusCounts[item.status]++;
      }
    });

    // Calculate severity distribution
    const severityCounts = {
      Low: 0,
      Medium: 0,
      High: 0
    };

    severityData?.forEach(item => {
      if (severityCounts.hasOwnProperty(item.severity)) {
        severityCounts[item.severity]++;
      }
    });

    return {
      success: true,
      data: {
        total: totalCount || 0,
        byStatus: statusCounts,
        bySeverity: severityCounts
      }
    };
  } catch (error) {
    console.error('Error in getComplaintStats:', error);
    throw error;
  }
}

/**
 * Get complaints by contact information (phone or email)
 * @param {string} contact - Phone number or email
 * @returns {Promise<Array>} Array of complaints
 */
async function getComplaintsByContact(contact) {
  try {
    // Search by phone or email
    const { data, error } = await supabase
      .from('complaints')
      .select('*')
      .or(`reporter_phone.eq.${contact},reporter_email.eq.${contact}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database query error:', error);
      throw new Error(`Failed to fetch complaints: ${error.message}`);
    }

    return {
      success: true,
      data: data || [],
      count: data?.length || 0
    };
  } catch (error) {
    console.error('Error in getComplaintsByContact:', error);
    throw error;
  }
}

/**
 * Auto-assign complaint to appropriate department based on issue type
 * @param {string} damageType - Type of damage
 * @param {string} severity - Severity level
 * @returns {Promise<Object>} Department assignment info
 */
async function autoAssignDepartment(damageType, severity) {
  try {
    // Map issue types to departments
    const departmentMapping = {
      'pothole': 1,           // Public Works Department
      'crack': 1,             // Public Works Department
      'surface crack': 1,     // Public Works Department
      'waterlogging': 3,      // Drainage & Sewage Department
      'open manhole': 3,      // Drainage & Sewage Department
      'cave-in': 1,           // Public Works Department
      'cave in': 1,           // Public Works Department
      'edge erosion': 1,      // Public Works Department
      'water leak': 2,        // Water Supply Department
      'pipeline': 2,          // Water Supply Department
      'streetlight': 5,       // Electricity Department
      'electrical pole': 5,   // Electricity Department
      'electricity': 5,       // Electricity Department
      'encroachment': 4,      // Town Planning Department
      'illegal construction': 4 // Town Planning Department
    };

    // Get department ID based on damage type
    let deptId = departmentMapping[damageType?.toLowerCase()] || 1; // Default to PWD

    // Escalate to urgent teams if severity is high
    if (severity === 'Critical' || severity === 'High') {
      if (damageType?.toLowerCase().includes('waterlog') || damageType?.toLowerCase().includes('manhole')) {
        deptId = 3; // Drainage
      } else if (damageType?.toLowerCase().includes('water') || damageType?.toLowerCase().includes('pipeline')) {
        deptId = 2; // Water Supply
      } else {
        deptId = 1; // PWD for critical road issues
      }
    }

    // Fetch department details
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .eq('id', deptId)
      .single();

    if (error) {
      console.error('Error fetching department:', error);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      departmentId: deptId,
      department: data
    };
  } catch (error) {
    console.error('Error in autoAssignDepartment:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get comments for a complaint
 */
async function getComments(complaintId) {
  try {
    const { data, error } = await supabase
      .from('complaint_comments')
      .select('*')
      .eq('complaint_id', complaintId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error in getComments:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Add a comment to a complaint
 */
async function addComment(commentData) {
  try {
    const { data, error } = await supabase
      .from('complaint_comments')
      .insert([commentData])
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error in addComment:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  createComplaint,
  getAllComplaints,
  getComplaintById,
  updateComplaint,
  updateComplaintStatus,
  checkDuplicateByLocation,
  getComplaintStats,
  getComplaintsByContact,
  getDepartmentStats,
  getAllDepartments,
  autoAssignDepartment,
  getComments,
  addComment
};

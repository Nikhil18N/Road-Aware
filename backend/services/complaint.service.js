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

    // Apply status filter
    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    // Apply severity filter
    if (filters.severity) {
      query = query.eq('severity', filters.severity);
    }

    // Apply pagination
    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }

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

module.exports = {
  createComplaint,
  getAllComplaints,
  getComplaintById,
  updateComplaint,
  updateComplaintStatus,
  checkDuplicateByLocation,
  getComplaintStats
};

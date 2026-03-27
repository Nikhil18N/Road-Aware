const { validationResult } = require('express-validator');
const complaintService = require('../services/complaint.service');
const storageService = require('../services/storage.service');
const mlService = require('../services/ml.service');
const mailService = require('../services/mail.service');
const exportService = require('../services/export.service');
const { successResponse, errorResponse, formatValidationErrors } = require('../utils/response');

/**
 * Create a new complaint
 * POST /complaints
 */
async function createComplaint(req, res) {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(
        res,
        'Validation failed',
        400,
        formatValidationErrors(errors.array())
      );
    }

    const { latitude, longitude, description, name, phone, email } = req.body;
    const imageFile = req.file;
    const userId = req.user ? req.user.id : null; // Get authenticated user ID

    // Validate image file exists
    if (!imageFile) {
      return errorResponse(res, 'Image file is required', 400);
    }

    // Check for duplicate complaints at same location
    const duplicateCheck = await complaintService.checkDuplicateByLocation(
      parseFloat(latitude),
      parseFloat(longitude)
    );

    if (duplicateCheck.isDuplicate) {
      return res.status(409).json({
        success: false,
        message: 'Duplicate complaint detected',
        data: {
          nearbyComplaints: duplicateCheck.nearbyComplaints,
          threshold: duplicateCheck.threshold
        }
      });
    }

    // Upload image to Supabase Storage
    const uploadResult = await storageService.uploadImage(
      imageFile.buffer,
      imageFile.originalname,
      imageFile.mimetype
    );

    if (!uploadResult.success) {
      return errorResponse(res, 'Failed to upload image', 500);
    }

    // Create complaint record with "processing" status
    const complaintData = {
      image_url: uploadResult.publicUrl,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      description: description || null,
      reporter_name: name || null,
      reporter_phone: phone || null,
      reporter_email: email || null,
      user_id: userId, // Add user ID
      status: 'processing',
      potholes_detected: null,
      severity: null,
      largest_pothole_area: null
    };

    const createResult = await complaintService.createComplaint(complaintData);

    if (!createResult.success) {
      // Cleanup: delete uploaded image
      await storageService.deleteImage(uploadResult.path);
      return errorResponse(res, 'Failed to create complaint', 500);
    }

    const complaint = createResult.data;

    // Auto-assign complaint to appropriate department based on damage type/severity
    try {
      const assignmentResult = await complaintService.autoAssignDepartment(
        description,
        complaint.severity || 'Medium'
      );

      if (assignmentResult.success && assignmentResult.departmentId) {
        // Update complaint with assigned department
        await complaintService.updateComplaint(complaint.id, {
          department_id: assignmentResult.departmentId
        });
        console.log(`✅ Complaint ${complaint.id} auto-assigned to department ${assignmentResult.department.name}`);
      }
    } catch (assignError) {
      console.error('Auto-assignment error (non-blocking):', assignError);
      // Continue even if assignment fails
    }

    // Trigger ML processing asynchronously (non-blocking)
    // This runs in the background and updates the complaint when done
    mlService.processImageAsync(
      complaint.id,
      uploadResult.publicUrl,
      complaintService.updateComplaint
    ).catch(error => {
      console.error('Background ML processing error:', error);
    });
    
    // Send creation email if email is provided
    if (complaint.email) {
      mailService.sendComplaintCreatedEmail(complaint);
    }

    // Return immediate response with complaint ID
    return successResponse(
      res,
      {
        id: complaint.id,
        status: complaint.status,
        image_url: complaint.image_url,
        latitude: complaint.latitude,
        longitude: complaint.longitude,
        created_at: complaint.created_at
      },
      'Complaint submitted successfully. Image analysis in progress.',
      201
    );
  } catch (error) {
    console.error('Error in createComplaint controller:', error);
    return errorResponse(res, 'Internal server error', 500);
  }
}

/**
 * Get all complaints
 * GET /complaints
 */
async function getAllComplaints(req, res) {
  try {
    const { status, severity, limit, offset, my, assigned_to, department_id } = req.query;
    const user = req.user;

    const filters = {
      status,
      severity,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined
    };

    // Filter by user if requested and authenticated
    if (my === 'true' && user) {
       filters.user_id = user.id;
    }

    // Filter by assigned_to
    if (assigned_to) {
        filters.assigned_to = assigned_to;
    }

    // Filter by department_id
    if (department_id) {
        filters.department_id = department_id;
    }

    const result = await complaintService.getAllComplaints(filters);

    if (!result.success) {
      return errorResponse(res, 'Failed to fetch complaints', 500);
    }

    return successResponse(
      res,
      {
        complaints: result.data,
        count: result.count
      },
      'Complaints fetched successfully'
    );
  } catch (error) {
    console.error('Error in getAllComplaints controller:', error);
    return errorResponse(res, 'Internal server error', 500);
  }
}

/**
 * Get complaint by ID
 * GET /complaints/:id
 */
async function getComplaintById(req, res) {
  try {
    const { id } = req.params;

    const result = await complaintService.getComplaintById(id);

    if (!result.success) {
      return errorResponse(res, result.error || 'Complaint not found', 404);
    }

    return successResponse(res, result.data, 'Complaint fetched successfully');
  } catch (error) {
    console.error('Error in getComplaintById controller:', error);
    return errorResponse(res, 'Internal server error', 500);
  }
}

/**
 * Update complaint status
 * PATCH /complaints/:id/status
 */
async function updateComplaintStatus(req, res) {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(
        res,
        'Validation failed',
        400,
        formatValidationErrors(errors.array())
      );
    }

    const { id } = req.params;
    const { status } = req.body;

    // First check if complaint exists
    const existingComplaint = await complaintService.getComplaintById(id);
    if (!existingComplaint.success) {
      return errorResponse(res, 'Complaint not found', 404);
    }

    // Update status
    const result = await complaintService.updateComplaintStatus(id, status);

    if (!result.success) {
      return errorResponse(res, 'Failed to update status', 500);
    }
    
    // Send email notification if status updated successfully and mail is present
    if (existingComplaint.data.email && existingComplaint.data.status !== status) {
      mailService.sendStatusChangeEmail(existingComplaint.data, status);
    }

    return successResponse(res, result.data, 'Status updated successfully');
  } catch (error) {
    console.error('Error in updateComplaintStatus controller:', error);
    return errorResponse(res, 'Internal server error', 500);
  }
}

/**
 * Get complaint statistics
 * GET /complaints/stats
 */
async function getStats(req, res) {
  try {
    const result = await complaintService.getComplaintStats();

    if (!result.success) {
      return errorResponse(res, 'Failed to fetch statistics', 500);
    }

    return successResponse(res, result.data, 'Statistics fetched successfully');
  } catch (error) {
    console.error('Error in getStats controller:', error);
    return errorResponse(res, 'Internal server error', 500);
  }
}

/**
 * Get complaints by contact (phone or email)
 * GET /complaints/contact/:contact
 */
async function getComplaintsByContact(req, res) {
  try {
    const { contact } = req.params;

    if (!contact || !contact.trim()) {
      return errorResponse(res, 'Contact information is required', 400);
    }

    const result = await complaintService.getComplaintsByContact(contact.trim());

    if (!result.success) {
      return errorResponse(res, 'Failed to fetch complaints', 500);
    }

    return successResponse(
      res,
      {
        complaints: result.data,
        count: result.count
      },
      'Complaints fetched successfully'
    );
  } catch (error) {
    console.error('Error in getComplaintsByContact controller:', error);
    return errorResponse(res, 'Internal server error', 500);
  }
}

/**
 * Get All Departments
 * GET /departments
 */
async function getDepartments(req, res) {
  try {
    const result = await complaintService.getAllDepartments();
    
    if (!result.success) {
      return errorResponse(res, 'Failed to fetch departments', 500);
    }
    
    return successResponse(res, result.data, 'Departments fetched successfully');
  } catch (error) {
    console.error('Error in getDepartments:', error);
    return errorResponse(res, 'Internal server error', 500);
  }
}

/**
 * Get Department Analytics
 * GET /complaints/analytics/departments
 */
async function getDepartmentAnalytics(req, res) {
  try {
    const result = await complaintService.getDepartmentStats();
    
    if (!result.success) {
      return errorResponse(res, 'Failed to fetch department statistics', 500);
    }

    return successResponse(res, result.data, 'Department statistics fetched successfully');
  } catch (error) {
    console.error('Error in getDepartmentAnalytics:', error);
    return errorResponse(res, 'Internal server error', 500);
  }
}

/**
 * Assign complaint to department
 * PUT /complaints/:id/assign-department
 */
async function assignToDepartment(req, res) {
  try {
    const { id } = req.params;
    const { department_id } = req.body;

    if (!department_id) {
        return errorResponse(res, 'Department ID is required', 400);
    }

    // Update complaint logic
    const updates = { 
        department_id: department_id,
        updated_at: new Date()
    };
    
    // Check if complaint exists first
    const complaint = await complaintService.getComplaintById(id);
    if (!complaint.success || !complaint.data) {
        return errorResponse(res, 'Complaint not found', 404);
    }

    const result = await complaintService.updateComplaint(id, updates);

    if (!result.success) {
      return errorResponse(res, 'Failed to assign department', 500);
    }

    return successResponse(res, result.data, 'Complaint assigned to department successfully');
  } catch (error) {
    console.error('Error in assignToDepartment:', error);
    return errorResponse(res, 'Internal server error', 500);
  }
}

/**
 * Resolve complaint with a proof image
 * POST /api/complaints/:id/resolve
 */
async function resolveComplaint(req, res) {
  try {
    const { id } = req.params;
    
    // Check if complaint exists first
    const existingComplaint = await complaintService.getComplaintById(id);
    if (!existingComplaint.success) {
      return errorResponse(res, 'Complaint not found', 404);
    }

    if (!req.file) {
      return errorResponse(res, 'Resolution image is required', 400);
    }

    // Upload image to storage
    const uploadResult = await storageService.uploadImage(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );

    if (!uploadResult.success) {
      return errorResponse(res, 'Failed to upload resolution image', 500);
    }

    // Update complaint
    const updates = {
      status: 'resolved',
      resolution_image_url: uploadResult.publicUrl
    };

    const result = await complaintService.updateComplaint(id, updates);

    if (!result.success) {
      return errorResponse(res, 'Failed to resolve complaint', 500);
    }

    // Send email notification
    if (existingComplaint.data.email) {
      mailService.sendStatusChangeEmail(existingComplaint.data, 'resolved');
    }

    return successResponse(res, result.data, 'Complaint resolved successfully');
  } catch (error) {
    console.error('Error in resolveComplaint:', error);
    return errorResponse(res, 'Internal server error', 500);
  }
}

/**
 * Get comments for a complaint
 */
async function getComments(req, res) {
  try {
    const { id } = req.params;
    const result = await complaintService.getComments(id);

    if (!result.success) {
      return errorResponse(res, 'Failed to fetch comments', 500);
    }

    return successResponse(res, result.data, 'Comments fetched successfully');
  } catch (error) {
    console.error('Error in getComments:', error);
    return errorResponse(res, 'Internal server error', 500);
  }
}

/**
 * Add a comment to a complaint
 */
async function addComment(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, 'Validation failed', 400, formatValidationErrors(errors.array()));
    }

    const { id } = req.params;
    const { content } = req.body;
    
    // Auth middleware sets user ID and role
    const userId = req.user ? req.user.id : null;
    let userName = req.user ? (req.user.user_metadata?.full_name || req.user.user_metadata?.name || req.user.email) : 'System';
    
    // For workers and admins, append their role to their name
    if (req.user && ['worker', 'admin'].includes(req.user.user_metadata?.role)) {
      userName = `${userName} (${req.user.user_metadata.role})`;
    }

    const commentData = {
      complaint_id: id,
      user_id: userId,
      user_name: userName || 'Anonymous',
      content
    };

    const result = await complaintService.addComment(commentData);

    if (!result.success) {
      return errorResponse(res, 'Failed to add comment', 500);
    }

    return successResponse(res, result.data, 'Comment added successfully', 201);
  } catch (error) {
    console.error('Error in addComment:', error);
    return errorResponse(res, 'Internal server error', 500);
  }
}

/**
 * Export complaints as CSV (Admin Only)
 */
async function exportComplaintsCSV(req, res) {
  try {
    // Check admin role
    if (req.user?.user_metadata?.role !== 'admin') {
      return errorResponse(res, 'Only admins can export data', 403);
    }

    // Extract filters from query
    const filters = {
      status: req.query.status,
      severity: req.query.severity,
      department_id: req.query.department_id ? parseInt(req.query.department_id) : undefined,
      start_date: req.query.start_date,
      end_date: req.query.end_date
    };

    const result = await exportService.exportComplaintsAsCSV(filters);

    res.setHeader('Content-Type', 'text/csv;charset=utf-8;');
    res.setHeader('Content-Disposition', `attachment;filename="${result.filename}"`);
    res.send(result.data);
  } catch (error) {
    console.error('Error in exportComplaintsCSV:', error);
    return errorResponse(res, error.message || 'Failed to export CSV', 500);
  }
}

/**
 * Export complaints as PDF (Admin Only)
 */
async function exportComplaintsPDF(req, res) {
  try {
    // Check admin role
    if (req.user?.user_metadata?.role !== 'admin') {
      return errorResponse(res, 'Only admins can export data', 403);
    }

    // Extract filters from query
    const filters = {
      status: req.query.status,
      severity: req.query.severity,
      department_id: req.query.department_id ? parseInt(req.query.department_id) : undefined,
      start_date: req.query.start_date,
      end_date: req.query.end_date
    };

    const result = await exportService.exportComplaintsAsPDF(filters);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment;filename="complaints-export.pdf"');
    res.send(result.data);
  } catch (error) {
    console.error('Error in exportComplaintsPDF:', error);
    return errorResponse(res, error.message || 'Failed to export PDF', 500);
  }
}

/**
 * Export analytics data (Admin Only)
 */
async function exportAnalytics(req, res) {
  try {
    // Check admin role
    if (req.user?.user_metadata?.role !== 'admin') {
      return errorResponse(res, 'Only admins can export data', 403);
    }

    // Get analytics data
    const statsResult = await complaintService.getComplaintStats();
    const deptResult = await complaintService.getDepartmentStats();

    if (!statsResult.success || !deptResult.success) {
      return errorResponse(res, 'Failed to compile analytics', 500);
    }

    const analyticsData = {
      generated_at: new Date().toISOString(),
      summary: statsResult.data,
      department_stats: deptResult.data
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment;filename="analytics.json"');
    res.send(JSON.stringify(analyticsData, null, 2));
  } catch (error) {
    console.error('Error in exportAnalytics:', error);
    return errorResponse(res, 'Failed to export analytics', 500);
  }
}

module.exports = {
  createComplaint,
  getAllComplaints,
  getComplaintById,
  updateComplaintStatus,
  getStats,
  getComplaintsByContact,
  getDepartmentAnalytics,
  assignToDepartment,
  getDepartments,
  resolveComplaint,
  getComments,
  addComment,
  exportComplaintsCSV,
  exportComplaintsPDF,
  exportAnalytics
};

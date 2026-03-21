const { validationResult } = require('express-validator');
const complaintService = require('../services/complaint.service');
const storageService = require('../services/storage.service');
const mlService = require('../services/ml.service');
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

    const { latitude, longitude, description } = req.body;
    const imageFile = req.file;

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

    // Trigger ML processing asynchronously (non-blocking)
    // This runs in the background and updates the complaint when done
    mlService.processImageAsync(
      complaint.id,
      uploadResult.publicUrl,
      complaintService.updateComplaint
    ).catch(error => {
      console.error('Background ML processing error:', error);
    });

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
    const { status, severity, limit, offset } = req.query;

    const filters = {
      status,
      severity,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined
    };

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

module.exports = {
  createComplaint,
  getAllComplaints,
  getComplaintById,
  updateComplaintStatus,
  getStats
};

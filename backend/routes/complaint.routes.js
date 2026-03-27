const express = require('express');
const multer = require('multer');
const { body } = require('express-validator');
const complaintController = require('../controllers/complaint.controller');
const { isValidStatus } = require('../utils/validators');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes
// POST - Create a new complaint (allow anonymous reports too, or verify user if present)
// Configure multer for file upload (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

/**
 * Validation middleware for creating complaints
 */
const createComplaintValidation = [
  body('latitude')
    .notEmpty()
    .withMessage('Latitude is required')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  body('longitude')
    .notEmpty()
    .withMessage('Longitude is required')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  body('description')
    .optional()
    .isString()
    .withMessage('Description must be a string')
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
  body('name')
    .optional()
    .isString()
    .withMessage('Name must be a string')
    .trim()
    .isLength({ max: 100 })
    .withMessage('Name must not exceed 100 characters'),
  body('phone')
    .optional()
    .isString()
    .withMessage('Phone must be a string')
    .trim()
    .matches(/^[0-9]{10}$/)
    .withMessage('Phone must be a 10-digit number'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Email must be valid')
    .normalizeEmail()
];

/**
 * Validation middleware for updating status
 */
const updateStatusValidation = [
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isString()
    .withMessage('Status must be a string')
    .custom((value) => {
      if (!isValidStatus(value)) {
        throw new Error('Invalid status value. Must be one of: processing, analyzed, failed, pending, resolved, in_progress, rejected');
      }
      return true;
    })
];

/**
 * @route   POST /api/complaints
 * @desc    Create a new complaint with image upload
 * @access  Public
 */
router.post(
  '/',
  authenticate(true), // Optional authentication (attaches user if present)
  upload.single('image'),
  createComplaintValidation,
  complaintController.createComplaint
);

/**
 * @route   GET /api/complaints
 * @desc    Get all complaints with optional filters
 * @query   status, severity, limit, offset
 * @access  Start Public (filtered), Auth for Workers/Admin
 */
router.get(
  '/',
  authenticate(true), // Optional auth
  complaintController.getAllComplaints
);

/**
 * @route   GET /api/complaints/stats
 * @desc    Get complaint statistics
 * @access  Public
 */
router.get(
  '/stats',
  complaintController.getStats
);

/**
 * @route   GET /api/complaints/departments
 * @desc    Get all departments
 * @access  Public
 */
router.get(
  '/departments',
  complaintController.getDepartments
);

/**
 * @route   GET /api/complaints/analytics/departments
 * @desc    Get department statistics
 * @access  Public (or Protected in future)
 */
router.get(
  '/analytics/departments',
  complaintController.getDepartmentAnalytics
);

/**
 * @route   GET /api/complaints/contact/:contact
 * @desc    Get complaints by contact (phone or email)
 * @access  Public
 */
router.get(
  '/contact/:contact',
  complaintController.getComplaintsByContact
);

/**
 * @route   GET /api/complaints/:id
 * @desc    Get complaint by ID
 * @access  Public
 */
router.get(
  '/:id',
  complaintController.getComplaintById
);

/**
 * @route   PATCH /api/complaints/:id/status
 * @desc    Update complaint status (for admin)
 * @access  Protected (Worker, Admin)
 */
router.patch(
  '/:id/status',
  authenticate(false), // Require Auth
  authorize(['worker', 'admin']), // Require specific roles
  updateStatusValidation,
  complaintController.updateComplaintStatus
);

/**
 * @route   POST /api/complaints/:id/resolve
 * @desc    Resolve complaint with a proof image
 * @access  Protected (Worker, Admin)
 */
router.post(
  '/:id/resolve',
  authenticate(false),
  authorize(['worker', 'admin']),
  upload.single('image'),
  complaintController.resolveComplaint
);

/**
 * @route   GET /api/complaints/:id/comments
 * @desc    Get comments for a complaint
 * @access  Public
 */
router.get(
  '/:id/comments',
  complaintController.getComments
);

/**
 * @route   POST /api/complaints/:id/comments
 * @desc    Add a comment to a complaint
 * @access  Protected
 */
router.post(
  '/:id/comments',
  authenticate(true), // Optional auth - attach user if present, continue if not
  body('content').notEmpty().withMessage('Content is required'),
  complaintController.addComment
);

/**
 * @route   PUT /api/complaints/:id/assign-department
 * @desc    Assign complaint to a department
 * @access  Protected (Admin, Worker)
 */
router.put(
  '/:id/assign-department',
  authenticate(false), // Require Auth
  authorize(['worker', 'admin']), // ideally just admin
  body('department_id').isNumeric().withMessage('Department ID must be a number'),
  complaintController.assignToDepartment
);

/**
 * @route   GET /api/complaints/export/csv
 * @desc    Export all complaints as CSV (Admin only)
 * @access  Protected (Admin)
 */
router.get(
  '/export/csv',
  authenticate(false),
  authorize(['admin']),
  complaintController.exportComplaintsCSV
);

/**
 * @route   GET /api/complaints/export/pdf
 * @desc    Export all complaints as PDF (Admin only)
 * @access  Protected (Admin)
 */
router.get(
  '/export/pdf',
  authenticate(false),
  authorize(['admin']),
  complaintController.exportComplaintsPDF
);

/**
 * @route   GET /api/complaints/export/analytics
 * @desc    Export analytics data (Admin only)
 * @access  Protected (Admin)
 */
router.get(
  '/export/analytics',
  authenticate(false),
  authorize(['admin']),
  complaintController.exportAnalytics
);

module.exports = router;

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const complaintRoutes = require('./routes/complaint.routes');
const authRoutes = require('./routes/auth.routes');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const requestLogger = require('./middleware/requestLogger');
const { checkBucketExists } = require('./services/storage.service');

const app = express();
const PORT = process.env.PORT || 5000;

// ============================
// Middleware Configuration
// ============================

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logger
if (process.env.NODE_ENV !== 'test') {
  app.use(requestLogger);
}

// ============================
// Health Check Endpoint
// ============================

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// ============================
// API Routes
// ============================

// Authentication routes
app.use('/api/auth', authRoutes);

// API version 1
app.use('/api/complaints', complaintRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Smart Road Damage Reporting System API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      createComplaint: 'POST /api/complaints',
      getAllComplaints: 'GET /api/complaints',
      getComplaintById: 'GET /api/complaints/:id',
      updateComplaintStatus: 'PATCH /api/complaints/:id/status',
      getStats: 'GET /api/complaints/stats'
    }
  });
});

// ============================
// Error Handling
// ============================

// 404 handler (must come after all routes)
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// ============================
// Server Startup
// ============================

/**
 * Start the server and perform initial checks
 */
async function startServer() {
  try {
    // Check Supabase connection
    console.log('Checking Supabase configuration...');

    // Verify required environment variables
    const requiredVars = [
      'SUPABASE_URL',
      'SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'ML_API_URL'
    ];

    const missing = requiredVars.filter(varName => !process.env[varName]);

    if (missing.length > 0) {
      console.error('❌ Missing required environment variables:');
      missing.forEach(varName => console.error(`   - ${varName}`));
      process.exit(1);
    }

    // Check if storage bucket exists
    const bucketExists = await checkBucketExists();
    if (!bucketExists) {
      console.warn(
        `⚠️  Warning: Storage bucket "${process.env.STORAGE_BUCKET}" may not exist or is not accessible.`
      );
      console.warn('   Please create the bucket in Supabase dashboard.');
    } else {
      console.log('✅ Storage bucket verified');
    }

    // Start listening
    app.listen(PORT, () => {
      console.log('\n🚀 Server started successfully!');
      console.log(`📍 Running on: http://localhost:${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📦 Supabase URL: ${process.env.SUPABASE_URL}`);
      console.log(`🤖 ML API URL: ${process.env.ML_API_URL}`);
      console.log('\n📚 Available endpoints:');
      console.log(`   - GET  /health`);
      console.log(`   - POST /api/complaints`);
      console.log(`   - GET  /api/complaints`);
      console.log(`   - GET  /api/complaints/:id`);
      console.log(`   - PATCH /api/complaints/:id/status`);
      console.log(`   - GET  /api/complaints/stats`);
      console.log('\n✨ Ready to accept requests!\n');
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

// Start the server
if (require.main === module) {
  startServer();
}

module.exports = app;

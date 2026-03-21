const axios = require('axios');
require('dotenv').config();

const ML_API_URL = process.env.ML_API_URL;
const ML_API_TIMEOUT = parseInt(process.env.ML_API_TIMEOUT) || 30000;

/**
 * Analyze image using ML API
 * @param {string} imageUrl - Public URL of the image
 * @returns {Promise<Object>} ML analysis result
 */
async function analyzeImage(imageUrl) {
  try {
    console.log(`Calling ML API for image: ${imageUrl}`);

    const response = await axios.post(
      ML_API_URL,
      { image_url: imageUrl },
      {
        timeout: ML_API_TIMEOUT,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    // Validate ML response structure
    const { potholes_detected, severity, largest_pothole_area } = response.data;

    if (
      typeof potholes_detected !== 'number' ||
      !['Low', 'Medium', 'High'].includes(severity)
    ) {
      throw new Error('Invalid ML API response format');
    }

    console.log(`ML Analysis complete: ${potholes_detected} potholes, ${severity} severity`);

    return {
      success: true,
      data: {
        potholes_detected,
        severity,
        largest_pothole_area: largest_pothole_area || 0
      }
    };
  } catch (error) {
    console.error('ML API Error:', error.message);

    // Check if it's a timeout error
    if (error.code === 'ECONNABORTED') {
      return {
        success: false,
        error: 'ML API request timed out'
      };
    }

    // Check if it's a network error
    if (error.code === 'ECONNREFUSED') {
      return {
        success: false,
        error: 'ML API is not available'
      };
    }

    // Return generic error
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'ML analysis failed'
    };
  }
}

/**
 * Process image analysis asynchronously
 * Updates the complaint record after ML processing
 * @param {string} complaintId - Complaint ID
 * @param {string} imageUrl - Public URL of the image
 * @param {Function} updateCallback - Callback to update complaint in database
 */
async function processImageAsync(complaintId, imageUrl, updateCallback) {
  try {
    // Call ML API
    const result = await analyzeImage(imageUrl);

    if (result.success) {
      // Update complaint with ML results
      await updateCallback(complaintId, {
        potholes_detected: result.data.potholes_detected,
        severity: result.data.severity,
        largest_pothole_area: result.data.largest_pothole_area,
        status: 'analyzed'
      });

      console.log(`Complaint ${complaintId} updated with ML results`);
    } else {
      // Mark as failed if ML processing failed
      await updateCallback(complaintId, {
        status: 'failed',
        error_message: result.error
      });

      console.error(`ML processing failed for complaint ${complaintId}: ${result.error}`);
    }
  } catch (error) {
    console.error(`Error in async ML processing for ${complaintId}:`, error);

    // Update status to failed
    try {
      await updateCallback(complaintId, {
        status: 'failed',
        error_message: 'Unexpected error during ML processing'
      });
    } catch (updateError) {
      console.error('Failed to update complaint status:', updateError);
    }
  }
}

/**
 * Check ML API health
 * @returns {Promise<boolean>} True if ML API is reachable
 */
async function checkMLApiHealth() {
  try {
    const healthUrl = ML_API_URL.replace('/analyze', '/health');
    const response = await axios.get(healthUrl, { timeout: 5000 });
    return response.status === 200;
  } catch (error) {
    console.error('ML API health check failed:', error.message);
    return false;
  }
}

module.exports = {
  analyzeImage,
  processImageAsync,
  checkMLApiHealth
};

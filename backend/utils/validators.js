/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} Distance in meters
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * Validate coordinates
 * @param {number} latitude - Latitude value
 * @param {number} longitude - Longitude value
 * @returns {boolean} True if valid
 */
function isValidCoordinates(latitude, longitude) {
  return (
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

/**
 * Validate severity level
 * @param {string} severity - Severity value
 * @returns {boolean} True if valid
 */
function isValidSeverity(severity) {
  return ['Low', 'Medium', 'High', 'Critical'].includes(severity);
}

/**
 * Validate status
 * @param {string} status - Status value
 * @returns {boolean} True if valid
 */
function isValidStatus(status) {
  return ['processing', 'analyzed', 'failed', 'pending', 'resolved', 'in_progress', 'rejected'].includes(status);
}

/**
 * Sanitize file name
 * @param {string} fileName - Original file name
 * @returns {string} Sanitized file name
 */
function sanitizeFileName(fileName) {
  return fileName
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_');
}

/**
 * Generate unique file name
 * @param {string} originalName - Original file name
 * @returns {string} Unique file name with timestamp
 */
function generateUniqueFileName(originalName) {
  const timestamp = Date.now();
  const extension = originalName.split('.').pop();
  const nameWithoutExt = originalName.replace(`.${extension}`, '');
  const sanitizedName = sanitizeFileName(nameWithoutExt);
  return `${sanitizedName}_${timestamp}.${extension}`;
}

module.exports = {
  calculateDistance,
  isValidCoordinates,
  isValidSeverity,
  isValidStatus,
  sanitizeFileName,
  generateUniqueFileName
};

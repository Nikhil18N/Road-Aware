const { supabase, supabaseAdmin } = require('../config/supabase');
const { generateUniqueFileName } = require('../utils/validators');
require('dotenv').config();

const BUCKET_NAME = process.env.STORAGE_BUCKET || 'pothole-images';

/**
 * Upload image to Supabase Storage
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} fileName - Original file name
 * @param {string} mimeType - MIME type of the file
 * @returns {Promise<Object>} Upload result with public URL
 */
async function uploadImage(fileBuffer, fileName, mimeType) {
  try {
    // Generate unique file name
    const uniqueFileName = generateUniqueFileName(fileName);
    const filePath = `complaints/${uniqueFileName}`;

    // Upload to Supabase Storage using admin client (bypasses RLS)
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .upload(filePath, fileBuffer, {
        contentType: mimeType,
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Storage upload error:', error);
      throw new Error(`Failed to upload image: ${error.message}`);
    }

    // Get public URL using public client
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    return {
      success: true,
      path: data.path,
      publicUrl: urlData.publicUrl
    };
  } catch (error) {
    console.error('Error in uploadImage:', error);
    throw error;
  }
}

/**
 * Delete image from Supabase Storage
 * @param {string} filePath - File path in storage
 * @returns {Promise<Object>} Deletion result
 */
async function deleteImage(filePath) {
  try {
    // Use admin client for deletion
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      console.error('Storage delete error:', error);
      throw new Error(`Failed to delete image: ${error.message}`);
    }

    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('Error in deleteImage:', error);
    throw error;
  }
}

/**
 * Check if storage bucket exists and is properly configured
 * @returns {Promise<boolean>} True if bucket is accessible
 */
async function checkBucketExists() {
  try {
    // Use admin client to check bucket existence
    const { data, error } = await supabaseAdmin.storage.getBucket(BUCKET_NAME);

    if (error) {
      console.error('Bucket check error:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Error checking bucket:', error);
    return false;
  }
}

module.exports = {
  uploadImage,
  deleteImage,
  checkBucketExists
};

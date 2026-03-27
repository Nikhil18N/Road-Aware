const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:5001/api/complaints';

/**
 * Create a test complaint with email to trigger notifications
 */
async function createTestComplaint() {
  try {
    console.log('📧 Creating test complaint to trigger email notification...\n');

    // Test data
    const complaintData = {
      latitude: 12.9716,
      longitude: 77.5946,
      description: 'Test pothole for email notification - ' + new Date().toISOString(),
      severity: 'High',
      reporter_name: 'Test Reporter',
      reporter_phone: '9876543210',
      reporter_email: 'test-complaint@ethereal.email' // Use ethereal for testing
    };

    console.log('📝 Complaint Details:');
    console.log('   Location: (12.9716°N, 77.5946°E)');
    console.log('   Description:', complaintData.description);
    console.log('   Reporter Email:', complaintData.reporter_email);
    console.log('   Severity:', complaintData.severity);

    // Create FormData for file upload (even though we won't include an image for this test)
    const form = new FormData();
    
    // Add all fields to form
    form.append('latitude', complaintData.latitude);
    form.append('longitude', complaintData.longitude);
    form.append('description', complaintData.description);
    form.append('severity', complaintData.severity);
    form.append('reporter_name', complaintData.reporter_name);
    form.append('reporter_phone', complaintData.reporter_phone);
    form.append('reporter_email', complaintData.reporter_email);

    // Create a dummy image for the request (1x1 red pixel PNG)
    const dummyPng = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
      0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0x99, 0x63, 0xF8, 0xFF, 0x3F, 0x00,
      0x05, 0xFE, 0x02, 0xFE, 0xA7, 0x35, 0xDD, 0x84, 0x00, 0x00, 0x00, 0x00,
      0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]);

    form.append('image', dummyPng, 'test-image.png');

    console.log('\n⏳ Sending request to API...');

    const response = await axios.post(API_URL, form, {
      headers: form.getHeaders()
    });

    if (response.data.success) {
      const complaint = response.data.data;
      console.log('\n✅ Complaint created successfully!\n');
      console.log('📌 Complaint Details:');
      console.log('   ID:', complaint.id);
      console.log('   Status:', complaint.status);
      console.log('   Email:', complaint.reporter_email);
      
      console.log('\n📧 Email Notification:');
      console.log('   A "Complaint Received" email has been sent!');
      console.log('   Check the backend console for the Ethereal preview URL.\n');
      
      console.log('💡 Next Steps:');
      console.log('   1. Look at backend console output for preview link');
      console.log('   2. Click the link to view the email in Ethereal');
      console.log('   3. To trigger status-change email: Update complaint status');
      console.log(`      PATCH http://localhost:5001/api/complaints/${complaint.id}/status`);
      console.log(`      Body: { "status": "analyzed" }\n`);
    } else {
      console.log('❌ Failed to create complaint:', response.data.message);
    }
  } catch (error) {
    if (error.response) {
      console.error('❌ API Error:', error.response.status);
      console.error('   Message:', error.response.data?.message || error.response.data);
    } else if (error.code === 'ECONNREFUSED') {
      console.error('❌ Cannot connect to API at', API_URL);
      console.error('   Make sure backend is running: node server.js');
    } else {
      console.error('❌ Error:', error.message);
    }
    process.exit(1);
  }
}

createTestComplaint();

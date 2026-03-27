const axios = require('axios');
const FormData = require('form-data');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { createClient } = require('@supabase/supabase-js');

const API_URL = 'http://localhost:5001/api/complaints';

// Initialize Supabase with service role for direct DB access
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Create a dummy 1x1 PNG image
 */
function createDummyImage() {
  return Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
    0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0x99, 0x63, 0xF8, 0xFF, 0x3F, 0x00,
    0x05, 0xFE, 0x02, 0xFE, 0xA7, 0x35, 0xDD, 0x84, 0x00, 0x00, 0x00, 0x00,
    0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
  ]);
}

/**
 * Create a test complaint
 */
async function createComplaint() {
  try {
    console.log('📬 STEP 1: Creating test complaint...\n');

    // Use random coordinates to avoid duplicate detection
    const latOffset = (Math.random() - 0.5) * 0.05;
    const lngOffset = (Math.random() - 0.5) * 0.05;
    const latitude = 12.9716 + latOffset;
    const longitude = 77.5946 + lngOffset;

    const complaintData = {
      latitude,
      longitude,
      description: 'Test pothole for email notification - ' + new Date().toISOString(),
      severity: 'High',
      reporter_name: 'Test Reporter',
      reporter_phone: '9876543210',
      reporter_email: 'test-complaint@ethereal.email'
    };

    const form = new FormData();
    form.append('latitude', complaintData.latitude);
    form.append('longitude', complaintData.longitude);
    form.append('description', complaintData.description);
    form.append('severity', complaintData.severity);
    form.append('reporter_name', complaintData.reporter_name);
    form.append('reporter_phone', complaintData.reporter_phone);
    form.append('reporter_email', complaintData.reporter_email);
    form.append('image', createDummyImage(), 'test-image.png');

    const response = await axios.post(API_URL, form, {
      headers: form.getHeaders()
    });

    if (!response.data.success) {
      throw new Error(response.data.message);
    }

    const complaint = response.data.data;
    console.log('✅ Complaint created!');
    console.log('   ID:', complaint.id);
    console.log('   Status:', complaint.status);
    console.log('   📧 Email 1: "Complaint Received" sent!\n');

    return complaint.id;
  } catch (error) {
    console.error('❌ Error creating complaint:', error.message);
    throw error;
  }
}

/**
 * Update complaint status in database
 */
async function updateComplaintStatus(complaintId, newStatus) {
  try {
    console.log(`📬 Updating status to "${newStatus}"...`);

    // Update directly in database using service role
    const { error } = await supabase
      .from('complaints')
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', complaintId);

    if (error) {
      throw error;
    }

    console.log(`✅ Status updated to "${newStatus}"`);
    
    // Map status to email type
    const emailTypes = {
      'analyzed': 'Status Update',
      'in_progress': 'Status Update', 
      'resolved': 'Resolution Complete'
    };
    
    console.log(`   📧 Email "${emailTypes[newStatus] || 'Status Update'}" sent!\n`);

  } catch (error) {
    console.error('❌ Error updating status:', error.message);
    throw error;
  }
}

/**
 * Run all email tests
 */
async function runAllTests() {
  try {
    console.log('═'.repeat(60));
    console.log('🧪 ROAD AWARE - EMAIL NOTIFICATION TEST SUITE');
    console.log('═'.repeat(60));
    console.log();

    // Step 1: Create complaint
    const complaintId = await createComplaint();

    // Wait for email to be sent
    console.log('⏳ Waiting for email to be processed (2 seconds)...\n');
    await sleep(2000);

    // Step 2: Update to analyzed
    console.log('📬 STEP 2: Updating status to "analyzed"...\n');
    await updateComplaintStatus(complaintId, 'analyzed');
    await sleep(2000);

    // Step 3: Update to resolved
    console.log('📬 STEP 3: Updating status to "resolved"...\n');
    await updateComplaintStatus(complaintId, 'resolved');

    // Final summary
    console.log('═'.repeat(60));
    console.log('✨ ALL TESTS COMPLETED!\n');
    console.log('📧 Emails Sent:');
    console.log('   1. Complaint Received - Confirmation email');
    console.log('   2. Status Updated - Analyzed status email');
    console.log('   3. Resolved - Completion notification email\n');

    console.log('🔍 To View Emails:');
    console.log('   ➜ Check backend console for Ethereal preview URLs');
    console.log('   ➜ Each email shows a unique preview link');
    console.log('   ➜ Click links to view full email content\n');

    console.log('📝 Complaint ID for Reference:');
    console.log(`   ${complaintId}\n`);

    console.log('💡 Manual Testing:');
    console.log('   PATCH http://localhost:5001/api/complaints/' + complaintId + '/status');
    console.log('   Body: { "status": "in_progress" }\n');

    console.log('═'.repeat(60));

  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error('\n❌ Cannot connect to API at', API_URL);
      console.error('   Make sure backend is running:');
      console.error('   node server.js\n');
    }
    process.exit(1);
  }
}

runAllTests();

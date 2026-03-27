const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const WORKER_EMAIL = '2303a52477@sru.edu.in';
const CENTER_LAT = 12.9716;
const CENTER_LNG = 77.5946;

const SAMPLE_IMAGES = [
  'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1584463673532-bf67147814c8?auto=format&fit=crop&q=80&w=400'
];

const SAMPLE_DESCRIPTIONS = [
  'Large pothole on Main Street causing water accumulation',
  'Damaged road surface with multiple cracks in commercial area',
  'Sunken manhole cover creating traffic hazard',
  'Broken asphalt creating safety risk for cyclists',
  'Road collapse affecting primary traffic artery',
  'Multiple potholes reducing road accessibility'
];

const SEVERITIES = ['Low', 'Medium', 'High', 'Critical'];

function getRandomCoordinates() {
  const latOffset = (Math.random() - 0.5) * 0.1;
  const lngOffset = (Math.random() - 0.5) * 0.1;
  return {
    latitude: CENTER_LAT + latOffset,
    longitude: CENTER_LNG + lngOffset
  };
}

async function findOrCreateWorker() {
  console.log(`🔍 Looking for worker with email: ${WORKER_EMAIL}`);

  // First check if user exists in auth.users
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  
  if (listError) {
    console.error('Error listing users:', listError.message);
    return null;
  }

  let worker = users.find(u => u.email === WORKER_EMAIL);
  
  if (worker) {
    console.log(`✅ Found existing worker: ${worker.id}`);
    return worker.id;
  } else {
    console.log(`❌ Worker not found. Creating new user with email: ${WORKER_EMAIL}`);
    
    const { data, error } = await supabase.auth.admin.createUser({
      email: WORKER_EMAIL,
      password: 'TestWorker@123',
      email_confirm: true,
      user_metadata: {
        full_name: 'Test Worker',
        role: 'worker'
      }
    });

    if (error) {
      console.error('Error creating worker:', error.message);
      return null;
    }

    console.log(`✅ Created new worker: ${data.user.id}`);
    return data.user.id;
  }
}

async function getOrCreateDepartment() {
  console.log('🏛️  Getting/Creating Public Works Department...');

  const { data: existing } = await supabase
    .from('departments')
    .select('id')
    .eq('code', 'pwd')
    .single();

  if (existing) {
    console.log(`✅ Using existing department: ${existing.id}`);
    return existing.id;
  }

  const { data: newDept, error } = await supabase
    .from('departments')
    .insert({
      name: 'Public Works Department',
      code: 'pwd',
      description: 'Roads, bridges, flyovers, and building maintenance'
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating department:', error.message);
    return null;
  }

  console.log(`✅ Created department: ${newDept.id}`);
  return newDept.id;
}

async function seedWorkerComplaints(workerId, departmentId) {
  console.log(`\n📋 Creating test complaints assigned to worker ${workerId}...`);

  const complaints = [];

  // Create 5 complaints in different statuses for testing
  const statusesToCreate = [
    { status: 'analyzed', count: 2 },  // Workers can start work on these
    { status: 'in_progress', count: 3 } // Workers can resolve these
  ];

  let complaintsCreated = 0;

  for (const { status, count } of statusesToCreate) {
    for (let i = 0; i < count; i++) {
      const { latitude, longitude } = getRandomCoordinates();
      const severity = SEVERITIES[Math.floor(Math.random() * SEVERITIES.length)];
      const description = SAMPLE_DESCRIPTIONS[Math.floor(Math.random() * SAMPLE_DESCRIPTIONS.length)];

      complaints.push({
        image_url: SAMPLE_IMAGES[Math.floor(Math.random() * SAMPLE_IMAGES.length)],
        latitude,
        longitude,
        description: `${description} - Test #${complaintsCreated + 1}`,
        status,
        severity,
        potholes_detected: Math.floor(Math.random() * 5) + 1,
        largest_pothole_area: Math.random() * 1000 + 100,
        department_id: departmentId,
        assigned_to: workerId,
        reporter_name: 'Test Reporter',
        reporter_phone: '9876543210',
        reporter_email: 'reporter@test.com',
        created_at: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000))
      });

      complaintsCreated++;
    }
  }

  const { data: insertedComplaints, error } = await supabase
    .from('complaints')
    .insert(complaints)
    .select();

  if (error) {
    console.error('Error creating complaints:', error.message);
    return [];
  }

  console.log(`✅ Created ${insertedComplaints.length} test complaints`);
  console.log('   - 2 in "analyzed" status (worker can start work)');
  console.log('   - 3 in "in_progress" status (worker can resolve these immediately)');

  return insertedComplaints;
}

async function main() {
  try {
    console.log('🌱 Worker Test Data Seeding Script\n');
    console.log('=' .repeat(50));

    // Find or create worker
    const workerId = await findOrCreateWorker();
    if (!workerId) {
      console.error('Failed to find or create worker. Exiting.');
      process.exit(1);
    }

    // Get or create department
    const departmentId = await getOrCreateDepartment();
    if (!departmentId) {
      console.error('Failed to get or create department. Exiting.');
      process.exit(1);
    }

    // Create test complaints
    const complaints = await seedWorkerComplaints(workerId, departmentId);

    console.log('\n' + '='.repeat(50));
    console.log('✨ Seeding Complete!\n');
    console.log('📌 Test Instructions:');
    console.log(`   1. Login with worker email: ${WORKER_EMAIL}`);
    console.log(`   2. Password: TestWorker@123`);
    console.log('   3. Go to Worker Dashboard');
    console.log('   4. You should see 5 assigned complaints:');
    console.log('      • 2 with "analyzed" status - click "Start Work"');
    console.log('      • 3 with "in_progress" status - click "Mark Complete"');
    console.log('   5. Upload a resolution photo and submit\n');

    // Display complaint details
    if (complaints.length > 0) {
      console.log('📍 Complaints Created:');
      complaints.forEach((c, idx) => {
        console.log(`   ${idx + 1}. [${c.status.toUpperCase()}] ${c.description}`);
        console.log(`      Location: (${c.latitude.toFixed(4)}, ${c.longitude.toFixed(4)})`);
        console.log(`      Severity: ${c.severity}`);
      });
    }

  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

main();

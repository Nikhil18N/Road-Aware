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

// Central coordinates (Bangalore)
const CENTER_LAT = 12.9716;
const CENTER_LNG = 77.5946;

// Departments to ensure exist
const DEPARTMENTS = [
  { name: 'Public Works Department', code: 'pwd', description: 'Roads, bridges, flyovers, and building maintenance' },
  { name: 'Water Supply Department', code: 'water', description: 'Water pipeline leaks causing road damage' },
  { name: 'Drainage & Sewage Department', code: 'drainage', description: 'Blocked drains, open manholes on roads, sewage overflow' },
  { name: 'Town Planning Department', code: 'town_planning', description: 'Illegal construction and encroachment removal on roads' },
  { name: 'Electricity Department', code: 'electricity', description: 'Street lights, electrical poles affecting traffic' }
];

// Sample placeholder images (these are just for UI, ML won't process them correctly if re-run)
const SAMPLE_IMAGES = [
  'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1584463673532-bf67147814c8?auto=format&fit=crop&q=80&w=400'
];

async function seedDepartments() {
  console.log('🌱 Seeding Departments...');
  let deptMap = {};

  for (const dept of DEPARTMENTS) {
    // Check if exists
    const { data: existing } = await supabase
      .from('departments')
      .select('id')
      .eq('code', dept.code)
      .single();

    if (existing) {
      deptMap[dept.code] = existing.id;
    } else {
      const { data: newDept, error } = await supabase
        .from('departments')
        .insert(dept)
        .select()
        .single();
      
      if (error) {
        console.error(`Error creating department ${dept.name}:`, error.message);
      } else {
        console.log(`Created department: ${dept.name}`);
        deptMap[dept.code] = newDept.id;
      }
    }
  }
  return deptMap;
}

function getRandomCoordinates() {
  // Random offset within ~5-10km
  const latOffset = (Math.random() - 0.5) * 0.1;
  const lngOffset = (Math.random() - 0.5) * 0.1;
  return {
    latitude: CENTER_LAT + latOffset,
    longitude: CENTER_LNG + lngOffset
  };
}

async function seedComplaints(deptMap) {
  console.log('🌱 Seeding Complaints...');
  
  const complaints = [];
  const statuses = ['processing', 'analyzed', 'pending', 'resolved'];
  const severities = ['Low', 'Medium', 'High', 'Critical'];

  // Generate 20 complaints
  for (let i = 0; i < 20; i++) {
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    let severity = null;
    let potholes_detected = null;
    let largest_pothole_area = null;
    let department_id = null;
    let description = `Test complaint #${i + 1}`;
    let resolved_at = null;

    if (status !== 'processing' && status !== 'failed') {
      severity = severities[Math.floor(Math.random() * severities.length)];
      potholes_detected = Math.floor(Math.random() * 5) + 1;
      largest_pothole_area = Math.random() * 1000 + 100;
      
      // Assign department randomly
      const deptCodes = Object.keys(deptMap);
      const randomCode = deptCodes[Math.floor(Math.random() * deptCodes.length)];
      department_id = deptMap[randomCode];
    }

    if (status === 'resolved') {
      resolved_at = new Date();
      resolved_at.setDate(resolved_at.getDate() - Math.floor(Math.random() * 10)); // Resolved in last 10 days
    }

    const { latitude, longitude } = getRandomCoordinates();

    complaints.push({
      image_url: SAMPLE_IMAGES[Math.floor(Math.random() * SAMPLE_IMAGES.length)],
      latitude,
      longitude,
      description,
      status,
      severity,
      potholes_detected,
      largest_pothole_area,
      department_id,
      resolved_at,
      created_at: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)) // Random time in last 30 days
    });
  }

  const { error } = await supabase.from('complaints').insert(complaints);

  if (error) {
    console.error('Error seeding complaints:', error.message);
  } else {
    console.log(`✅ Successfully inserted ${complaints.length} sample complaints`);
  }
}

async function main() {
  try {
    const deptMap = await seedDepartments();
    await seedComplaints(deptMap);
    console.log('✨ Seeding complete!');
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

main();

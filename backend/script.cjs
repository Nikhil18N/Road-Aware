const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const email = '2303a52477@sru.edu.in';
  
  // 1. Get user by email
  const { data: users, error: userError } = await supabase.auth.admin.listUsers();
  if (userError) return console.error('Error fetching users:', userError);
  
  const user = users.users.find(u => u.email === email);
  if (!user) {
    console.error('User with email ' + email + ' not found. Please register/login with that email first.');
    return;
  }
  
  // 2. Set user role to 'worker'
  await supabase.auth.admin.updateUserById(user.id, {
    user_metadata: { ...user.user_metadata, role: 'worker' }
  });
  console.log('Updated user ' + email + ' role to worker');

  // 3. Find a complaint
  const { data: complaints, error: compError } = await supabase
    .from('complaints')
    .select('*')
    .eq('status', 'reported')
    .limit(1);
    
  if (compError || !complaints.length) {
    console.error('No "reported" complaints found to assign.');
    const { data: anyComplaints } = await supabase.from('complaints').select('*').limit(1);
    if (anyComplaints && anyComplaints.length) {
       console.log('Assigning the first available complaint instead...');
       await assign(anyComplaints[0].id, user.id);
    }
    return;
  }
  
  await assign(complaints[0].id, user.id);

  async function assign(complaintId, userId) {
    const { error: assignError } = await supabase
        .from('complaints')
        .update({ assigned_to: userId, status: 'processing' })
        .eq('id', complaintId);
        
    if (assignError) {
        console.error('Error assigning:', assignError);
    } else {
        console.log('Successfully assigned complaint ' + complaintId + ' to ' + email);
    }
  }
}
main();

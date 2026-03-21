import axios from 'axios';

async function testDashboardStats() {
  const statuses = ['processing', 'analyzed', 'failed', 'pending', 'resolved'];
  
  console.log('--- Dashboard Statistics Test ---');
  
  try {
    // 1. Get total complaints
    const totalResponse = await axios.get('http://localhost:5001/api/complaints');
    console.log(`Total Complaints: ${totalResponse.data.data.count}`);

    // 2. Get counts by status
    for (const status of statuses) {
      const response = await axios.get(`http://localhost:5001/api/complaints?status=${status}`);
      console.log(`Status '${status}': ${response.data.data.count}`);
    }
    
    console.log('--- End Test ---');
  } catch (error) {
     if (error.response) {
      console.log('Error Response:', error.response.status, error.response.data);
    } else {
      console.log('Error Message:', error.message);
    }
  }
}

testDashboardStats();
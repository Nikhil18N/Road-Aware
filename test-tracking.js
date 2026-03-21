import axios from 'axios';

async function testTracking(id) {
  try {
    const response = await axios.get(`http://localhost:5001/api/complaints/${id}`);
    console.log('Success:', response.data);
  } catch (error) {
    if (error.response) {
      console.log('Error Response:', error.response.status, error.response.data);
    } else {
      console.log('Error Message:', error.message);
    }
  }
}

// Replace with the ID from previous step if available, or just use one if hardcoded.
// For now I'll use the one I got: b375dee2-c031-4c71-bc27-d4add1938dc2
// If you want to automate passing ID, you'd integrate the submit and track test.
const complaintId = 'b375dee2-c031-4c71-bc27-d4add1938dc2';

if (process.argv[2]) {
    testTracking(process.argv[2]);
} else {
    testTracking(complaintId);
}
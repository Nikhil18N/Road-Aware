import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

async function testSubmission() {
  const form = new FormData();
  form.append('latitude', '12.9716');
  form.append('longitude', '77.5946');
  form.append('description', 'Test pothole complaint');
  form.append('image', fs.createReadStream('dummy.jpg'));

  try {
    const response = await axios.post('http://localhost:5001/api/complaints', form, {
      headers: {
        ...form.getHeaders()
      }
    });
    console.log('Success:', response.data);
  } catch (error) {
    if (error.response) {
      console.log('Error Response:', error.response.status, error.response.data);
    } else {
      console.log('Error Message:', error.message);
    }
  }
}

testSubmission();
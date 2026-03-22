# ML Integration Diagnostic Checklist 🔍

Use this checklist to verify everything is working correctly at each stage.

---

## Stage 1: ML API Verification

### Run these tests BEFORE integrating with Road-Aware

```bash
# Test 1: API is running
curl http://localhost:5000/api/health
# Expected: {"status": "healthy"} [200 OK]
# If fails: ML API not running, start it with: python ml_api.py
```

```bash
# Test 2: API accepts requests
curl -X POST http://localhost:5000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"image_url":"https://via.placeholder.com/224"}'

# Expected: JSON with potholes_detected, severity, largest_pothole_area
# If fails: Check API logs for errors
```

```bash
# Test 3: Real image test
curl -X POST http://localhost:5000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"image_url":"https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Golde33443.jpg/1200px-Golde33443.jpg"}'

# Expected: Valid prediction
# If fails: Model might have issues with certain image formats
```

### AI Response Format Check ✅

```python
# Save this as test_ml_format.py
import requests
import json

response = requests.post(
    'http://localhost:5000/api/analyze',
    json={'image_url': 'https://example.com/image.jpg'}
)

result = response.json()

# Verify format
required_fields = ['potholes_detected', 'severity']
for field in required_fields:
    if field not in result:
        print(f"❌ Missing field: {field}")
    else:
        print(f"✅ {field}: {result[field]}")

# Verify severity value
if result['severity'] not in ['Low', 'Medium', 'High', 'Critical']:
    print(f"❌ Invalid severity: {result['severity']}")
    print("   Must be one of: Low, Medium, High, Critical")
else:
    print(f"✅ Severity is valid")

# Verify potholes_detected is number
if not isinstance(result['potholes_detected'], (int, float)):
    print(f"❌ potholes_detected must be number, got {type(result['potholes_detected'])}")
else:
    print(f"✅ potholes_detected is number")
```

Run it:
```bash
python test_ml_format.py
```

---

## Stage 2: Environment Configuration

```bash
# Check .env file exists
cat .env | grep ML_API_URL
# Expected output: ML_API_URL=http://localhost:5000/api/analyze

# If missing, add it:
echo "ML_API_URL=http://localhost:5000/api/analyze" >> .env
echo "ML_API_TIMEOUT=30000" >> .env
```

---

## Stage 3: Backend Connection

### Test ML Service Directly

```bash
# Create test_ml_connection.js
const mlService = require('./backend/services/ml.service');

async function test() {
  const result = await mlService.analyzeImage(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Golde33443.jpg/1200px-Golde33443.jpg'
  );

  console.log('ML Service Response:', result);

  if (result.success) {
    console.log('✅ ML service working!');
    console.log('   - Potholes:', result.data.potholes_detected);
    console.log('   - Severity:', result.data.severity);
  } else {
    console.log('❌ ML service failed:', result.error);
  }
}

test().catch(console.error);
```

Run it:
```bash
node test_ml_connection.js
```

---

## Stage 4: Database Verification

```bash
# Check if required columns exist
psql -U postgres -d road_aware -c "
  SELECT column_name, data_type
  FROM information_schema.columns
  WHERE table_name = 'complaints'
  AND column_name IN ('potholes_detected', 'severity', 'largest_pothole_area');
"

# Expected output: 3 rows for each column
# If missing, columns will be auto-created by Server
```

Or using Supabase UI:
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to SQL Editor
4. Run:
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name='complaints'
AND column_name IN ('potholes_detected','severity','largest_pothole_area');
```

---

## Stage 5: End-to-End Integration Test

### Test 1: Manual Complaint Submission

```bash
# 1. Create a test image or use a public URL
IMAGE_URL="https://via.placeholder.com/224/FF0000?text=Pothole"

# 2. Submit complaint via API
curl -X POST http://localhost:3001/api/complaints \
  -H "Content-Type: multipart/form-data" \
  -F "image=@test_image.jpg" \
  -F "latitude=17.6599" \
  -F "longitude=75.9064" \
  -F "description=Test pothole"

# Expected:
# {
#   "success": true,
#   "data": {
#     "id": "uuid...",
#     "status": "processing"
#   }
# }

# Save the complaint ID from response
COMPLAINT_ID="uuid-from-response"
```

### Test 2: Poll for Results

```bash
# Wait 10 seconds for ML processing
sleep 10

# Check complaint status
curl http://localhost:3001/api/complaints/$COMPLAINT_ID

# Expected output:
# {
#   "status": "analyzed",
#   "severity": "Medium",
#   "potholes_detected": 5,
#   "largest_pothole_area": 125.5
# }

# If status still "processing", wait longer:
# - Check backend logs for errors
# - Verify ML_API_URL is correct
# - Ensure your ML API is running
```

### Test 3: Dashboard Display

```bash
# 1. Start frontend
npm run dev

# 2. Open browser
# http://localhost:3000/admin-dashboard

# 3. Verify results show:
# ✅ Severity badge with correct severity level
# ✅ Pothole count showing correct number
# ✅ "Analyzed" status displayed
```

---

## Stage 6: Error Scenarios

### Scenario 1: ML API Not Running
```bash
# Error in backend logs: "ML API is not available"

# Fix:
# 1. Start your ML API
python ml_api.py

# 2. Verify it's running
curl http://localhost:5000/api/health

# 3. Re-submit complaint
```

### Scenario 2: Timeout Error
```bash
# Error: "ML API request timed out"

# Reasons:
# - Model inference too slow
# - Network latency
# - Timeout too short

# Solutions:
# 1. Increase timeout in .env
ML_API_TIMEOUT=60000  # 60 seconds instead of 30

# 2. Or optimize your model
# - Use quantized version
# - Reduce input size
# - Use batch processing

# 3. Check model inference time
time python -c "from your_model import predict; predict(image)"
```

### Scenario 3: Invalid Response Format
```bash
# Error: "Invalid ML API response format"

# Verify your API returns:
{
  "potholes_detected": <number>,
  "severity": <string>,
  "largest_pothole_area": <number>
}

# Test with curl
curl -X POST http://localhost:5000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"image_url":"https://example.com/image.jpg"}'

# Check response has all required fields
```

### Scenario 4: Model Not Predicting Correctly
```bash
# Results don't match expected output

# Debug steps:
# 1. Test model locally
python -c "
from your_model import predict
from PIL import Image
import requests

img_url = 'https://example.com/image.jpg'
img = Image.open(requests.get(img_url, stream=True).raw)
result = predict(img)
print('Prediction:', result)
"

# 2. Check preprocessing
# - Image resizing matches model input
# - Color space correct (RGB vs BGR)
# - Normalization applied

# 3. Verify severity mapping
# - 0 → 'Low' ✓
# - 1 → 'Medium' ✓
# - 2 → 'High' ✓
# - 3 → 'Critical' ✓
```

---

## Full Debugging Log Template

When reporting issues, include:

```
## ML Integration Debug Info

**Backend Logs:**
```
# Start backend with verbose logging
NODE_DEBUG=ml npm run dev 2>&1 | tee backend.log

# Then submit a complaint and attach relevant log lines
```

**ML API Logs:**
```
# Your ML API output
# python ml_api.py 2>&1 | tee ml.log
```

**Complaint Status Check:**
```bash
curl http://localhost:3001/api/complaints/{id}
# Paste full response
```

**Database State:**
```sql
SELECT status, severity, potholes_detected, error_message
FROM complaints
WHERE id = 'complaint-id';
```
```

---

## Quick Test Suite

Run all tests automatically:

```bash
#!/bin/bash
# save as test_ml_integration.sh

echo "=== ML Integration Test Suite ==="
echo ""

echo "1. Testing ML API Health..."
if curl -s http://localhost:5000/api/health | grep -q "healthy"; then
    echo "✅ ML API is healthy"
else
    echo "❌ ML API is NOT reachable"
    exit 1
fi

echo ""
echo "2. Testing ML API Response Format..."
response=$(curl -s -X POST http://localhost:5000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"image_url":"https://via.placeholder.com/224"}')

if echo "$response" | grep -q "potholes_detected"; then
    echo "✅ Response has required fields"
else
    echo "❌ Response missing required fields"
    echo "Response: $response"
    exit 1
fi

echo ""
echo "3. Testing Backend ML Service..."
cd backend
node -e "
  const mlService = require('./services/ml.service');
  mlService.analyzeImage('https://via.placeholder.com/224')
    .then(r => {
      if (r.success) {
        console.log('✅ ML Service working');
        console.log('   Result:', r.data);
      } else {
        console.log('❌ ML Service error:', r.error);
      }
    })
    .catch(e => console.error('❌ Error:', e.message));
"

echo ""
echo "4. Testing Backend Server..."
if curl -s http://localhost:3001/api/complaints | grep -q "success"; then
    echo "✅ Backend API is running"
else
    echo "❌ Backend API not responding"
    echo "Start with: npm run dev"
    exit 1
fi

echo ""
echo "=== All tests passed! ✅ ==="
```

Run it:
```bash
chmod +x test_ml_integration.sh
./test_ml_integration.sh
```

---

## Performance Benchmarks

After integration, monitor these metrics:

| Metric | Target | Acceptable | Alert |
|--------|--------|-----------|-------|
| Image Upload | < 2s | < 5s | > 10s |
| ML Inference | < 15s | < 30s | > 45s |
| Database Update | < 1s | < 3s | > 5s |
| Total Pipeline | < 20s | < 40s | > 60s |
| Error Rate | < 1% | < 5% | > 10% |

---

## Final Verification Checklist

- [ ] ML API running and healthy
- [ ] API returns correct JSON format
- [ ] Backend can reach ML API
- [ ] Environment variables set (.env)
- [ ] Database columns exist
- [ ] Complaint submission works
- [ ] ML processing triggers automatically
- [ ] Results appear in database
- [ ] AdminDashboard shows predictions
- [ ] Severity badges display correctly
- [ ] Pothole counts calculate correctly
- [ ] Map heatmap color changes with severity
- [ ] Error handling works (ML down = "failed" status)
- [ ] Performance acceptable (< 40 seconds per complaint)

---

**When all checks pass ✅, your ML integration is complete and ready for production!**


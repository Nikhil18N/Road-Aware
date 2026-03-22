# ML Model Integration Guide 🤖

**Status**: Implementation-Ready Architecture
**Date**: March 22, 2026
**Purpose**: Integrate trained ML model for pothole severity prediction and hole detection

---

## 📋 Overview

Your trained ML model will be integrated into the Road-Aware system to:
1. **Predict severity** of potholes (Low, Medium, High, Critical)
2. **Detect and count** number of holes/potholes in images
3. **Estimate damage area** of largest pothole (optional)

The system is **already architected** to support this! No major code changes needed.

---

## 🏗️ Current Architecture

### Data Flow
```
User submits complaint with image
        ↓
Image uploaded to Supabase Storage
        ↓
Complaint created with status: "processing"
        ↓
ML Service triggered asynchronously (non-blocking)
        ↓
Your ML Model analyzes image
        ↓
Results returned: potholes_detected, severity, largest_pothole_area
        ↓
Complaint updated with ML results
        ↓
Status changed to "analyzed" (or "failed" if error)
        ↓
Workers/Admins see results in Dashboard
```

### Key Files Already in Place

| File | Purpose | Status |
|------|---------|--------|
| `backend/services/ml.service.js` | ML service layer | ✅ Ready |
| `backend/controllers/complaint.controller.js` | Triggers ML processing | ✅ Ready |
| `backend/services/complaint.service.js` | Updates complaint with ML results | ✅ Ready |

---

## 🔧 Integration Steps

### Step 1: Prepare Your ML Model

**Option A: Python Flask/FastAPI Server** (Recommended)

Create a simple ML API endpoint that accepts images and returns predictions:

```python
# ml_server.py
from flask import Flask, request, jsonify
import cv2
import numpy as np
from your_model import predict_severity, detect_holes
import base64

app = Flask(__name__)

@app.route('/api/analyze', methods=['POST'])
def analyze_image():
    """
    Expects: { "image_url": "https://..." }
    Returns: {
        "potholes_detected": 5,
        "severity": "High",
        "largest_pothole_area": 125.5
    }
    """
    try:
        data = request.json
        image_url = data.get('image_url')

        # Download image from URL
        response = requests.get(image_url)
        image_array = np.frombuffer(response.content, np.uint8)
        image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)

        # Run your trained model
        severity = predict_severity(image)
        num_holes, largest_area = detect_holes(image)

        # Map your severity output to system format
        severity_map = {
            0: 'Low',      # Your model outputs 0-3
            1: 'Medium',
            2: 'High',
            3: 'Critical'
        }

        return jsonify({
            'potholes_detected': int(num_holes),
            'severity': severity_map[severity],
            'largest_pothole_area': float(largest_area)
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'healthy'}), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
```

**Option B: Local Model Integration** (Advanced)

If you want to run the model in the same Node.js process, use:

```javascript
// Use Python bridge: python-shell
const { PythonShell } = require('python-shell');

async function analyzeImageLocal(imagePath) {
  return new Promise((resolve, reject) => {
    PythonShell.run('ml_inference.py', {
      args: [imagePath]
    }, (err, results) => {
      if (err) reject(err);
      else {
        const result = JSON.parse(results[0]);
        resolve(result);
      }
    });
  });
}
```

**Option C: TensorFlow.js** (Browser/Node.js)

If your model is TensorFlow/Keras compatible:

```javascript
const tf = require('@tensorflow/tfjs-node');
const model = await tf.loadLayersModel('file://path/to/model.json');

async function analyzeImage(imageUrl) {
  const image = await loadImage(imageUrl);
  const tensor = tf.browser.fromPixels(image);
  const predictions = await model.predict(tensor);

  const result = {
    potholes_detected: predictions.data()[0],
    severity: mapSeverity(predictions.data()[1]),
    largest_pothole_area: predictions.data()[2]
  };

  return result;
}
```

---

### Step 2: Set Environment Variables

Add these to `.env` file in project root:

```env
# ML Configuration
ML_API_URL=http://localhost:5000/api/analyze
ML_API_TIMEOUT=30000  # 30 seconds timeout
```

**For Production:**
```env
ML_API_URL=https://your-ml-server.com/api/analyze
```

---

### Step 3: Upload/Deploy Your ML Server

**If using Python Flask/FastAPI:**

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install flask flask-cors numpy opencv-python tensorflow  # or your requirements

# Run server
python ml_server.py
```

**If using Docker** (Recommended for production):

```dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY ml_server.py .
COPY your_model.pkl .

EXPOSE 5000
CMD ["python", "ml_server.py"]
```

---

### Step 4: Test ML Integration

**Test 1: Health Check**

```bash
# Verify ML API is running
curl http://localhost:5000/api/health
# Expected: {"status": "healthy"}
```

**Test 2: Analyze Sample Image**

```bash
# Get a valid image URL first
IMAGE_URL="https://example.com/sample_pothole.jpg"

curl -X POST http://localhost:5000/api/analyze \
  -H "Content-Type: application/json" \
  -d "{\"image_url\": \"$IMAGE_URL\"}"

# Expected response:
# {
#   "potholes_detected": 5,
#   "severity": "High",
#   "largest_pothole_area": 125.5
# }
```

**Test 3: End-to-End Complaint Flow**

```bash
# 1. Submit complaint with image
POST /api/complaints
Content-Type: multipart/form-data
- image: [image file]
- latitude: 17.6599
- longitude: 75.9064
- description: "Pothole on main road"

# 2. Check complaint status after 10 seconds
GET /api/complaints/{complaint_id}

# Expected: status: "analyzed", severity: "High", potholes_detected: 5
```

---

## 📊 Expected ML API Response Format

Your ML API **MUST** return this exact JSON structure:

```json
{
  "potholes_detected": 5,           // Integer: number of holes detected
  "severity": "High",               // String: "Low" | "Medium" | "High" | "Critical"
  "largest_pothole_area": 125.5     // Float: area in square cm (optional)
}
```

### Severity Mapping Guide

If your model outputs numeric values, map them like this:

```javascript
// Example mapping (adjust based on your model)
const severityMap = {
  0: 'Low',        // Small holes, non-critical
  1: 'Medium',     // Moderate damage, affects driving
  2: 'High',       // Significant damage, safety concern
  3: 'Critical',   // Severe damage, urgent repair needed
};
```

---

## 🗄️ Database Updates

When ML processing completes, these fields are updated:

```sql
UPDATE complaints SET
  potholes_detected = 5,           -- Number of holes
  severity = 'High',               -- Predicted severity
  largest_pothole_area = 125.5,    -- Area of largest hole
  status = 'analyzed'              -- Processing complete
WHERE id = '...'
```

### Database Schema

The `complaints` table already has these fields:

```sql
potholes_detected INTEGER      -- Number of detected potholes
severity TEXT                  -- 'Low' | 'Medium' | 'High' | 'Critical'
largest_pothole_area FLOAT     -- Area of largest pothole in sq cm
status TEXT                    -- 'processing' | 'analyzed' | 'failed'
error_message TEXT             -- Error details if status='failed'
```

---

## 🛡️ Error Handling

### If ML API Fails

The system gracefully handles failures:

```
ML API timeout/error
          ↓
Complaint status → "failed"
          ↓
Error message stored in DB
          ↓
Admin notification (optional)
          ↓
Admin can manually assign severity
```

### Common Error Scenarios

| Error | Cause | Solution |
|-------|-------|----------|
| "ML API is not available" | Server not running | Start your ML server |
| "ML API request timed out" | Slow model inference | Increase ML_API_TIMEOUT or optimize model |
| "Invalid ML API response format" | Wrong response structure | Check your API returns exact format |
| "Network error" | Connection refused | Verify ML_API_URL is correct |

---

## 📈 Performance Optimization

### For Fast Inference

1. **Model Optimization**:
   ```python
   # Use quantized/compressed models
   import tensorflow as tf
   converter = tf.lite.TFLiteConverter.from_saved_model("model")
   converter.optimizations = [tf.lite.Optimize.DEFAULT]
   tflite_model = converter.convert()
   ```

2. **Batch Processing** (Optional):
   ```python
   # Process multiple images together
   @app.route('/api/analyze-batch', methods=['POST'])
   def analyze_batch():
       images = request.json['images']
       results = model.predict(np.array(images))
       return jsonify(results), 200
   ```

3. **Caching**:
   ```python
   from functools import lru_cache

   @lru_cache(maxsize=100)
   def analyze_cached(image_hash):
       # Avoid re-analyzing same image
       ...
   ```

---

## 🚀 Deployment Options

### Option 1: Local Development
```bash
# Terminal 1: Start ML server
cd ml_server
python ml_server.py

# Terminal 2: Start Road-Aware backend
cd Road-Aware
npm run dev
```

### Option 2: Docker Compose
```yaml
# docker-compose.yml
version: '3'
services:
  ml-server:
    build: ./ml_server
    ports:
      - "5000:5000"
    environment:
      - PYTHONUNBUFFERED=1

  backend:
    build: ./backend
    ports:
      - "3001:3001"
    depends_on:
      - ml-server
    environment:
      - ML_API_URL=http://ml-server:5000/api/analyze
```

Run with:
```bash
docker-compose up
```

### Option 3: Cloud Deployment (AWS/GCP/Azure)
```bash
# Deploy ML server to cloud
# E.g., AWS Elastic Beanstalk, Google Cloud Run, Azure App Service

# Update .env for production
ML_API_URL=https://your-ml-server.cloud.com/api/analyze
```

---

## 📝 Monitoring & Logging

### Enable ML Debugging

```javascript
// In backend/services/ml.service.js
async function analyzeImage(imageUrl) {
  const startTime = Date.now();
  console.log(`[ML] Starting analysis for: ${imageUrl}`);

  try {
    const response = await axios.post(ML_API_URL, ...);
    const duration = Date.now() - startTime;

    console.log(`[ML] ✅ Success in ${duration}ms`, response.data);
    return response.data;

  } catch (error) {
    console.error(`[ML] ❌ Failed after ${Date.now() - startTime}ms:`, error.message);
  }
}
```

### View Logs

```bash
# Backend logs
npm run logs

# Check specific complaint processing
grep "Complaint ID" logs/error.log
```

---

## ✅ Testing Checklist

**Before Production:**

- [ ] ML server running and healthy check passes
- [ ] Single image analysis works correctly
- [ ] Response format matches expected structure
- [ ] Timeout handling works (ML_API_TIMEOUT)
- [ ] Error scenarios handled gracefully
- [ ] Multiple complaints process correctly
- [ ] Database updates reflect ML results
- [ ] Admin dashboard shows predicted severity
- [ ] Worker dashboard shows pothole count

**Load Testing:**

```bash
# Test with 100 concurrent complaints
for i in {1..100}; do
  curl -X POST http://localhost:3001/api/complaints \
    -F "image=@sample.jpg" \
    -F "latitude=17.6599" \
    -F "longitude=75.9064" &
done
```

---

## 🔗 Integration with Dashboard

### AdminDashboard Updates

The ML results are automatically displayed:

```tsx
// In AdminDashboard.tsx
<TableCell>
  <Badge variant={
    complaint.severity === 'Critical' ? 'destructive' :
    complaint.severity === 'High' ? 'warning' :
    'default'
  }>
    {complaint.severity}
  </Badge>
</TableCell>

<TableCell>
  {complaint.potholes_detected ? (
    <span className="font-semibold">{complaint.potholes_detected} holes</span>
  ) : (
    <span className="text-muted-foreground">Analyzing...</span>
  )}
</TableCell>
```

### Worker Dashboard Updates

Workers see predicted severity when viewing assigned tasks:

```tsx
// In WorkerDashboard.tsx
<div className="text-sm">
  <p>Severity: <Badge>{complaint.severity}</Badge></p>
  <p>Holes detected: {complaint.potholes_detected}</p>
</div>
```

### Public Map Heatmap

Heatmap intensity will be based on predicted severity:

```tsx
// In ComplaintMap.tsx
const heatmapIntensity = {
  'Low': 0.3,
  'Medium': 0.5,
  'High': 0.7,
  'Critical': 1.0
};
```

---

## 🐛 Troubleshooting

### Issue: ML results not showing up

```bash
# 1. Check if ML API is running
curl http://localhost:5000/api/health

# 2. Check backend logs
grep "ML API Error" backend.log

# 3. Verify environment variable
echo $ML_API_URL

# 4. Test manually
curl -X POST http://localhost:5000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"image_url":"https://..."}'
```

### Issue: High timeout errors

```javascript
// Increase timeout in .env
ML_API_TIMEOUT=60000  // 60 seconds instead of 30

// Or optimize model inference time
// Check model prediction latency:
time python -c "from your_model import predict; predict(image)"
```

### Issue: Database fields are NULL

```sql
-- Check if migration applied
SELECT * FROM complaints LIMIT 1;
-- Should show: potholes_detected, severity, largest_pothole_area columns

-- If missing, add columns:
ALTER TABLE complaints
  ADD COLUMN potholes_detected INTEGER,
  ADD COLUMN severity TEXT,
  ADD COLUMN largest_pothole_area FLOAT;
```

---

## 📞 Support & Next Steps

### You Need to Provide:

1. **Model Format**: TensorFlow/PyTorch/Pickle/etc.
2. **Input Format**: Image size, color channels (RGB/BGR)
3. **Output Format**: Numeric/categorical severity levels
4. **Model Performance**: Inference time per image
5. **Accuracy Metrics**: True positive rate, false positive rate

### Quick Start Commands:

```bash
# 1. Copy this guide to your ML project
cp ML_INTEGRATION_GUIDE.md ../your_ml_project/

# 2. Start ML server
cd ../your_ml_project
python ml_server.py

# 3. Update .env with ML_API_URL
echo "ML_API_URL=http://localhost:5000/api/analyze" >> .env

# 4. Start Road-Aware backend
npm run dev

# 5. Test by submitting complaint
# Go to http://localhost:3000/report
```

---

## 🎯 Success Criteria

✅ **System is ready when:**
1. Complaint submitted → Status shows "processing"
2. After 10 seconds → Status changes to "analyzed"
3. Severity field populated → Shows prediction from your model
4. Potholes detected field → Shows count from your model
5. AdminDashboard → Shows all ML results correctly
6. Dashboard filters → Work with severity predictions

---

**Status**: 🟢 Architecture Ready - Awaiting Your ML Model Integration

**Next Action**: Implement your ML API endpoint following Option A, B, or C above, then we'll complete the integration! 🚀


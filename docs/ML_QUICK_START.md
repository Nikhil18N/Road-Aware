# ML Model Integration - Quick Start 🚀

## What You Need to Do

### Step 1️⃣: Create ML API Endpoint

**Minimal Flask Example:**

```python
# ml_api.py
from flask import Flask, request, jsonify
import cv2
import numpy as np
from your_trained_model import predict_severity, count_potholes
import requests

app = Flask(__name__)

@app.route('/api/analyze', methods=['POST'])
def analyze():
    data = request.json
    image_url = data['image_url']

    # Download image
    img_data = requests.get(image_url).content
    image = cv2.imdecode(np.frombuffer(img_data, np.uint8), cv2.IMREAD_COLOR)

    # Run your trained model
    severity_level = predict_severity(image)  # Returns: 0, 1, 2, or 3
    hole_count = count_potholes(image)        # Returns: number
    largest_area = get_largest_area(image)    # Returns: area in sq cm

    # Map your output to system format
    severity_map = {
        0: 'Low',
        1: 'Medium',
        2: 'High',
        3: 'Critical'
    }

    return jsonify({
        'potholes_detected': int(hole_count),
        'severity': severity_map[severity_level],
        'largest_pothole_area': float(largest_area)
    })

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)
```

### Step 2️⃣: Configure Environment

```bash
# In project root .env file
ML_API_URL=http://localhost:5000/api/analyze
ML_API_TIMEOUT=30000
```

### Step 3️⃣: Test Your ML API

```bash
# Test local endpoint
curl -X POST http://localhost:5000/api/health
# Should return: {"status": "healthy"}

# Test image analysis
curl -X POST http://localhost:5000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"image_url":"https://example.com/pothole.jpg"}'

# Should return:
# {
#   "potholes_detected": 5,
#   "severity": "High",
#   "largest_pothole_area": 125.5
# }
```

---

## How the System Uses Your Model

```
┌─────────────────────────────────────────────────┐
│ 1. User submits complaint with image            │
└──────────────────┬──────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────┐
│ 2. Image uploaded to Supabase Storage           │
└──────────────────┬──────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────┐
│ 3. Complaint created (status: "processing")    │
└──────────────────┬──────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────┐
│ 4. ML Service calls YOUR ML API (async)         │
│    - Sends image URL                            │
│    - Waits for response                         │
└──────────────────┬──────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────┐
│ 5. Your ML Model processes image                │
│    - Predicts severity: "High"                  │
│    - Counts potholes: 5                         │
│    - Estimates area: 125.5 sq cm                │
└──────────────────┬──────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────┐
│ 6. API returns results to Road-Aware            │
└──────────────────┬──────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────┐
│ 7. Complaint updated in database                │
│    - severity: "High"                           │
│    - potholes_detected: 5                       │
│    - status: "analyzed"                         │
└──────────────────┬──────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────┐
│ 8. Results visible in dashboards                │
│    - AdminDashboard: See severity badge        │
│    - WorkerDashboard: See pothole count        │
│    - Map heatmap: Based on severity            │
└─────────────────────────────────────────────────┘
```

---

## Response Format MUST BE Exact

Your API must return **exactly this structure**:

```json
{
  "potholes_detected": <number>,
  "severity": <string: "Low"|"Medium"|"High"|"Critical">,
  "largest_pothole_area": <float, optional>
}
```

**❌ WRONG Format Examples:**
```json
// Missing severity
{"pothole_count": 5}

// Wrong field names
{"holes": 5, "damage_level": "high"}

// Wrong severity format (should be "High" not 2)
{"potholes_detected": 5, "severity": 2}
```

**✅ CORRECT Examples:**
```json
{"potholes_detected": 5, "severity": "High", "largest_pothole_area": 125.5}
{"potholes_detected": 0, "severity": "Low"}
{"potholes_detected": 12, "severity": "Critical", "largest_pothole_area": 500.0}
```

---

## Integration Checklist

- [ ] ML API endpoint created (Flask/FastAPI/custom)
- [ ] Returns exact JSON format required
- [ ] Health check endpoint works (`/health`)
- [ ] API running on localhost:5000 (or configured port)
- [ ] `.env` file has `ML_API_URL` set
- [ ] Test image analysis works manually
- [ ] Model handles errors gracefully
- [ ] Inference time < 30 seconds (or adjust ML_API_TIMEOUT)

---

## Common Model Output Mappings

### If your model outputs 0-3 (categorical):
```python
severity_map = {
    0: 'Low',
    1: 'Medium',
    2: 'High',
    3: 'Critical'
}
```

### If your model outputs probabilities (0-1):
```python
if severity_prob < 0.25:
    severity = 'Low'
elif severity_prob < 0.5:
    severity = 'Medium'
elif severity_prob < 0.75:
    severity = 'High'
else:
    severity = 'Critical'
```

### If your model outputs text directly:
```python
severity_map = {
    'low': 'Low',
    'medium': 'Medium',
    'high': 'High',
    'critical': 'Critical',
    'severe': 'Critical'
}
```

---

## Testing After Integration

```bash
# 1. Start your ML API
python ml_api.py

# 2. In another terminal, start Road-Aware
npm run dev

# 3. Go to http://localhost:3000
# 4. Click "Report an Issue"
# 5. Submit complaint with image
# 6. Wait 10 seconds
# 7. Check Admin Dashboard
#    ✅ Severity shows prediction
#    ✅ Pothole count shows count
#    ✅ Status changed to "analyzed"
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "ML API is not available" | Start your ML server: `python ml_api.py` |
| "ML API request timed out" | Increase timeout in `.env`: `ML_API_TIMEOUT=60000` |
| "Invalid response format" | Check your API returns **exact** JSON structure |
| Model too slow | Optimize model or increase timeout |
| Database fields NULL | Migration applied automatically, no action needed |

---

## System Already Handles

✅ Image upload to cloud storage
✅ Creating complaint record
✅ Calling your ML API asynchronously
✅ Updating complaint with results
✅ Displaying in dashboards
✅ Error handling & logging
✅ Database schema (fields already exist)

**You only need to**: Provide the ML API endpoint that accepts image URL and returns predictions!

---

## File Locations

**Backend ML Integration:**
- `backend/services/ml.service.js` - Calls your API
- `backend/controllers/complaint.controller.js` - Triggers ML on line 108-114

**Frontend Display:**
- `src/pages/AdminDashboard.tsx` - Shows severity & pothole count
- `src/pages/WorkerDashboard.tsx` - Shows results in task view
- `src/components/map/ComplaintMap.tsx` - Heatmap intensity based on severity

---

## Example: Integration Complete ✅

After you integrate your model:

```
User submits pothole image
         ↓
Your ML predicts: "High" severity, 5 potholes detected
         ↓
AdminDashboard shows:
┌─────────────────────────────────────────┐
│ Report #123                             │
│ Status: Analyzed                        │
│ Severity: [HIGH badge in red]           │
│ Potholes: 5 detected                    │
│ Area: 125.5 sq cm                       │
└─────────────────────────────────────────┘
```

---

**Ready to integrate? Create your ML API endpoint and let's connect it! 🚀**


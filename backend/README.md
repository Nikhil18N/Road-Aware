# Smart Road Damage Reporting System - Backend API

Production-ready Node.js Express backend with Supabase integration and ML processing for automated pothole detection.

## 🚀 Features

- ✅ **Image Upload**: Upload images to Supabase Storage
- ✅ **Location Tracking**: Store GPS coordinates (latitude/longitude)
- ✅ **ML Integration**: Asynchronous image analysis via FastAPI
- ✅ **Duplicate Prevention**: Detect nearby complaints (within 50m)
- ✅ **Status Management**: Track complaint lifecycle
- ✅ **Statistics**: Real-time analytics and reporting
- ✅ **Error Handling**: Comprehensive error management
- ✅ **Validation**: Input validation with express-validator
- ✅ **Modular Architecture**: Clean separation of concerns

## 📁 Project Structure

```
backend/
├── config/
│   └── supabase.js          # Supabase client configuration
├── controllers/
│   └── complaint.controller.js  # Request handlers
├── services/
│   ├── complaint.service.js     # Database operations
│   ├── storage.service.js       # File upload/deletion
│   └── ml.service.js            # ML API integration
├── routes/
│   └── complaint.routes.js      # API route definitions
├── middleware/
│   ├── errorHandler.js          # Global error handler
│   └── requestLogger.js         # Request logging
├── utils/
│   ├── validators.js            # Validation functions
│   └── response.js              # Response helpers
├── database/
│   └── schema.sql               # Database schema
├── .env.example                 # Environment variables template
├── .gitignore                   # Git ignore rules
├── package.json                 # Dependencies
└── server.js                    # Main application entry
```

## 📦 Installation

### 1. Clone & Install Dependencies

```bash
cd backend
npm install
```

### 2. Set Up Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Supabase Storage
STORAGE_BUCKET=pothole-images

# ML API Configuration
ML_API_URL=http://localhost:8000/api/analyze
ML_API_TIMEOUT=30000

# Location Settings
DUPLICATE_LOCATION_THRESHOLD=50
```

### 3. Set Up Supabase Database

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to **SQL Editor**
3. Copy the content from `database/schema.sql`
4. Execute the SQL script

This creates:
- `complaints` table with proper indexes
- Triggers for auto-updating timestamps
- Row Level Security (RLS) policies

### 4. Set Up Supabase Storage

1. Go to **Storage** in Supabase Dashboard
2. Create a new bucket: `pothole-images`
3. Make it **Public**
4. Storage policies are created automatically by the schema

### 5. Start the Server

```bash
# Development mode (with nodemon)
npm run dev

# Production mode
npm start
```

Server starts at: `http://localhost:5000`

## 📡 API Endpoints

### 1. Health Check

```http
GET /health
```

**Response:**
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2026-03-21T10:30:00.000Z",
  "environment": "development"
}
```

---

### 2. Create Complaint

```http
POST /api/complaints
Content-Type: multipart/form-data
```

**Request Body (Form Data):**
- `image` (file, required): Image file (max 10MB)
- `latitude` (number, required): Latitude (-90 to 90)
- `longitude` (number, required): Longitude (-180 to 180)
- `description` (string, optional): Description (max 1000 chars)

**Example using cURL:**
```bash
curl -X POST http://localhost:5000/api/complaints \
  -F "image=@pothole.jpg" \
  -F "latitude=17.6599" \
  -F "longitude=75.9064" \
  -F "description=Large pothole on MG Road"
```

**Example using JavaScript (Axios):**
```javascript
const formData = new FormData();
formData.append('image', imageFile);
formData.append('latitude', 17.6599);
formData.append('longitude', 75.9064);
formData.append('description', 'Large pothole');

const response = await axios.post('http://localhost:5000/api/complaints', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Complaint submitted successfully. Image analysis in progress.",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "processing",
    "image_url": "https://xxx.supabase.co/storage/v1/object/public/pothole-images/complaints/...",
    "latitude": 17.6599,
    "longitude": 75.9064,
    "created_at": "2026-03-21T10:30:00.000Z"
  }
}
```

**Duplicate Response (409):**
```json
{
  "success": false,
  "message": "Duplicate complaint detected",
  "data": {
    "nearbyComplaints": [
      {
        "id": "abc-123",
        "distance": 35,
        "created_at": "2026-03-21T09:00:00.000Z"
      }
    ],
    "threshold": 50
  }
}
```

---

### 3. Get All Complaints

```http
GET /api/complaints?status=analyzed&severity=High&limit=10&offset=0
```

**Query Parameters:**
- `status` (optional): Filter by status (`processing`, `analyzed`, `failed`, `pending`, `resolved`)
- `severity` (optional): Filter by severity (`Low`, `Medium`, `High`)
- `limit` (optional): Number of results (default: all)
- `offset` (optional): Pagination offset (default: 0)

**Response (200):**
```json
{
  "success": true,
  "message": "Complaints fetched successfully",
  "data": {
    "complaints": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "image_url": "https://...",
        "latitude": 17.6599,
        "longitude": 75.9064,
        "description": "Large pothole",
        "potholes_detected": 3,
        "severity": "High",
        "largest_pothole_area": 25.5,
        "status": "analyzed",
        "created_at": "2026-03-21T10:30:00.000Z",
        "updated_at": "2026-03-21T10:31:00.000Z",
        "resolved_at": null
      }
    ],
    "count": 1
  }
}
```

---

### 4. Get Complaint by ID

```http
GET /api/complaints/:id
```

**Example:**
```http
GET /api/complaints/550e8400-e29b-41d4-a716-446655440000
```

**Response (200):**
```json
{
  "success": true,
  "message": "Complaint fetched successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "image_url": "https://...",
    "latitude": 17.6599,
    "longitude": 75.9064,
    "description": "Large pothole on MG Road",
    "potholes_detected": 3,
    "severity": "High",
    "largest_pothole_area": 25.5,
    "status": "analyzed",
    "created_at": "2026-03-21T10:30:00.000Z",
    "updated_at": "2026-03-21T10:31:00.000Z",
    "resolved_at": null
  }
}
```

---

### 5. Update Complaint Status

```http
PATCH /api/complaints/:id/status
Content-Type: application/json
```

**Request Body:**
```json
{
  "status": "resolved"
}
```

**Valid Status Values:**
- `processing` - Initial state, ML analysis in progress
- `analyzed` - ML analysis complete
- `failed` - ML analysis failed
- `pending` - Pending review/action
- `resolved` - Issue resolved

**Response (200):**
```json
{
  "success": true,
  "message": "Status updated successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "resolved",
    "resolved_at": "2026-03-21T15:00:00.000Z",
    "updated_at": "2026-03-21T15:00:00.000Z"
  }
}
```

---

### 6. Get Statistics

```http
GET /api/complaints/stats
```

**Response (200):**
```json
{
  "success": true,
  "message": "Statistics fetched successfully",
  "data": {
    "total": 150,
    "byStatus": {
      "processing": 10,
      "analyzed": 85,
      "failed": 5,
      "pending": 30,
      "resolved": 20
    },
    "bySeverity": {
      "Low": 45,
      "Medium": 60,
      "High": 40
    }
  }
}
```

## 🔄 ML Processing Flow

1. **User submits complaint** → Image uploaded to Supabase Storage
2. **Backend creates record** → Status: `processing`
3. **Return immediate response** → User gets complaint ID
4. **Background ML processing** → Call FastAPI async
5. **ML API returns result** → Update complaint with severity
6. **Status updated** → Changed to `analyzed` or `failed`

### ML API Expected Format

**POST Request to ML API:**
```json
{
  "image_url": "https://supabase.co/storage/..."
}
```

**Expected ML Response:**
```json
{
  "potholes_detected": 3,
  "severity": "High",
  "largest_pothole_area": 25.5
}
```

## 🔒 Security Features

### Current Implementation
- ✅ File type validation (images only)
- ✅ File size limit (10MB)
- ✅ Input validation & sanitization
- ✅ SQL injection prevention (Supabase handles this)
- ✅ Row Level Security (RLS) enabled

### Production Recommendations
1. **Add Authentication**: Implement JWT-based auth for admin endpoints
2. **Rate Limiting**: Use `express-rate-limit` to prevent abuse
3. **CORS**: Restrict CORS to specific origins
4. **API Keys**: Require API keys for ML service calls
5. **HTTPS**: Always use HTTPS in production
6. **Environment Variables**: Use secrets management (AWS Secrets Manager, etc.)

## 🧪 Testing

### Test Complaint Creation

```bash
curl -X POST http://localhost:5000/api/complaints \
  -F "image=@test-pothole.jpg" \
  -F "latitude=17.6599" \
  -F "longitude=75.9064" \
  -F "description=Test complaint"
```

### Test Get All Complaints

```bash
curl http://localhost:5000/api/complaints
```

### Test Update Status

```bash
curl -X PATCH http://localhost:5000/api/complaints/YOUR_ID/status \
  -H "Content-Type: application/json" \
  -d '{"status": "resolved"}'
```

## 🐛 Troubleshooting

### Issue: "Missing required environment variable"
- Ensure all variables in `.env.example` are set in `.env`
- Check for typos in variable names

### Issue: "Storage bucket not accessible"
- Verify bucket name matches `STORAGE_BUCKET` in `.env`
- Ensure bucket is created and set to Public in Supabase
- Check storage policies are enabled

### Issue: "ML API request failed"
- Ensure FastAPI ML service is running
- Verify `ML_API_URL` is correct
- Check ML API logs for errors

### Issue: "Failed to create complaint"
- Verify database schema is created
- Check Supabase credentials
- Ensure RLS policies allow INSERT

## 🚀 Deployment

### Deploy to Heroku

```bash
heroku create your-app-name
heroku config:set SUPABASE_URL=your-url
heroku config:set SUPABASE_ANON_KEY=your-key
# ... set other env vars
git push heroku main
```

### Deploy to Railway

```bash
railway login
railway init
railway add
# Set environment variables in Railway dashboard
railway up
```

### Deploy to AWS/Azure/GCP

Use Docker containerization:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["node", "server.js"]
```

## 📊 Performance Optimization

- **Database Indexing**: Already included in schema
- **Connection Pooling**: Supabase handles this
- **Caching**: Consider Redis for frequently accessed data
- **CDN**: Use CloudFront/Cloudflare for image delivery
- **Compression**: Use `compression` middleware

## 📝 License

MIT License

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit changes
4. Push to the branch
5. Open a Pull Request

---

**Built with ❤️ using Node.js, Express, and Supabase**

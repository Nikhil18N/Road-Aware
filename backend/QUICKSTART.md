# 🚀 Quick Start Guide

Get the backend running in 5 minutes!

## Step 1: Install Dependencies (1 min)

```bash
cd backend
npm install
```

## Step 2: Set Up Supabase (2 min)

1. Go to [supabase.com](https://supabase.com) → Create project
2. Wait for project to initialize (~1-2 minutes)
3. Go to **SQL Editor** → Paste content from `database/schema.sql` → Run
4. Go to **Storage** → Create bucket: `pothole-images` → Set to **Public**

## Step 3: Configure Environment (30 sec)

```bash
cp .env.example .env
```

Get your credentials from Supabase:
- **Project Settings** → **API**
- Copy **URL** → Paste as `SUPABASE_URL`
- Copy **anon/public key** → Paste as `SUPABASE_ANON_KEY`
- Copy **service_role key** → Paste as `SUPABASE_SERVICE_ROLE_KEY`

Your `.env` should look like:
```env
PORT=5000
SUPABASE_URL=https://abcdefgh.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1...
STORAGE_BUCKET=pothole-images
ML_API_URL=http://localhost:8000/api/analyze
```

## Step 4: Start Server (10 sec)

```bash
npm run dev
```

You should see:
```
🚀 Server started successfully!
📍 Running on: http://localhost:5000
```

## Step 5: Test It! (1 min)

### Test 1: Health Check
```bash
curl http://localhost:5000/health
```

Expected response:
```json
{"success": true, "message": "Server is running"}
```

### Test 2: Create a Complaint

Save this as `test-image.jpg` or use any image file:

```bash
curl -X POST http://localhost:5000/api/complaints \
  -F "image=@test-image.jpg" \
  -F "latitude=17.6599" \
  -F "longitude=75.9064" \
  -F "description=Test pothole report"
```

You'll get back a complaint ID!

### Test 3: Get All Complaints
```bash
curl http://localhost:5000/api/complaints
```

## 🎉 Success!

Your backend is now running and ready to:
- ✅ Accept image uploads
- ✅ Store complaints in Supabase
- ✅ Process ML analysis (when ML API is running)
- ✅ Prevent duplicate complaints
- ✅ Provide statistics

## Next Steps

1. **Set up ML API**: Build/deploy the FastAPI service for image analysis
2. **Connect Frontend**: Update frontend to call this backend
3. **Add Authentication**: Implement JWT for admin routes
4. **Deploy**: Deploy to Heroku/Railway/AWS

## Troubleshooting

❌ **Error: "Missing required environment variable"**
→ Check your `.env` file has all variables from `.env.example`

❌ **Error: "Storage bucket not accessible"**
→ Make sure you created the bucket `pothole-images` in Supabase Storage

❌ **Error: "Failed to create complaint"**
→ Verify you ran the `database/schema.sql` in Supabase SQL Editor

❌ **Server won't start**
→ Make sure port 5000 is not in use: `lsof -i :5000` (Mac/Linux) or `netstat -ano | findstr :5000` (Windows)

## API Endpoints Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/api/complaints` | Create complaint with image |
| GET | `/api/complaints` | List all complaints |
| GET | `/api/complaints/:id` | Get single complaint |
| PATCH | `/api/complaints/:id/status` | Update status |
| GET | `/api/complaints/stats` | Get statistics |

## Example Frontend Integration

```javascript
// React example
const handleSubmit = async (imageFile, location, description) => {
  const formData = new FormData();
  formData.append('image', imageFile);
  formData.append('latitude', location.lat);
  formData.append('longitude', location.lng);
  formData.append('description', description);

  const response = await fetch('http://localhost:5000/api/complaints', {
    method: 'POST',
    body: formData
  });

  const result = await response.json();
  console.log('Complaint ID:', result.data.id);
};
```

---

Need help? Check the full [README.md](./README.md) for detailed documentation!

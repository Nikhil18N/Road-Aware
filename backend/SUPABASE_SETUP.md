# 🎯 Supabase Setup Guide - Step by Step

Complete guide to set up Supabase for the Road Damage Reporting System backend.

## 📋 Overview

You'll set up:
1. ✅ Supabase account and project
2. ✅ PostgreSQL database with schema
3. ✅ Storage bucket for images
4. ✅ Get API credentials
5. ✅ Test the connection

**Estimated time:** 10 minutes

---

## Step 1: Create Supabase Account (2 minutes)

### 1.1 Sign Up

1. Go to [https://supabase.com](https://supabase.com)
2. Click **"Start your project"** or **"Sign Up"**
3. Sign up with:
   - GitHub (recommended)
   - Google
   - Email

### 1.2 Create Organization

After signing in:
1. You'll be asked to create an organization
2. Enter organization name (e.g., "Road-Aware" or your name)
3. Click **"Create Organization"**

---

## Step 2: Create Project (2 minutes)

### 2.1 New Project

1. Click **"New Project"** button
2. Fill in the details:
   - **Name**: `road-damage-backend` (or any name)
   - **Database Password**: Create a strong password (SAVE THIS!)
   - **Region**: Choose closest to your users (e.g., Mumbai, Singapore, US East)
   - **Pricing Plan**: Start with **Free tier** (500MB database, 1GB storage)

3. Click **"Create new project"**

### 2.2 Wait for Project Setup

- This takes **1-2 minutes**
- You'll see a progress screen
- ☕ Grab a coffee while you wait!

---

## Step 3: Set Up Database (3 minutes)

### 3.1 Open SQL Editor

Once your project is ready:
1. In the left sidebar, click **"SQL Editor"**
2. Click **"New query"** button (top right)

### 3.2 Copy Database Schema

1. Open the file: `backend/database/schema.sql`
2. Copy the **entire contents** of that file
3. Paste it into the SQL Editor

### 3.3 Execute Schema

1. Click **"Run"** button (or press Ctrl/Cmd + Enter)
2. You should see: **"Success. No rows returned"**
3. This creates:
   - ✅ `complaints` table
   - ✅ Indexes for performance
   - ✅ Triggers for auto-updates
   - ✅ Row Level Security policies

### 3.4 Verify Database

1. In left sidebar, click **"Table Editor"**
2. You should see the `complaints` table listed
3. Click on it to view the structure

Expected columns:
- `id` (uuid)
- `image_url` (text)
- `latitude` (float8)
- `longitude` (float8)
- `description` (text)
- `potholes_detected` (int4)
- `severity` (text)
- `largest_pothole_area` (float8)
- `status` (text)
- `error_message` (text)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)
- `resolved_at` (timestamptz)

---

## Step 4: Set Up Storage Bucket (2 minutes)

### 4.1 Open Storage

1. In left sidebar, click **"Storage"**
2. Click **"Create a new bucket"** button

### 4.2 Create Bucket

1. **Bucket name**: `pothole-images` (must be exactly this!)
2. **Public bucket**: Toggle to **ON** ✅
   - This allows public read access to images
3. **File size limit**: Leave default (50MB) or set to 10MB
4. Click **"Create bucket"**

### 4.3 Verify Storage Policies

1. Click on your `pothole-images` bucket
2. Go to **"Policies"** tab
3. You should see policies already created by the SQL schema:
   - ✅ "Public Access to Images" (SELECT)
   - ✅ "Anyone can upload images" (INSERT)
   - ✅ "Allow image deletion" (DELETE)

If policies are missing, click **"New Policy"** and add:

**Policy 1 - Public Read:**
```sql
Policy name: Public Access to Images
SELECT: true
Target roles: public
Policy definition: true
```

**Policy 2 - Public Upload:**
```sql
Policy name: Anyone can upload images
INSERT: true
Target roles: public
Policy definition: true
```

**Policy 3 - Public Delete:**
```sql
Policy name: Allow image deletion
DELETE: true
Target roles: public
Policy definition: true
```

---

## Step 5: Get API Credentials (1 minute)

### 5.1 Open Project Settings

1. Click **"Settings"** (gear icon) in left sidebar
2. Click **"API"** under Project Settings

### 5.2 Copy Credentials

You'll see three important values:

1. **Project URL**
   - Format: `https://xxxxxx.supabase.co`
   - Copy this entire URL

2. **anon public** (API Key)
   - Under "Project API keys" section
   - Look for **"anon"** or **"anon public"**
   - Click **"Copy"** or click to reveal and copy
   - This is a long string starting with `eyJ...`

3. **service_role** (Secret Key)
   - Under "Project API keys" section
   - Look for **"service_role"**
   - Click **"Reveal"** then **"Copy"**
   - ⚠️ Keep this secret! Never expose in frontend

### 5.3 Save Credentials

Open your `backend/.env` file and add:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Supabase Configuration
SUPABASE_URL=https://xxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6...

# Supabase Storage
STORAGE_BUCKET=pothole-images

# ML API Configuration (temp URL for now)
ML_API_URL=http://localhost:8000/api/analyze
ML_API_TIMEOUT=30000

# Location Proximity Settings
DUPLICATE_LOCATION_THRESHOLD=50
```

Replace:
- `SUPABASE_URL` with your Project URL
- `SUPABASE_ANON_KEY` with your anon public key
- `SUPABASE_SERVICE_ROLE_KEY` with your service_role key

---

## Step 6: Test Connection (1 minute)

### 6.1 Start Your Backend

```bash
cd backend
npm install
npm run dev
```

### 6.2 Check Startup Output

You should see:
```
✅ Storage bucket verified
🚀 Server started successfully!
📍 Running on: http://localhost:5000
```

If you see warnings about storage bucket, double-check the bucket name is exactly `pothole-images`.

### 6.3 Test Health Endpoint

```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2026-03-21T...",
  "environment": "development"
}
```

### 6.4 Test Database Connection

Create a test complaint (using a test image):

```bash
curl -X POST http://localhost:5000/api/complaints \
  -F "image=@test-image.jpg" \
  -F "latitude=17.6599" \
  -F "longitude=75.9064" \
  -F "description=Test complaint"
```

Expected response:
```json
{
  "success": true,
  "message": "Complaint submitted successfully...",
  "data": {
    "id": "uuid-here",
    "status": "processing",
    ...
  }
}
```

### 6.5 Verify in Supabase

1. Go back to Supabase dashboard
2. Click **"Table Editor"**
3. Click **"complaints"** table
4. You should see your test complaint!

---

## 🎉 Setup Complete!

Your Supabase is now configured and connected to your backend!

### What You've Set Up

✅ Supabase account and project
✅ PostgreSQL database with schema
✅ Storage bucket for images
✅ API credentials configured
✅ Backend connected and tested

---

## 🔍 Troubleshooting

### Issue: "Missing required environment variable"

**Problem:** Environment variables not loaded

**Solution:**
1. Ensure `.env` file exists in `backend/` directory
2. Check that `.env` has all required variables
3. Restart the server after editing `.env`

### Issue: "Storage bucket not accessible"

**Problem:** Bucket name mismatch or not public

**Solution:**
1. Verify bucket name is exactly `pothole-images`
2. Check bucket is set to **Public** in Supabase Storage
3. Verify storage policies are enabled

### Issue: "Failed to create complaint"

**Problem:** Database schema not created or RLS policies blocking

**Solution:**
1. Re-run the `schema.sql` in SQL Editor
2. Check that RLS policies exist for `complaints` table
3. Verify credentials in `.env` are correct

### Issue: "CORS Error" (when calling from frontend)

**Problem:** CORS not configured for your frontend domain

**Solution:**
1. In Supabase dashboard, go to **Settings** → **API**
2. Scroll to **CORS** section
3. Add your frontend URL (e.g., `http://localhost:5173`)

### Issue: "Authentication required"

**Problem:** RLS policies too restrictive

**Solution:**
The current schema allows public access. If you've modified policies, ensure:
- SELECT policy allows `true`
- INSERT policy allows `true`
- UPDATE policy allows `true` (or authenticated only)

---

## 📊 View Your Data

### Table Editor
View and edit data directly:
1. Click **"Table Editor"** in sidebar
2. Select **"complaints"** table
3. View all complaints

### Storage Browser
View uploaded images:
1. Click **"Storage"** in sidebar
2. Click **"pothole-images"** bucket
3. Browse uploaded images in `complaints/` folder

### SQL Editor
Run custom queries:
1. Click **"SQL Editor"** in sidebar
2. Try these queries:

**Get all complaints:**
```sql
SELECT * FROM complaints ORDER BY created_at DESC LIMIT 10;
```

**Get complaints by status:**
```sql
SELECT status, COUNT(*) as count
FROM complaints
GROUP BY status;
```

**Get complaints by severity:**
```sql
SELECT severity, COUNT(*) as count
FROM complaints
WHERE severity IS NOT NULL
GROUP BY severity;
```

---

## 🚀 Next Steps

1. ✅ Supabase setup complete
2. ⬜ Build/deploy ML API for image analysis
3. ⬜ Connect frontend to backend API
4. ⬜ Test end-to-end flow
5. ⬜ Deploy to production

---

## 💡 Tips

### Free Tier Limits
- **Database size:** 500 MB
- **Storage:** 1 GB
- **Bandwidth:** 2 GB/month
- **API requests:** 50,000/month

For production, consider upgrading to Pro plan.

### Backup Your Database
1. Go to **Settings** → **Database**
2. Click **"Download backup"**
3. Save SQL dump file

### Monitor Usage
1. Go to **Settings** → **Usage**
2. Track database size, storage, bandwidth
3. Set up alerts when approaching limits

### Security Best Practices
- ✅ Never expose `service_role` key in frontend
- ✅ Use environment variables for secrets
- ✅ Enable RLS on all tables
- ✅ Restrict CORS to your domain in production
- ✅ Regularly rotate API keys

---

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Storage Guide](https://supabase.com/docs/guides/storage)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase API Reference](https://supabase.com/docs/reference/javascript/introduction)

---

**Need help?**
- Check [Supabase Discord](https://discord.supabase.com)
- Visit [Supabase GitHub Discussions](https://github.com/supabase/supabase/discussions)

---

Happy coding! 🎉

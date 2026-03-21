# 📋 Supabase Setup Checklist

Print this out or keep it open while setting up Supabase!

---

## ☐ Step 1: Create Supabase Account (2 minutes)

- [ ] Go to https://supabase.com
- [ ] Click "Start your project" or "Sign Up"
- [ ] Sign up with GitHub/Google/Email
- [ ] Create organization (any name)

**Status:** ⬜ Not Started | 🟡 In Progress | ✅ Complete

---

## ☐ Step 2: Create Project (2 minutes)

- [ ] Click "New Project"
- [ ] Enter project name: `road-damage-backend`
- [ ] Create **strong database password** (SAVE IT!)
- [ ] Select region (closest to you)
- [ ] Choose Free tier
- [ ] Click "Create new project"
- [ ] Wait 1-2 minutes for setup

**Database Password:** ___________________________________
(Write it down! You'll need this to connect later)

**Status:** ⬜ Not Started | 🟡 In Progress | ✅ Complete

---

## ☐ Step 3: Set Up Database (3 minutes)

- [ ] Project is ready and dashboard loaded
- [ ] Click "SQL Editor" in left sidebar
- [ ] Click "New query" button
- [ ] Open file: `backend/database/schema.sql`
- [ ] Copy entire content
- [ ] Paste into SQL Editor
- [ ] Click "Run" button
- [ ] See success message: "Success. No rows returned"
- [ ] Click "Table Editor" to verify
- [ ] Confirm `complaints` table exists

**Status:** ⬜ Not Started | 🟡 In Progress | ✅ Complete

---

## ☐ Step 4: Set Up Storage (2 minutes)

- [ ] Click "Storage" in left sidebar
- [ ] Click "Create a new bucket"
- [ ] Bucket name: `pothole-images` (exactly!)
- [ ] Toggle "Public bucket" to ON ✅
- [ ] Click "Create bucket"
- [ ] Bucket appears in list
- [ ] Click on bucket to verify it's created

**Status:** ⬜ Not Started | 🟡 In Progress | ✅ Complete

---

## ☐ Step 5: Get API Credentials (1 minute)

- [ ] Click "Settings" (gear icon) in left sidebar
- [ ] Click "API" under Project Settings
- [ ] Copy three values:

### Project URL:
```
https://__________________________.supabase.co
```
(Paste here for reference: _____________________________________)

### anon public key:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9._________________...
```
(First 50 chars: _____________________________________)

### service_role key:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9._________________...
```
(First 50 chars: _____________________________________)

**Status:** ⬜ Not Started | 🟡 In Progress | ✅ Complete

---

## ☐ Step 6: Configure Backend (1 minute)

- [ ] Open `backend/.env` file
- [ ] If it doesn't exist, copy from `.env.example`
- [ ] Paste SUPABASE_URL
- [ ] Paste SUPABASE_ANON_KEY
- [ ] Paste SUPABASE_SERVICE_ROLE_KEY
- [ ] Save the file

**Status:** ⬜ Not Started | 🟡 In Progress | ✅ Complete

---

## ☐ Step 7: Test Connection (2 minutes)

- [ ] Open terminal in `backend/` directory
- [ ] Run: `npm install`
- [ ] Run: `npm run dev`
- [ ] See: "✅ Storage bucket verified"
- [ ] See: "🚀 Server started successfully!"
- [ ] Server running on http://localhost:5000

### Testing:

**Test 1: Health Check**
- [ ] Run: `curl http://localhost:5000/health`
- [ ] See: `{"success": true, "message": "Server is running"}`

**Test 2: Create Test Complaint** (optional)
- [ ] Prepare a test image (any JPG/PNG)
- [ ] Run curl command from setup guide
- [ ] Receive complaint ID in response
- [ ] Check Supabase Table Editor
- [ ] See new complaint in `complaints` table

**Status:** ⬜ Not Started | 🟡 In Progress | ✅ Complete

---

## 🎉 Setup Complete!

### ✅ Checklist Summary

Mark your progress:
- [ ] Supabase account created
- [ ] Project created and ready
- [ ] Database schema executed
- [ ] Storage bucket created
- [ ] API credentials copied
- [ ] Backend .env configured
- [ ] Backend server running
- [ ] Health check passed

### 📊 Total Time: ~13 minutes

---

## 🔍 Troubleshooting

### ❌ "Server won't start"
**Check:**
- [ ] All three credentials in .env?
- [ ] Credentials copied correctly (no extra spaces)?
- [ ] Port 5000 available?
- [ ] Node.js installed? (run: `node --version`)

### ❌ "Storage bucket not accessible"
**Check:**
- [ ] Bucket name is exactly `pothole-images`?
- [ ] Bucket set to Public?
- [ ] Storage policies enabled?

### ❌ "Failed to create complaint"
**Check:**
- [ ] Database schema executed successfully?
- [ ] `complaints` table exists in Table Editor?
- [ ] RLS policies enabled?

### ❌ "Missing required environment variable"
**Check:**
- [ ] .env file exists in `backend/` directory?
- [ ] All variables from .env.example are filled?
- [ ] Restarted server after editing .env?

---

## 📞 Need Help?

- 📚 Full guide: `backend/SUPABASE_SETUP.md`
- 💬 Supabase Discord: https://discord.supabase.com
- 📖 Supabase Docs: https://supabase.com/docs

---

## 🚀 Next Steps After Setup

- [ ] Build ML API (FastAPI) for image analysis
- [ ] Connect frontend to backend
- [ ] Test end-to-end flow
- [ ] Deploy to production

---

**Date Completed:** ___ / ___ / ______

**Notes:**
_____________________________________________________________
_____________________________________________________________
_____________________________________________________________

---

✨ Great job setting up Supabase! You're ready to build! ✨

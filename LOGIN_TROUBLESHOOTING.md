# Login Setup & Troubleshooting Guide

## Current Configuration Status

### Backend (Port 5001) ✓
- Port: 5001 (set in `backend/.env`)
- Auth Routes: 
  - POST `/api/auth/register`
  - POST `/api/auth/login`
  - POST `/api/auth/logout`
  - GET `/api/auth/session`

### Frontend (Port 8080/8081) ✓
- API Base URL: `http://localhost:5001/api`
- Vite Proxy: `http://localhost:5001`

---

## Login Flow

### Step 1: User Registration
```
Frontend Register Form
  ↓
POST /api/auth/register
  ↓
Backend creates user in Supabase
  ↓
Response: User data
  ↓
User redirected to login page
```

### Step 2: User Login
```
Frontend Login Form
  ↓
POST /api/auth/login  
  ↓
Backend validates with Supabase
  ↓
Response includes:
  - access_token
  - refresh_token
  - user { id, email, role, full_name }
  ↓
Frontend stores in localStorage (session)
  ↓
Frontend redirects based on role:
  - admin → /admin-dashboard
  - worker → /worker-dashboard
  - user → /dashboard
  ↓
AuthContext loads session from localStorage on next page load
```

---

## Troubleshooting Login Issues

### Issue 1: "Invalid login credentials"
**Cause:** User account doesn't exist in Supabase

**Solution:** 
1. Go to `/register` and create a new account first
2. Wait for email verification (check email)
3. Then try logging in

### Issue 2: Login button doesn't respond
**Cause:** 
- Backend not running
- Network error
- CORS issue

**Solution:**
1. Verify backend is running: `npm run dev` in `/backend` folder
2. Check port 5001: http://localhost:5001/health
3. Check console for network errors (F12)

### Issue 3: Login succeeds but page doesn't redirect
**Cause:** 
- Role not properly set during registration
- localStorage not persisting
- AuthContext not initialized

**Solution:**
1. Check browser DevTools → Application → LocalStorage → `session`
2. Should contain: `{"access_token": "...", "refresh_token": "...", "user": {...}}`
3. Check browser console for errors (F12 → Console)

### Issue 4: Stays on login page after redirect
**Cause:** AuthContext loading session fails

**Solution:**
1. Clear localStorage: In DevTools console:
   ```javascript
   localStorage.removeItem('session')
   ```
2. Restart browser
3. Try again

---

## Testing Steps

### Test 1: Register New User
1. Go to http://localhost:8081/register (or 8080 if available)
2. Fill in:
   - Full Name: `Test User`
   - Email: `testuser123@example.com`
   - Password: `TestPassword123!`
   - Role: `User`
3. Click "Sign up"
4. Should see: "Registration successful"

### Test 2: Login with New User
1. Go to http://localhost:8081/login
2. Fill in:
   - Email: `testuser123@example.com`
   - Password: `TestPassword123!`
3. Click "Login"
4. Should redirect to `/dashboard`

### Test 3: Verify Session Persists
1. Check DevTools → Application → LocalStorage
2. Look for `session` key
3. Should contain token data
4. Refresh page - should stay logged in
5. Should see "dashboard" page

### Test 4: Test Logout
1. From dashboard, click logout button
2. Should clear session from localStorage
3. Should redirect to home page
4. Should not have access to protected routes

---

## Backend API Testing

### Register Test
```powershell
$body = @{
  email = "test@example.com"
  password = "Password123!"
  full_name = "Test User"
  role = "user"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:5001/api/auth/register" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body $body `
  -UseBasicParsing
```

### Login Test
```powershell
$body = @{
  email = "test@example.com"
  password = "Password123!"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:5001/api / auth/login" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body $body `
  -UseBasicParsing
```

---

## Session Storage Structure

When login succeeds, localStorage["session"] contains:
```json
{
  "access_token": "eyJhbGc...",
  "refresh_token": "eyJhbGc...",
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "full_name": "User Name",
    "role": "user"
  }
}
```

---

## Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| 401 Unauthorized | Invalid token | Clear session, login again |
| 500 Server Error | Backend crash | Check backend logs, restart |
| CORS Error | Wrong origin | Verify CORS_ORIGIN=* in backend .env |
| Network Error | Backend not running | Run `npm run dev` in /backend |
| Cannot find route | API endpoint missing | Check auth routes are registered in server.js |

---

## Verification Checklist

- [ ] Backend running on port 5001
- [ ] Frontend running on port 8080 or 8081
- [ ] Supabase URL configured in `backend/.env`
- [ ] Supabase keys configured in `backend/.env`
- [ ] VITE_API_URL set to `http://localhost:5001/api` in `.env`
- [ ] Auth routes registered in `backend/server.js`
- [ ] Frontend Login.tsx uses `login()` from api.ts
- [ ] AuthContext loads sessions from localStorage
- [ ] No TypeScript errors in console
- [ ] Can register a new user
- [ ] Can login with registered user
- [ ] Session persists in localStorage
- [ ] Page redirects based on role

# 📋 Production Deployment Checklist

Use this checklist to ensure your backend is production-ready before deployment.

## ✅ Pre-Deployment Checklist

### 1. Environment Configuration

- [ ] All environment variables set in production environment
- [ ] `NODE_ENV` set to `production`
- [ ] Database credentials secured (not in code)
- [ ] API keys stored in secure vault
- [ ] CORS configured for production domain only
- [ ] Storage bucket configured correctly

### 2. Database Setup

- [ ] Production Supabase project created
- [ ] Database schema executed (`schema.sql`)
- [ ] Indexes created and verified
- [ ] Row Level Security (RLS) policies enabled
- [ ] Backup strategy configured
- [ ] Connection pooling verified

### 3. Storage Configuration

- [ ] Supabase Storage bucket created (`pothole-images`)
- [ ] Bucket set to Public
- [ ] Storage policies applied
- [ ] CDN configured (optional)
- [ ] Image optimization enabled (optional)

### 4. Security Hardening

- [ ] HTTPS enabled (required)
- [ ] Rate limiting added (`express-rate-limit`)
- [ ] Helmet.js middleware added
- [ ] CORS restricted to specific origins
- [ ] File upload limits enforced (10MB)
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention verified
- [ ] XSS protection enabled

**Add these security middlewares:**

```javascript
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Helmet for security headers
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);
```

### 5. Error Handling & Logging

- [ ] Error tracking configured (Sentry, LogRocket)
- [ ] Logging system set up (Winston, Pino)
- [ ] Error notifications enabled
- [ ] Health monitoring configured
- [ ] Uptime monitoring (UptimeRobot, Pingdom)

### 6. Performance Optimization

- [ ] Compression middleware enabled
- [ ] Response caching configured
- [ ] Database query optimization verified
- [ ] Image compression enabled
- [ ] Load testing completed
- [ ] CDN configured for static assets

**Add compression:**

```javascript
const compression = require('compression');
app.use(compression());
```

### 7. ML API Integration

- [ ] ML API URL configured for production
- [ ] ML API authentication configured
- [ ] Timeout settings optimized
- [ ] Retry logic implemented (optional)
- [ ] ML API health check working
- [ ] Fallback handling for ML failures

### 8. Testing

- [ ] All endpoints tested
- [ ] File upload tested (max size, file types)
- [ ] Error scenarios tested
- [ ] Duplicate detection tested
- [ ] ML integration tested end-to-end
- [ ] Load testing completed
- [ ] Security testing completed

### 9. Documentation

- [ ] API documentation up to date
- [ ] Environment variables documented
- [ ] Deployment process documented
- [ ] Troubleshooting guide available
- [ ] Runbook for common issues

### 10. Monitoring & Alerts

- [ ] Application monitoring (New Relic, DataDog)
- [ ] Error rate alerts configured
- [ ] Performance metrics tracked
- [ ] Database monitoring enabled
- [ ] Storage usage monitoring
- [ ] Cost alerts configured

## 🚀 Deployment Steps

### Option 1: Heroku Deployment

```bash
# Install Heroku CLI
heroku login

# Create app
heroku create road-damage-api

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set SUPABASE_URL=your-url
heroku config:set SUPABASE_ANON_KEY=your-key
heroku config:set SUPABASE_SERVICE_ROLE_KEY=your-key
heroku config:set ML_API_URL=your-ml-api-url
heroku config:set STORAGE_BUCKET=pothole-images

# Deploy
git push heroku main

# Scale
heroku ps:scale web=1

# View logs
heroku logs --tail
```

### Option 2: Railway Deployment

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize
railway init

# Add project
railway add

# Set environment variables via Railway dashboard

# Deploy
railway up
```

### Option 3: Docker Deployment

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start server
CMD ["node", "server.js"]
```

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      - ML_API_URL=${ML_API_URL}
      - STORAGE_BUCKET=${STORAGE_BUCKET}
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/health"]
      interval: 30s
      timeout: 3s
      retries: 3
```

Build and run:
```bash
docker-compose up -d
```

### Option 4: AWS Deployment (EC2)

```bash
# 1. Launch EC2 instance (Ubuntu)
# 2. SSH into instance
ssh -i your-key.pem ubuntu@your-ip

# 3. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 4. Install PM2
sudo npm install -g pm2

# 5. Clone repository
git clone your-repo.git
cd backend

# 6. Install dependencies
npm install --production

# 7. Set environment variables
nano .env
# Add your production values

# 8. Start with PM2
pm2 start server.js --name road-damage-api
pm2 save
pm2 startup

# 9. Configure nginx as reverse proxy (optional)
sudo apt install nginx
# Configure nginx to proxy to port 5000
```

## 📊 Post-Deployment Verification

### 1. Health Checks

```bash
# Check health endpoint
curl https://your-domain.com/health

# Expected response
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2026-03-21T10:30:00.000Z"
}
```

### 2. API Functionality

```bash
# Test complaint creation
curl -X POST https://your-domain.com/api/complaints \
  -F "image=@test.jpg" \
  -F "latitude=17.6599" \
  -F "longitude=75.9064"

# Test get complaints
curl https://your-domain.com/api/complaints

# Test statistics
curl https://your-domain.com/api/complaints/stats
```

### 3. Error Handling

```bash
# Test validation errors
curl -X POST https://your-domain.com/api/complaints \
  -F "latitude=invalid" \
  -F "longitude=75.9064"

# Should return 400 with validation errors
```

### 4. Performance Testing

```bash
# Install Apache Bench
sudo apt-get install apache2-utils

# Load test (100 requests, 10 concurrent)
ab -n 100 -c 10 https://your-domain.com/api/complaints
```

## 🔍 Monitoring Setup

### 1. Error Tracking with Sentry

```bash
npm install @sentry/node
```

```javascript
// server.js
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0
});

// Add Sentry request handler
app.use(Sentry.Handlers.requestHandler());

// Add Sentry error handler (before other error handlers)
app.use(Sentry.Handlers.errorHandler());
```

### 2. Application Monitoring

```bash
# New Relic
npm install newrelic
# Add newrelic.js config file

# DataDog
npm install dd-trace
```

### 3. Health Monitoring

Set up external monitoring:
- **UptimeRobot**: https://uptimerobot.com
- **Pingdom**: https://www.pingdom.com
- **StatusCake**: https://www.statuscake.com

## 🔒 Security Hardening

### Install Security Packages

```bash
npm install helmet express-rate-limit hpp express-mongo-sanitize xss-clean
```

### Update server.js

```javascript
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');

// Security headers
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 100
});
app.use('/api/', limiter);

// Prevent HTTP Parameter Pollution
app.use(hpp());

// Data sanitization against NoSQL injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());
```

## 📈 Performance Optimization

### Add Caching

```javascript
const apicache = require('apicache');
const cache = apicache.middleware;

// Cache statistics for 5 minutes
app.get('/api/complaints/stats', cache('5 minutes'), getStats);
```

### Add Compression

```javascript
const compression = require('compression');
app.use(compression());
```

## 🔄 CI/CD Setup

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Deploy to Heroku
        uses: akhileshns/heroku-deploy@v3.12.12
        with:
          heroku_api_key: ${{secrets.HEROKU_API_KEY}}
          heroku_app_name: "your-app-name"
          heroku_email: "your-email@example.com"
```

## ✅ Final Checklist

Before going live:

- [ ] All tests passing
- [ ] Environment variables configured
- [ ] SSL/HTTPS enabled
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] Error tracking configured
- [ ] Monitoring set up
- [ ] Backups configured
- [ ] Documentation updated
- [ ] Team trained on troubleshooting
- [ ] Rollback plan prepared

## 🎉 You're Ready!

Your backend is now production-ready and deployed!

Monitor your application closely in the first 24-48 hours and be ready to address any issues.

**Good luck! 🚀**

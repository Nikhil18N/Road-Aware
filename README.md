# 🛣️ Road Aware - Smart AI-Powered Road Maintenance System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue.svg)](https://www.typescriptlang.org/)

> **An intelligent, citizen-centric application that automates road damage reporting, analysis, and management using AI-powered pothole detection with offline-first PWA capabilities.**

---

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Running the Application](#running-the-application)
- [API Configuration](#api-configuration)
- [Build & Deployment](#build--deployment)
- [Development](#development)
- [Contributing](#contributing)
- [License](#license)

---

## 🌟 Overview

**Road Aware** is a full-stack, AI-integrated solution designed to revolutionize municipal road maintenance. It enables citizens to report road damage with photographic evidence, automatically analyzes images using machine learning (Faster R-CNN) to detect potholes and assess severity, and intelligently routes complaints to responsible departments—all with seamless offline functionality.

### Why Road Aware?

✅ **AI-Powered Diagnostics** - Automated severity classification (Low, Medium, High, Critical)  
✅ **Offline-First PWA** - Works in remote/low-connection zones with background sync  
✅ **Geospatial Intelligence** - Automatic duplicate detection within 50-meter radius  
✅ **Closed-Loop Accountability** - Workers must upload proof-of-work resolution images  
✅ **Real-Time Dashboards** - Interactive maps and analytics for citizens, admins, and field workers  

---

## 🚀 Key Features

### 👤 Citizen Features
- 📱 **Anonymous or Authenticated Reporting** - Submit complaints via mobile camera with auto-GPS tagging
- 🗺️ **Complaint Tracking** - Track status via complaint ID or user dashboard
- 📍 **Public Map View** - Interactive map showing all reported road damage nearby
- 🔔 **Notifications** - Email/SMS updates on complaint status changes

### 👨‍💼 Admin Features
- 📊 **Comprehensive Dashboard** - Real-time analytics, ward-wise metrics, department performance
- 📈 **Data Export** - CSV and PDF report generation for government records
- 🎯 **Auto-Assignment** - Intelligent routing of complaints to departments based on severity
- 🗂️ **Department Management** - Track and manage multiple municipal departments

### 👷 Field Worker Features
- 📋 **Work Assignment Dashboard** - View and manage assigned complaints
- 📸 **Proof of Resolution** - Upload completion photos to close complaints
- 📍 **Real-Time Routing** - Geolocation-based task prioritization
- 💬 **In-App Communication** - Comment threads with admins and supervisors

### ⚙️ Technical Features
- ✅ **Progressive Web App (PWA)** - Install as native app on iOS/Android
- ✅ **Offline-First Architecture** - IndexedDB data persistence, Service Worker caching
- ✅ **Real-Time Sync** - Automatic background synchronization when network returns
- ✅ **Role-Based Access Control (RBAC)** - Secure, row-level security for multi-tenant access
- ✅ **High-Performance ML Integration** - Asynchronous image processing without blocking main thread

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18, TypeScript, Vite | Modern, responsive PWA interface |
| **Styling** | Tailwind CSS, shadcn/ui | Beautiful, accessible component library |
| **State Management** | React Context, TanStack React Query | Global state & server cache |
| **Mapping** | Leaflet, OpenStreetMap | Interactive geospatial visualization |
| **Backend API** | Node.js, Express.js | RESTful API with business logic |
| **Database** | PostgreSQL (Supabase) | Relational data with Row-Level Security |
| **Storage** | Supabase Blob Storage | Image and evidence storage |
| **Authentication** | Supabase Auth | Secure SSO with JWT tokens |
| **ML Service** | Python, FastAPI, PyTorch, Faster R-CNN | Pothole detection & severity assessment |
| **Deployment** | Docker, Cloud platforms | Containerized microservices |

---

## 📁 Project Structure

```
Road-Aware/
├── frontend/                    # React + Vite PWA
│   ├── src/
│   │   ├── pages/              # Page components
│   │   ├── components/         # Reusable UI components
│   │   ├── services/           # API services
│   │   ├── context/            # Auth & global state
│   │   ├── hooks/              # Custom React hooks
│   │   ├── lib/                # Utilities & helpers
│   │   └── main.tsx            # Application entry point
│   ├── index.html              # PWA manifest & entry
│   ├── vite.config.ts          # Vite + PWA configuration
│   ├── tailwind.config.ts      # Tailwind theme
│   └── package.json            # Frontend dependencies
│
├── backend/                     # Node.js Express API
│   ├── controllers/            # Request handlers
│   ├── services/               # Business logic & DB operations
│   ├── routes/                 # API endpoints
│   ├── middleware/             # Auth, logging, error handling
│   ├── config/                 # Supabase client setup
│   ├── database/               # Schema & migrations
│   ├── migrations/             # SQL migration files
│   ├── scripts/                # Seed data & utilities
│   ├── server.js               # Express server entry point
│   ├── .env.example            # Environment template
│   └── package.json            # Backend dependencies
│
├── docs/                        # Documentation
│   └── SUPABASE_SETUP.md       # Database setup guide
│
├── public/                      # Static assets
└── README.md                    # This file
```

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** (v9 or higher) - Comes with Node.js
- **Git** - [Download](https://git-scm.com/)
- **Supabase Account** - [Free tier available](https://supabase.com/)
- **(Optional) Python 3.9+** - For ML service setup
- **(Optional) Docker** - For containerized deployment

**Verify installations:**
```bash
node --version    # Should show v18+
npm --version     # Should show v9+
git --version     # Should show latest version
```

---

## 🔧 Installation & Setup

### Step 1: Clone the Repository

```bash
git clone https://github.com/your-org/Road-Aware.git
cd Road-Aware
```

### Step 2: Frontend Setup

```bash
# Install frontend dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Edit .env.local with your Supabase credentials
# (See API Configuration section below)
```

### Step 3: Backend Setup

```bash
cd backend

# Install backend dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your Supabase credentials
# (See API Configuration section below)

cd ..
```

### Step 4: Database Setup (Supabase)

1. **Create a Supabase Project:**
   - Go to [supabase.com/dashboard](https://supabase.com/dashboard)
   - Click "New Project"
   - Configure database credentials, save them securely

2. **Execute Database Schema:**
   - Open Supabase SQL Editor
   - Copy content from `backend/database/schema.sql`
   - Paste and execute the SQL script
   - This creates all tables, indexes, and Row-Level Security policies

3. **Set Up Storage Bucket:**
   - Go to Storage in Supabase dashboard
   - Create bucket: `road-damage-images`
   - Make it **Public**
   - Storage policies are auto-created by the schema

4. **Get Your Credentials:**
   - Go to Settings > API
   - Copy `SUPABASE_URL` and `SUPABASE_ANON_KEY`
   - Copy `SUPABASE_SERVICE_ROLE_KEY` (backend only)

---

## 🚀 Running the Application

### Development Mode (Frontend + Backend)

**Terminal 1 - Start Frontend:**
```bash
npm run dev
# Frontend runs at http://localhost:8080
```

**Terminal 2 - Start Backend:**
```bash
cd backend
npm run dev
# Backend runs at http://localhost:5000
# API proxy enabled in vite.config.ts
```

### Production Build

```bash
# Build frontend
npm run build

# Output: dist/ folder (ready for deployment)

# Backend deployment: See backend/README.md
```

### Preview Production Build

```bash
npm run preview
# Preview built frontend at http://localhost:4173
```

---

## 📝 API Configuration

### Frontend Environment Variables (`.env.local`)

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_API_URL=http://localhost:5000
```

### Backend Environment Variables (`.backend/.env`)

```env
# Server
PORT=5000
NODE_ENV=development

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
STORAGE_BUCKET=road-damage-images

# ML API (Optional)
ML_API_URL=http://localhost:8000/api/analyze
ML_API_TIMEOUT=30000

# Location
DUPLICATE_LOCATION_THRESHOLD=50

# Email (Optional)
SMTP_HOST=your-smtp-host.com
SMTP_USER=your-email@example.com
SMTP_PASS=your-smtp-password
SMTP_PORT=587
```

> **Security Note:** Never commit `.env` or `.env.local` files. Use `.env.example` as template.

---

## 📦 Build & Deployment

### Build Frontend for Production

```bash
npm run build
npm run preview       # Test production build locally
```

Deployment options:
- **Vercel:** `codebase-framework: "vite"` with `output_dir: "dist"`
- **Netlify:** Drag-and-drop `dist/` folder or connect GitHub
- **Docker:** Create Dockerfile with Node.js base and `npm run build`
- **Firebase Hosting:** Deploy `dist/` folder via Firebase CLI

### Deploy Backend API

Backend deployment supports:
- **Docker** - Containerized Node.js Express server
- **AWS Lambda** - Serverless function deployment
- **Heroku** - Git-based deployment
- **Railway, Render, Fly.io** - Modern PaaS platforms

See `backend/README.md` for detailed deployment instructions.

---

## 🔨 Development

### Available Scripts

```bash
# Frontend
npm run dev            # Start development server with HMR
npm run build          # Build for production
npm run preview        # Preview production build
npm run lint           # Run ESLint
npm test               # Run unit tests
npm run test:watch     # Run tests in watch mode

# Backend (cd backend/ first)
npm run dev            # Start Express server with nodemon
npm run build          # Compile TypeScript (if applicable)
npm run seed           # Seed database with test data
```

### Code Quality

```bash
# Lint frontend code
npm run lint

# Format with Prettier (if configured)
npm run format
```

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test src/pages/ReportDamage.tsx
```

---

## 🌐 API Endpoints

### Complaints (Primary Resource)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/complaints` | Create new complaint |
| GET | `/api/complaints` | List all complaints (filtered) |
| GET | `/api/complaints/:id` | Get complaint details |
| PATCH | `/api/complaints/:id` | Update complaint status |
| POST | `/api/complaints/:id/resolve` | Mark as resolved with proof image |

### Comments

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/complaints/:id/comments` | Get complaint comments |
| POST | `/api/complaints/:id/comments` | Add comment |

### Analytics & Export

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/complaints/export/csv` | Export as CSV |
| GET | `/api/complaints/export/pdf` | Export as PDF |
| GET | `/api/complaints/export/analytics` | Analytics summary |

**Full API documentation:** See `backend/postman_collection.json` (import into Postman)

---

## 🔐 Security & Best Practices

✅ **Authentication:** Supabase Auth with JWT tokens  
✅ **Row-Level Security:** PostgreSQL RLS policies per role  
✅ **Input Validation:** Server-side validation via express-validator  
✅ **CORS:** Configured for frontend origin  
✅ **Environment Variables:** Sensitive data via .env files  
✅ **HTTPS:** Required in production  

**Security Checklist:**
- [ ] Never commit `.env` files
- [ ] Rotate Supabase keys periodically
- [ ] Use HTTPS in production
- [ ] Implement rate limiting on API endpoints
- [ ] Validate and sanitize all user inputs
- [ ] Keep dependencies up-to-date: `npm audit`

---

## 🐛 Troubleshooting

### Frontend won't connect to backend
- Check backend is running: `http://localhost:5000`
- Verify VITE_API_URL in `.env.local`
- Check CORS configuration in backend

### Supabase connection errors
- Verify credentials in `.env` and `.env.local`
- Check Supabase project status in dashboard
- Ensure database schema was executed

### Images not uploading
- Verify `road-damage-images` bucket exists in Supabase
- Ensure bucket is set to **Public**
- Check storage policies in Supabase dashboard

### "Offline Sync Not Working"
- Service Workers require HTTPS in production (or localhost)
- Check browser DevTools > Application > Service Workers
- Clear browser cache and reinstall PWA

---

## 📚 Additional Resources

- **Supabase Documentation:** https://supabase.com/docs
- **React Documentation:** https://react.dev
- **Tailwind CSS:** https://tailwindcss.com
- **Vite Guide:** https://vitejs.dev
- **Express.js:** https://expressjs.com

---

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -m "Add your feature"`
4. Push to branch: `git push origin feature/your-feature`
5. Open Pull Request

---

## 📄 License

This project is licensed under the MIT License - see LICENSE file for details.

---

## 📞 Support

For issues, questions, or suggestions:
- Open a GitHub Issue
- Check existing documentation
- Review backend/README.md for API specifics

---

**Made with ❤️ for smarter, more responsive municipal infrastructure management.**

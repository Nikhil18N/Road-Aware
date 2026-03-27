# 🛣️ Road Aware: Smart AI-Powered Road Maintenance System
**Evaluation Presentation Document**

---

## 🌟 1. Project Overview & Uniqueness
**Road Aware** is an intelligent, citizen-centric application designed to automate and streamline the road damage reporting and management lifecycle. 

### Why is this Unique? 
*   🤖 **AI-Driven Diagnostics:** Unlike traditional grievance systems that rely on manual ticket sorting, Road Aware uses a dedicated Machine Learning model (Faster R-CNN) to automatically detect potholes, estimate surface area, and assign an objective severity score (Low, Medium, High, Critical).
*   📶 **Offline-First PWA:** Features a True Offline Mode. Citizens can open the app, snap a photo, and submit reports in remote/low-network zones. Background synchronization (via Service Workers & IndexedDB) ensures data is uploaded as soon as the network returns.
*   📍 **Geospatial Intelligence & Anti-Spam:** Incorporates smart geographical tracking that automatically intercepts and flags duplicate complaints occurring within a 50-meter radius, saving valuable administrative time and preventing redundant dispatches.
*   🔄 **Closed-Loop Accountability:** It enforces accountability by requiring municipal workers to upload a "Resolution Image" to close a ticket, automatically notifying the citizen of the fix.

---

## ✨ 2. Key Features Implemented to Date
Our prototype is fully functional with the following major systems integrated:
*   **PWA & True Offline Mode:** Fully functional Service Workers and IndexedDB sync. Citizens can report issues offline, and data queues up to auto-sync when the network is restored.
*   **Anonymous Complaint Submission:** Users can submit reports via mobile camera with auto-captured GPS coordinates, without needing to create an account.
*   **Automated Status & Feedback Loop:** End-to-end tracking (Pending -> In Progress -> Resolved). Workers must upload a "Proof of Work" resolution photo to close a ticket.
*   **Interactive Department & Public Dashboards:** Comprehensive Admin dashboards with Ward/Department analytics and data visualization, plus a public interactive map for live geospatial tracking.
*   **Live Interactive Comments:** Mini-chat threads on complaints with role-based visibility, allowing seamless interaction between admins, workers, and citizens.
*   **Admin Analytics & Data Exports:** Admins can instantly generate robust CSV and formatted PDF reports containing complete complaint statistics, severity breakdowns, and resolution times.
*   **Notification Integration:** Automated email notifications are sent for status updates, resolutions, and direct comments.
*   **Secure Authentication & RBAC:** Supabase SSO with Role-Based Access Control securely segmenting Citizens, Field Workers, and system Admins.

---

## 🏗️ 3. Approach & Implementation Methodology
We adopted a **Microservices-oriented architecture** to separate concerns, improve scalability, and easily incorporate Python-based ML alongside our Node.js transactional backend.

### The Four Pillars of Implementation:
1.  **User Layer (Data Collection & PWA):** A progressive web app (PWA) that acts as the entry point. It auto-captures GPS coordinates with the image timestamp. Designed with anonymous reporting capabilities to encourage citizen participation.
2.  **API Layer (Business Logic & Orchestration):** Centralized Node/Express backend that handles routing, deduplication algorithms, and role-based access control (RBAC). It handles the hand-off to the ML layer cleanly via asynchronous processing.
3.  **Intelligence Layer (AI processing):** A highly specialized Python/FastAPI microservice. Images received by the backend are processed here to identify road defect counts and critical severity prior to hitting the active queues.
4.  **Data & Identity Layer (Supabase PaaS):** Leveraged Supabase to handle relational queries (PostgreSQL), complex Role-Based Row Level Security (RLS), User Authentication, and secure Blob Storage for evidence and resolution images.

---

## ⚙️ 4. Architecture Deep-Dive

### Tech Stack
*   **Frontend:** React.js (Vite), TypeScript, Tailwind CSS, shadcn/ui, Workbox (for PWA).
*   **Backend Server:** Node.js, Express.js.
*   **AI/ML Service:** Python, FastAPI, PyTorch, Faster R-CNN.
*   **Database & Storage:** Supabase (PostgreSQL, Blob Storage).
*   **Mapping:** Leaflet / OpenStreetMap.

### Workflow Architecture Diagram (Mental Model)
```text
[ Citizen Device ]
       │  (Offline-First / PWA)
       ▼
[ Node.js Backend API ]  <───────────> [ Supabase (PostgreSQL + Auth + Storage) ]
       │                                     ^
       │ (Async Image URL passing)           │
       ▼                                     │
[ Python/FastAPI ML Microservice ] ──────────┘
(Faster R-CNN: Pothole Count, Area, Severity)
```

---

## 👥 5. Role-Based Capabilities

The system serves three distinct stakeholders with custom dashboards:
*   **Citizen Layer:** Quick damage reporting (with/without login), complaint tracking via UUID, interactive mapping to view neighborhood defects, and email/SMS/Push notifications on status changes.
*   **Admin/Department Layer:** Comprehensive analytics dashboard, CSV/PDF export generation for government records, ward-wise performance metrics, and tools for overriding or verifying severity.
*   **Worker Layer:** Mobile-optimized assignment dashboard, real-time routing to defects, and mandatory "proof of work" image uploads to resolve assigned tasks.

---

## 🚀 6. Readiness for Evaluation Panel

**Key Interactions to Highlight During Q&A:**
1.  **Demonstrate the PWA Offline Sync:** Turn off network tools in browser, submit a report, turn on network, and show the background sync working.
2.  **Highlight the AI Speed & Logic:** Explain how the Faster R-CNN model calculates severity (e.g., surface area thresholding) without locking up the Node main thread.
3.  **Show the Deduplication Logic:** Try creating two complaints in the exact same location and show the panel how the system catches the 50-meter radius overlap.
4.  **Security & Privacy:** Address how Row-Level Security (RLS) restricts workers to only their assigned department/ward while keeping reporter personal data private.

---
*Road Aware team is ready to disrupt civic infrastructure management with actionable, AI-backed, and location-aware insights.*
# SAMVED Phase 2 Prototype Development Submission

**Project Title:** Road Aware - Smart AI-Powered Road Maintenance System

---

## 1. Problem Statement
The current road maintenance system relies heavily on manual reporting and inspections, which leads to:
*   **Delayed identification** of critical road damage (potholes, cracks).
*   **Lack of verifiable data** (location, severity) for reported issues.
*   **Inefficient resource allocation** due to the inability to prioritize damage severity automatically.
*   **Duplicate complaints** for the same issue, wasting administrative time.

## 2. Proposed Solution
**Road Aware** is an intelligent, citizen-centric application that automates the road damage reporting and management lifecycle. 
*   **Citizen Reporting:** Uses a mobile-responsive web app to capture images and GPS locations of road damage.
*   **AI Analysis:** Integrates a Machine Learning model (Faster R-CNN) to automatically detect potholes, calculate their area, and assign a severity score (Low, Medium, High, Critical).
*   **Automated Workflow:** Auto-assigns complaints to the relevant department (e.g., Public Works) based on severity and prevents duplicate reports within a 50-meter radius.

## 3. Key Features
1.  **Smart Reporting Interface:**
    *   Camera integration with auto-capture.
    *   Automatic GPS Coordinate tagging.
    *   Offline-capable PWA features.
2.  **AI-Powered Analysis (Backend):**
    *   **Automated Pothole Detection:** Counts potholes and estimates surface area.
    *   **Severity Classification:** Auto-tags issues as Low, Medium, High, or Critical.
3.  **Intelligent Backend Processing:**
    *   **Duplicate Detection:** Checks for existing unresolved complaints within 50 meters to prevent spam.
    *   **Auto-Assignment:** Routes complaints to specific departments (PWD, Water Board, etc.).
4.  **Dashboards & Visualization:**
    *   **Citizen Dashboard:** Track complaint status (Processing -> Analyzed -> Resolved).
    *   **Admin Dashboard:** Geospatial map view of all defects for route planning.
    *   **Worker Dashboard:** View assigned tasks and update status.

## 4. Technology Stack
*   **Frontend:** React.js (Vite), Tailwind CSS, shadcn/ui.
*   **Backend API:** Node.js, Express.js.
*   **AI/ML Service:** Python, FastAPI, PyTorch, Faster R-CNN.
*   **Database & Storage:** Supabase (PostgreSQL, Blob Storage).
*   **Maps:** Leaflet / OpenStreetMap.

## 5. Implementation Methodology
The project follows a microservices-like architecture:
1.  **User Layer:** React frontend serves as the entry point for data collection.
2.  **API Layer:** Node.js backend handles business logic, authentication (Supabase Auth), and orchestration.
3.  **Intelligence Layer:** A dedicated Python microservice hosts the ML model. Images are passed via URL, processed, and results (count, severity) are returned to the backend.
4.  **Data Layer:** PostgreSQL stores relational data (complaints, users, departments) while Blob Storage holds the evidence images.

## 6. Current Status (Prototype)
*   **Completed:** 
    *   Full-stack integration (Frontend <-> Backend <-> ML Service).
    *   Real-time pothole detection and severity scoring.
    *   Geospatial duplicate detection algorithm.
    *   Role-based access control (Citizen, Admin, Worker).
*   **Demonstration Ready:** Yes. The system can successfully capture a live image, analyze it, and display it on the admin dashboard with the correct severity tag.

## 7. Future Scope
*   **IoT Integration:** Auto-trigger reports from survey vehicles.
*   **Predictive Maintenance:** Use historical data to predict where potholes will form next.
*   **Public API:** Allow integration with existing municipal grievance systems.

-- Road-Aware Database Schema for Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. WARDS TABLE
CREATE TABLE wards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ward_number INTEGER UNIQUE NOT NULL,
  ward_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TEAMS TABLE (for assignment)
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_name VARCHAR(100) UNIQUE NOT NULL,
  department VARCHAR(100),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. REPORTS TABLE (main table)
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  complaint_id VARCHAR(50) UNIQUE NOT NULL, -- e.g., SMC-2026-001234

  -- Reporter Information
  reporter_name VARCHAR(100) NOT NULL,
  reporter_phone VARCHAR(15) NOT NULL,
  reporter_email VARCHAR(100),

  -- Damage Details
  damage_type VARCHAR(50) NOT NULL, -- pothole, crack, cave-in, erosion, waterlogging, other
  severity VARCHAR(20) NOT NULL, -- low, moderate, critical
  description TEXT,

  -- Location Details
  location VARCHAR(255) NOT NULL,
  landmark VARCHAR(255),
  ward_id UUID REFERENCES wards(id),
  gps_latitude DECIMAL(10, 8),
  gps_longitude DECIMAL(11, 8),

  -- Image
  image_url TEXT, -- Supabase Storage URL
  image_size VARCHAR(50),

  -- Status & Assignment
  status VARCHAR(50) DEFAULT 'pending', -- pending, under_review, assigned, in_progress, resolved, rejected
  assigned_team_id UUID REFERENCES teams(id),
  priority INTEGER DEFAULT 2, -- 1: Low, 2: Moderate, 3: Critical

  -- Timestamps
  reported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,

  -- Metadata
  created_by UUID, -- Optional: if you want to track admin who created/verified
  updated_by UUID
);

-- 4. STATUS TIMELINE TABLE
CREATE TABLE status_timeline (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL,
  description TEXT,
  changed_by UUID, -- Optional: who made the change
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. COMMENTS TABLE (Optional - for internal notes)
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- INDEXES for better performance
CREATE INDEX idx_reports_complaint_id ON reports(complaint_id);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_ward_id ON reports(ward_id);
CREATE INDEX idx_reports_severity ON reports(severity);
CREATE INDEX idx_reports_reported_at ON reports(reported_at DESC);
CREATE INDEX idx_status_timeline_report_id ON status_timeline(report_id);

-- FUNCTION: Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- TRIGGER: Auto-update updated_at on reports table
CREATE TRIGGER update_reports_updated_at
BEFORE UPDATE ON reports
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- FUNCTION: Generate complaint ID
CREATE OR REPLACE FUNCTION generate_complaint_id()
RETURNS VARCHAR AS $$
DECLARE
  new_id VARCHAR;
  year_val VARCHAR;
  counter INTEGER;
BEGIN
  year_val := TO_CHAR(NOW(), 'YYYY');

  -- Get the count of reports for this year
  SELECT COUNT(*) + 1 INTO counter
  FROM reports
  WHERE complaint_id LIKE 'SMC-' || year_val || '-%';

  -- Generate ID: SMC-YYYY-NNNNNN
  new_id := 'SMC-' || year_val || '-' || LPAD(counter::TEXT, 6, '0');

  RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- TRIGGER: Auto-generate complaint_id if not provided
CREATE OR REPLACE FUNCTION set_complaint_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.complaint_id IS NULL OR NEW.complaint_id = '' THEN
    NEW.complaint_id := generate_complaint_id();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_complaint_id_trigger
BEFORE INSERT ON reports
FOR EACH ROW
EXECUTE FUNCTION set_complaint_id();

-- FUNCTION: Auto-create timeline entry on status change
CREATE OR REPLACE FUNCTION create_status_timeline()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create timeline entry if status changed or it's a new report
  IF (TG_OP = 'INSERT') OR (NEW.status IS DISTINCT FROM OLD.status) THEN
    INSERT INTO status_timeline (report_id, status, description)
    VALUES (
      NEW.id,
      NEW.status,
      CASE
        WHEN NEW.status = 'pending' THEN 'Complaint submitted by citizen'
        WHEN NEW.status = 'under_review' THEN 'Complaint verified by ward officer'
        WHEN NEW.status = 'assigned' THEN 'Assigned to department team'
        WHEN NEW.status = 'in_progress' THEN 'Repair work has started'
        WHEN NEW.status = 'resolved' THEN 'Issue has been resolved'
        WHEN NEW.status = 'rejected' THEN 'Complaint rejected'
        ELSE 'Status updated'
      END
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_status_timeline_trigger
AFTER INSERT OR UPDATE OF status ON reports
FOR EACH ROW
EXECUTE FUNCTION create_status_timeline();

-- SEED DATA: Insert sample wards
INSERT INTO wards (ward_number, ward_name) VALUES
(1, 'Ward 1'), (2, 'Ward 2'), (3, 'Ward 3'), (4, 'Ward 4'), (5, 'Ward 5'),
(6, 'Ward 6'), (7, 'Ward 7'), (8, 'Ward 8'), (9, 'Ward 9'), (10, 'Ward 10'),
(11, 'Ward 11'), (12, 'Ward 12'), (13, 'Ward 13'), (14, 'Ward 14'), (15, 'Ward 15'),
(16, 'Ward 16'), (17, 'Ward 17'), (18, 'Ward 18'), (19, 'Ward 19'), (20, 'Ward 20');

-- SEED DATA: Insert sample teams
INSERT INTO teams (team_name, department) VALUES
('Team Alpha', 'Public Works Department'),
('Team Beta', 'Public Works Department'),
('Team Gamma', 'Public Works Department'),
('Team Delta', 'Road Maintenance Division'),
('Team Epsilon', 'Emergency Response Unit');

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read reports (for public tracking)
CREATE POLICY "Anyone can view reports" ON reports
  FOR SELECT USING (true);

-- Policy: Anyone can insert reports (for public reporting)
CREATE POLICY "Anyone can create reports" ON reports
  FOR INSERT WITH CHECK (true);

-- Policy: Anyone can view timeline
CREATE POLICY "Anyone can view timeline" ON status_timeline
  FOR SELECT USING (true);

-- Policy: Only authenticated users can update reports (admin only)
-- Note: You'll need to set up authentication for this
-- CREATE POLICY "Only admins can update reports" ON reports
--   FOR UPDATE USING (auth.role() = 'authenticated');

-- Policy: Only authenticated users can insert timeline entries
-- CREATE POLICY "Only admins can create timeline" ON status_timeline
--   FOR INSERT WITH CHECK (auth.role() = 'authenticated');

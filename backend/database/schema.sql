-- ================================================
-- Smart Road Damage Reporting System
-- Database Schema for Supabase PostgreSQL
-- ================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================
-- COMPLAINTS TABLE
-- ================================================

CREATE TABLE IF NOT EXISTS complaints (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Image information
  image_url TEXT NOT NULL,

  -- Location information
  latitude DOUBLE PRECISION NOT NULL CHECK (latitude >= -90 AND latitude <= 90),
  longitude DOUBLE PRECISION NOT NULL CHECK (longitude >= -180 AND longitude <= 180),

  -- Description
  description TEXT,

  -- ML Analysis results
  potholes_detected INTEGER,
  severity TEXT CHECK (severity IN ('Low', 'Medium', 'High')),
  largest_pothole_area DOUBLE PRECISION,

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'processing'
    CHECK (status IN ('processing', 'analyzed', 'failed', 'pending', 'resolved')),

  -- Error tracking (for ML failures)
  error_message TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- ================================================
-- INDEXES for better query performance
-- ================================================

CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_severity ON complaints(severity);
CREATE INDEX IF NOT EXISTS idx_complaints_created_at ON complaints(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_complaints_location ON complaints(latitude, longitude);

-- ================================================
-- TRIGGER: Auto-update updated_at timestamp
-- ================================================

CREATE OR REPLACE FUNCTION update_complaints_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_complaints_updated_at
  BEFORE UPDATE ON complaints
  FOR EACH ROW
  EXECUTE FUNCTION update_complaints_updated_at();

-- ================================================
-- ROW LEVEL SECURITY (RLS)
-- ================================================

-- Enable RLS
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read complaints
CREATE POLICY "Anyone can view complaints" ON complaints
  FOR SELECT USING (true);

-- Policy: Anyone can insert complaints (for public reporting)
CREATE POLICY "Anyone can create complaints" ON complaints
  FOR INSERT WITH CHECK (true);

-- Policy: Anyone can update complaints (should be restricted to authenticated users in production)
CREATE POLICY "Anyone can update complaints" ON complaints
  FOR UPDATE USING (true);

-- ================================================
-- STORAGE BUCKET SETUP
-- ================================================

-- Create storage bucket for pothole images
-- NOTE: This must be done via Supabase Dashboard or using the Storage API
-- Go to Storage > Create Bucket > Name: "pothole-images" > Public: true

-- Storage policies (run after creating bucket via dashboard)
-- Allow public read access to images
CREATE POLICY "Public Access to Images" ON storage.objects
  FOR SELECT USING (bucket_id = 'pothole-images');

-- Allow anyone to upload images
CREATE POLICY "Anyone can upload images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'pothole-images');

-- Allow deletion of images (for cleanup)
CREATE POLICY "Allow image deletion" ON storage.objects
  FOR DELETE USING (bucket_id = 'pothole-images');

-- ================================================
-- SAMPLE DATA (Optional - for testing)
-- ================================================

-- Insert sample complaint
INSERT INTO complaints (
  image_url,
  latitude,
  longitude,
  description,
  potholes_detected,
  severity,
  largest_pothole_area,
  status
) VALUES (
  'https://example.com/sample-pothole.jpg',
  17.6599,
  75.9064,
  'Large pothole on MG Road near City Mall',
  3,
  'High',
  25.5,
  'analyzed'
);

-- ================================================
-- USEFUL QUERIES
-- ================================================

-- Get all complaints with status breakdown
-- SELECT
--   status,
--   COUNT(*) as count,
--   AVG(potholes_detected) as avg_potholes
-- FROM complaints
-- WHERE potholes_detected IS NOT NULL
-- GROUP BY status;

-- Get severity distribution
-- SELECT
--   severity,
--   COUNT(*) as count
-- FROM complaints
-- WHERE severity IS NOT NULL
-- GROUP BY severity;

-- Get recent complaints
-- SELECT *
-- FROM complaints
-- ORDER BY created_at DESC
-- LIMIT 10;

-- Find complaints near a location (within ~1km)
-- SELECT *,
--   (
--     6371 * acos(
--       cos(radians(17.6599)) * cos(radians(latitude)) *
--       cos(radians(longitude) - radians(75.9064)) +
--       sin(radians(17.6599)) * sin(radians(latitude))
--     ) * 1000
--   ) AS distance_meters
-- FROM complaints
-- WHERE status != 'resolved'
-- HAVING distance_meters < 1000
-- ORDER BY distance_meters;

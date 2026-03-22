-- Migration: Setup Departments & Linking
-- Adds departments table and links it to complaints and profiles

-- 1. Create Departments Table
CREATE TABLE IF NOT EXISTS public.departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Insert Standard Municipal Departments (Filtered for Road Management)
INSERT INTO public.departments (name, code, description) VALUES
('Public Works Department', 'pwd', 'Roads, bridges, flyovers, and building maintenance'),
('Water Supply Department', 'water', 'Water pipeline leaks causing road damage'),
('Drainage & Sewage Department', 'drainage', 'Blocked drains, open manholes on roads, sewage overflow'),
('Town Planning Department', 'town_planning', 'Illegal construction and encroachment removal on roads'),
('Electricity Department', 'electricity', 'Street lights, electrical poles affecting traffic')
ON CONFLICT (code) DO UPDATE 
SET description = EXCLUDED.description;

-- Optional: Cleanup unrelated departments if they exist from previous migrations
DELETE FROM public.departments 
WHERE code NOT IN ('pwd', 'water', 'drainage', 'town_planning', 'electricity');

-- 3. Add department_id to Complaints
ALTER TABLE public.complaints 
ADD COLUMN IF NOT EXISTS department_id INTEGER REFERENCES public.departments(id);

-- 4. Add department_id to Profiles (for Workers/Officials)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS department_id INTEGER REFERENCES public.departments(id);

-- 5. Create index for faster querying
CREATE INDEX IF NOT EXISTS idx_complaints_department ON public.complaints(department_id);
CREATE INDEX IF NOT EXISTS idx_profiles_department ON public.profiles(department_id);

-- 6. Update RLS Policies (Optional but good practice)
-- Allow anyone to read departments
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Read Departments" ON public.departments
FOR SELECT USING (true);

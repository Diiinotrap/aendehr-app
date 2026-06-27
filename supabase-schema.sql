-- =============================================
-- HRIS Database Schema
-- Run this SQL in Supabase SQL Editor
-- =============================================

-- 1. Create employees table
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  position VARCHAR(100),
  division VARCHAR(100),
  role VARCHAR(20) DEFAULT 'employee' CHECK (role IN ('admin', 'employee')),
  avatar_url TEXT,
  join_date DATE DEFAULT CURRENT_DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
  type VARCHAR(10) NOT NULL CHECK (type IN ('clock_in', 'clock_out')),
  selfie_url TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  address TEXT,
  notes TEXT,
  server_timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_employees_auth_id ON employees(auth_id);
CREATE INDEX IF NOT EXISTS idx_employees_role ON employees(role);
CREATE INDEX IF NOT EXISTS idx_employees_division ON employees(division);
CREATE INDEX IF NOT EXISTS idx_attendance_employee_id ON attendance(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_type ON attendance(type);
CREATE INDEX IF NOT EXISTS idx_attendance_server_timestamp ON attendance(server_timestamp);

-- 4. Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON employees
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 5. Enable Row Level Security (RLS)
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for employees table

-- Admin can read all employees
CREATE POLICY "Admin can read all employees"
  ON employees FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e 
      WHERE e.auth_id = auth.uid() AND e.role = 'admin'
    )
  );

-- Employee can read own data
CREATE POLICY "Employee can read own data"
  ON employees FOR SELECT
  TO authenticated
  USING (auth_id = auth.uid());

-- Admin can insert employees
CREATE POLICY "Admin can insert employees"
  ON employees FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees e 
      WHERE e.auth_id = auth.uid() AND e.role = 'admin'
    )
  );

-- Admin can update employees
CREATE POLICY "Admin can update employees"
  ON employees FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e 
      WHERE e.auth_id = auth.uid() AND e.role = 'admin'
    )
  );

-- Admin can delete employees
CREATE POLICY "Admin can delete employees"
  ON employees FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e 
      WHERE e.auth_id = auth.uid() AND e.role = 'admin'
    )
  );

-- 7. RLS Policies for attendance table

-- Admin can read all attendance
CREATE POLICY "Admin can read all attendance"
  ON attendance FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e 
      WHERE e.auth_id = auth.uid() AND e.role = 'admin'
    )
  );

-- Employee can read own attendance
CREATE POLICY "Employee can read own attendance"
  ON attendance FOR SELECT
  TO authenticated
  USING (
    employee_id IN (
      SELECT id FROM employees WHERE auth_id = auth.uid()
    )
  );

-- Employee can insert own attendance
CREATE POLICY "Employee can insert own attendance"
  ON attendance FOR INSERT
  TO authenticated
  WITH CHECK (
    employee_id IN (
      SELECT id FROM employees WHERE auth_id = auth.uid()
    )
  );

-- 8. Create storage buckets (run these in SQL Editor)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('attendance-photos', 'attendance-photos', false)
ON CONFLICT (id) DO NOTHING;

-- 9. Storage policies for avatars bucket
CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload avatars"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can update avatars"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can delete avatars"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'avatars');

-- 10. Storage policies for attendance-photos bucket
CREATE POLICY "Authenticated users can read attendance photos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'attendance-photos');

CREATE POLICY "Authenticated users can upload attendance photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'attendance-photos');

-- =============================================
-- IMPORTANT: Create your first admin user
-- =============================================
-- Step 1: Go to Supabase Dashboard > Authentication > Users
-- Step 2: Click "Add User" and create a user with email/password
-- Step 3: Copy the user's UUID from the users table
-- Step 4: Run this INSERT (replace the values):
--
-- INSERT INTO employees (auth_id, name, email, role, position, division)
-- VALUES (
--   'YOUR-AUTH-USER-UUID-HERE',
--   'Admin Name',
--   'admin@email.com',
--   'admin',
--   'HR Manager',
--   'Human Resources'
-- );

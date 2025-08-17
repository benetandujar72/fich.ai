-- Add missing columns to employees to align with shared/schema.ts
ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS academic_year_id varchar,
  ADD COLUMN IF NOT EXISTS teacher_code varchar,
  ADD COLUMN IF NOT EXISTS contract_hours numeric(5,2);

-- Backfill academic_year_id for existing employees to current active year per institution
-- Note: This sets employees to the active year at migration time; adjust manually if needed
UPDATE employees e
SET academic_year_id = ay.id
FROM academic_years ay
WHERE ay.institution_id = e.institution_id AND ay.is_active = true AND e.academic_year_id IS NULL;

-- Create useful indexes
CREATE INDEX IF NOT EXISTS idx_employees_institution_year ON employees (institution_id, academic_year_id);
CREATE INDEX IF NOT EXISTS idx_employees_teacher_code ON employees (teacher_code);
CREATE INDEX IF NOT EXISTS idx_employees_email ON employees (email);


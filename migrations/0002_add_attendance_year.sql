-- Add academic_year_id to attendance_records to support per-year reporting
ALTER TABLE attendance_records
  ADD COLUMN IF NOT EXISTS academic_year_id varchar;

-- Backfill attendance_records academic_year_id by joining employee institution's active year at the time of insert
-- This is best-effort; historical data without year will be assigned current active year
UPDATE attendance_records ar
SET academic_year_id = ay.id
FROM employees e
JOIN academic_years ay ON ay.institution_id = e.institution_id AND ay.is_active = true
WHERE ar.employee_id = e.id AND ar.academic_year_id IS NULL;

-- Create index for queries by employee and year
CREATE INDEX IF NOT EXISTS idx_attendance_employee_year ON attendance_records (employee_id, academic_year_id);


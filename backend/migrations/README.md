# Database Migration Instructions

## Add Contact Fields to Complaints Table

This migration adds optional contact information fields to the complaints table to support both anonymous and tracked submissions.

### Fields Added:
- `reporter_name` (VARCHAR 100) - Optional name of person reporting
- `reporter_phone` (VARCHAR 15) - Optional phone for SMS updates and tracking verification
- `reporter_email` (VARCHAR 255) - Optional email for updates and tracking verification

### To Run This Migration:

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Navigate to your project
   - Click on "SQL Editor" in the sidebar

2. **Execute the Migration**
   - Copy the contents of `add_contact_fields.sql`
   - Paste into the SQL Editor
   - Click "Run" to execute

3. **Verify the Migration**
   Run this query to verify the columns were added:
   ```sql
   SELECT column_name, data_type, character_maximum_length
   FROM information_schema.columns
   WHERE table_name = 'complaints'
   AND column_name IN ('reporter_name', 'reporter_phone', 'reporter_email');
   ```

### Alternative: Using Supabase CLI

If you have Supabase CLI installed:

```bash
# Navigate to backend directory
cd backend

# Run migration
supabase db push
```

### Rollback (if needed):

If you need to remove these fields:

```sql
ALTER TABLE complaints
DROP COLUMN IF EXISTS reporter_name,
DROP COLUMN IF EXISTS reporter_phone,
DROP COLUMN IF EXISTS reporter_email;

DROP INDEX IF EXISTS idx_complaints_reporter_phone;
DROP INDEX IF EXISTS idx_complaints_reporter_email;
```

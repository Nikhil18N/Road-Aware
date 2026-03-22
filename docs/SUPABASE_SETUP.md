# Road-Aware - Supabase Backend Setup Guide

## 🎯 Quick Start

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Wait for the project to be fully set up (1-2 minutes)

### 2. Set Up Database

1. In your Supabase dashboard, go to **SQL Editor**
2. Create a new query
3. Copy the entire content from `supabase-schema.sql` and paste it
4. Click **Run** to execute the schema

This will create:
- Tables: `wards`, `teams`, `reports`, `status_timeline`, `comments`
- Triggers for auto-generating complaint IDs and status timeline
- Indexes for better performance
- Row Level Security (RLS) policies
- Seed data for wards (20 wards) and teams (5 teams)

### 3. Set Up Storage for Images

1. Go to **Storage** in Supabase dashboard
2. Create a new bucket called `road-damage-images`
3. Make it **Public** (so images can be accessed via URL)
4. Set the following policies:
   - **INSERT**: Allow anyone to upload images
   - **SELECT**: Allow anyone to view images

Or use SQL:
```sql
-- Create storage bucket (run in SQL Editor)
INSERT INTO storage.buckets (id, name, public)
VALUES ('road-damage-images', 'road-damage-images', true);

-- Allow public access to read images
CREATE POLICY "Public Access" ON storage.objects FOR SELECT
USING (bucket_id = 'road-damage-images');

-- Allow anyone to upload images
CREATE POLICY "Anyone can upload images" ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'road-damage-images');
```

### 4. Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Get your Supabase credentials:
   - Go to **Project Settings** > **API**
   - Copy **Project URL** → paste as `VITE_SUPABASE_URL`
   - Copy **anon/public key** → paste as `VITE_SUPABASE_ANON_KEY`

3. Your `.env` file should look like:
   ```
   VITE_SUPABASE_URL=https://abcdefgh.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### 5. Install Supabase Client

```bash
npm install @supabase/supabase-js
```

### 6. Update Your React Components

The service layer is ready in `src/services/reportService.ts`. Update your components to use these services:

#### Example: Update ReportDamage.tsx

```typescript
import { createReport, CreateReportData } from '@/services/reportService';

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsSubmitting(true);

  // Convert base64 image to File if needed
  let imageFile: File | undefined;
  if (imagePreview) {
    const blob = await fetch(imagePreview).then(r => r.blob());
    imageFile = new File([blob], 'damage-photo.jpg', { type: 'image/jpeg' });
  }

  const reportData: CreateReportData = {
    reporter_name: formData.name,
    reporter_phone: formData.phone,
    reporter_email: formData.email,
    damage_type: formData.damageType,
    severity: formData.severity as 'low' | 'moderate' | 'critical',
    description: formData.description,
    location: formData.location,
    landmark: formData.landmark,
    ward_number: parseInt(formData.ward.split('-')[1]),
    gps_latitude: gpsCoords?.lat,
    gps_longitude: gpsCoords?.lng,
    image_file: imageFile,
  };

  const result = await createReport(reportData);

  if (result.success && result.data) {
    toast({
      title: "Report Submitted Successfully!",
      description: `Your complaint ID is ${result.data.complaint_id}. You can track the status using this ID.`,
    });
    // Reset form...
  } else {
    toast({
      title: "Submission Failed",
      description: result.error || "Please try again later.",
      variant: "destructive",
    });
  }

  setIsSubmitting(false);
};
```

#### Example: Update TrackComplaint.tsx

```typescript
import { getReportByComplaintId } from '@/services/reportService';

const handleSearch = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!searchId.trim()) return;

  setIsSearching(true);
  setNotFound(false);
  setComplaint(null);

  const result = await getReportByComplaintId(searchId);

  if (result.success && result.data) {
    // Transform the data to match your component's interface
    setComplaint({
      id: result.data.complaint_id,
      type: result.data.damage_type,
      severity: result.data.severity,
      status: result.data.status,
      location: result.data.location,
      ward: `Ward ${result.data.ward?.ward_number}`,
      reportedBy: result.data.reporter_name,
      reportedAt: new Date(result.data.reported_at).toLocaleString(),
      assignedTo: result.data.team?.team_name || null,
      timeline: result.timeline?.map(t => ({
        status: t.status,
        date: new Date(t.changed_at).toLocaleString(),
        description: t.description,
        isCompleted: true,
        icon: getIconForStatus(t.status)
      })) || []
    });
  } else {
    setNotFound(true);
  }

  setIsSearching(false);
};
```

#### Example: Update Dashboard.tsx

```typescript
import { getAllReports, getDashboardStats } from '@/services/reportService';
import { useQuery } from '@tanstack/react-query';

const Dashboard = () => {
  const [statusFilter, setStatusFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");

  // Fetch dashboard stats
  const { data: statsData } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const result = await getDashboardStats();
      return result.data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch reports with filters
  const { data: reportsData, isLoading } = useQuery({
    queryKey: ['reports', statusFilter, severityFilter],
    queryFn: async () => {
      const result = await getAllReports({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        severity: severityFilter !== 'all' ? severityFilter : undefined,
      });
      return result.data;
    },
  });

  // Use the data in your component...
};
```

## 📊 Database Schema Overview

### Tables

1. **wards** - Municipal wards information
2. **teams** - Department teams for assignment
3. **reports** - Main table for all road damage reports
4. **status_timeline** - Tracks status changes for each report
5. **comments** - Optional internal notes (admin feature)

### Key Features

- ✅ Auto-generated complaint IDs (SMC-YYYY-NNNNNN format)
- ✅ Auto-updating timestamps
- ✅ Automatic timeline creation on status change
- ✅ Row Level Security (RLS) for public/admin access
- ✅ Indexed queries for better performance
- ✅ GPS coordinates support
- ✅ Image storage via Supabase Storage

## 🔒 Security Considerations

### Current Setup (Public Access)
- Anyone can create reports (no auth required)
- Anyone can view reports and track by complaint ID
- Good for MVP/public reporting system

### For Production (Add Authentication)

1. Enable Supabase Auth:
```typescript
// Login
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'admin@example.com',
  password: 'password'
});

// Check if user is authenticated
const { data: { user } } = await supabase.auth.getUser();
```

2. Update RLS policies to restrict updates to authenticated users:
```sql
-- Only authenticated users can update reports
CREATE POLICY "Only admins can update reports" ON reports
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Only authenticated users can change status
CREATE POLICY "Only admins can update status" ON reports
  FOR UPDATE USING (auth.role() = 'authenticated');
```

## 🚀 Advanced Features to Add

### 1. Real-time Updates
```typescript
// Subscribe to new reports
const subscription = supabase
  .channel('reports')
  .on('postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'reports' },
    (payload) => {
      console.log('New report:', payload.new);
      // Update UI
    }
  )
  .subscribe();
```

### 2. Email Notifications
Set up Supabase Edge Functions for email notifications when:
- New report is created
- Status changes
- Report is resolved

### 3. Admin Dashboard
- Add authentication for admin users
- Create admin-only routes for managing reports
- Add ability to assign teams, update status, add comments

### 4. Image Optimization
- Add image compression before upload
- Generate thumbnails for faster loading
- Implement lazy loading for images

### 5. Analytics
- Track response times
- Generate monthly reports
- Ward-wise performance metrics
- Team efficiency tracking

## 🐛 Troubleshooting

### Issue: "Failed to create report"
- Check Supabase credentials in `.env`
- Verify `wards` table has seed data
- Check browser console for detailed errors

### Issue: "Image upload failed"
- Verify storage bucket `road-damage-images` exists
- Check bucket is set to **Public**
- Verify storage policies allow INSERT

### Issue: "Report not found"
- Verify complaint ID format (SMC-YYYY-NNNNNN)
- Check if report exists in database
- Complaint IDs are case-insensitive

## 📝 Next Steps

1. ✅ Set up Supabase project
2. ✅ Run database schema
3. ✅ Configure storage
4. ✅ Add environment variables
5. ✅ Install dependencies
6. ⬜ Update React components to use services
7. ⬜ Test report creation
8. ⬜ Test report tracking
9. ⬜ Test dashboard
10. ⬜ Add authentication (optional)
11. ⬜ Deploy to production

## 🌐 API Service Functions

All service functions are in `src/services/reportService.ts`:

- `createReport(data)` - Create a new report
- `getReportByComplaintId(id)` - Get report details with timeline
- `getAllReports(filters)` - Get all reports with optional filters
- `getDashboardStats()` - Get dashboard statistics
- `updateReportStatus(id, status)` - Update report status (admin)
- `uploadImage(file, complaintId)` - Upload image to storage

## 💡 Tips

- Use React Query (`@tanstack/react-query`) for data fetching and caching
- Enable real-time subscriptions for live dashboard updates
- Add pagination for large datasets
- Implement proper error handling and user feedback
- Use TypeScript types from `src/lib/supabase.ts`

---

**Need help?** Check [Supabase Documentation](https://supabase.com/docs) or open an issue.

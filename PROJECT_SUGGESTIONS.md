# Road-Aware - Project Suggestions & Improvements

## 🎯 Immediate Enhancements

### 1. **CSS Import Warning Fix**
There's a CSS warning about `@import` placement in your `index.css`. Move the Google Fonts import to the top:

```css
/* Move this to the top of index.css */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

/* Rest of your CSS... */
```

### 2. **Image Handling Improvements**

#### Convert base64 to File for Upload
```typescript
// In ReportDamage.tsx
const base64ToFile = async (base64: string, filename: string): Promise<File> => {
  const response = await fetch(base64);
  const blob = await response.blob();
  return new File([blob], filename, { type: 'image/jpeg' });
};

// Usage
const imageFile = imagePreview
  ? await base64ToFile(imagePreview, `damage-${Date.now()}.jpg`)
  : undefined;
```

#### Add Image Compression
```bash
npm install browser-image-compression
```

```typescript
import imageCompression from 'browser-image-compression';

const handleImageCapture = async (imageData: string, quality: number) => {
  // Convert to file
  const file = await base64ToFile(imageData, 'damage.jpg');

  // Compress
  const options = {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 1920,
    useWebWorker: true
  };

  const compressedFile = await imageCompression(file, options);
  setImagePreview(URL.createObjectURL(compressedFile));
  // Store compressed file for upload
};
```

### 3. **Form Validation with Zod**

Create form schemas for better validation:

```typescript
// src/schemas/reportSchema.ts
import { z } from 'zod';

export const reportSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string()
    .regex(/^[6-9]\d{9}$/, 'Enter valid 10-digit Indian mobile number'),
  email: z.string().email().optional().or(z.literal('')),
  damageType: z.enum(['pothole', 'crack', 'cave-in', 'erosion', 'waterlogging', 'other']),
  severity: z.enum(['low', 'moderate', 'critical']),
  location: z.string().min(5, 'Location must be at least 5 characters'),
  landmark: z.string().optional(),
  ward: z.string().regex(/^ward-\d+$/, 'Please select a ward'),
  description: z.string().optional(),
});

export type ReportFormData = z.infer<typeof reportSchema>;
```

Use with React Hook Form:
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { reportSchema } from '@/schemas/reportSchema';

const form = useForm({
  resolver: zodResolver(reportSchema)
});
```

## 🚀 Feature Enhancements

### 4. **Map Integration**

#### Option A: Google Maps (Paid)
```bash
npm install @react-google-maps/api
```

#### Option B: Leaflet (Free & Open Source) ⭐ Recommended
```bash
npm install leaflet react-leaflet
npm install -D @types/leaflet
```

```typescript
// src/components/MapPicker.tsx
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface MapPickerProps {
  position: [number, number] | null;
  onLocationSelect: (lat: number, lng: number) => void;
}

const LocationMarker = ({ onLocationSelect }: any) => {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

export const MapPicker = ({ position, onLocationSelect }: MapPickerProps) => {
  const defaultPosition: [number, number] = [17.6599, 75.9064]; // Solapur

  return (
    <MapContainer
      center={position || defaultPosition}
      zoom={13}
      style={{ height: '300px', width: '100%', borderRadius: '8px' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
      />
      {position && <Marker position={position} />}
      <LocationMarker onLocationSelect={onLocationSelect} />
    </MapContainer>
  );
};
```

### 5. **PWA Support (Offline Access)**

```bash
npm install vite-plugin-pwa -D
```

```typescript
// vite.config.ts
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Road-Aware',
        short_name: 'RoadAware',
        description: 'Report road damage and track complaints',
        theme_color: '#3b82f6',
        icons: [
          {
            src: '/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          }
        ]
      }
    })
  ]
});
```

### 6. **SMS/Email Notifications**

#### Using Supabase Edge Functions

```typescript
// supabase/functions/send-notification/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req) => {
  const { complaintId, phone, email } = await req.json();

  // Send SMS using Twilio/MSG91
  // Send Email using Resend/SendGrid

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { 'Content-Type': 'application/json' } }
  );
});
```

### 7. **WhatsApp Integration**

Enable reporting via WhatsApp:

```typescript
// Generate WhatsApp link with pre-filled data
const shareViaWhatsApp = (complaintId: string) => {
  const message = `My road damage complaint has been registered!

Complaint ID: ${complaintId}
Track here: ${window.location.origin}/track?id=${complaintId}`;

  const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
};
```

### 8. **Multi-language Support (Marathi/Hindi)**

```bash
npm install i18next react-i18next
```

```typescript
// src/i18n/config.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

i18n.use(initReactI18next).init({
  resources: {
    en: {
      translation: {
        'report.title': 'Report Road Damage',
        'report.submit': 'Submit Report'
      }
    },
    mr: {
      translation: {
        'report.title': 'रस्त्याच्या नुकसानीची तक्रार करा',
        'report.submit': 'अहवाल सबमिट करा'
      }
    }
  },
  lng: 'en',
  fallbackLng: 'en'
});
```

Usage:
```typescript
import { useTranslation } from 'react-i18next';

const Component = () => {
  const { t, i18n } = useTranslation();

  return (
    <div>
      <h1>{t('report.title')}</h1>
      <Button onClick={() => i18n.changeLanguage('mr')}>
        Switch to Marathi
      </Button>
    </div>
  );
};
```

## 🎨 UI/UX Improvements

### 9. **Loading States**

```typescript
// src/components/ui/loading.tsx
export const ReportSkeleton = () => (
  <Card>
    <CardContent className="space-y-4 p-6">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-32 w-full" />
    </CardContent>
  </Card>
);
```

### 10. **Toast Notifications Enhancement**

```typescript
// Use Sonner for better toast notifications (already installed)
import { toast } from 'sonner';

toast.success('Report submitted!', {
  description: `Complaint ID: ${complaintId}`,
  action: {
    label: 'Track',
    onClick: () => navigate(`/track?id=${complaintId}`)
  }
});
```

### 11. **Dark Mode Support**

Already have `next-themes` installed, add theme toggle:

```typescript
// src/components/ThemeToggle.tsx
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  );
}
```

## 📊 Analytics & Monitoring

### 12. **Error Tracking**

```bash
npm install @sentry/react
```

```typescript
// src/main.tsx
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: 'your-sentry-dsn',
  environment: import.meta.env.MODE,
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay()
  ]
});
```

### 13. **Analytics**

```bash
npm install @vercel/analytics
```

```typescript
// src/App.tsx
import { Analytics } from '@vercel/analytics/react';

export default function App() {
  return (
    <>
      {/* Your app */}
      <Analytics />
    </>
  );
}
```

## 🔐 Security Enhancements

### 14. **Rate Limiting**

Implement on Supabase side using Edge Functions:

```typescript
// Prevent spam submissions from same IP/phone
const rateLimits = new Map<string, number>();

const checkRateLimit = (identifier: string): boolean => {
  const now = Date.now();
  const lastSubmit = rateLimits.get(identifier) || 0;

  if (now - lastSubmit < 60000) { // 1 minute
    return false;
  }

  rateLimits.set(identifier, now);
  return true;
};
```

### 15. **Input Sanitization**

```bash
npm install dompurify
```

```typescript
import DOMPurify from 'dompurify';

const sanitizedDescription = DOMPurify.sanitize(formData.description);
```

## 🧪 Testing

### 16. **Unit Tests**

```typescript
// src/test/reportService.test.ts
import { describe, it, expect, beforeAll } from 'vitest';
import { createReport } from '@/services/reportService';

describe('Report Service', () => {
  it('should create a report successfully', async () => {
    const result = await createReport({
      reporter_name: 'Test User',
      reporter_phone: '9876543210',
      damage_type: 'pothole',
      severity: 'moderate',
      location: 'Test Location',
      ward_number: 1
    });

    expect(result.success).toBe(true);
    expect(result.data?.complaint_id).toMatch(/^SMC-\d{4}-\d{6}$/);
  });
});
```

### 17. **E2E Tests**

```bash
npm install -D playwright @playwright/test
```

```typescript
// e2e/report-flow.spec.ts
import { test, expect } from '@playwright/test';

test('submit a report', async ({ page }) => {
  await page.goto('/report');

  await page.fill('input[name="name"]', 'John Doe');
  await page.fill('input[name="phone"]', '9876543210');
  await page.selectOption('select[name="damageType"]', 'pothole');

  await page.click('button[type="submit"]');

  await expect(page.locator('text=Report Submitted')).toBeVisible();
});
```

## 🚀 Deployment

### 18. **Environment-specific Configs**

```typescript
// src/config/index.ts
export const config = {
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  },
  app: {
    name: 'Road-Aware',
    version: '1.0.0',
    environment: import.meta.env.MODE,
  },
  features: {
    enableRealtime: true,
    enablePWA: true,
    enableAnalytics: import.meta.env.PROD,
  }
};
```

### 19. **CI/CD Pipeline**

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run lint
      - run: npm run test
      - run: npm run build
      - uses: vercel/actions@v2
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
```

## 📱 Mobile App (Optional)

### 20. **React Native Conversion**

Consider building a mobile app using React Native or Capacitor:

```bash
npm install @capacitor/core @capacitor/cli
npx cap init
```

This allows:
- Native camera access
- Better GPS integration
- Push notifications
- Offline support
- App store distribution

## 🎯 Priority Order

**Phase 1 - Critical (Week 1)**
1. ✅ Set up Supabase backend
2. ✅ Fix CSS import warning
3. ✅ Integrate report creation
4. ✅ Integrate report tracking
5. ✅ Integrate dashboard

**Phase 2 - Important (Week 2)**
6. Add map integration
7. Image compression
8. Form validation with Zod
9. Loading states
10. Error handling

**Phase 3 - Enhanced (Week 3)**
11. PWA support
12. Email notifications
13. WhatsApp sharing
14. Multi-language support
15. Dark mode toggle

**Phase 4 - Advanced (Week 4)**
16. Analytics
17. Error tracking
18. Rate limiting
19. E2E tests
20. CI/CD pipeline

---

**Ready to implement?** Start with Phase 1, then gradually add features from other phases!

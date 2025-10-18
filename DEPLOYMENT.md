# APNexus Vision - Deployment Guide

## Pre-Deployment Checklist

### 1. Environment Setup
- [ ] Create production `.env` file with all required variables
- [ ] Verify Supabase production instance is configured
- [ ] Ensure all database migrations are applied
- [ ] Confirm all secrets are set in Supabase Edge Functions

### 2. Security Verification
- [ ] All routes protected with authentication
- [ ] Row-Level Security (RLS) policies enabled on all tables
- [ ] File upload validation implemented
- [ ] Input sanitization in place
- [ ] HTTPS enforced
- [ ] CORS configured correctly

### 3. Performance Testing
- [ ] Run Lighthouse audit (target: 90+)
- [ ] Check bundle size (< 500KB initial)
- [ ] Test with slow 3G network
- [ ] Verify lazy loading works
- [ ] Test offline functionality (PWA)

### 4. Browser Testing
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

### 5. Functional Testing
- [ ] User registration and login
- [ ] All CRUD operations
- [ ] File uploads
- [ ] Report generation
- [ ] Notifications
- [ ] Mobile navigation
- [ ] Camera capture (mobile)

## Deployment Steps

### Option 1: Deploy to Vercel

1. **Connect Repository**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Login to Vercel
   vercel login
   
   # Deploy
   vercel --prod
   ```

2. **Configure Environment Variables**
   - Go to Vercel Dashboard > Project Settings > Environment Variables
   - Add all variables from `.env.example`

3. **Configure Build Settings**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

### Option 2: Deploy to Netlify

1. **Connect Repository**
   ```bash
   # Install Netlify CLI
   npm i -g netlify-cli
   
   # Login to Netlify
   netlify login
   
   # Deploy
   netlify deploy --prod
   ```

2. **Configure Build Settings**
   - Build command: `npm run build`
   - Publish directory: `dist`

3. **Add Environment Variables**
   - Go to Netlify Dashboard > Site Settings > Environment Variables
   - Add all variables from `.env.example`

### Database Setup

1. **Apply Migrations**
   ```bash
   # Ensure you're connected to production Supabase project
   # Run all migrations in order through Supabase SQL Editor
   ```

2. **Verify RLS Policies**
   ```bash
   # Check all tables have RLS enabled
   # Test policies with different user roles
   ```

3. **Enable Backups**
   - Go to Supabase Dashboard > Database > Backups
   - Enable daily backups
   - Configure retention period (recommend 30 days)

## Post-Deployment

### 1. Monitoring Setup

**Error Tracking (Sentry)**
```bash
npm install @sentry/react @sentry/vite-plugin
```

Add to `main.tsx`:
```typescript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  environment: "production",
  integrations: [new Sentry.BrowserTracing()],
  tracesSampleRate: 1.0,
});
```

**Analytics (Google Analytics)**
```bash
npm install @analytics/google-analytics
```

### 2. Performance Monitoring

- Set up Vercel/Netlify analytics
- Configure Supabase database monitoring
- Set up uptime monitoring (e.g., UptimeRobot)

### 3. Security

**Configure Security Headers**

Add `netlify.toml` or `vercel.json`:
```toml
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "camera=(), microphone=(), geolocation=()"
```

### 4. CDN Configuration

- Enable automatic compression (Brotli/Gzip)
- Configure cache headers
- Set up image optimization

## Custom Domain Setup

### 1. DNS Configuration

Add these DNS records:
```
A     @     76.76.21.21
CNAME www   cname.vercel-dns.com
```

### 2. SSL Certificate

- Automatic with Vercel/Netlify
- Verify HTTPS redirect is enabled

## Maintenance

### Regular Tasks

**Daily:**
- Monitor error logs
- Check application uptime

**Weekly:**
- Review user feedback
- Analyze usage metrics
- Check for dependency updates

**Monthly:**
- Database backup verification
- Security audit
- Performance review

### Backup Strategy

1. **Database Backups**
   - Automated daily backups via Supabase
   - Manual backup before major updates
   - Test restore procedure quarterly

2. **Code Backups**
   - Version control (Git)
   - Tagged releases

### Rollback Procedure

If issues occur:
1. Identify the problematic deployment
2. Revert to previous version via Vercel/Netlify dashboard
3. Apply hotfix if needed
4. Re-deploy with fix

## Scaling Considerations

### Database
- Monitor query performance
- Add indexes as needed
- Consider read replicas for high load

### Frontend
- Use CDN for static assets
- Implement edge caching
- Monitor bundle size

### Storage
- Monitor storage usage
- Implement lifecycle policies
- Use image compression

## Support

### Emergency Contacts
- Technical Lead: [email]
- Database Admin: [email]
- Hosting Support: support@vercel.com or support@netlify.com

### Status Page
- Application: [your-domain]/status
- Supabase: status.supabase.com

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Vite Documentation](https://vitejs.dev)
- [React Documentation](https://react.dev)
- [Vercel Documentation](https://vercel.com/docs)
- [Netlify Documentation](https://docs.netlify.com)

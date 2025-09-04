# TMS Passenger App - Vercel Deployment Checklist

## ✅ Pre-Deployment Checklist

### 1. Environment Variables
- [ ] `NEXT_PUBLIC_PARENT_APP_URL` = `https://my.jkkn.ac.in`
- [ ] `NEXT_PUBLIC_APP_ID` = `transport_management_system_menrm674`
- [ ] `NEXT_PUBLIC_API_KEY` = `app_e20655605d48ebce_cfa1ffe34268949a`
- [ ] `NEXT_PUBLIC_REDIRECT_URI` = `https://tms-passenger.vercel.app/auth/callback`
- [ ] `NEXT_PUBLIC_DRIVER_REDIRECT_URI` = `https://tms-passenger.vercel.app/auth/driver-callback`
- [ ] `NEXT_PUBLIC_AUTH_DEBUG` = `true`
- [ ] `NEXT_PUBLIC_SUPABASE_URL` = `https://gsvbrytleqdxpdfbykqh.supabase.co`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 2. Vercel Configuration
- [ ] `vercel.json` file is present with correct configuration
- [ ] Environment variables are set in Vercel dashboard
- [ ] Build command: `npm run build`
- [ ] Output directory: `.next`

### 3. Parent App Registration
- [ ] TMS app is registered with MYJKKN parent app
- [ ] Redirect URIs are whitelisted in parent app:
  - `https://tms-passenger.vercel.app/auth/callback`
  - `https://tms-passenger.vercel.app/auth/driver-callback`
- [ ] App ID and API key are correct

## 🚀 Deployment Steps

### 1. Push to Git Repository
```bash
git add .
git commit -m "Update callback URLs for production deployment"
git push origin main
```

### 2. Deploy to Vercel
- [ ] Connect repository to Vercel (if not already done)
- [ ] Set environment variables in Vercel dashboard
- [ ] Deploy the application

### 3. Verify Deployment
- [ ] Visit https://tms-passenger.vercel.app/
- [ ] Run the verification script in browser console:
  ```javascript
  // Copy and paste the content of verify-production-config.js
  ```

## 🔍 Post-Deployment Verification

### 1. Configuration Check
- [ ] Open browser console on production site
- [ ] Run verification script
- [ ] Confirm all environment variables are correct
- [ ] Verify redirect URIs are production URLs

### 2. Authentication Flow Test
- [ ] Navigate to `/login`
- [ ] Click "Sign in with MYJKKN"
- [ ] Complete authentication on parent app
- [ ] Verify redirect back to TMS dashboard
- [ ] Test driver authentication flow

### 3. Debug Pages
- [ ] Visit `/auth/debug-redirect` to check configuration
- [ ] Visit `/auth/diagnostic` for detailed auth diagnostics
- [ ] Visit `/test-auth-debug` for token debugging

## 🐛 Troubleshooting

### Common Issues

1. **Authentication Redirect Fails**
   - Check if redirect URIs are whitelisted in parent app
   - Verify environment variables are set correctly
   - Check browser console for errors

2. **Environment Variables Not Loading**
   - Ensure variables are set in Vercel dashboard
   - Check if variables start with `NEXT_PUBLIC_`
   - Redeploy after setting variables

3. **CORS Issues**
   - Check `vercel.json` headers configuration
   - Verify parent app allows requests from Vercel domain

4. **Build Failures**
   - Check build logs in Vercel dashboard
   - Ensure all dependencies are installed
   - Verify TypeScript compilation

### Debug Commands

```bash
# Check build locally
npm run build

# Test environment variables
npm run dev
# Then check browser console for config

# Verify production config
# Run verify-production-config.js in browser console
```

## 📞 Support

If issues persist:
1. Check Vercel deployment logs
2. Review browser console errors
3. Test authentication flow step by step
4. Contact MYJKKN support for parent app issues

## 🔄 Rollback Plan

If deployment fails:
1. Revert to previous working commit
2. Update environment variables to development URLs
3. Redeploy with working configuration
4. Debug issues in development environment first
















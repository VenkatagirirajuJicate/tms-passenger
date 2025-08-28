# 🔍 Main OAuth Authentication - Diagnosis & Fixes

## 📋 **Current Configuration Analysis**

Based on your Supabase dashboard image, the configuration looks correct:

| Parameter | Dashboard Value | Code Value | Status |
|-----------|----------------|------------|---------|
| **Application ID** | `transport_management_system_menrm674` | ✅ Matches | **CORRECT** |
| **Redirect URI** | `http://localhost:3003/auth/callback` | ✅ Matches | **CORRECT** |
| **Parent App URL** | `https://my.jkkn.ac.in` | ✅ Matches | **CORRECT** |
| **API Key** | Hidden (set) | ✅ Present | **CORRECT** |

## 🔍 **Diagnostic Tools Created**

### **1. OAuth Diagnostic Tool** 
**File**: `passenger/oauth-diagnostic-tool.html`
- **Purpose**: Comprehensive web-based testing interface
- **Features**: 
  - Configuration validation
  - Network connectivity tests
  - Authorization URL generation
  - Endpoint discovery
  - Live OAuth flow testing

**Usage**: Open `http://localhost:3003/oauth-diagnostic-tool.html` in browser

### **2. OAuth Flow Test Script**
**File**: `passenger/test-main-oauth.js`
- **Purpose**: Browser console testing script
- **Features**:
  - Exact OAuth flow simulation
  - Callback processing test
  - Token exchange testing
  - Authentication state checking

**Usage**: Copy/paste into browser console on `/login` page

## 🚨 **Most Likely Issues & Fixes**

### **Issue 1: Parent App Endpoint Not Available**
**Symptoms**: OAuth redirect fails, network errors
**Diagnosis**: 
```bash
curl -I https://my.jkkn.ac.in/api/auth/child-app/authorize
```

**Fixes**:
1. **Contact MYJKKN Admin** - Verify the child app authorization endpoint is active
2. **Try Alternative Endpoints** - Test different OAuth endpoints:
   ```typescript
   // In parent-auth-service.ts, try these URLs:
   '/auth/child-app/consent'  // Alternative 1
   '/oauth/authorize'         // Alternative 2  
   '/api/oauth/authorize'     // Alternative 3
   ```

### **Issue 2: App Not Properly Registered**
**Symptoms**: "Invalid app_id" or "Unauthorized" errors
**Diagnosis**: Check browser network tab for 401/403 responses

**Fixes**:
1. **Verify Registration** with MYJKKN admin
2. **Check API Key** - Ensure it matches exactly
3. **Test Different Parameter Format**:
   ```typescript
   // Try 'client_id' instead of 'app_id'
   authUrl.searchParams.append('client_id', appId);
   ```

### **Issue 3: CORS Policy Issues**
**Symptoms**: Browser blocks requests, CORS errors in console
**Diagnosis**: Network tab shows CORS preflight failures

**Fixes**:
1. **Contact MYJKKN Admin** - Request CORS headers for your domain
2. **Use Server-Side Proxy** - Route OAuth through your backend
3. **Alternative Flow** - Use popup window instead of redirect

### **Issue 4: Confirmation Token Error (Known Issue)**
**Symptoms**: `converting NULL to string is unsupported`
**Status**: ✅ **Already Fixed** with enhanced error handling

**Current Solution**:
- Automatic error detection
- User-friendly error messages  
- Direct login fallback options

## 🛠️ **Immediate Action Plan**

### **Step 1: Run Diagnostics** ⏱️ *5 minutes*
1. Open `passenger/oauth-diagnostic-tool.html`
2. Click "Test Parent App Connection"
3. Click "Generate & Test Auth URL"
4. Click "Test Manually" to see actual OAuth response

### **Step 2: Check Network Tab** ⏱️ *3 minutes*
1. Go to `/login` page
2. Open browser dev tools → Network tab
3. Select "Passenger" role
4. Click "Sign in with MYJKKN"
5. **Look for**:
   - HTTP status codes (200, 401, 403, 404, 500)
   - CORS errors
   - Response content

### **Step 3: Test Console Script** ⏱️ *2 minutes*
1. Go to `/login` page
2. Open browser console (F12)
3. Paste contents of `passenger/test-main-oauth.js`
4. Check console output for errors

### **Step 4: Contact MYJKKN Admin** ⏱️ *If needed*
**Information to provide**:
- App ID: `transport_management_system_menrm674`
- Redirect URI: `http://localhost:3003/auth/callback`
- Expected endpoint: `/api/auth/child-app/authorize`
- Any error messages from diagnostics

## 🔧 **Quick Fixes to Try**

### **Fix 1: Alternative OAuth Endpoint**
```typescript
// In passenger/lib/auth/parent-auth-service.ts, line 102:
const authUrl = new URL(
  '/auth/child-app/consent', // Try this instead
  process.env.NEXT_PUBLIC_PARENT_APP_URL || 'https://my.jkkn.ac.in'
);
```

### **Fix 2: Different Parameter Format**
```typescript
// In passenger/lib/auth/parent-auth-service.ts, line 106:
authUrl.searchParams.append('client_id', appId); // Instead of 'app_id'
```

### **Fix 3: Simplified Scope**
```typescript
// In passenger/lib/auth/parent-auth-service.ts, line 112:
authUrl.searchParams.append('scope', 'read'); // Instead of 'read write profile'
```

### **Fix 4: Remove API Key from URL**
```typescript
// In passenger/lib/auth/parent-auth-service.ts, remove line 107:
// authUrl.searchParams.append('api_key', ...); // Comment this out
// API key should only be in headers
```

## 📊 **Expected Test Results**

### **✅ Working OAuth Flow**:
```
1. Network tab shows: 302 redirect to my.jkkn.ac.in
2. Parent app shows: Login form or consent screen
3. After login: 302 redirect back to localhost:3003/auth/callback?code=...
4. Callback page: Processes code and redirects to dashboard
```

### **❌ Common Error Patterns**:
```
1. 404 Not Found → Endpoint doesn't exist
2. 401 Unauthorized → Invalid app_id or api_key  
3. 403 Forbidden → App not registered properly
4. CORS Error → Parent app doesn't allow your domain
5. 500 Server Error → Parent app internal issue (like confirmation_token)
```

## 🎯 **Success Criteria**

After running diagnostics, you should see:
- ✅ Parent app connection successful
- ✅ Authorization URL generates without errors
- ✅ Manual OAuth test shows login form (not error page)
- ✅ Network requests return proper HTTP codes
- ✅ No CORS errors in browser console

## 📞 **Next Steps Based on Results**

**If diagnostics show network/endpoint issues**: Contact MYJKKN admin
**If diagnostics show CORS issues**: Request CORS configuration
**If diagnostics show auth errors**: Verify app registration details
**If everything looks good**: The issue might be in callback processing

---

## 🚀 **Ready to Diagnose!**

**Start here**: Open `passenger/oauth-diagnostic-tool.html` and run the tests!

The diagnostic tools will pinpoint exactly what's wrong with the OAuth flow. 🎯

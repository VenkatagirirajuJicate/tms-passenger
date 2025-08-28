# Parent App Authentication Troubleshooting Guide

## Current Issue: "Failed to generate authorization"

The error `{"error":"Failed to generate authorization"}` from the MYJKKN parent app indicates that our TMS application is not properly registered or configured in the parent system.

## 🔍 **Root Cause Analysis**

### 1. **App Registration Issue**
- **App ID**: `transport_management_system_menrm674`
- **API Key**: `app_e20655605d48ebce_cfa1ffe34268949a`
- **Status**: ❌ Not recognized by parent app

### 2. **Possible Causes**
1. **App not registered**: The app ID might not exist in the parent system
2. **Inactive app**: The app might be registered but not activated
3. **Wrong API key**: The API key might be incorrect or expired
4. **Wrong endpoint**: We might be using an incorrect authorization endpoint
5. **Missing parameters**: Required parameters might be missing

## 🛠️ **Solutions to Try**

### **Solution 1: Verify App Registration**
Contact the MYJKKN system administrator to verify:
- Is app ID `transport_management_system_menrm674` registered?
- Is the app active and approved?
- Is API key `app_e20655605d48ebce_cfa1ffe34268949a` correct?
- What is the correct redirect URI format?

### **Solution 2: Try Alternative Endpoints**
The authorization endpoint might be different. Try these alternatives:

1. **Current URL**: `/api/auth/child-app/authorize`
2. **Alternative 1**: `/auth/child-app/consent` 
3. **Alternative 2**: `/oauth/authorize`
4. **Alternative 3**: `/api/oauth/child-app/authorize`

### **Solution 3: Check Required Parameters**
Ensure all required parameters are included:

```javascript
const authUrl = new URL('/api/auth/child-app/authorize', 'https://my.jkkn.ac.in');
authUrl.searchParams.append('response_type', 'code');
authUrl.searchParams.append('app_id', 'transport_management_system_menrm674');
authUrl.searchParams.append('client_id', 'transport_management_system_menrm674'); // Try both
authUrl.searchParams.append('api_key', 'app_e20655605d48ebce_cfa1ffe34268949a');
authUrl.searchParams.append('redirect_uri', 'http://localhost:3003/auth/callback');
authUrl.searchParams.append('scope', 'read write profile');
authUrl.searchParams.append('state', state);
```

### **Solution 4: Test with Different Parameters**
Try removing/adding parameters one by one:

1. **Remove API key from URL** (send only in headers)
2. **Use client_id instead of app_id**
3. **Change scope** to just 'read' or 'profile'
4. **Remove state parameter**

## 🧪 **Testing Steps**

### **Step 1: Manual API Test**
Test the authorization endpoint manually:

```bash
curl -X GET "https://my.jkkn.ac.in/api/auth/child-app/authorize?response_type=code&app_id=transport_management_system_menrm674&redirect_uri=http://localhost:3003/auth/callback&scope=read" \
  -H "X-API-Key: app_e20655605d48ebce_cfa1ffe34268949a"
```

### **Step 2: Check Network Tab**
1. Open browser dev tools
2. Go to Network tab
3. Click "Sign in with MYJKKN"
4. Check the request/response details

### **Step 3: Test Different URLs**
Update the auth service to try different endpoints:

```typescript
// In parent-auth-service.ts, try these URLs one by one:
const authUrl = new URL('/auth/child-app/consent', parentAppUrl);
// or
const authUrl = new URL('/oauth/authorize', parentAppUrl);
```

## 📋 **Implementation Status**

### ✅ **Completed**
- [x] Database migration script created
- [x] Authentication API endpoints updated
- [x] Parent auth service configured
- [x] Session management implemented
- [x] Audit logging added

### 🔄 **Next Steps**
1. **Run database migration** (see `passenger/database-migrations/add_parent_app_auth_support.sql`)
2. **Verify app registration** with MYJKKN admin
3. **Test with correct credentials**
4. **Update environment variables** if needed

## 🔧 **Configuration Files**

### **Environment Variables** (`.env.local`)
```env
# MyJKKN Parent App Configuration
NEXT_PUBLIC_PARENT_APP_URL=https://my.jkkn.ac.in
NEXT_PUBLIC_APP_ID=transport_management_system_menrm674
NEXT_PUBLIC_API_KEY=app_e20655605d48ebce_cfa1ffe34268949a
NEXT_PUBLIC_REDIRECT_URI=http://localhost:3003/auth/callback

# Supabase Configuration (add these)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### **Database Migration**
Run the migration script in Supabase:
```sql
-- See passenger/database-migrations/add_parent_app_auth_support.sql
```

## 🚨 **Immediate Actions Required**

1. **Contact MYJKKN Admin**: Verify app registration and get correct credentials
2. **Run Database Migration**: Execute the SQL migration script
3. **Update Environment Variables**: Add Supabase service role key
4. **Test Authentication Flow**: Try the login process again

## 📞 **Support Contacts**

- **MYJKKN System Admin**: Contact for app registration verification
- **TMS Development Team**: For technical implementation issues

## 📝 **Error Logging**

The system now logs all authentication attempts to `parent_app_auth_logs` table for debugging:
- Token exchange attempts
- Validation requests  
- Success/failure details
- Error messages

Check these logs to track authentication issues.






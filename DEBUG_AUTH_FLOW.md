# 🔍 Debug Authentication Flow

## 🎯 **Issue Description**
Drivers are being redirected to the passenger dashboard instead of the driver dashboard after OAuth authentication.

## 🔍 **Root Cause Analysis**

### **1. Token Exchange Endpoint Issue** ✅ FIXED
- **Problem**: Callback was trying to use `/api/auth/driver/token-exchange` which doesn't exist
- **Solution**: Updated to use unified `/api/auth/token` endpoint
- **Status**: ✅ Fixed

### **2. User Type Detection Issue** 🔍 INVESTIGATING
- **Problem**: User type might not be properly set in auth context
- **Investigation**: Need to verify `setUserType('passenger')` is called for passenger users

### **3. Callback Logic Issue** 🔍 INVESTIGATING
- **Problem**: Callback might not be correctly determining user type from sessionStorage
- **Investigation**: Need to verify `tms_oauth_role` flag is properly set and read

## 🔧 **Current Implementation**

### **Driver OAuth Flow**
1. User clicks "Driver" role on login page
2. `loginDriverOAuth()` is called
3. `sessionStorage.setItem('tms_oauth_role', 'driver')` is set
4. OAuth redirect happens to MYJKKN
5. User completes OAuth and returns to `/auth/callback`
6. Callback checks `sessionStorage.getItem('tms_oauth_role')`
7. If 'driver', should redirect to `/driver`

### **Passenger OAuth Flow**
1. User clicks "Passenger" role on login page
2. `login()` is called (no role flag set)
3. OAuth redirect happens to MYJKKN
4. User completes OAuth and returns to `/auth/callback`
5. Callback checks `sessionStorage.getItem('tms_oauth_role')`
6. If not 'driver', should redirect to `/dashboard`

## 🧪 **Testing Steps**

### **Test 1: Driver OAuth Flow**
1. Clear browser session storage
2. Navigate to `/login`
3. Select "Driver" role
4. Click "Sign in with MYJKKN"
5. Complete OAuth
6. Check console logs for:
   - `tms_oauth_role` being set to 'driver'
   - Callback detecting driver role
   - Redirect to `/driver`

### **Test 2: Passenger OAuth Flow**
1. Clear browser session storage
2. Navigate to `/login`
3. Select "Passenger" role
4. Click "Sign in with MYJKKN"
5. Complete OAuth
6. Check console logs for:
   - No `tms_oauth_role` being set
   - Callback detecting passenger role
   - Redirect to `/dashboard`

## 🔍 **Debug Points**

### **Point 1: Session Storage Check**
```javascript
// In browser console
console.log('Session storage:', {
  tms_oauth_role: sessionStorage.getItem('tms_oauth_role'),
  post_login_redirect: sessionStorage.getItem('post_login_redirect')
});
```

### **Point 2: Auth Context State**
```javascript
// In browser console
// Check if userType is properly set
console.log('Auth context state:', {
  userType: window.__AUTH_CONTEXT__?.userType,
  isAuthenticated: window.__AUTH_CONTEXT__?.isAuthenticated,
  user: window.__AUTH_CONTEXT__?.user
});
```

### **Point 3: Callback Processing**
```javascript
// In callback page console
console.log('Callback processing:', {
  isDriverOAuth: sessionStorage.getItem('tms_oauth_role') === 'driver',
  targetPath: isDriverOAuth ? '/driver' : '/dashboard'
});
```

## 🚨 **Potential Issues**

### **Issue 1: Session Storage Not Set**
- **Cause**: `loginDriverOAuth()` not setting `tms_oauth_role`
- **Check**: Verify `unifiedAuthService.loginDriverOAuth()` implementation

### **Issue 2: Session Storage Cleared**
- **Cause**: Session storage cleared during OAuth flow
- **Check**: Verify session storage persists through redirect

### **Issue 3: Auth Context Not Updated**
- **Cause**: `handleAuthCallback()` not setting user type correctly
- **Check**: Verify `setUserType()` calls in auth context

### **Issue 4: Callback Logic Error**
- **Cause**: Callback not reading session storage correctly
- **Check**: Verify session storage access in callback

## 🔧 **Fixes Applied**

### **Fix 1: Token Exchange Endpoint** ✅
```typescript
// Before
const tokenExchangeUrl = isDriverOAuth 
  ? '/api/auth/driver/token-exchange'
  : '/api/auth/token-exchange';

// After
const tokenExchangeUrl = '/api/auth/token';
```

### **Fix 2: Passenger User Type Setting** ✅
```typescript
// Added to handleAuthCallback
setUserType('passenger'); // Ensure passenger user type is set
```

## 📋 **Next Steps**

1. **Test the fixes** with both driver and passenger OAuth flows
2. **Monitor console logs** for proper role detection
3. **Verify redirects** work correctly for both user types
4. **Check session storage** persistence through OAuth flow
5. **Validate auth context state** after authentication

## 🎯 **Expected Behavior**

### **Driver OAuth**
- Session storage: `tms_oauth_role = 'driver'`
- Auth context: `userType = 'driver'`
- Redirect: `/driver`

### **Passenger OAuth**
- Session storage: `tms_oauth_role = null` (or not set)
- Auth context: `userType = 'passenger'`
- Redirect: `/dashboard`

---

**Status**: 🔍 **Investigating**
**Last Updated**: [Current Date]


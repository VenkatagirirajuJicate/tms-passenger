# 🧪 Driver Callback URL Testing Guide

## 🎯 **Current Status**

✅ **Completed:**
- Driver-specific callback page created (`/auth/driver-callback`)
- Environment variables configured
- Smart redirect URI selection implemented
- Enhanced recovery logic added

⏳ **Next Steps:**
1. Add driver callback URL to MYJKKN settings
2. Test the implementation
3. Verify OAuth flow works correctly

## 🔧 **Step 1: Update MYJKKN Settings**

### **Required Action:**
Add the new driver callback URL to your MYJKKN application settings.

### **Current Configuration:**
```
Application ID: transport_management_system_menrm674
Allowed Redirect URIs: 
  - http://localhost:3003/auth/callback
```

### **Updated Configuration Needed:**
```
Application ID: transport_management_system_menrm674
Allowed Redirect URIs: 
  - http://localhost:3003/auth/callback          ← Keep this for passengers
  - http://localhost:3003/auth/driver-callback   ← ADD THIS for drivers
```

### **How to Add:**
1. Go to your MYJKKN application management page
2. Find the "Allowed Redirect URIs" section
3. Add: `http://localhost:3003/auth/driver-callback`
4. Save the configuration

## 🧪 **Step 2: Test Using the Test Page**

### **Open the Test Page:**
```
http://localhost:3003/test-driver-callback-url.html
```

### **What the Test Page Does:**
1. **Environment Check**: Verifies callback URLs are configured
2. **URL Generation Test**: Shows how OAuth URLs are generated differently
3. **Live OAuth Test**: Tests actual OAuth flow with real MYJKKN integration

## 🧪 **Step 3: Manual Testing**

### **Test 1: Driver OAuth Flow**
1. **Clear browser data** (important for clean test)
2. Go to: `http://localhost:3003/login`
3. Select **"Driver"**
4. Click **"Sign in with MYJKKN"**
5. **Watch console logs** for:
   ```
   🔗 [PARENT AUTH] Redirect URI selection: {
     userType: "driver",
     selectedRedirectUri: "http://localhost:3003/auth/driver-callback",
     isDriverCallback: true
   }
   ```
6. Complete OAuth flow on MYJKKN
7. **Verify redirect**: Should go to `/auth/driver-callback?code=...`
8. **Watch for driver logs**:
   ```
   🚗 [DRIVER CALLBACK] Step 10: Driver OAuth callback page loaded
   🚗 [DRIVER CALLBACK] Driver parameters received: {...}
   ```
9. **Final redirect**: Should end up at `/driver` dashboard

### **Test 2: Passenger OAuth Flow (Verification)**
1. **Clear browser data**
2. Go to: `http://localhost:3003/login`
3. Select **"Passenger"**
4. Click **"Sign in with MYJKKN"**
5. **Verify redirect**: Should go to `/auth/callback?code=...` (not driver-callback)
6. **Final redirect**: Should end up at `/dashboard`

## 🔍 **Expected Results**

### **✅ Success Indicators:**

#### **Driver OAuth:**
- OAuth URL includes: `redirect_uri=http://localhost:3003/auth/driver-callback`
- OAuth URL includes: `user_type=driver` and `oauth_role=driver`
- Redirects to: `/auth/driver-callback?code=...`
- Console shows: `🚗 [DRIVER CALLBACK]` prefixed logs
- Final destination: `/driver` dashboard
- Green-themed loading screen during processing

#### **Passenger OAuth:**
- OAuth URL includes: `redirect_uri=http://localhost:3003/auth/callback`
- OAuth URL includes: `user_type=passenger` and `oauth_role=passenger`
- Redirects to: `/auth/callback?code=...`
- Console shows: `🔄 [CALLBACK]` prefixed logs
- Final destination: `/dashboard`
- Blue-themed loading screen during processing

### **🚨 Failure Indicators:**

#### **If Driver OAuth Fails:**
- Error: "Invalid redirect URI" → Driver callback URL not added to MYJKKN
- Redirects to wrong callback → Check environment variables
- Authentication fails → Check OAuth workaround is working
- Wrong final destination → Check callback page logic

## 🛠️ **Debugging**

### **Common Issues:**

#### **1. "Invalid redirect URI" Error**
**Cause**: Driver callback URL not added to MYJKKN settings
**Solution**: Add `http://localhost:3003/auth/driver-callback` to MYJKKN

#### **2. Wrong Callback URL Used**
**Cause**: Environment variables not loaded or sessionStorage issue
**Solution**: 
- Restart development server
- Check `.env.local` file
- Clear browser data and try again

#### **3. OAuth Workaround Not Triggered**
**Cause**: Driver callback page not detecting errors properly
**Solution**: Check console logs for error detection logic

### **Debug Commands:**

#### **Check Environment Variables:**
```javascript
// In browser console
console.log('Passenger callback:', process.env.NEXT_PUBLIC_REDIRECT_URI);
console.log('Driver callback:', process.env.NEXT_PUBLIC_DRIVER_REDIRECT_URI);
```

#### **Check Session Storage:**
```javascript
// In browser console
console.log('OAuth role:', sessionStorage.getItem('tms_oauth_role'));
console.log('OAuth state:', sessionStorage.getItem('oauth_state'));
```

#### **Simulate Driver OAuth URL:**
```javascript
// In browser console
sessionStorage.setItem('tms_oauth_role', 'driver');
// Then trigger OAuth and check the generated URL
```

## 📊 **Testing Checklist**

### **Pre-Testing:**
- [ ] Driver callback URL added to MYJKKN settings
- [ ] Development server running (`npm run dev`)
- [ ] Browser developer tools open (Console tab)
- [ ] Browser data cleared for clean test

### **Driver OAuth Test:**
- [ ] Select "Driver" role
- [ ] OAuth URL shows driver callback URI
- [ ] OAuth URL includes `user_type=driver`
- [ ] MYJKKN accepts the driver callback URL
- [ ] Redirects to `/auth/driver-callback`
- [ ] Console shows `🚗 [DRIVER CALLBACK]` logs
- [ ] Final redirect to `/driver` dashboard
- [ ] Driver authentication successful

### **Passenger OAuth Test (Verification):**
- [ ] Select "Passenger" role
- [ ] OAuth URL shows standard callback URI
- [ ] OAuth URL includes `user_type=passenger`
- [ ] Redirects to `/auth/callback`
- [ ] Console shows `🔄 [CALLBACK]` logs
- [ ] Final redirect to `/dashboard`
- [ ] Passenger authentication successful

## 🎉 **Success Criteria**

The implementation is successful when:

1. **Driver OAuth** uses `/auth/driver-callback` and works reliably
2. **Passenger OAuth** continues to use `/auth/callback` and works as before
3. **Both flows** complete successfully with proper role-based redirects
4. **Console logs** clearly distinguish between driver and passenger flows
5. **Error handling** works correctly for both callback types

## 🚀 **Next Steps After Successful Testing**

Once testing is successful:

1. **Update TODO status** to mark driver callback implementation complete
2. **Document any issues** found during testing
3. **Consider production deployment** with production callback URLs
4. **Monitor OAuth success rates** to verify improvement

The separate callback URL approach should significantly improve the reliability of driver OAuth authentication with MYJKKN! 🎯

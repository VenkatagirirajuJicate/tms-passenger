# 🧪 Unified Authentication Testing Plan

## 🎯 **Testing Overview**

Comprehensive testing plan for the unified authentication system to ensure both passenger and driver authentication work correctly with the new unified callback URL.

## ✅ **Pre-Testing Checklist**

### **Code Quality Checks** ✅
- [x] TypeScript compilation passes (`npx tsc --noEmit`)
- [x] No syntax errors in modified files
- [x] All imports and dependencies resolved
- [x] Environment variables properly configured

### **Configuration Verification** ✅
- [x] `.env.local` updated with unified callback URL
- [x] `NEXT_PUBLIC_DRIVER_REDIRECT_URI` removed
- [x] `NEXT_PUBLIC_REDIRECT_URI` set correctly
- [x] MYJKKN application settings updated (if needed)

## 🔄 **Test Scenarios**

### **Test 1: Passenger OAuth Flow** 🧪

#### **1.1 Basic Passenger Authentication**
**Steps**:
1. Navigate to `/login`
2. Select "Passenger" role
3. Click "Sign in with MYJKKN"
4. Complete OAuth flow
5. Verify redirect to `/dashboard`

**Expected Results**:
- ✅ OAuth URL generated with unified callback
- ✅ No `tms_oauth_role` flag set in sessionStorage
- ✅ Callback processes passenger role correctly
- ✅ Redirects to `/dashboard` successfully

#### **1.2 Passenger Authentication with Redirect URL**
**Steps**:
1. Navigate to `/login?redirect=/dashboard/payments`
2. Select "Passenger" role
3. Complete OAuth flow
4. Verify redirect to `/dashboard/payments`

**Expected Results**:
- ✅ Post-login redirect URL stored correctly
- ✅ Redirects to specified URL after authentication

#### **1.3 Passenger Authentication Error Handling**
**Steps**:
1. Simulate OAuth error (invalid state, expired code)
2. Verify error handling and user feedback

**Expected Results**:
- ✅ Error messages displayed appropriately
- ✅ User can retry authentication
- ✅ No crashes or infinite loops

### **Test 2: Driver OAuth Flow** 🧪

#### **2.1 Basic Driver Authentication**
**Steps**:
1. Navigate to `/login`
2. Select "Driver" role
3. Click "Sign in with MYJKKN"
4. Complete OAuth flow
5. Verify redirect to `/driver`

**Expected Results**:
- ✅ `tms_oauth_role` flag set to 'driver' in sessionStorage
- ✅ OAuth URL generated with unified callback
- ✅ Callback processes driver role correctly
- ✅ Redirects to `/driver` successfully

#### **2.2 Driver Authentication with Redirect URL**
**Steps**:
1. Navigate to `/login?redirect=/driver/routes`
2. Select "Driver" role
3. Complete OAuth flow
4. Verify redirect to `/driver/routes`

**Expected Results**:
- ✅ Post-login redirect URL stored correctly
- ✅ Redirects to specified URL after authentication

#### **2.3 Driver Authentication Error Handling**
**Steps**:
1. Simulate OAuth error for driver flow
2. Verify error handling and user feedback

**Expected Results**:
- ✅ Error messages displayed appropriately
- ✅ Driver role flag cleared on error
- ✅ User can retry authentication

### **Test 3: Backward Compatibility** 🧪

#### **3.1 Old Driver Callback URL**
**Steps**:
1. Directly navigate to `/auth/driver-callback?code=test&state=test`
2. Verify redirect to unified callback
3. Verify driver role flag set automatically

**Expected Results**:
- ✅ Automatic redirect to `/auth/callback`
- ✅ All URL parameters preserved
- ✅ Driver role flag set automatically
- ✅ Processing continues seamlessly

#### **3.2 Existing OAuth Links**
**Steps**:
1. Test existing OAuth links that use old driver callback
2. Verify they still work correctly

**Expected Results**:
- ✅ All existing links continue to work
- ✅ No breaking changes for users
- ✅ Seamless migration experience

### **Test 4: Edge Cases** 🧪

#### **4.1 Concurrent Authentication Attempts**
**Steps**:
1. Open multiple tabs
2. Initiate OAuth in different tabs simultaneously
3. Complete authentication in one tab
4. Verify other tabs handle correctly

**Expected Results**:
- ✅ No race conditions
- ✅ Global flags prevent concurrent processing
- ✅ Each tab processes independently

#### **4.2 Session Storage Manipulation**
**Steps**:
1. Manually set `tms_oauth_role` to 'driver'
2. Initiate passenger OAuth
3. Verify role detection works correctly

**Expected Results**:
- ✅ Role detection overrides manual manipulation
- ✅ Correct dashboard shown based on OAuth type

#### **4.3 Network Failures**
**Steps**:
1. Simulate network failures during OAuth
2. Test retry mechanisms
3. Verify error recovery

**Expected Results**:
- ✅ Graceful error handling
- ✅ Clear error messages
- ✅ Retry options available

### **Test 5: Integration Testing** 🧪

#### **5.1 MYJKKN Integration**
**Steps**:
1. Test with actual MYJKKN OAuth endpoints
2. Verify token exchange works correctly
3. Test with real user credentials

**Expected Results**:
- ✅ Successful token exchange
- ✅ User data retrieved correctly
- ✅ Session established properly

#### **5.2 Dashboard Integration**
**Steps**:
1. Complete authentication for both user types
2. Verify dashboard loads correctly
3. Test dashboard functionality

**Expected Results**:
- ✅ Dashboard loads with correct user data
- ✅ Role-specific features available
- ✅ Session persists correctly

## 🔧 **Test Environment Setup**

### **Local Development Testing**
```bash
# Start development server
npm run dev

# Test URLs
http://localhost:3003/login
http://localhost:3003/auth/callback
http://localhost:3003/auth/driver-callback (backward compatibility)
```

### **Environment Variables for Testing**
```env
# Development
NEXT_PUBLIC_REDIRECT_URI=http://localhost:3003/auth/callback
NEXT_PUBLIC_AUTH_DEBUG=true

# Production
NEXT_PUBLIC_REDIRECT_URI=https://tms-passenger.vercel.app/auth/callback
```

## 📊 **Test Results Tracking**

### **Test Execution Log**
| Test Scenario | Status | Notes | Date |
|---------------|--------|-------|------|
| Passenger OAuth - Basic | 🔄 Pending | | |
| Passenger OAuth - Redirect | 🔄 Pending | | |
| Passenger OAuth - Error | 🔄 Pending | | |
| Driver OAuth - Basic | 🔄 Pending | | |
| Driver OAuth - Redirect | 🔄 Pending | | |
| Driver OAuth - Error | 🔄 Pending | | |
| Backward Compatibility | 🔄 Pending | | |
| Edge Cases | 🔄 Pending | | |
| Integration Testing | 🔄 Pending | | |

### **Success Criteria**
- ✅ All test scenarios pass
- ✅ No console errors
- ✅ No TypeScript errors
- ✅ No build errors
- ✅ User experience is smooth
- ✅ Backward compatibility maintained

## 🚨 **Known Issues & Workarounds**

### **Potential Issues**
1. **MYJKKN Configuration**: May need to update MYJKKN app settings
2. **Caching**: Browser cache might interfere with testing
3. **Session Storage**: Manual clearing may be needed between tests

### **Testing Workarounds**
1. **Clear Browser Data**: Clear cache, cookies, and session storage
2. **Incognito Mode**: Use incognito/private browsing for clean testing
3. **Multiple Browsers**: Test in different browsers to isolate issues

## 🎯 **Next Steps**

### **Immediate Actions**
1. Execute all test scenarios
2. Document any issues found
3. Fix critical issues immediately
4. Retest after fixes

### **Post-Testing Actions**
1. Update documentation with test results
2. Prepare for production deployment
3. Monitor production authentication flows
4. Gather user feedback

## 📋 **Testing Checklist**

### **Pre-Testing** ✅
- [x] Code compilation passes
- [x] Environment variables configured
- [x] Development server running
- [x] Browser cache cleared

### **Core Functionality** 🔄
- [ ] Passenger OAuth works correctly
- [ ] Driver OAuth works correctly
- [ ] Role detection functions properly
- [ ] Redirects work as expected

### **Error Handling** 🔄
- [ ] OAuth errors handled gracefully
- [ ] Network failures handled properly
- [ ] Invalid tokens handled correctly
- [ ] User feedback is clear

### **Backward Compatibility** 🔄
- [ ] Old driver callback redirects correctly
- [ ] Existing links continue to work
- [ ] No breaking changes introduced
- [ ] Migration is seamless

### **Integration** 🔄
- [ ] MYJKKN integration works
- [ ] Dashboard loads correctly
- [ ] Session management works
- [ ] User data is correct

### **Performance** 🔄
- [ ] Authentication is fast
- [ ] No memory leaks
- [ ] No infinite loops
- [ ] Resource usage is reasonable

## 🎉 **Success Metrics**

### **Technical Metrics**
- ✅ Zero TypeScript errors
- ✅ Zero build errors
- ✅ All test scenarios pass
- ✅ No console errors

### **User Experience Metrics**
- ✅ Smooth authentication flow
- ✅ Fast redirect times
- ✅ Clear error messages
- ✅ Intuitive user interface

### **Compatibility Metrics**
- ✅ 100% backward compatibility
- ✅ Works across browsers
- ✅ Works on mobile devices
- ✅ No breaking changes

---

**Testing Status**: 🔄 **In Progress**
**Last Updated**: [Current Date]
**Next Review**: After test execution









// Test script to debug main OAuth authentication
// Run this in browser console on localhost:3003/login

console.log('🔍 Testing Main OAuth Authentication...');

// Test the exact OAuth flow that happens when clicking "Sign in with MYJKKN"
function testMainOAuthFlow() {
    console.log('🚀 Starting main OAuth flow test...');
    
    // Configuration from environment/defaults
    const config = {
        parentAppUrl: 'https://my.jkkn.ac.in',
        appId: 'transport_management_system_menrm674',
        apiKey: 'app_e20655605d48ebce_cfa1ffe34268949a',
        redirectUri: 'http://localhost:3003/auth/callback'
    };
    
    console.log('📋 OAuth Configuration:', config);
    
    // Generate state (same as parent-auth-service.ts)
    const state = Math.random().toString(36).substring(2, 15) + 
                  Math.random().toString(36).substring(2, 15);
    
    console.log('🔑 Generated state:', state);
    
    // Store state in sessionStorage (same as parent-auth-service.ts)
    sessionStorage.setItem('oauth_state', state);
    
    // Build authorization URL (exact same as parent-auth-service.ts)
    const authUrl = new URL('/api/auth/child-app/authorize', config.parentAppUrl);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('app_id', config.appId);
    authUrl.searchParams.append('api_key', config.apiKey);
    authUrl.searchParams.append('redirect_uri', config.redirectUri);
    authUrl.searchParams.append('scope', 'read write profile');
    authUrl.searchParams.append('state', state);
    
    console.log('🔗 Generated OAuth URL:', authUrl.toString());
    
    // Test URL accessibility
    console.log('🌐 Testing URL accessibility...');
    
    // Create a test link to manually check
    const testLink = document.createElement('a');
    testLink.href = authUrl.toString();
    testLink.target = '_blank';
    testLink.textContent = '🔗 Click to test OAuth URL manually';
    testLink.style.cssText = `
        display: block;
        padding: 10px;
        background: #2563eb;
        color: white;
        text-decoration: none;
        border-radius: 5px;
        margin: 10px 0;
        text-align: center;
    `;
    
    // Add to page if possible
    if (document.body) {
        const container = document.createElement('div');
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: white;
            padding: 20px;
            border: 2px solid #2563eb;
            border-radius: 10px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            max-width: 400px;
        `;
        
        container.innerHTML = `
            <h3 style="margin: 0 0 10px 0; color: #2563eb;">🔍 OAuth Test</h3>
            <p style="margin: 0 0 10px 0; font-size: 14px;">Generated OAuth URL for manual testing:</p>
        `;
        
        container.appendChild(testLink);
        
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '✕ Close';
        closeBtn.style.cssText = `
            background: #ef4444;
            color: white;
            border: none;
            padding: 5px 10px;
            border-radius: 3px;
            cursor: pointer;
            margin-top: 10px;
        `;
        closeBtn.onclick = () => container.remove();
        container.appendChild(closeBtn);
        
        document.body.appendChild(container);
        
        console.log('✅ Test link added to page (top-right corner)');
    }
    
    return {
        authUrl: authUrl.toString(),
        state,
        config
    };
}

// Test what happens during callback processing
function testCallbackProcessing() {
    console.log('🔄 Testing callback processing...');
    
    // Simulate callback URL parameters
    const mockCode = 'mock_auth_code_12345';
    const mockState = sessionStorage.getItem('oauth_state') || 'test_state';
    
    console.log('📋 Callback simulation:', {
        code: mockCode,
        state: mockState,
        expectedRedirectUri: 'http://localhost:3003/auth/callback'
    });
    
    // Test callback URL format
    const callbackUrl = `http://localhost:3003/auth/callback?code=${mockCode}&state=${mockState}`;
    console.log('🔗 Simulated callback URL:', callbackUrl);
    
    return {
        callbackUrl,
        code: mockCode,
        state: mockState
    };
}

// Test token exchange process
async function testTokenExchange() {
    console.log('🔄 Testing token exchange process...');
    
    const mockCode = 'test_code_12345';
    const config = {
        parentAppUrl: 'https://my.jkkn.ac.in',
        appId: 'transport_management_system_menrm674',
        apiKey: 'app_e20655605d48ebce_cfa1ffe34268949a',
        redirectUri: 'http://localhost:3003/auth/callback'
    };
    
    try {
        // Test the token exchange endpoint
        const tokenUrl = new URL('/api/auth/child-app/token', config.parentAppUrl);
        
        const tokenRequest = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': config.apiKey
            },
            body: JSON.stringify({
                grant_type: 'authorization_code',
                code: mockCode,
                redirect_uri: config.redirectUri,
                app_id: config.appId
            })
        };
        
        console.log('📤 Token exchange request:', {
            url: tokenUrl.toString(),
            method: tokenRequest.method,
            headers: tokenRequest.headers,
            body: JSON.parse(tokenRequest.body)
        });
        
        // Note: This will likely fail due to CORS, but we can see the request structure
        console.log('⚠️ Note: Actual request will likely fail due to CORS policy');
        console.log('💡 This is normal - the token exchange happens server-side in production');
        
    } catch (error) {
        console.error('❌ Token exchange test error:', error);
    }
}

// Check current authentication state
function checkCurrentAuthState() {
    console.log('🔍 Checking current authentication state...');
    
    const authData = {
        localStorage: {
            tms_driver_user: localStorage.getItem('tms_driver_user'),
            tms_driver_token: localStorage.getItem('tms_driver_token'),
            tms_access_token: localStorage.getItem('tms_access_token'),
            tms_user: localStorage.getItem('tms_user')
        },
        sessionStorage: {
            oauth_state: sessionStorage.getItem('oauth_state'),
            post_login_redirect: sessionStorage.getItem('post_login_redirect'),
            tms_oauth_role: sessionStorage.getItem('tms_oauth_role')
        },
        cookies: document.cookie
    };
    
    console.log('📊 Current auth state:', authData);
    
    return authData;
}

// Run comprehensive OAuth test
function runComprehensiveOAuthTest() {
    console.log('🚀 Running comprehensive OAuth test...\n');
    
    console.log('=== 1. Current Auth State ===');
    checkCurrentAuthState();
    console.log('');
    
    console.log('=== 2. OAuth Flow Test ===');
    const oauthTest = testMainOAuthFlow();
    console.log('');
    
    console.log('=== 3. Callback Processing Test ===');
    testCallbackProcessing();
    console.log('');
    
    console.log('=== 4. Token Exchange Test ===');
    testTokenExchange();
    console.log('');
    
    console.log('✅ Comprehensive OAuth test completed!');
    console.log('💡 Next steps:');
    console.log('1. Click the test link that appeared on the page');
    console.log('2. Check browser network tab during OAuth flow');
    console.log('3. Look for any error responses from my.jkkn.ac.in');
    console.log('4. Verify the callback URL receives proper parameters');
    
    return oauthTest;
}

// Auto-run the comprehensive test
const testResults = runComprehensiveOAuthTest();

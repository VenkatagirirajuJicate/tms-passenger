import { NextRequest, NextResponse } from 'next/server';

// In-memory cache to prevent duplicate token exchanges for the same code
const activeTokenExchanges = new Map<string, Promise<any>>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, state } = body;

    console.log('Token exchange request:', { 
      hasCode: !!code, 
      hasState: !!state,
      codeLength: code?.length || 0 
    });

    if (!code) {
      return NextResponse.json(
        { error: 'Missing authorization code' },
        { status: 400 }
      );
    }

    // Check if this code is already being processed
    if (activeTokenExchanges.has(code)) {
      console.log('⏳ Code already being processed, waiting for existing request...');
      try {
        // Wait for the existing request to complete and get the token data
        const tokenData = await activeTokenExchanges.get(code)!;
        console.log('✅ Using cached token data for duplicate request');
        
        // Create a fresh response with the cached data
        return NextResponse.json({
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          token_type: tokenData.token_type || 'Bearer',
          expires_in: tokenData.expires_in || 3600,
          user: tokenData.user
        });
      } catch (error) {
        // If the existing request failed, we'll try again below
        console.log('⚠️ Existing request failed, proceeding with new attempt');
        activeTokenExchanges.delete(code);
      }
    }

    // Create and cache the token exchange promise
    console.log('🔄 Starting new token exchange with parent app...');
    
    const tokenExchangePromise = (async () => {
      try {
        const tokenResponse = await fetch(
          `${process.env.NEXT_PUBLIC_PARENT_APP_URL || 'https://my.jkkn.ac.in'}/api/auth/child-app/token`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-API-Key': process.env.NEXT_PUBLIC_API_KEY || 'app_e20655605d48ebce_cfa1ffe34268949a'
            },
            body: JSON.stringify({
              grant_type: 'authorization_code',
              code,
              app_id: process.env.NEXT_PUBLIC_APP_ID || 'transport_management_system_menrm674',
              redirect_uri: process.env.NEXT_PUBLIC_REDIRECT_URI || 'http://localhost:3003/auth/callback',
              state
            })
          }
        );

        const responseText = await tokenResponse.text();
        
        if (!tokenResponse.ok) {
          console.error('Token exchange failed:', {
            status: tokenResponse.status,
            statusText: tokenResponse.statusText,
            response: responseText
          });

          // Throw error to be caught by outer catch block
          throw new Error(`Token exchange failed: ${responseText} (${tokenResponse.status})`);
        }

        let tokenData;
        try {
          tokenData = JSON.parse(responseText);
        } catch (parseError) {
          console.error('Failed to parse token response:', responseText);
          throw new Error('Invalid response format from parent app');
        }

        console.log('Token exchange successful:', {
          hasAccessToken: !!tokenData.access_token,
          hasUser: !!tokenData.user,
          userEmail: tokenData.user?.email
        });

        // Return the raw token data for caching
        return {
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          token_type: tokenData.token_type || 'Bearer',
          expires_in: tokenData.expires_in || 3600,
          user: tokenData.user
        };

      } catch (error) {
        console.error('Error in token exchange promise:', error);
        throw error; // Re-throw to be caught by outer try-catch
      } finally {
        // Always clean up the cache entry when done
        activeTokenExchanges.delete(code);
      }
    })();

    // Cache the promise before starting execution
    activeTokenExchanges.set(code, tokenExchangePromise);

    // Get the token data and create a fresh response
    const tokenData = await tokenExchangePromise;
    return NextResponse.json({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      token_type: tokenData.token_type || 'Bearer',
      expires_in: tokenData.expires_in || 3600,
      user: tokenData.user
    });

  } catch (error) {
    console.error('Token exchange error:', error);
    
    // Clean up cache entry if it was created
    if (code) {
      activeTokenExchanges.delete(code);
    }
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

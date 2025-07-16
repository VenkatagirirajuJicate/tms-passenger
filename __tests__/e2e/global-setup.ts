import { chromium, FullConfig } from '@playwright/test'

async function globalSetup(config: FullConfig) {
  console.log('🚀 Setting up end-to-end tests...')
  
  // Create a browser instance for setup
  const browser = await chromium.launch()
  const context = await browser.newContext()
  const page = await context.newPage()

  try {
    // Wait for the application to be ready
    const baseURL = config.projects[0].use.baseURL || 'http://localhost:3003'
    console.log(`📡 Checking if application is ready at ${baseURL}`)
    
    await page.goto(baseURL, { waitUntil: 'networkidle' })
    
    // Verify the application loads correctly
    await page.waitForSelector('text=Student Portal', { timeout: 30000 })
    console.log('✅ Application is ready for testing')
    
    // Setup test data (if needed)
    await setupTestData(page)
    
    // Create authentication state for tests
    await setupAuthenticationState(page, context)
    
  } catch (error) {
    console.error('❌ Failed to setup tests:', error)
    throw error
  } finally {
    await browser.close()
  }
  
  console.log('🎯 End-to-end test setup completed')
}

async function setupTestData(page: any) {
  console.log('🔧 Setting up test data...')
  
  // Here you could set up test data in your database
  // For now, we'll just log that this step exists
  console.log('📝 Test data setup completed')
}

async function setupAuthenticationState(page: any, context: any) {
  console.log('🔐 Setting up authentication states...')
  
  try {
    // Try to create a test student session
    // This would typically involve:
    // 1. Creating test student data
    // 2. Performing login to get session
    // 3. Saving authentication state
    
    // For now, we'll create a mock session state
    await context.addCookies([
      {
        name: 'student-session',
        value: 'test-session-token',
        domain: 'localhost',
        path: '/',
        httpOnly: false,
        secure: false,
        sameSite: 'Lax'
      }
    ])
    
    // Store authentication state for reuse in tests
    await context.storageState({ path: './__tests__/e2e/auth-state.json' })
    
    console.log('🔑 Authentication state saved')
  } catch (error) {
    console.warn('⚠️ Could not setup authentication state:', error)
    // Don't fail the entire setup if auth state creation fails
  }
}

export default globalSetup 
import { FullConfig } from '@playwright/test'
import fs from 'fs'
import path from 'path'

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Cleaning up after end-to-end tests...')
  
  try {
    // Clean up authentication state files
    const authStatePath = path.join(__dirname, 'auth-state.json')
    if (fs.existsSync(authStatePath)) {
      fs.unlinkSync(authStatePath)
      console.log('🔑 Authentication state cleaned up')
    }
    
    // Clean up test data (if any was created)
    await cleanupTestData()
    
    // Clean up any temporary files or resources
    await cleanupTempFiles()
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error)
    // Don't fail the tests if cleanup fails
  }
  
  console.log('✅ End-to-end test cleanup completed')
}

async function cleanupTestData() {
  console.log('🗑️ Cleaning up test data...')
  
  // Here you would clean up any test data created in the database
  // For example:
  // - Delete test students
  // - Remove test bookings
  // - Clean up test routes/schedules
  
  console.log('📝 Test data cleanup completed')
}

async function cleanupTempFiles() {
  console.log('🗂️ Cleaning up temporary files...')
  
  try {
    // Clean up any temporary files created during tests
    const tempDirs = [
      path.join(__dirname, '../../test-results'),
      path.join(__dirname, '../../coverage/tmp')
    ]
    
    tempDirs.forEach(dir => {
      if (fs.existsSync(dir)) {
        // Remove old files but keep the directory structure
        const files = fs.readdirSync(dir)
        files.forEach(file => {
          const filePath = path.join(dir, file)
          const stats = fs.statSync(filePath)
          
          // Remove files older than 1 day
          const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000)
          if (stats.mtime.getTime() < oneDayAgo) {
            if (stats.isFile()) {
              fs.unlinkSync(filePath)
            }
          }
        })
      }
    })
    
    console.log('🗂️ Temporary files cleaned up')
  } catch (error) {
    console.warn('⚠️ Could not clean up some temporary files:', error)
  }
}

export default globalTeardown 
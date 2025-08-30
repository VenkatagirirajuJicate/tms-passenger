// Debug script to check route locations in the database
// Run this to see what's actually stored in the database

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugRouteLocations() {
  try {
    console.log('🔍 Checking route locations in database...\n');
    
    // Get all routes
    const { data: routes, error } = await supabase
      .from('routes')
      .select('id, route_number, route_name, start_location, end_location, departure_time, arrival_time')
      .eq('status', 'active')
      .order('route_number');
    
    if (error) {
      console.error('❌ Error fetching routes:', error);
      return;
    }
    
    if (!routes || routes.length === 0) {
      console.log('❌ No routes found in database');
      return;
    }
    
    console.log(`✅ Found ${routes.length} active routes:\n`);
    
    routes.forEach((route, index) => {
      console.log(`${index + 1}. Route ${route.route_number}: ${route.route_name}`);
      console.log(`   Start: ${route.start_location}`);
      console.log(`   End: ${route.end_location}`);
      console.log(`   Time: ${route.departure_time} → ${route.arrival_time}`);
      console.log('');
    });
    
    // Check if there are any obvious swaps
    console.log('🔍 Checking for potential location swaps...\n');
    
    const potentialSwaps = routes.filter(route => {
      // Check if start and end locations might be swapped
      // This is a heuristic - you might need to adjust based on your data
      const start = route.start_location.toLowerCase();
      const end = route.end_location.toLowerCase();
      
      // Common patterns that might indicate a swap
      const campusPatterns = ['campus', 'college', 'university', 'school'];
      const cityPatterns = ['city', 'center', 'town', 'station'];
      
      const startIsCampus = campusPatterns.some(pattern => start.includes(pattern));
      const endIsCampus = campusPatterns.some(pattern => end.includes(pattern));
      const startIsCity = cityPatterns.some(pattern => start.includes(pattern));
      const endIsCity = cityPatterns.some(pattern => end.includes(pattern));
      
      // If start looks like a city and end looks like campus, it might be correct
      // If start looks like campus and end looks like city, it might be swapped
      return startIsCampus && endIsCity;
    });
    
    if (potentialSwaps.length > 0) {
      console.log('⚠️  Potential location swaps detected:');
      potentialSwaps.forEach(route => {
        console.log(`   Route ${route.route_number}: ${route.route_name}`);
        console.log(`   Current: ${route.start_location} → ${route.end_location}`);
        console.log(`   Suggested: ${route.end_location} → ${route.start_location}`);
        console.log('');
      });
    } else {
      console.log('✅ No obvious location swaps detected');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the debug function
debugRouteLocations();

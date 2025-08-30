-- Debug script to check route locations in the database
-- Run this in your Supabase SQL editor to see what's actually stored

-- Check all active routes and their locations
SELECT 
  id,
  route_number,
  route_name,
  start_location,
  end_location,
  departure_time,
  arrival_time,
  status
FROM routes 
WHERE status = 'active'
ORDER BY route_number;

-- Check if there are any obvious location swaps
-- This query looks for routes where start_location might be a campus location
-- and end_location might be a city location (which could indicate a swap)
SELECT 
  route_number,
  route_name,
  start_location,
  end_location,
  CASE 
    WHEN start_location ILIKE '%campus%' OR start_location ILIKE '%college%' OR start_location ILIKE '%university%' OR start_location ILIKE '%school%'
    THEN '⚠️ START looks like campus location'
    ELSE '✅ START looks like city location'
  END as start_assessment,
  CASE 
    WHEN end_location ILIKE '%campus%' OR end_location ILIKE '%college%' OR end_location ILIKE '%university%' OR end_location ILIKE '%school%'
    THEN '✅ END looks like campus location'
    ELSE '⚠️ END looks like city location'
  END as end_assessment
FROM routes 
WHERE status = 'active'
ORDER BY route_number;

-- Check student route allocations to see which routes are assigned
SELECT 
  s.student_name,
  s.email,
  s.allocated_route_id,
  r.route_number,
  r.route_name,
  r.start_location,
  r.end_location
FROM students s
LEFT JOIN routes r ON s.allocated_route_id = r.id
WHERE s.allocated_route_id IS NOT NULL
ORDER BY r.route_number, s.student_name;

-- Check route stops to see the complete route path
SELECT 
  r.route_number,
  r.route_name,
  r.start_location,
  r.end_location,
  rs.stop_name,
  rs.sequence_order,
  rs.stop_time,
  rs.is_major_stop
FROM routes r
LEFT JOIN route_stops rs ON r.id = rs.route_id
WHERE r.status = 'active'
ORDER BY r.route_number, rs.sequence_order;

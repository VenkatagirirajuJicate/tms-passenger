import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build query for summary data
    let query = supabase
      .from('location_tracking')
      .select(`
        id,
        tracking_date,
        tracking_timestamp,
        speed,
        accuracy,
        route_id,
        driver_id,
        vehicle_id,
        routes!inner (
          id,
          route_number,
          route_name
        ),
        drivers!inner (
          id,
          name,
          license_number
        ),
        vehicles (
          id,
          registration_number,
          model
        )
      `)
      .eq('is_active', true);

    // Add date filters
    if (date) {
      query = query.eq('tracking_date', date);
    } else if (startDate && endDate) {
      query = query.gte('tracking_date', startDate).lte('tracking_date', endDate);
    } else {
      // Default to today if no date specified
      const today = new Date().toISOString().split('T')[0];
      query = query.eq('tracking_date', today);
    }

    const { data: trackingData, error } = await query;

    if (error) {
      console.error('Error fetching tracking summary data:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch tracking summary data' },
        { status: 500 }
      );
    }

    if (!trackingData || trackingData.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          summary: {
            totalRecords: 0,
            uniqueRoutes: 0,
            uniqueDrivers: 0,
            uniqueVehicles: 0,
            avgSpeed: 0,
            avgAccuracy: 0,
            maxSpeed: 0,
            dateRange: {
              start: date || startDate || new Date().toISOString().split('T')[0],
              end: date || endDate || new Date().toISOString().split('T')[0]
            }
          },
          dailyStats: [],
          routeStats: [],
          driverStats: []
        }
      });
    }

    // Calculate overall summary statistics
    const summary = {
      totalRecords: trackingData.length,
      uniqueRoutes: new Set(trackingData.map(item => item.routes.id)).size,
      uniqueDrivers: new Set(trackingData.map(item => item.drivers.id)).size,
      uniqueVehicles: new Set(trackingData.map(item => item.vehicles?.id).filter(Boolean)).size,
      avgSpeed: trackingData.reduce((sum, item) => sum + (item.speed || 0), 0) / trackingData.length,
      avgAccuracy: trackingData.reduce((sum, item) => sum + (item.accuracy || 0), 0) / trackingData.length,
      maxSpeed: Math.max(...trackingData.map(item => item.speed || 0)),
      dateRange: {
        start: trackingData.reduce((min, item) => item.tracking_date < min ? item.tracking_date : min, trackingData[0].tracking_date),
        end: trackingData.reduce((max, item) => item.tracking_date > max ? item.tracking_date : max, trackingData[0].tracking_date)
      }
    };

    // Group by date for daily statistics
    const dailyStats = trackingData.reduce((acc, item) => {
      const date = item.tracking_date;
      if (!acc[date]) {
        acc[date] = {
          date,
          totalRecords: 0,
          uniqueRoutes: new Set(),
          uniqueDrivers: new Set(),
          uniqueVehicles: new Set(),
          avgSpeed: 0,
          avgAccuracy: 0,
          maxSpeed: 0
        };
      }
      
      acc[date].totalRecords++;
      acc[date].uniqueRoutes.add(item.routes.id);
      acc[date].uniqueDrivers.add(item.drivers.id);
      if (item.vehicles?.id) acc[date].uniqueVehicles.add(item.vehicles.id);
      acc[date].avgSpeed += item.speed || 0;
      acc[date].avgAccuracy += item.accuracy || 0;
      acc[date].maxSpeed = Math.max(acc[date].maxSpeed, item.speed || 0);
      
      return acc;
    }, {} as Record<string, any>);

    // Calculate averages and convert sets to counts for daily stats
    Object.values(dailyStats).forEach((stat: any) => {
      stat.avgSpeed = stat.totalRecords > 0 ? stat.avgSpeed / stat.totalRecords : 0;
      stat.avgAccuracy = stat.totalRecords > 0 ? stat.avgAccuracy / stat.totalRecords : 0;
      stat.uniqueRoutes = stat.uniqueRoutes.size;
      stat.uniqueDrivers = stat.uniqueDrivers.size;
      stat.uniqueVehicles = stat.uniqueVehicles.size;
      delete stat.uniqueRoutes;
      delete stat.uniqueDrivers;
      delete stat.uniqueVehicles;
    });

    // Group by route for route statistics
    const routeStats = trackingData.reduce((acc, item) => {
      const routeId = item.routes.id;
      if (!acc[routeId]) {
        acc[routeId] = {
          routeId,
          routeNumber: item.routes.route_number,
          routeName: item.routes.route_name,
          totalRecords: 0,
          uniqueDrivers: new Set(),
          uniqueVehicles: new Set(),
          avgSpeed: 0,
          avgAccuracy: 0,
          maxSpeed: 0
        };
      }
      
      acc[routeId].totalRecords++;
      acc[routeId].uniqueDrivers.add(item.drivers.id);
      if (item.vehicles?.id) acc[routeId].uniqueVehicles.add(item.vehicles.id);
      acc[routeId].avgSpeed += item.speed || 0;
      acc[routeId].avgAccuracy += item.accuracy || 0;
      acc[routeId].maxSpeed = Math.max(acc[routeId].maxSpeed, item.speed || 0);
      
      return acc;
    }, {} as Record<string, any>);

    // Calculate averages and convert sets to counts for route stats
    Object.values(routeStats).forEach((stat: any) => {
      stat.avgSpeed = stat.totalRecords > 0 ? stat.avgSpeed / stat.totalRecords : 0;
      stat.avgAccuracy = stat.totalRecords > 0 ? stat.avgAccuracy / stat.totalRecords : 0;
      stat.uniqueDrivers = stat.uniqueDrivers.size;
      stat.uniqueVehicles = stat.uniqueVehicles.size;
      delete stat.uniqueDrivers;
      delete stat.uniqueVehicles;
    });

    // Group by driver for driver statistics
    const driverStats = trackingData.reduce((acc, item) => {
      const driverId = item.drivers.id;
      if (!acc[driverId]) {
        acc[driverId] = {
          driverId,
          driverName: item.drivers.name,
          licenseNumber: item.drivers.license_number,
          totalRecords: 0,
          uniqueRoutes: new Set(),
          uniqueVehicles: new Set(),
          avgSpeed: 0,
          avgAccuracy: 0,
          maxSpeed: 0
        };
      }
      
      acc[driverId].totalRecords++;
      acc[driverId].uniqueRoutes.add(item.routes.id);
      if (item.vehicles?.id) acc[driverId].uniqueVehicles.add(item.vehicles.id);
      acc[driverId].avgSpeed += item.speed || 0;
      acc[driverId].avgAccuracy += item.accuracy || 0;
      acc[driverId].maxSpeed = Math.max(acc[driverId].maxSpeed, item.speed || 0);
      
      return acc;
    }, {} as Record<string, any>);

    // Calculate averages and convert sets to counts for driver stats
    Object.values(driverStats).forEach((stat: any) => {
      stat.avgSpeed = stat.totalRecords > 0 ? stat.avgSpeed / stat.totalRecords : 0;
      stat.avgAccuracy = stat.totalRecords > 0 ? stat.avgAccuracy / stat.totalRecords : 0;
      stat.uniqueRoutes = stat.uniqueRoutes.size;
      stat.uniqueVehicles = stat.uniqueVehicles.size;
      delete stat.uniqueRoutes;
      delete stat.uniqueVehicles;
    });

    return NextResponse.json({
      success: true,
      data: {
        summary,
        dailyStats: Object.values(dailyStats),
        routeStats: Object.values(routeStats),
        driverStats: Object.values(driverStats)
      }
    });

  } catch (error) {
    console.error('Error in tracking summary API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

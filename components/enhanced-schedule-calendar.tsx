'use client';

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Bus,
  AlertCircle,
  CheckCircle,
  CreditCard,
  Lock,
  Users
} from 'lucide-react';

interface Schedule {
  id: string;
  route_id: string;
  schedule_date: string;
  departure_time: string;
  available_seats: number;
  booked_seats: number;
  booking_enabled: boolean;
  status: string;
}

interface PaymentStatus {
  can_book: boolean;
  reason: string;
  payment_required: boolean;
  required_term?: string;
  payment_info?: {
    payment_type: string;
    term_number: string;
    receipt_color: string;
  };
}

interface EnhancedScheduleCalendarProps {
  studentId: string;
  routeId?: string;
  onDateSelect?: (date: string, schedule?: Schedule) => void;
  onBookingAttempt?: (schedule: Schedule, paymentStatus: PaymentStatus) => void;
}

const EnhancedScheduleCalendar: React.FC<EnhancedScheduleCalendarProps> = ({
  studentId,
  routeId,
  onDateSelect,
  onBookingAttempt
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [paymentStatuses, setPaymentStatuses] = useState<Record<string, PaymentStatus>>({});
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    fetchSchedulesAndPaymentStatus();
  }, [currentDate, studentId, routeId]);

  const fetchSchedulesAndPaymentStatus = async () => {
    try {
      setLoading(true);
      
      // Get schedules for the current month
      const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      const scheduleParams = new URLSearchParams({
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        ...(routeId && { route_id: routeId })
      });

      const schedulesResponse = await fetch(`/api/schedules/availability?${scheduleParams}`);
      const schedulesData = await schedulesResponse.json();
      
      if (schedulesResponse.ok) {
        setSchedules(schedulesData);
        
        // Check payment status for each schedule date
        const paymentPromises = schedulesData.map(async (schedule: Schedule) => {
          try {
            const eligibilityParams = new URLSearchParams({
              studentId,
              scheduleId: schedule.id,
              ...(routeId && { routeId })
            });

            const response = await fetch(`/api/schedules/booking-eligibility?${eligibilityParams}`);
            const eligibilityData = await response.json();
            
            return {
              date: schedule.schedule_date,
              status: eligibilityData
            };
          } catch (error) {
            console.error('Error checking payment status for date:', schedule.schedule_date, error);
            return {
              date: schedule.schedule_date,
              status: { can_book: false, reason: 'Unable to verify payment', payment_required: true }
            };
          }
        });
        
        const paymentResults = await Promise.all(paymentPromises);
        const statusMap: Record<string, PaymentStatus> = {};
        
        paymentResults.forEach(result => {
          statusMap[result.date] = result.status;
        });
        
        setPaymentStatuses(statusMap);
      }
    } catch (error) {
      console.error('Error fetching schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateClick = (date: string) => {
    setSelectedDate(date);
    const schedule = schedules.find(s => s.schedule_date === date);
    onDateSelect?.(date, schedule);
  };

  const handleBookingClick = (schedule: Schedule) => {
    const paymentStatus = paymentStatuses[schedule.schedule_date];
    onBookingAttempt?.(schedule, paymentStatus);
  };

  const getDateStatus = (date: string) => {
    const schedule = schedules.find(s => s.schedule_date === date);
    const paymentStatus = paymentStatuses[date];
    
    if (!schedule) {
      return { type: 'no-schedule', className: '', icon: null };
    }
    
    if (!paymentStatus) {
      return { type: 'loading', className: 'bg-gray-100 text-gray-400', icon: null };
    }
    
    if (paymentStatus.payment_required) {
      return { 
        type: 'payment-required', 
        className: 'bg-red-100 text-red-800 border border-red-200',
        icon: <CreditCard className="h-3 w-3" />
      };
    }
    
    if (paymentStatus.can_book) {
      const receiptColor = paymentStatus.payment_info?.receipt_color;
      const colorClasses = {
        white: 'bg-gray-100 text-gray-800 border border-gray-200',
        blue: 'bg-blue-100 text-blue-800 border border-blue-200',
        yellow: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
        green: 'bg-green-100 text-green-800 border border-green-200'
      };
      
      return {
        type: 'available',
        className: colorClasses[receiptColor as keyof typeof colorClasses] || colorClasses.white,
        icon: <CheckCircle className="h-3 w-3" />
      };
    }
    
    return { 
      type: 'unavailable', 
      className: 'bg-gray-100 text-gray-600',
      icon: <Lock className="h-3 w-3" />
    };
  };

  const renderCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="p-2"></div>);
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateString = date.toISOString().split('T')[0];
      const isToday = date.toDateString() === new Date().toDateString();
      const isSelected = selectedDate === dateString;
      const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));
      
      const schedule = schedules.find(s => s.schedule_date === dateString);
      const dateStatus = getDateStatus(dateString);
      const paymentStatus = paymentStatuses[dateString];
      
      days.push(
        <div
          key={day}
          className={`
            relative p-2 min-h-[80px] border border-gray-100 cursor-pointer transition-all duration-200
            ${isSelected ? 'ring-2 ring-blue-500' : ''}
            ${isToday ? 'bg-blue-50' : 'hover:bg-gray-50'}
            ${isPast ? 'opacity-60' : ''}
          `}
          onClick={() => !isPast && handleDateClick(dateString)}
        >
          {/* Date Number */}
          <div className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
            {day}
          </div>
          
          {/* Schedule Info */}
          {schedule && (
            <div className="space-y-1">
              {/* Status Badge */}
              <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-md text-xs font-medium ${dateStatus.className}`}>
                {dateStatus.icon}
                <span>
                  {paymentStatus?.payment_required ? 'Fee Pending' :
                   paymentStatus?.can_book ? 'Available' : 'Unavailable'}
                </span>
              </div>
              
              {/* Time and Seats */}
              <div className="text-xs text-gray-600 space-y-1">
                <div className="flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span>{schedule.departure_time}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Users className="h-3 w-3" />
                  <span>{schedule.available_seats - schedule.booked_seats}/{schedule.available_seats}</span>
                </div>
              </div>
              
              {/* Payment Status Details */}
              {paymentStatus?.payment_required && (
                <div className="text-xs text-red-600">
                  Term {paymentStatus.required_term} payment required
                </div>
              )}
              
              {paymentStatus?.payment_info && (
                <div className="text-xs text-gray-500">
                  {paymentStatus.payment_info.payment_type === 'full_year' ? 'Full Year' : `Term ${paymentStatus.payment_info.term_number}`} paid
                </div>
              )}
            </div>
          )}
          
          {/* No Schedule Available */}
          {!schedule && (
            <div className="text-xs text-gray-400 mt-2">
              No schedule
            </div>
          )}
        </div>
      );
    }
    
    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          {loading && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <h3 className="text-sm font-medium text-gray-900 mb-2">Payment Status Legend:</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-100 border border-red-200 rounded"></div>
            <span>Fee Pending</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gray-100 border border-gray-200 rounded"></div>
            <span>Term 1 Paid</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-100 border border-blue-200 rounded"></div>
            <span>Term 2 Paid</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-100 border border-yellow-200 rounded"></div>
            <span>Term 3 Paid</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-100 border border-green-200 rounded"></div>
            <span>Full Year Paid</span>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-4">
        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-0 mb-2">
          {dayNames.map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-600">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-0 border border-gray-200 rounded-lg overflow-hidden">
          {renderCalendarDays()}
        </div>
      </div>

      {/* Selected Date Details */}
      {selectedDate && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <h3 className="font-medium text-gray-900 mb-2">
            Selected Date: {new Date(selectedDate).toLocaleDateString('en-IN', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </h3>
          
          {(() => {
            const schedule = schedules.find(s => s.schedule_date === selectedDate);
            const paymentStatus = paymentStatuses[selectedDate];
            
            if (!schedule) {
              return <p className="text-sm text-gray-600">No schedule available for this date.</p>;
            }
            
            return (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Departure:</span>
                    <div className="font-medium">{schedule.departure_time}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Available Seats:</span>
                    <div className="font-medium">{schedule.available_seats - schedule.booked_seats}/{schedule.available_seats}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <div className="font-medium">
                      {paymentStatus?.payment_required ? 'Payment Required' :
                       paymentStatus?.can_book ? 'Available for Booking' : 'Unavailable'}
                    </div>
                  </div>
                </div>
                
                {paymentStatus?.payment_required && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2 text-red-800">
                      <AlertCircle className="h-4 w-4" />
                      <span className="font-medium">Payment Required</span>
                    </div>
                    <p className="text-sm text-red-700 mt-1">
                      You need to pay for Term {paymentStatus.required_term} before booking this schedule.
                    </p>
                  </div>
                )}
                
                <div className="flex justify-end">
                  <button
                    onClick={() => handleBookingClick(schedule)}
                    disabled={!paymentStatus?.can_book}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      paymentStatus?.can_book 
                        ? 'bg-blue-600 text-white hover:bg-blue-700' 
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {paymentStatus?.payment_required ? 'Pay to Book' : 'Book Now'}
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default EnhancedScheduleCalendar; 
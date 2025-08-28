'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  ArrowRight,
  Calendar,
  CreditCard,
  DollarSign,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';
import { Card } from './modern-ui-components';

// Simple Chart Components (Pure CSS/SVG based)
interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

// Line Chart Component
interface LineChartProps {
  data: ChartDataPoint[];
  height?: number;
  color?: string;
  showGrid?: boolean;
  animated?: boolean;
  className?: string;
}

export const LineChart: React.FC<LineChartProps> = ({
  data,
  height = 200,
  color = '#16a34a',
  showGrid = true,
  animated = true,
  className = ''
}) => {
  if (!data.length) return null;

  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue || 1;
  
  const points = data.map((point, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = ((maxValue - point.value) / range) * 80 + 10;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className={`w-full ${className}`} style={{ height }}>
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="overflow-visible"
      >
        {/* Grid Lines */}
        {showGrid && (
          <g className="opacity-20">
            {[0, 25, 50, 75, 100].map((y) => (
              <line
                key={y}
                x1="0"
                y1={y}
                x2="100"
                y2={y}
                stroke="currentColor"
                strokeWidth="0.5"
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </g>
        )}
        
        {/* Line Path */}
        <motion.polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          initial={animated ? { pathLength: 0 } : undefined}
          animate={animated ? { pathLength: 1 } : undefined}
          transition={{ duration: 1, ease: "easeInOut" }}
        />
        
        {/* Data Points */}
        {data.map((point, index) => {
          const x = (index / (data.length - 1)) * 100;
          const y = ((maxValue - point.value) / range) * 80 + 10;
          return (
            <motion.circle
              key={index}
              cx={x}
              cy={y}
              r="1"
              fill={color}
              vectorEffect="non-scaling-stroke"
              initial={animated ? { scale: 0 } : undefined}
              animate={animated ? { scale: 1 } : undefined}
              transition={{ delay: index * 0.1, duration: 0.3 }}
            />
          );
        })}
      </svg>
    </div>
  );
};

// Bar Chart Component
interface BarChartProps {
  data: ChartDataPoint[];
  height?: number;
  showValues?: boolean;
  animated?: boolean;
  className?: string;
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  height = 200,
  showValues = true,
  animated = true,
  className = ''
}) => {
  if (!data.length) return null;

  const maxValue = Math.max(...data.map(d => d.value));

  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-end space-x-2" style={{ height }}>
        {data.map((item, index) => {
          const barHeight = (item.value / maxValue) * 100;
          const color = item.color || '#16a34a';
          
          return (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div className="relative flex-1 w-full flex items-end">
                <motion.div
                  className="w-full rounded-t-lg"
                  style={{ 
                    backgroundColor: color,
                    height: `${barHeight}%`
                  }}
                  initial={animated ? { height: 0 } : undefined}
                  animate={animated ? { height: `${barHeight}%` } : undefined}
                  transition={{ delay: index * 0.1, duration: 0.6, ease: "easeOut" }}
                />
                
                {showValues && (
                  <motion.div
                    className="absolute -top-6 w-full text-center text-xs font-medium text-gray-600"
                    initial={animated ? { opacity: 0 } : undefined}
                    animate={animated ? { opacity: 1 } : undefined}
                    transition={{ delay: index * 0.1 + 0.3 }}
                  >
                    {item.value}
                  </motion.div>
                )}
              </div>
              
              <div className="mt-2 text-xs text-center text-gray-500 truncate w-full">
                {item.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Pie Chart Component
interface PieChartProps {
  data: ChartDataPoint[];
  size?: number;
  showLabels?: boolean;
  showValues?: boolean;
  animated?: boolean;
  className?: string;
}

export const PieChart: React.FC<PieChartProps> = ({
  data,
  size = 200,
  showLabels = true,
  showValues = true,
  animated = true,
  className = ''
}) => {
  if (!data.length) return null;

  const total = data.reduce((sum, item) => sum + item.value, 0);
  const radius = size / 2 - 10;
  const centerX = size / 2;
  const centerY = size / 2;
  
  let cumulativeAngle = 0;

  return (
    <div className={`flex items-center space-x-8 ${className}`}>
      <div style={{ width: size, height: size }}>
        <svg width={size} height={size}>
          {data.map((item, index) => {
            const angle = (item.value / total) * 360;
            const startAngle = cumulativeAngle;
            const endAngle = cumulativeAngle + angle;
            
            cumulativeAngle += angle;
            
            const startAngleRad = (startAngle - 90) * Math.PI / 180;
            const endAngleRad = (endAngle - 90) * Math.PI / 180;
            
            const x1 = centerX + radius * Math.cos(startAngleRad);
            const y1 = centerY + radius * Math.sin(startAngleRad);
            const x2 = centerX + radius * Math.cos(endAngleRad);
            const y2 = centerY + radius * Math.sin(endAngleRad);
            
            const largeArcFlag = angle > 180 ? 1 : 0;
            
            const pathData = [
              `M ${centerX} ${centerY}`,
              `L ${x1} ${y1}`,
              `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
              'Z'
            ].join(' ');
            
            const color = item.color || `hsl(${index * 137.508}deg, 70%, 50%)`;
            
            return (
              <motion.path
                key={index}
                d={pathData}
                fill={color}
                stroke="white"
                strokeWidth="2"
                initial={animated ? { pathLength: 0 } : undefined}
                animate={animated ? { pathLength: 1 } : undefined}
                transition={{ delay: index * 0.2, duration: 0.6 }}
              />
            );
          })}
        </svg>
      </div>
      
      {showLabels && (
        <div className="space-y-2">
          {data.map((item, index) => {
            const color = item.color || `hsl(${index * 137.508}deg, 70%, 50%)`;
            const percentage = ((item.value / total) * 100).toFixed(1);
            
            return (
              <motion.div
                key={index}
                className="flex items-center space-x-3"
                initial={animated ? { opacity: 0, x: -20 } : undefined}
                animate={animated ? { opacity: 1, x: 0 } : undefined}
                transition={{ delay: index * 0.1 }}
              >
                <div
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: color }}
                />
                <div className="text-sm">
                  <span className="text-gray-900">{item.label}</span>
                  {showValues && (
                    <span className="text-gray-500 ml-2">
                      {item.value} ({percentage}%)
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Enhanced Stats Card with Trend
interface StatsCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease';
    period: string;
  };
  icon: React.ComponentType<{ className?: string }>;
  color?: 'green' | 'blue' | 'purple' | 'amber' | 'red';
  trend?: ChartDataPoint[];
  className?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  change,
  icon: Icon,
  color = 'green',
  trend,
  className = ''
}) => {
  const colorClasses = {
    green: 'bg-green-50 text-green-600 border-green-200',
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    amber: 'bg-amber-50 text-amber-600 border-amber-200',
    red: 'bg-red-50 text-red-600 border-red-200'
  };

  const trendColors = {
    green: '#16a34a',
    blue: '#2563eb',
    purple: '#7c3aed',
    amber: '#d97706',
    red: '#dc2626'
  };

  return (
    <Card className={`modern-card-accent ${className}`} padding="lg">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClasses[color]}`}>
            <Icon className="w-6 h-6" />
          </div>
          
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <motion.p 
              className="text-2xl font-bold text-gray-900"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {value}
            </motion.p>
          </div>
          
          {change && (
            <div className={`flex items-center space-x-1 text-sm ${
              change.type === 'increase' ? 'text-green-600' : 'text-red-600'
            }`}>
              {change.type === 'increase' ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span>{Math.abs(change.value)}% {change.period}</span>
            </div>
          )}
        </div>
        
        {trend && (
          <div className="w-20 h-12">
            <LineChart 
              data={trend} 
              height={48}
              color={trendColors[color]}
              showGrid={false}
            />
          </div>
        )}
      </div>
    </Card>
  );
};

// Enhanced Payment History Timeline
interface PaymentHistoryEntry {
  id: string;
  date: string;
  amount: number;
  description: string;
  status: 'success' | 'pending' | 'failed';
  method: string;
}

interface PaymentTimelineProps {
  payments: PaymentHistoryEntry[];
  className?: string;
}

export const PaymentTimeline: React.FC<PaymentTimelineProps> = ({
  payments,
  className = ''
}) => {
  const statusStyles = {
    success: 'bg-green-100 text-green-800 border-green-200',
    pending: 'bg-amber-100 text-amber-800 border-amber-200',
    failed: 'bg-red-100 text-red-800 border-red-200'
  };

  const statusIcons = {
    success: '✓',
    pending: '⏳',
    failed: '✕'
  };

  return (
    <Card className={`${className}`} padding="lg">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Payment History</h3>
          <Activity className="w-5 h-5 text-gray-400" />
        </div>
        
        <div className="space-y-4">
          {payments.map((payment, index) => (
            <motion.div
              key={payment.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative flex items-start space-x-4"
            >
              {/* Timeline Line */}
              {index < payments.length - 1 && (
                <div className="absolute left-6 top-12 w-px h-8 bg-gray-200" />
              )}
              
              {/* Status Icon */}
              <div className={`
                w-12 h-12 rounded-full flex items-center justify-center text-sm font-medium
                ${statusStyles[payment.status]}
              `}>
                {statusIcons[payment.status]}
              </div>
              
              {/* Payment Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {payment.description}
                  </h4>
                  <span className="text-lg font-semibold text-gray-900">
                    ₹{payment.amount.toLocaleString()}
                  </span>
                </div>
                
                <div className="flex items-center justify-between mt-1">
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(payment.date).toLocaleDateString()}</span>
                    <CreditCard className="w-3 h-3 ml-2" />
                    <span>{payment.method}</span>
                  </div>
                  
                  <span className={`
                    px-2 py-1 rounded-full text-xs font-medium border
                    ${statusStyles[payment.status]}
                  `}>
                    {payment.status}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        
        {payments.length === 0 && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditCard className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500">No payment history available</p>
          </div>
        )}
      </div>
    </Card>
  );
};

// Spending Analytics Component
interface SpendingAnalyticsProps {
  monthlyData: ChartDataPoint[];
  categoryData: ChartDataPoint[];
  totalSpent: number;
  averageMonthly: number;
  className?: string;
}

export const SpendingAnalytics: React.FC<SpendingAnalyticsProps> = ({
  monthlyData,
  categoryData,
  totalSpent,
  averageMonthly,
  className = ''
}) => {
  return (
    <Card className={`${className}`} padding="lg">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Spending Analytics</h3>
          <BarChart3 className="w-5 h-5 text-gray-400" />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-xl">
            <div className="text-2xl font-bold text-green-600">
              ₹{totalSpent.toLocaleString()}
            </div>
            <div className="text-sm text-green-700">Total Spent</div>
          </div>
          
          <div className="text-center p-4 bg-blue-50 rounded-xl">
            <div className="text-2xl font-bold text-blue-600">
              ₹{averageMonthly.toLocaleString()}
            </div>
            <div className="text-sm text-blue-700">Avg Monthly</div>
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Monthly Spending</h4>
            <BarChart data={monthlyData} height={120} />
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">By Category</h4>
            <PieChart data={categoryData} size={180} />
          </div>
        </div>
      </div>
    </Card>
  );
};






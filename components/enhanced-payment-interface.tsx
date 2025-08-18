'use client';

import React, { useState, useEffect } from 'react';
import { 
  CalendarDays, 
  CreditCard, 
  CheckCircle, 
  AlertCircle,
  Banknote,
  Sparkles,
  Clock
} from 'lucide-react';
import toast from 'react-hot-toast';
import DummyPaymentGateway from './dummy-payment-gateway';

// Simple UI components using TailwindCSS
const Card = ({ children, className = '', ...props }: any) => (
  <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`} {...props}>
    {children}
  </div>
);

const CardHeader = ({ children, className = '' }: any) => (
  <div className={`px-6 py-4 border-b border-gray-100 ${className}`}>
    {children}
  </div>
);

const CardTitle = ({ children, className = '' }: any) => (
  <h3 className={`text-lg font-semibold text-gray-900 ${className}`}>
    {children}
  </h3>
);

const CardDescription = ({ children, className = '' }: any) => (
  <div className={`text-sm text-gray-600 mt-1 ${className}`}>
    {children}
  </div>
);

const CardContent = ({ children, className = '' }: any) => (
  <div className={`px-6 py-4 ${className}`}>
    {children}
  </div>
);

const Button = ({ children, className = '', variant = 'primary' as 'primary' | 'secondary' | 'outline', size = 'md' as 'sm' | 'md' | 'lg', disabled = false, ...props }: any) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  const variants: Record<string, string> = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
    outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500'
  };
  const sizes: Record<string, string> = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };
  
  return (
    <button 
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

const Badge = ({ children, className = '', variant = 'default' as 'default' | 'secondary' | 'outline' }: any) => {
  const variants: Record<string, string> = {
    default: 'bg-blue-100 text-blue-800',
    secondary: 'bg-gray-100 text-gray-800',
    outline: 'border border-gray-300 text-gray-700'
  };
  
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};

interface PaymentOption {
  payment_type: 'term' | 'full_year';
  term: string;
  amount: number;
  description: string;
  period: string;
  covers_terms: string[];
  receipt_color: string;
  is_recommended?: boolean;
  savings?: number;
  discount_percent?: number;
  is_paid?: boolean;
  is_available?: boolean;
  paid_reason?: string | null;
}

interface PaymentData {
  student_id: string;
  academic_year: string;
  current_term: string;
  route: any;
  boarding_stop: string;
  fee_structure: any;
  paid_terms: string[];
  has_full_year_payment: boolean;
  available_options: PaymentOption[];
}

interface EnhancedPaymentInterfaceProps {
  studentId: string;
  onPaymentInitiated?: (option: PaymentOption) => void;
  onError?: (error: string) => void;
}

const EnhancedPaymentInterface: React.FC<EnhancedPaymentInterfaceProps> = ({
  studentId,
  onPaymentInitiated,
  onError
}) => {
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState<PaymentOption | null>(null);
  const [processing, setProcessing] = useState(false);
  const [showPaymentGateway, setShowPaymentGateway] = useState(false);
  const [currentPaymentId, setCurrentPaymentId] = useState<string | null>(null);

  useEffect(() => {
    fetchPaymentOptions();
  }, [studentId]);

  const fetchPaymentOptions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/semester-payments-v2?studentId=${studentId}&type=available`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch payment options');
      }
      
      const data = await response.json();
      setPaymentData(data);
      
      // Auto-select recommended option
      const recommended = data.available_options?.find((opt: PaymentOption) => opt.is_recommended);
      if (recommended) {
        setSelectedOption(recommended);
      }
      
    } catch (error: any) {
      console.error('Error fetching payment options:', error);
      onError?.('Failed to load payment options');
    } finally {
      setLoading(false);
    }
  };

  const initiatePayment = async () => {
    if (!selectedOption || !paymentData) return;

    try {
      setProcessing(true);
      
      const paymentRequest = {
        studentId: paymentData.student_id,
        paymentType: selectedOption.payment_type,
        termNumber: selectedOption.payment_type === 'term' ? selectedOption.term : undefined,
        routeId: paymentData.route?.id,
        stopName: paymentData.boarding_stop,
        paymentMethod: 'upi'
      };

      const response = await fetch('/api/semester-payments-v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(paymentRequest)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Payment initiation failed');
      }

      const result = await response.json();
      
      // Store payment ID and show payment gateway
      setCurrentPaymentId(result.payment_id);
      setShowPaymentGateway(true);
      
    } catch (error: any) {
      console.error('Error initiating payment:', error);
      onError?.(error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handlePaymentComplete = async (paymentResult: any) => {
    // Close payment gateway
    setShowPaymentGateway(false);
    setCurrentPaymentId(null);
    
    // Notify parent component
    if (selectedOption) {
      onPaymentInitiated?.(selectedOption);
    }
    
    // Refresh payment options to show updated status
    await fetchPaymentOptions();
    
    // Show success message
    toast.success(`Payment completed! Receipt: ${paymentResult.receiptNumber}`);
  };

  const handlePaymentGatewayClose = () => {
    setShowPaymentGateway(false);
    setCurrentPaymentId(null);
  };

  const getReceiptColorStyle = (color: string) => {
    const colorMap = {
      white: 'bg-gray-50 border-gray-200 text-gray-900',
      blue: 'bg-blue-50 border-blue-200 text-blue-900',
      yellow: 'bg-yellow-50 border-yellow-200 text-yellow-900',
      green: 'bg-green-50 border-green-200 text-green-900'
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.white;
  };

  const getReceiptBadgeColor = (color: string) => {
    const colorMap = {
      white: 'bg-gray-100 text-gray-800',
      blue: 'bg-blue-100 text-blue-800',
      yellow: 'bg-yellow-100 text-yellow-800',
      green: 'bg-green-100 text-green-800'
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.white;
  };

  if (loading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span>Loading payment options...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!paymentData || paymentData.available_options.length === 0) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-6">
          <div className="text-center">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              All Payments Complete
            </h3>
            <p className="text-gray-600">
              {paymentData?.has_full_year_payment 
                ? 'You have completed full year payment'
                : 'All required term payments have been completed'
              }
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-4 sm:space-y-6 overflow-x-hidden">
      {/* Header Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 space-y-1 sm:space-y-0">
            <div className="flex items-center space-x-2 min-w-0 flex-1">
              <CreditCard className="h-5 w-5 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-sm sm:text-base font-semibold text-gray-900">
                  <span className="block sm:inline">Transport Fee Payment</span>
                  <span className="block sm:inline sm:ml-1 text-gray-600">- Academic Year {paymentData.academic_year}</span>
                </div>
              </div>
            </div>
          </CardTitle>
          <CardDescription className="space-y-1">
            {paymentData.route && (
              <div className="text-sm text-gray-600 break-words">
                <span className="font-medium">Route:</span> {paymentData.route.route_number} - {paymentData.route.route_name}
              </div>
            )}
            <div className="text-sm text-gray-600 break-words">
              <span className="font-medium">Boarding Stop:</span> {paymentData.boarding_stop}
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <Badge variant="outline" className="flex items-center space-x-1 w-fit">
              <Clock className="h-3 w-3 flex-shrink-0" />
              <span className="hidden sm:inline">Current Term: {paymentData.current_term}</span>
              <span className="sm:hidden">Term: {paymentData.current_term}</span>
            </Badge>
            {paymentData.paid_terms.length > 0 && (
              <Badge variant="secondary" className="w-fit">
                <span className="hidden sm:inline">Paid Terms: {paymentData.paid_terms.join(', ')}</span>
                <span className="sm:hidden">Paid: {paymentData.paid_terms.join(', ')}</span>
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payment Options */}
      <div className="grid gap-3 sm:gap-4 lg:gap-6 grid-cols-1 lg:grid-cols-2">
        {paymentData.available_options.map((option, index) => (
          <Card 
            key={index}
            className={`transition-all duration-200 ${
              option.is_paid 
                ? 'opacity-75 cursor-not-allowed' 
                : option.is_available
                  ? `cursor-pointer ${
                      selectedOption?.term === option.term 
                        ? 'ring-2 ring-blue-500 border-blue-500' 
                        : 'hover:shadow-md'
                    }`
                  : 'opacity-50 cursor-not-allowed'
            } ${getReceiptColorStyle(option.receipt_color)}`}
            onClick={() => option.is_available && !option.is_paid ? setSelectedOption(option) : null}
          >
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                <CardTitle className="text-base sm:text-lg flex items-center space-x-2 min-w-0 flex-1">
                  {option.is_paid && (
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
                  )}
                  {option.payment_type === 'full_year' && !option.is_paid && (
                    <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 flex-shrink-0" />
                  )}
                  <span className="truncate">{option.description}</span>
                  {option.is_paid && (
                    <Badge className="ml-1 sm:ml-2 bg-green-100 text-green-800 flex-shrink-0">Paid</Badge>
                  )}
                  {option.is_recommended && !option.is_paid && (
                    <Badge variant="default" className="ml-1 sm:ml-2 flex-shrink-0">Recommended</Badge>
                  )}
                </CardTitle>
                <Badge className={`${getReceiptBadgeColor(option.receipt_color)} flex-shrink-0`}>
                  {option.receipt_color} receipt
                </Badge>
              </div>
              <CardDescription className="flex items-center space-x-1">
                <CalendarDays className="h-4 w-4" />
                <span>{option.period}</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">₹{option.amount.toLocaleString()}</span>
                  {option.is_paid ? (
                    <div className="text-right">
                      <div className="text-sm text-green-600 font-medium flex items-center space-x-1">
                        <CheckCircle className="h-4 w-4" />
                        <span>Payment Complete</span>
                      </div>
                      <div className="text-xs text-green-500">
                        {option.paid_reason}
                      </div>
                    </div>
                  ) : option.savings && option.savings > 0 ? (
                    <div className="text-right">
                      <div className="text-sm text-green-600 font-medium">
                        Save ₹{option.savings.toLocaleString()}
                      </div>
                      <div className="text-xs text-green-500">
                        ({option.discount_percent}% discount)
                      </div>
                    </div>
                  ) : null}
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm text-gray-600">
                    <strong>Covers:</strong> {option.covers_terms.map(term => `Term ${term}`).join(', ')}
                  </div>
                  
                  {option.is_paid && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-800">
                          Payment Completed
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-green-700">
                        {option.paid_reason}
                      </div>
                    </div>
                  )}
                  
                  {option.payment_type === 'full_year' && !option.is_paid && option.is_available && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-800">
                          Full Year Benefits
                        </span>
                      </div>
                      <ul className="mt-2 text-xs text-green-700 space-y-1">
                        <li>• No need to pay for individual terms</li>
                        <li>• Guaranteed seat booking for entire year</li>
                        <li>• Single green receipt for easy tracking</li>
                        <li>• Automatic coverage for all 3 terms</li>
                      </ul>
                    </div>
                  )}

                  {!option.is_available && !option.is_paid && option.paid_reason && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm font-medium text-yellow-800">
                          Not Available
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-yellow-700">
                        {option.paid_reason}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Fee Structure Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Banknote className="h-5 w-5" />
            <span>Fee Structure Overview</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">Term 1</div>
              <div className="text-lg font-semibold">₹{paymentData.fee_structure.term_1_fee}</div>
              <Badge className="mt-1 bg-gray-100 text-gray-800">White Receipt</Badge>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-sm text-blue-600">Term 2</div>
              <div className="text-lg font-semibold">₹{paymentData.fee_structure.term_2_fee}</div>
              <Badge className="mt-1 bg-blue-100 text-blue-800">Blue Receipt</Badge>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-sm text-yellow-600">Term 3</div>
              <div className="text-lg font-semibold">₹{paymentData.fee_structure.term_3_fee}</div>
              <Badge className="mt-1 bg-yellow-100 text-yellow-800">Yellow Receipt</Badge>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg border-2 border-green-200">
              <div className="text-sm text-green-600">Full Year</div>
              <div className="text-lg font-semibold">₹{paymentData.fee_structure.full_year_fee}</div>
              <Badge className="mt-1 bg-green-100 text-green-800">Green Receipt</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Action */}
      {selectedOption && selectedOption.is_available && !selectedOption.is_paid && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Ready to Pay</h3>
                <p className="text-gray-600">
                  {selectedOption.description} - ₹{selectedOption.amount.toLocaleString()}
                </p>
              </div>
              <Button 
                onClick={initiatePayment}
                disabled={processing}
                size="lg"
                className="min-w-[120px]"
              >
                {processing ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Processing...</span>
                  </div>
                ) : (
                  <>Pay Now</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selected Payment Info for Paid Options */}
      {selectedOption && selectedOption.is_paid && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>Payment Already Completed</span>
                </h3>
                <p className="text-gray-600">
                  {selectedOption.description} - ₹{selectedOption.amount.toLocaleString()}
                </p>
                <p className="text-sm text-green-600 mt-1">
                  {selectedOption.paid_reason}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dummy Payment Gateway Modal */}
      <DummyPaymentGateway
        isOpen={showPaymentGateway}
        onClose={handlePaymentGatewayClose}
        paymentOption={selectedOption}
        paymentId={currentPaymentId}
        onPaymentComplete={handlePaymentComplete}
      />
    </div>
  );
};

export default EnhancedPaymentInterface; 
'use client';

import React from 'react';
import { 
  Download,
  Receipt,
  Calendar,
  MapPin,
  Bus,
  CheckCircle,
  FileText,
  Printer
} from 'lucide-react';

interface PaymentReceipt {
  id: string;
  payment_type: 'term' | 'full_year';
  semester: string;
  covers_terms: string[];
  amount_paid: number;
  payment_date: string;
  receipt_number: string;
  receipt_color: 'white' | 'blue' | 'yellow' | 'green';
  valid_from: string;
  valid_until: string;
  academic_year: string;
  route?: {
    route_number: string;
    route_name: string;
  };
  boarding_stop: string;
  payment_method: string;
  payment_status: string;
}

interface ColorCodedReceiptProps {
  receipt: PaymentReceipt;
  size?: 'small' | 'medium' | 'large';
  showActions?: boolean;
  onDownload?: (receipt: PaymentReceipt) => void;
  onPrint?: (receipt: PaymentReceipt) => void;
}

const ColorCodedReceipt: React.FC<ColorCodedReceiptProps> = ({
  receipt,
  size = 'medium',
  showActions = true,
  onDownload,
  onPrint
}) => {
  const getColorScheme = (color: string) => {
    const schemes = {
      white: {
        bg: 'bg-gray-50',
        border: 'border-gray-200',
        header: 'bg-gray-100',
        text: 'text-gray-900',
        accent: 'text-gray-600',
        badge: 'bg-gray-200 text-gray-800'
      },
      blue: {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        header: 'bg-blue-100',
        text: 'text-blue-900',
        accent: 'text-blue-600',
        badge: 'bg-blue-200 text-blue-800'
      },
      yellow: {
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        header: 'bg-yellow-100',
        text: 'text-yellow-900',
        accent: 'text-yellow-600',
        badge: 'bg-yellow-200 text-yellow-800'
      },
      green: {
        bg: 'bg-green-50',
        border: 'border-green-200',
        header: 'bg-green-100',
        text: 'text-green-900',
        accent: 'text-green-600',
        badge: 'bg-green-200 text-green-800'
      }
    };
    return schemes[color as keyof typeof schemes] || schemes.white;
  };

  const getSizeClasses = () => {
    const sizes = {
      small: 'p-4 text-sm',
      medium: 'p-6 text-base',
      large: 'p-8 text-lg'
    };
    return sizes[size];
  };

  const getTermDescription = (paymentType: string, covers: string[]) => {
    if (paymentType === 'full_year') {
      return 'Full Academic Year (All Terms)';
    }
    return covers.map(term => `Term ${term}`).join(', ');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const colorScheme = getColorScheme(receipt.receipt_color);

  return (
    <div className={`relative rounded-lg border-2 shadow-sm ${colorScheme.bg} ${colorScheme.border} ${getSizeClasses()}`}>
      {/* Receipt Header */}
      <div className={`${colorScheme.header} -m-6 mb-4 p-4 rounded-t-lg border-b ${colorScheme.border}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Receipt className={`h-6 w-6 ${colorScheme.accent}`} />
            <div>
              <h3 className={`font-bold ${colorScheme.text}`}>
                Transport Fee Receipt
              </h3>
              <p className={`text-sm ${colorScheme.accent}`}>
                Receipt #{receipt.receipt_number}
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${colorScheme.badge}`}>
              {receipt.receipt_color.toUpperCase()} RECEIPT
            </span>
            {receipt.payment_status === 'confirmed' && (
              <div className="flex items-center mt-1 text-green-600">
                <CheckCircle className="h-4 w-4 mr-1" />
                <span className="text-xs">Confirmed</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Receipt Body */}
      <div className="space-y-6">
        {/* Payment Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className={`font-semibold mb-2 ${colorScheme.text}`}>Payment Information</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className={colorScheme.accent}>Payment Type:</span>
                <span className={`font-medium ${colorScheme.text}`}>
                  {receipt.payment_type === 'full_year' ? 'Full Year' : 'Term Payment'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className={colorScheme.accent}>Coverage:</span>
                <span className={`font-medium ${colorScheme.text}`}>
                  {getTermDescription(receipt.payment_type, receipt.covers_terms)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className={colorScheme.accent}>Amount:</span>
                <span className={`font-bold text-lg ${colorScheme.text}`}>
                  ₹{receipt.amount_paid.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className={colorScheme.accent}>Method:</span>
                <span className={`font-medium ${colorScheme.text}`}>
                  {receipt.payment_method.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h4 className={`font-semibold mb-2 ${colorScheme.text}`}>Transport Details</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <Bus className={`h-4 w-4 ${colorScheme.accent}`} />
                <span className={colorScheme.accent}>Route:</span>
                <span className={`font-medium ${colorScheme.text}`}>
                  {receipt.route?.route_number || 'N/A'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className={`h-4 w-4 ${colorScheme.accent}`} />
                <span className={colorScheme.accent}>Boarding Stop:</span>
                <span className={`font-medium ${colorScheme.text}`}>
                  {receipt.boarding_stop}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className={`h-4 w-4 ${colorScheme.accent}`} />
                <span className={colorScheme.accent}>Academic Year:</span>
                <span className={`font-medium ${colorScheme.text}`}>
                  {receipt.academic_year}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Validity Period */}
        <div className={`bg-white/50 rounded-lg p-4 border ${colorScheme.border}`}>
          <h4 className={`font-semibold mb-2 ${colorScheme.text}`}>Validity Period</h4>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <span className={colorScheme.accent}>Valid From:</span>
              <span className={`font-medium ${colorScheme.text}`}>
                {formatDate(receipt.valid_from)}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className={colorScheme.accent}>Valid Until:</span>
              <span className={`font-medium ${colorScheme.text}`}>
                {formatDate(receipt.valid_until)}
              </span>
            </div>
          </div>
        </div>

        {/* Payment Date */}
        <div className="text-center pt-4 border-t border-gray-200">
          <p className={`text-sm ${colorScheme.accent}`}>
            Payment Date: <span className={`font-medium ${colorScheme.text}`}>
              {formatDate(receipt.payment_date)}
            </span>
          </p>
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex justify-center space-x-4 pt-4 border-t border-gray-200">
            <button
              onClick={() => onDownload?.(receipt)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium bg-white border ${colorScheme.border} ${colorScheme.text} hover:bg-gray-50 transition-colors`}
            >
              <Download className="h-4 w-4" />
              <span>Download</span>
            </button>
            <button
              onClick={() => onPrint?.(receipt)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium bg-white border ${colorScheme.border} ${colorScheme.text} hover:bg-gray-50 transition-colors`}
            >
              <Printer className="h-4 w-4" />
              <span>Print</span>
            </button>
          </div>
        )}
      </div>

      {/* Color Indicator */}
      <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full ${colorScheme.bg} border-2 ${colorScheme.border}`} />
    </div>
  );
};

export default ColorCodedReceipt; 
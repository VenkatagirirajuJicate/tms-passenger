'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Receipt,
  Download,
  Eye,
  CheckCircle,
  Calendar,
  MapPin,
  FileText,
  CreditCard,
  Building,
  User,
  Phone,
  Mail,
  Hash,
  Clock,
  Shield,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';

interface PaymentRecord {
  id: string;
  amount_paid: number;
  payment_status: string;
  payment_type: string;
  covers_terms: string[];
  transaction_id: string;
  receipt_number: string;
  payment_date: string;
  valid_from: string;
  valid_until: string;
  academic_year: string;
  semester: string;
  stop_name: string;
  payment_method?: string;
}

interface StudentInfo {
  id: string;
  name: string;
  route?: {
    route_number: string;
    route_name: string;
    start_location: string;
    end_location: string;
  };
}

interface InvoiceReceiptProps {
  payment: PaymentRecord;
  student?: StudentInfo;
  isOpen: boolean;
  onClose: () => void;
}

const InvoiceReceipt: React.FC<InvoiceReceiptProps> = ({
  payment,
  student,
  isOpen,
  onClose
}) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const getReceiptColorClass = (paymentType: string, semester: string) => {
    if (paymentType === 'full_year') {
      return {
        bg: 'bg-green-50',
        border: 'border-green-300',
        text: 'text-green-800',
        accent: 'bg-green-600'
      };
    }
    
    switch (semester) {
      case '1': return {
        bg: 'bg-gray-50',
        border: 'border-gray-300', 
        text: 'text-gray-800',
        accent: 'bg-gray-600'
      };
      case '2': return {
        bg: 'bg-blue-50',
        border: 'border-blue-300',
        text: 'text-blue-800',
        accent: 'bg-blue-600'
      };
      case '3': return {
        bg: 'bg-yellow-50',
        border: 'border-yellow-300',
        text: 'text-yellow-800',
        accent: 'bg-yellow-600'
      };
      default: return {
        bg: 'bg-gray-50',
        border: 'border-gray-300',
        text: 'text-gray-800',
        accent: 'bg-gray-600'
      };
    }
  };

  const getPaymentTypeLabel = (paymentType: string, coversTerms: string[]) => {
    if (paymentType === 'full_year') {
      return 'Full Academic Year Payment';
    }
    return `Term ${coversTerms.join(', ')} Payment`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const generateReceiptHTML = () => {
    const colors = getReceiptColorClass(payment.payment_type, payment.semester);
    
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Transport Payment Receipt - ${payment.receipt_number}</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
            color: #333;
        }
        .receipt-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .receipt-header {
            background: linear-gradient(135deg, #2563eb, #1d4ed8);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .receipt-title {
            font-size: 28px;
            font-weight: bold;
            margin: 0 0 10px 0;
        }
        .receipt-subtitle {
            font-size: 16px;
            opacity: 0.9;
            margin: 0;
        }
        .receipt-body {
            padding: 30px;
        }
        .receipt-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 30px;
        }
        .info-section {
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #2563eb;
        }
        .info-title {
            font-weight: bold;
            color: #1e293b;
            margin-bottom: 10px;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .info-item {
            margin: 8px 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .info-label {
            font-weight: 500;
            color: #64748b;
        }
        .info-value {
            font-weight: 600;
            color: #1e293b;
        }
        .amount-section {
            background: ${colors.bg};
            border: 2px solid ${colors.border.replace('border-', '')};
            padding: 25px;
            border-radius: 12px;
            text-align: center;
            margin: 30px 0;
        }
        .amount-label {
            font-size: 16px;
            font-weight: 500;
            color: #64748b;
            margin-bottom: 10px;
        }
        .amount-value {
            font-size: 36px;
            font-weight: bold;
            color: #1e293b;
            margin: 10px 0;
        }
        .payment-status {
            display: inline-block;
            background: #10b981;
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
        }
        .validity-section {
            background: #f0f9ff;
            border: 1px solid #e0f2fe;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .footer-section {
            background: #f8fafc;
            padding: 20px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
            margin-top: 30px;
        }
        .footer-text {
            font-size: 12px;
            color: #64748b;
            margin: 5px 0;
        }
        .receipt-stamp {
            position: relative;
            display: inline-block;
            background: #10b981;
            color: white;
            padding: 10px 20px;
            border-radius: 50px;
            font-weight: bold;
            margin: 20px 0;
            transform: rotate(-5deg);
        }
        @media print {
            body { margin: 0; padding: 0; background: white; }
            .receipt-container { box-shadow: none; }
        }
    </style>
</head>
<body>
    <div class="receipt-container">
        <div class="receipt-header">
            <h1 class="receipt-title">TRANSPORT PAYMENT RECEIPT</h1>
            <p class="receipt-subtitle">3-Term Academic Year Payment System</p>
        </div>
        
        <div class="receipt-body">
            <div class="receipt-info">
                <div class="info-section">
                    <div class="info-title">Student Information</div>
                    <div class="info-item">
                        <span class="info-label">Student ID:</span>
                        <span class="info-value">${student?.id || 'N/A'}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Student Name:</span>
                        <span class="info-value">${student?.name || 'N/A'}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Boarding Point:</span>
                        <span class="info-value">${payment.stop_name}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Route:</span>
                        <span class="info-value">${student?.route?.route_number || 'N/A'} - ${student?.route?.route_name || 'N/A'}</span>
                    </div>
                </div>
                
                <div class="info-section">
                    <div class="info-title">Payment Details</div>
                    <div class="info-item">
                        <span class="info-label">Receipt Number:</span>
                        <span class="info-value">${payment.receipt_number}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Transaction ID:</span>
                        <span class="info-value">${payment.transaction_id}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Payment Date:</span>
                        <span class="info-value">${formatDate(payment.payment_date)}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Payment Time:</span>
                        <span class="info-value">${formatTime(payment.payment_date)}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Payment Method:</span>
                        <span class="info-value">${payment.payment_method?.toUpperCase() || 'UPI'}</span>
                    </div>
                </div>
            </div>
            
            <div class="amount-section">
                <div class="amount-label">Amount Paid</div>
                <div class="amount-value">₹${parseFloat(payment.amount_paid).toLocaleString('en-IN')}</div>
                <div class="payment-status">PAYMENT CONFIRMED</div>
            </div>
            
            <div class="validity-section">
                <div class="info-title" style="margin-bottom: 15px;">Service Details</div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    <div>
                        <div class="info-item">
                            <span class="info-label">Academic Year:</span>
                            <span class="info-value">${payment.academic_year}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Payment Type:</span>
                            <span class="info-value">${getPaymentTypeLabel(payment.payment_type, payment.covers_terms)}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Terms Covered:</span>
                            <span class="info-value">${payment.covers_terms.join(', ')}</span>
                        </div>
                    </div>
                    <div>
                        <div class="info-item">
                            <span class="info-label">Valid From:</span>
                            <span class="info-value">${formatDate(payment.valid_from)}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Valid Until:</span>
                            <span class="info-value">${formatDate(payment.valid_until)}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Receipt Color:</span>
                            <span class="info-value">${colors.text.replace('text-', '').replace('-800', '').toUpperCase()}</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div style="text-align: center;">
                <div class="receipt-stamp">VERIFIED & PROCESSED</div>
            </div>
        </div>
        
        <div class="footer-section">
            <div class="footer-text"><strong>Transport Management System</strong></div>
            <div class="footer-text">This is a computer-generated receipt and does not require a signature.</div>
            <div class="footer-text">For any queries, please contact the transport office.</div>
            <div class="footer-text">Generated on: ${new Date().toLocaleString('en-IN')}</div>
        </div>
    </div>
</body>
</html>
    `;
  };

  const downloadReceipt = async () => {
    setIsDownloading(true);
    
    try {
      const htmlContent = generateReceiptHTML();
      
      // Create a blob with the HTML content
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      // Create download link
      const a = document.createElement('a');
      a.href = url;
      a.download = `Transport_Receipt_${payment.receipt_number}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Receipt downloaded successfully!');
    } catch (error) {
      console.error('Error downloading receipt:', error);
      toast.error('Failed to download receipt');
    } finally {
      setIsDownloading(false);
    }
  };

  const printReceipt = () => {
    const htmlContent = generateReceiptHTML();
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  if (!isOpen) return null;

  const colors = getReceiptColorClass(payment.payment_type, payment.semester);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Transport Payment Receipt</h2>
              <p className="text-blue-100 text-sm mt-1">Official Payment Confirmation</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Receipt Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Receipt Header Info */}
          <div className={`p-6 rounded-lg border-2 ${colors.bg} ${colors.border} ${colors.text} mb-6`}>
            <div className="flex items-center justify-center mb-4">
              <div className={`w-16 h-16 ${colors.accent} rounded-full flex items-center justify-center`}>
                <Receipt className="w-8 h-8 text-white" />
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold">Receipt #{payment.receipt_number}</h3>
              <p className="text-sm opacity-75 mt-1">Transaction ID: {payment.transaction_id}</p>
            </div>
          </div>

          {/* Payment Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Student Information */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h4 className="font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>Student Information</span>
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Student ID:</span>
                  <span className="font-medium">{student?.id || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Name:</span>
                  <span className="font-medium">{student?.name || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Boarding Point:</span>
                  <span className="font-medium">{payment.stop_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Route:</span>
                  <span className="font-medium">{student?.route?.route_number || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Payment Details */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h4 className="font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <CreditCard className="w-5 h-5" />
                <span>Payment Details</span>
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Date:</span>
                  <span className="font-medium">{formatDate(payment.payment_date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Time:</span>
                  <span className="font-medium">{formatTime(payment.payment_date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Method:</span>
                  <span className="font-medium">{payment.payment_method?.toUpperCase() || 'UPI'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-medium text-green-600 flex items-center space-x-1">
                    <CheckCircle className="w-4 h-4" />
                    <span>Confirmed</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Amount Section */}
          <div className={`p-6 rounded-lg border-2 ${colors.bg} ${colors.border} text-center mb-6`}>
            <h4 className="text-lg font-semibold mb-2">Amount Paid</h4>
            <div className="text-4xl font-bold mb-2">₹{parseFloat(payment.amount_paid).toLocaleString('en-IN')}</div>
            <div className="text-sm opacity-75">
              {getPaymentTypeLabel(payment.payment_type, payment.covers_terms)}
            </div>
          </div>

          {/* Service Details */}
          <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg mb-6">
            <h4 className="font-bold text-blue-900 mb-4 flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>Service Validity</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-blue-600 font-medium">Academic Year:</span>
                <div className="font-semibold">{payment.academic_year}</div>
              </div>
              <div>
                <span className="text-blue-600 font-medium">Terms Covered:</span>
                <div className="font-semibold">{payment.covers_terms.join(', ')}</div>
              </div>
              <div>
                <span className="text-blue-600 font-medium">Valid Period:</span>
                <div className="font-semibold">
                  {formatDate(payment.valid_from)} - {formatDate(payment.valid_until)}
                </div>
              </div>
            </div>
          </div>

          {/* Security Info */}
          <div className="bg-green-50 border border-green-200 p-4 rounded-lg text-center">
            <div className="flex items-center justify-center space-x-2 text-green-700">
              <Shield className="w-5 h-5" />
              <span className="font-medium">Verified & Processed</span>
            </div>
            <div className="text-sm text-green-600 mt-1">
              This is a computer-generated receipt and does not require a signature.
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="border-t bg-gray-50 p-6">
          <div className="flex space-x-3">
            <button
              onClick={downloadReceipt}
              disabled={isDownloading}
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
            >
              <Download className="w-5 h-5" />
              <span>{isDownloading ? 'Downloading...' : 'Download Receipt'}</span>
            </button>
            <button
              onClick={printReceipt}
              className="flex-1 bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2"
            >
              <FileText className="w-5 h-5" />
              <span>Print Receipt</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default InvoiceReceipt; 
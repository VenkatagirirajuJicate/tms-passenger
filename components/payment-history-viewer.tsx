'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Receipt,
  Download,
  Eye,
  CheckCircle,
  Clock,
  XCircle,
  Calendar,
  CreditCard,
  MapPin,
  FileText,
  Star,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import InvoiceReceipt from './invoice-receipt';

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

interface PaymentHistoryViewerProps {
  studentId: string;
}

const PaymentHistoryViewer: React.FC<PaymentHistoryViewerProps> = ({ studentId }) => {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);

  useEffect(() => {
    fetchPaymentHistory();
    fetchStudentInfo();
  }, [studentId]);

  const fetchPaymentHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/semester-payments-v2?studentId=${studentId}&type=history`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch payment history');
      }
      
      const data = await response.json();
      setPayments(data || []);
    } catch (error) {
      console.error('Error fetching payment history:', error);
      toast.error('Failed to load payment history');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentInfo = async () => {
    try {
      // Get student info from session or API
      const { sessionManager } = await import('@/lib/session');
      const currentStudent = sessionManager.getCurrentStudent();
      
      if (currentStudent) {
        setStudentInfo({
          id: currentStudent.student_id,
          name: currentStudent.student_name,
          route: {
            route_number: 'Route Number',
            route_name: 'Route Name',
            start_location: 'Start Location',
            end_location: 'End Location'
          }
        });
      }
    } catch (error) {
      console.error('Error fetching student info:', error);
    }
  };

  const getReceiptColorClass = (paymentType: string, semester: string) => {
    if (paymentType === 'full_year') {
      return 'bg-green-50 border-green-300 text-green-800';
    }
    
    switch (semester) {
      case '1': return 'bg-gray-50 border-gray-300 text-gray-800';
      case '2': return 'bg-blue-50 border-blue-300 text-blue-800';
      case '3': return 'bg-yellow-50 border-yellow-300 text-yellow-800';
      default: return 'bg-gray-50 border-gray-300 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Paid';
      case 'pending': return 'Pending';
      case 'failed': return 'Failed';
      default: return 'Unknown';
    }
  };

  const getPaymentTypeLabel = (paymentType: string, coversTerms: string[]) => {
    if (paymentType === 'full_year') {
      return 'Full Academic Year';
    }
    return `Term ${coversTerms.join(', ')}`;
  };



  const showReceiptDetails = (payment: PaymentRecord) => {
    setSelectedPayment(payment);
    setShowReceiptModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Payment History</h2>
          <p className="text-gray-600">Your transport fee payment records</p>
        </div>
        <button
          onClick={fetchPaymentHistory}
          className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Payment Records */}
      {payments.length === 0 ? (
        <div className="text-center py-12">
          <Receipt className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Payment History</h3>
          <p className="text-gray-600">You haven't made any payments yet.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {payments.map((payment) => (
            <motion.div
              key={payment.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-6 rounded-lg border-2 ${getReceiptColorClass(payment.payment_type, payment.semester)}`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(payment.payment_status)}
                  <div>
                    <h3 className="font-semibold">
                      {getPaymentTypeLabel(payment.payment_type, payment.covers_terms)}
                    </h3>
                    <p className="text-sm opacity-75">
                      {getStatusText(payment.payment_status)} • {new Date(payment.payment_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">₹{payment.amount_paid}</div>
                  <div className="text-sm opacity-75">{payment.academic_year}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 opacity-60" />
                  <span className="text-sm">{payment.stop_name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 opacity-60" />
                  <span className="text-sm">
                    {new Date(payment.valid_from).toLocaleDateString()} - {new Date(payment.valid_until).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 opacity-60" />
                  <span className="text-sm font-mono">{payment.receipt_number}</span>
                </div>
              </div>

              {payment.payment_status === 'confirmed' && (
                <div className="flex space-x-3 pt-4 border-t border-current/20">
                  <button
                    onClick={() => showReceiptDetails(payment)}
                    className="flex-1 bg-current/10 hover:bg-current/20 transition-colors px-4 py-2 rounded-lg flex items-center justify-center space-x-2"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View Receipt</span>
                  </button>
                  <button
                    onClick={() => showReceiptDetails(payment)}
                    className="flex-1 bg-current/10 hover:bg-current/20 transition-colors px-4 py-2 rounded-lg flex items-center justify-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download</span>
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

            {/* Professional Invoice Receipt Modal */}
      {selectedPayment && (
        <InvoiceReceipt
          payment={selectedPayment}
          student={studentInfo || undefined}
          isOpen={showReceiptModal}
          onClose={() => setShowReceiptModal(false)}
        />
      )}
    </div>
  );
};

export default PaymentHistoryViewer; 
import React, { useState, useEffect } from 'react';
import { 
  DollarSign, Download, Filter, CheckCircle, XCircle, Clock, Search, 
  Plus, Eye, RefreshCw, Calendar, TrendingUp, AlertCircle, FileText,
  CreditCard, User, Phone
} from 'lucide-react';
import { paymentService } from '../services/payment.service';

interface Payment {
  id: string;
  patient_name: string;
  patient_phone: string;
  expert_name?: string;
  amount: number;
  status: string;
  created_at: string;
  razorpay_payment_id?: string;
  razorpay_order_id?: string;
  appointment_time?: string;
  currency: string;
}

interface PaymentStats {
  total_payments: number;
  completed_payments: number;
  pending_payments: number;
  failed_payments: number;
  total_revenue: number;
  pending_amount: number;
}

const Payments: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0 });

  useEffect(() => {
    loadPayments();
    loadStats();
  }, [filter, pagination.currentPage]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const response = await paymentService.getAll(pagination.currentPage, 20, filter);
      setPayments(response.data.payments || []);
      setPagination(response.data.pagination || pagination);
    } catch (error) {
      console.error('Failed to load payments:', error);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await paymentService.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleViewDetails = (payment: Payment) => {
    setSelectedPayment(payment);
    setShowModal(true);
  };

  const handleUpdateStatus = async (paymentId: string, newStatus: string) => {
    try {
      await paymentService.updateStatus(paymentId, newStatus);
      loadPayments();
      loadStats();
      setShowModal(false);
      alert('Payment status updated successfully!');
    } catch (error) {
      alert('Failed to update payment status');
    }
  };

  const exportToCSV = () => {
    const csv = [
      ['Patient Name', 'Phone', 'Amount', 'Status', 'Transaction ID', 'Date'],
      ...filteredPayments.map(p => [
        p.patient_name || 'N/A',
        p.patient_phone,
        p.amount,
        p.status,
        p.razorpay_payment_id || 'N/A',
        new Date(p.created_at).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getStatusColor = (status: string) => {
    const colors: any = {
      completed: 'bg-green-500/20 text-green-400 border-green-500/30',
      pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      failed: 'bg-red-500/20 text-red-400 border-red-500/30',
      refunded: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    };
    return colors[status] || colors.pending;
  };

  const getStatusIcon = (status: string) => {
    if (status === 'completed') return <CheckCircle className="w-4 h-4" />;
    if (status === 'failed') return <XCircle className="w-4 h-4" />;
    if (status === 'refunded') return <RefreshCw className="w-4 h-4" />;
    return <Clock className="w-4 h-4" />;
  };

  const filteredPayments = payments.filter(payment =>
    payment.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.patient_phone?.includes(searchTerm) ||
    payment.razorpay_payment_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Payment Management</h1>
        <p className="text-gray-400">Manage transactions, track revenue and process payments</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-[#0d1b2e] border border-gray-800 rounded-xl p-6 hover:border-cyan-500/30 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-500/10 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-400" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">
              ₹{stats.total_revenue?.toLocaleString() || 0}
            </h3>
            <p className="text-sm text-gray-400">Total Revenue</p>
            <p className="text-xs text-green-400 mt-2">{stats.completed_payments} completed</p>
          </div>

          <div className="bg-[#0d1b2e] border border-gray-800 rounded-xl p-6 hover:border-green-500/30 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-500/10 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <span className="text-sm text-green-400">
                {stats.total_payments > 0 ? Math.round((stats.completed_payments / stats.total_payments) * 100) : 0}%
              </span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">{stats.completed_payments}</h3>
            <p className="text-sm text-gray-400">Successful Payments</p>
          </div>

          <div className="bg-[#0d1b2e] border border-gray-800 rounded-xl p-6 hover:border-yellow-500/30 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-yellow-500/10 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-400" />
              </div>
              <AlertCircle className="w-5 h-5 text-yellow-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">{stats.pending_payments}</h3>
            <p className="text-sm text-gray-400">Pending Payments</p>
            <p className="text-xs text-yellow-400 mt-2">₹{stats.pending_amount?.toLocaleString() || 0}</p>
          </div>

          <div className="bg-[#0d1b2e] border border-gray-800 rounded-xl p-6 hover:border-red-500/30 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-red-500/10 rounded-lg">
                <XCircle className="w-6 h-6 text-red-400" />
              </div>
              <span className="text-sm text-red-400">
                {stats.total_payments > 0 ? Math.round((stats.failed_payments / stats.total_payments) * 100) : 0}%
              </span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">{stats.failed_payments}</h3>
            <p className="text-sm text-gray-400">Failed Transactions</p>
          </div>
        </div>
      )}

      {/* Filters and Actions */}
      <div className="bg-[#0d1b2e] border border-gray-800 rounded-xl p-6">
        <div className="flex flex-col lg:flex-row justify-between items-center gap-4 mb-6">
          {/* Search */}
          <div className="relative w-full lg:w-96">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search by patient, phone, or transaction ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-800/50 border border-gray-700 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'all' 
                  ? 'bg-cyan-500 text-white' 
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              All ({stats?.total_payments || 0})
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'completed' 
                  ? 'bg-green-500 text-white' 
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              Completed ({stats?.completed_payments || 0})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'pending' 
                  ? 'bg-yellow-500 text-white' 
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              Pending ({stats?.pending_payments || 0})
            </button>
            <button
              onClick={() => setFilter('failed')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'failed' 
                  ? 'bg-red-500 text-white' 
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              Failed ({stats?.failed_payments || 0})
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={loadPayments}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Payments Table */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="text-center py-12">
            <DollarSign className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No payments found</p>
            <p className="text-gray-500 text-sm mt-2">
              {searchTerm ? 'Try adjusting your search' : 'Payments will appear here once created'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-800">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Patient</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Contact</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Amount</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Transaction</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((payment) => (
                    <tr key={payment.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="font-medium">{payment.patient_name || 'N/A'}</p>
                            {payment.expert_name && (
                              <p className="text-xs text-gray-400">Dr. {payment.expert_name}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2 text-gray-300">
                          <Phone className="w-4 h-4" />
                          {payment.patient_phone}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-green-400" />
                          <span className="font-semibold text-green-400">
                            ₹{payment.amount.toLocaleString()}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium w-fit border ${getStatusColor(payment.status)}`}>
                          {getStatusIcon(payment.status)}
                          {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm">
                          <p className="text-gray-300 font-mono">
                            {payment.razorpay_payment_id ? payment.razorpay_payment_id.substring(0, 20) + '...' : 'N/A'}
                          </p>
                          {payment.razorpay_order_id && (
                            <p className="text-xs text-gray-500 mt-1">
                              Order: {payment.razorpay_order_id.substring(0, 15)}...
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2 text-gray-300">
                          <Calendar className="w-4 h-4" />
                          <div className="text-sm">
                            <p>{new Date(payment.created_at).toLocaleDateString()}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(payment.created_at).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <button
                          onClick={() => handleViewDetails(payment)}
                          className="flex items-center gap-2 px-3 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-6">
              <p className="text-sm text-gray-400">
                Showing {filteredPayments.length} of {pagination.totalItems} payments
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPagination({ ...pagination, currentPage: pagination.currentPage - 1 })}
                  disabled={pagination.currentPage === 1}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  Previous
                </button>
                <span className="px-4 py-2 bg-gray-800 rounded-lg">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPagination({ ...pagination, currentPage: pagination.currentPage + 1 })}
                  disabled={pagination.currentPage === pagination.totalPages}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Payment Details Modal */}
      {showModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0d1b2e] border border-gray-800 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <FileText className="w-6 h-6 text-cyan-400" />
                Payment Details
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Status and Amount */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-800/30 rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-2">Status</p>
                  <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(selectedPayment.status)}`}>
                    {getStatusIcon(selectedPayment.status)}
                    {selectedPayment.status.charAt(0).toUpperCase() + selectedPayment.status.slice(1)}
                  </span>
                </div>
                <div className="bg-gray-800/30 rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-2">Amount</p>
                  <p className="text-2xl font-bold text-green-400">
                    ₹{selectedPayment.amount.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Patient Information */}
              <div className="bg-gray-800/30 rounded-lg p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <User className="w-5 h-5 text-cyan-400" />
                  Patient Information
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Name:</span>
                    <span className="font-medium">{selectedPayment.patient_name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Phone:</span>
                    <span className="font-medium">{selectedPayment.patient_phone}</span>
                  </div>
                  {selectedPayment.expert_name && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Doctor:</span>
                      <span className="font-medium">Dr. {selectedPayment.expert_name}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Transaction Details */}
              <div className="bg-gray-800/30 rounded-lg p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-cyan-400" />
                  Transaction Details
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Payment ID:</span>
                    <span className="font-mono text-sm">{selectedPayment.razorpay_payment_id || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Order ID:</span>
                    <span className="font-mono text-sm">{selectedPayment.razorpay_order_id || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Currency:</span>
                    <span className="font-medium">{selectedPayment.currency || 'INR'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Date:</span>
                    <span className="font-medium">
                      {new Date(selectedPayment.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              {selectedPayment.status === 'pending' && (
                <div className="flex gap-3 pt-4 border-t border-gray-800">
                  <button
                    onClick={() => handleUpdateStatus(selectedPayment.id, 'completed')}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-500 hover:bg-green-600 rounded-lg transition-colors"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Mark as Completed
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedPayment.id, 'failed')}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
                  >
                    <XCircle className="w-5 h-5" />
                    Mark as Failed
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;

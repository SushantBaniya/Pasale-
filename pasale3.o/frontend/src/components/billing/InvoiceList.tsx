import React, { useState, useMemo } from 'react';
import { FiDownload, FiUpload, FiPlus, FiSearch, FiFilter, FiMoreVertical, FiEye, FiTrash2 } from 'react-icons/fi';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { useDataStore, Transaction } from '../../store/dataStore';
import { useLanguageStore } from '../../store/languageStore';
import { formatCurrency } from '../../utils/nepaliDate';
import { KPICard } from '../dashboard/KPICard';

interface InvoiceListProps {
  onNewInvoice: () => void;
  onViewInvoice: (invoice: Transaction) => void;
  hideHeader?: boolean;
}

export const InvoiceList: React.FC<InvoiceListProps> = ({ onNewInvoice, onViewInvoice, hideHeader = false }) => {
  const { transactions, deleteTransaction } = useDataStore();
  const { language } = useLanguageStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'unpaid' | 'overdue'>('all');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Filter transactions to only show selling type (invoices)
  const invoices = transactions.filter((t) => t.type === 'selling');

  // Mock status - in real app, this would come from invoice data
  const getInvoiceStatus = (invoice: Transaction): 'Paid' | 'Unpaid' | 'Overdue' => {
    // Check for [PAID] marker in description
    if (invoice.description?.includes('[PAID]')) return 'Paid';

    const invoiceDate = new Date(invoice.date);
    const daysDiff = Math.floor((new Date().getTime() - invoiceDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff > 30) return 'Overdue';
    return 'Unpaid';
  };

  // Search and filter
  const filtered = useMemo(() => {
    return invoices.filter((invoice) => {
      const matchesSearch =
        invoice.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.partyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.id?.toLowerCase().includes(searchTerm.toLowerCase());

      if (filterStatus === 'all') return matchesSearch;
      return matchesSearch && getInvoiceStatus(invoice).toLowerCase() === filterStatus;
    });
  }, [invoices, searchTerm, filterStatus]);

  // Pagination
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedInvoices = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Calculate KPIs
  const inTransit = filtered.filter((i) => getInvoiceStatus(i) === 'Unpaid').length;
  const totalPaid = filtered.filter((i) => getInvoiceStatus(i) === 'Paid').reduce((sum, i) => sum + i.amount, 0);
  const totalUnpaid = filtered.filter((i) => getInvoiceStatus(i) === 'Unpaid').reduce((sum, i) => sum + i.amount, 0);
  const totalOverdue = filtered.filter((i) => getInvoiceStatus(i) === 'Overdue').reduce((sum, i) => sum + i.amount, 0);

  const handleExport = () => {
    const csvContent = [
      ['Invoice ID', 'Issue Date', 'Client Name', 'Status', 'Amount', 'Assigned Staff', 'Services'].join(','),
      ...paginatedInvoices.map((inv) =>
        [
          inv.id,
          new Date(inv.date).toLocaleDateString(),
          inv.partyName || 'N/A',
          getInvoiceStatus(inv),
          formatCurrency(inv.amount, language),
          'N/A',
          inv.description || 'N/A',
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoices-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        alert('Import functionality would process the CSV file here');
      }
    };
    input.click();
  };

  const handleDeleteInvoice = (id: string) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      deleteTransaction(id);
      setOpenMenuId(null);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'Paid':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'Unpaid':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'Overdue':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  return (
    <div className="space-y-6 pt-4">
      {/* Header */}
      {!hideHeader && (
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">Invoices</h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg mt-2">Manage all your invoices</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Button variant="outline" onClick={handleExport}>
              <FiDownload className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" onClick={handleImport}>
              <FiUpload className="w-4 h-4 mr-2" />
              Import
            </Button>
            <Button onClick={onNewInvoice} className="bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white">
              <FiPlus className="w-4 h-4 mr-2" />
              New Invoice
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <KPICard
          title="In Transit"
          value={formatCurrency(
            filtered.filter((i) => getInvoiceStatus(i) === 'Unpaid').reduce((sum, i) => sum + i.amount, 0),
            language
          )}
          borderColor="blue"
          onClick={() => setFilterStatus('unpaid')}
          icon="📋"
          subtitle="Last update: Jan 24"
        />
        <KPICard
          title="Total Paid"
          value={formatCurrency(totalPaid, language)}
          borderColor="green"
          onClick={() => setFilterStatus('paid')}
          icon="✓"
          subtitle="Last update: Jan 24"
        />
        <KPICard
          title="Total Unpaid"
          value={formatCurrency(totalUnpaid, language)}
          borderColor="amber"
          onClick={() => setFilterStatus('unpaid')}
          icon="⏱️"
          subtitle="Last update: Jan 24"
        />
        <KPICard
          title="Total Overdue"
          value={formatCurrency(totalOverdue, language)}
          borderColor="red"
          onClick={() => setFilterStatus('overdue')}
          icon="⚠️"
          subtitle="Last update: Jan 24"
        />
      </div>

      {/* Filters and Search */}
      <Card className="p-6 border-2 border-gray-200 dark:border-gray-700">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex-1 w-full relative">
            <FiSearch className="absolute left-4 top-4 text-gray-400" />
            <Input
              placeholder="Search by Invoice ID, Client Name, or Description..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-12 py-3"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {['All', 'Paid', 'Unpaid', 'Overdue'].map((status) => (
              <Button
                key={status}
                variant={
                  filterStatus === status.toLowerCase() || (status === 'All' && filterStatus === 'all')
                    ? 'primary'
                    : 'outline'
                }
                onClick={() => {
                  setFilterStatus(status.toLowerCase() as any);
                  setCurrentPage(1);
                }}
                className={status === 'All' && filterStatus === 'all' ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}
              >
                {status}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Invoices Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                <th className="px-6 py-3 text-left">
                  <input type="checkbox" className="rounded" />
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Invoice ID
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Issue Date
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Client Name
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Assigned Staff
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Services
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedInvoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    No invoices found
                  </td>
                </tr>
              ) : (
                paginatedInvoices.map((invoice) => (
                  <tr
                    key={invoice.id}
                    className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="px-6 py-3">
                      <input type="checkbox" className="rounded" />
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-900 dark:text-gray-100 font-medium">
                      {invoice.id}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {new Date(invoice.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-900 dark:text-gray-100">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {(invoice.partyName || 'N')[0]}
                        </div>
                        <span>{invoice.partyName || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(getInvoiceStatus(invoice))}`}>
                        {getInvoiceStatus(invoice)}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded-full" />
                        <span>Staff</span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {invoice.description}
                    </td>
                    <td className="px-6 py-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {formatCurrency(invoice.amount, language)}
                    </td>
                    <td className="px-6 py-3 text-sm">
                      <div className="relative">
                        <button
                          onClick={() => setOpenMenuId(openMenuId === invoice.id ? null : invoice.id)}
                          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                          <FiMoreVertical className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </button>
                        {openMenuId === invoice.id && (
                          <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-10 border border-gray-200 dark:border-gray-700">
                            <button
                              onClick={() => {
                                onViewInvoice(invoice);
                                setOpenMenuId(null);
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 rounded-t-lg"
                            >
                              <FiEye className="w-4 h-4" />
                              View
                            </button>
                            <button
                              onClick={() => handleDeleteInvoice(invoice.id)}
                              className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-sm text-red-600 dark:text-red-400 rounded-b-lg"
                            >
                              <FiTrash2 className="w-4 h-4" />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filtered.length)} of{' '}
              {filtered.length} entries
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                ←
              </Button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? 'primary' : 'outline'}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              {totalPages > 5 && currentPage < totalPages - 2 && (
                <>
                  <span className="px-2">...</span>
                  <Button variant="outline" onClick={() => setCurrentPage(totalPages)}>
                    {totalPages}
                  </Button>
                </>
              )}
              <Button
                variant="outline"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                →
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

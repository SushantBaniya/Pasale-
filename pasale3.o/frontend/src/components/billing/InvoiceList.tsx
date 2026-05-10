import React, { useState, useMemo } from 'react';
import { FiDownload, FiUpload, FiPlus, FiSearch, FiFilter, FiMoreVertical, FiEye, FiTrash2, FiFileText, FiCheck, FiClock, FiAlertTriangle, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
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

  const invoices = transactions.filter((t) => t.type === 'selling');

  const getInvoiceStatus = (invoice: Transaction): 'Paid' | 'Unpaid' | 'Overdue' => {
    if (invoice.description?.includes('[PAID]')) return 'Paid';
    const daysDiff = Math.floor((new Date().getTime() - new Date(invoice.date).getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff > 30) return 'Overdue';
    return 'Unpaid';
  };

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

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedInvoices = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const totalPaid    = filtered.filter((i) => getInvoiceStatus(i) === 'Paid').reduce((sum, i) => sum + i.amount, 0);
  const totalUnpaid  = filtered.filter((i) => getInvoiceStatus(i) === 'Unpaid').reduce((sum, i) => sum + i.amount, 0);
  const totalOverdue = filtered.filter((i) => getInvoiceStatus(i) === 'Overdue').reduce((sum, i) => sum + i.amount, 0);

  const handleExport = () => {
    const csvContent = [
      ['Invoice ID', 'Issue Date', 'Client Name', 'Status', 'Amount', 'Assigned Staff', 'Services'].join(','),
      ...paginatedInvoices.map((inv) =>
        [inv.id, new Date(inv.date).toLocaleDateString(), inv.partyName || 'N/A', getInvoiceStatus(inv), formatCurrency(inv.amount, language), 'N/A', inv.description || 'N/A'].join(',')
      ),
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url  = window.URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `invoices-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleImport = () => {
    const input    = document.createElement('input');
    input.type     = 'file';
    input.accept   = '.csv';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) alert('Import functionality would process the CSV file here');
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
      case 'Paid':    return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'Unpaid':  return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'Overdue': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  return (
    <div className="space-y-6 pt-4">

      {/* ── Header ── */}
      {!hideHeader && (
        <div className="flex justify-between items-start">
          <div>
            {/* font-medium instead of font-bold; text-2xl instead of text-4xl */}
            <h1 className="text-2xl font-medium text-gray-900 dark:text-gray-100">Invoices</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage all your invoices</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={handleExport}>
              <FiDownload className="w-4 h-4 mr-2" /> Export
            </Button>
            <Button variant="outline" onClick={handleImport}>
              <FiUpload className="w-4 h-4 mr-2" /> Import
            </Button>
            <Button onClick={onNewInvoice} className="bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white">
              <FiPlus className="w-4 h-4 mr-2" /> New Invoice
            </Button>
          </div>
        </div>
      )}

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="In Transit"
          value={formatCurrency(totalUnpaid, language)}
          borderColor="blue"
          onClick={() => setFilterStatus('unpaid')}
          icon={<FiFileText className="w-5 h-5" />}
          subtitle="Last update: Jan 24"
        />
        <KPICard
          title="Total Paid"
          value={formatCurrency(totalPaid, language)}
          borderColor="green"
          onClick={() => setFilterStatus('paid')}
          icon={<FiCheck className="w-5 h-5" />}
          subtitle="Last update: Jan 24"
        />
        <KPICard
          title="Total Unpaid"
          value={formatCurrency(totalUnpaid, language)}
          borderColor="amber"
          onClick={() => setFilterStatus('unpaid')}
          icon={<FiClock className="w-5 h-5" />}
          subtitle="Last update: Jan 24"
        />
        <KPICard
          title="Total Overdue"
          value={formatCurrency(totalOverdue, language)}
          borderColor="red"
          onClick={() => setFilterStatus('overdue')}
          icon={<FiAlertTriangle className="w-5 h-5" />}
          subtitle="Last update: Jan 24"
        />
      </div>

      {/* ── Search & Filters ── */}
      <Card className="p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center justify-between">
          <div className="flex-1 w-full relative">
            <FiSearch className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search by Invoice ID, client name, or description…"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="pl-10 py-2.5 text-sm"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {(['All', 'Paid', 'Unpaid', 'Overdue'] as const).map((status) => {
              const val = status === 'All' ? 'all' : status.toLowerCase() as typeof filterStatus;
              return (
                <Button
                  key={status}
                  variant={filterStatus === val ? 'primary' : 'outline'}
                  onClick={() => { setFilterStatus(val); setCurrentPage(1); }}
                  className={`text-sm ${filterStatus === val ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}`}
                >
                  {status}
                </Button>
              );
            })}
          </div>
        </div>
      </Card>

      {/* ── Table ── */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                <th className="px-5 py-3 text-left">
                  <input type="checkbox" className="rounded" />
                </th>
                {['Invoice ID', 'Issue Date', 'Client Name', 'Status', 'Assigned Staff', 'Services', 'Price', 'Actions'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedInvoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center text-sm text-gray-400 dark:text-gray-500">
                    No invoices found
                  </td>
                </tr>
              ) : (
                paginatedInvoices.map((invoice) => (
                  <tr
                    key={invoice.id}
                    className="border-b border-gray-100 dark:border-gray-700/60 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
                  >
                    <td className="px-5 py-3">
                      <input type="checkbox" className="rounded" />
                    </td>

                    {/* Invoice ID */}
                    <td className="px-5 py-3 text-sm font-medium text-gray-800 dark:text-gray-200">
                      {invoice.id}
                    </td>

                    {/* Issue Date */}
                    <td className="px-5 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {new Date(invoice.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>

                    {/* Client Name */}
                    <td className="px-5 py-3 text-sm text-gray-800 dark:text-gray-200">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                          {(invoice.partyName || 'N')[0]}
                        </div>
                        <span>{invoice.partyName || 'Unknown'}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(getInvoiceStatus(invoice))}`}>
                        {getInvoiceStatus(invoice)}
                      </span>
                    </td>

                    {/* Assigned Staff */}
                    <td className="px-5 py-3 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gray-200 dark:bg-gray-600 rounded-full flex-shrink-0" />
                        <span>Staff</span>
                      </div>
                    </td>

                    {/* Services */}
                    <td className="px-5 py-3 text-sm text-gray-500 dark:text-gray-400 max-w-[160px] truncate">
                      {invoice.description}
                    </td>

                    {/* Price */}
                    <td className="px-5 py-3 text-sm font-medium text-gray-800 dark:text-gray-200">
                      {formatCurrency(invoice.amount, language)}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3">
                      <div className="relative">
                        <button
                          onClick={() => setOpenMenuId(openMenuId === invoice.id ? null : invoice.id)}
                          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                          <FiMoreVertical className="w-4 h-4 text-gray-400" />
                        </button>
                        {openMenuId === invoice.id && (
                          <div className="absolute right-0 mt-1 w-36 bg-white dark:bg-gray-800 rounded-xl shadow-lg z-10 border border-gray-100 dark:border-gray-700 overflow-hidden">
                            <button
                              onClick={() => { onViewInvoice(invoice); setOpenMenuId(null); }}
                              className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
                            >
                              <FiEye className="w-4 h-4" /> View
                            </button>
                            <button
                              onClick={() => handleDeleteInvoice(invoice.id)}
                              className="w-full text-left px-4 py-2.5 text-sm text-rose-600 dark:text-rose-400 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
                            >
                              <FiTrash2 className="w-4 h-4" /> Delete
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

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Showing {((currentPage - 1) * itemsPerPage) + 1}–{Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length} entries
            </p>
            <div className="flex gap-1.5">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                <FiChevronLeft className="w-4 h-4" />
              </Button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5)              pageNum = i + 1;
                else if (currentPage <= 3)        pageNum = i + 1;
                else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                else                              pageNum = currentPage - 2 + i;
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? 'primary' : 'outline'}
                    onClick={() => setCurrentPage(pageNum)}
                    className={currentPage === pageNum ? 'bg-blue-600 text-white' : ''}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              {totalPages > 5 && currentPage < totalPages - 2 && (
                <>
                  <span className="px-2 self-center text-gray-400">…</span>
                  <Button variant="outline" onClick={() => setCurrentPage(totalPages)}>{totalPages}</Button>
                </>
              )}
              <Button
                variant="outline"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                <FiChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
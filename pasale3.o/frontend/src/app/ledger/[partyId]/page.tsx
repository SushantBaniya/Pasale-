import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDataStore } from '../../../store/dataStore';
import { formatDate } from '../../../utils/nepaliDate';
import { useTranslation } from '../../../utils/i18n';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { FiArrowLeft, FiDownload, FiPrinter, FiSearch, FiBook } from 'react-icons/fi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function LedgerPage() {
  const { partyId } = useParams<{ partyId: string }>();
  const navigate = useNavigate();
  const { transactions, parties } = useDataStore();
  const { t, c, n, d, language } = useTranslation();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [transactionType, setTransactionType] = useState<'all' | 'selling' | 'purchase' | 'expense'>('all');

  const party = parties.find((p) => p.id === partyId);

  const ledgerEntries = useMemo(() => {
    if (!party) return [];

    let entries = transactions
      .filter((t) => {
        if (t.partyId !== party.id && t.partyName?.toLowerCase() !== party.name.toLowerCase()) {
          return false;
        }
        if (transactionType !== 'all' && t.type !== transactionType) return false;
        if (startDate && new Date(t.date) < new Date(startDate)) return false;
        if (endDate) {
          const txEnd = new Date(endDate);
          txEnd.setHours(23, 59, 59);
          if (new Date(t.date) > txEnd) return false;
        }
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          if (!t.description.toLowerCase().includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate running balance
    let runningBalance = party.balance;
    const entriesWithBalance = entries.map((entry) => {
      const debit = entry.type === 'selling' ? entry.amount : 0;
      const credit = entry.type === 'purchase' || entry.type === 'expense' ? entry.amount : 0;
      runningBalance = runningBalance + debit - credit;
      return {
        ...entry,
        debit,
        credit,
        balance: runningBalance,
      };
    });

    return entriesWithBalance;
  }, [transactions, party, transactionType, startDate, endDate, searchQuery]);

  const openingBalance = party?.balance || 0;
  const closingBalance = ledgerEntries.length > 0 ? ledgerEntries[ledgerEntries.length - 1].balance : openingBalance;

  const chartData = useMemo(() => {
    return ledgerEntries.map((entry) => ({
      date: formatDate(entry.date, language).split(' ')[0],
      balance: entry.balance,
    }));
  }, [ledgerEntries, language]);

  const handleExport = (format: 'pdf' | 'excel') => {
    console.log(`Exporting ledger as ${format}`);
    alert(`Exporting ledger as ${format.toUpperCase()}`);
  };

  const handlePrint = () => {
    window.print();
  };

  if (!party) {
    return (
      <div className="space-y-6">
        <Button onClick={() => navigate('/parties')} variant="outline">
          <FiArrowLeft className="w-4 h-4 mr-2" />
          {t('common.back')}
        </Button>
        <Card className="p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">{t('parties.noParties')}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-4 pb-6 sm:pb-8">
      <div className="max-w-[1600px] mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="flex items-center gap-3 sm:gap-4">
            <Button onClick={() => navigate('/parties')} variant="outline" size="sm">
              <FiArrowLeft className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">{t('common.back')}</span>
            </Button>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-linear-to-br from-teal-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-teal-500/30">
              <FiBook className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100">
                {t('ledger.title')}: {party.name}
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {t('ledger.partyLedgerDesc')} {party.type === 'customer' ? t('parties.customer') : t('parties.supplier')}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => handleExport('pdf')}>
              <FiDownload className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">{t('ledger.exportPdf')}</span>
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <FiPrinter className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">{t('common.print')}</span>
            </Button>
          </div>
        </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 border-l-4 border-l-blue-500">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('ledger.openingBalance')}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {c(openingBalance)}
          </p>
        </Card>
        <Card className="p-4 border-l-4 border-l-green-500">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('ledger.totalDebit')}</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {c(ledgerEntries.reduce((sum, e) => sum + e.debit, 0))}
          </p>
        </Card>
        <Card className="p-4 border-l-4 border-l-red-500">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('ledger.totalCredit')}</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">
            {c(ledgerEntries.reduce((sum, e) => sum + e.credit, 0))}
          </p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium mb-1.5 text-gray-700 dark:text-gray-300">
              {t('transactions.type')}
            </label>
            <select
              value={transactionType}
              onChange={(e) => setTransactionType(e.target.value as any)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value="all">{t('transactions.all')}</option>
              <option value="selling">{t('transactions.sales')}</option>
              <option value="purchase">{t('transactions.purchases')}</option>
              <option value="expense">{t('transactions.expenses')}</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5 text-gray-700 dark:text-gray-300">
              {t('transactions.from')}
            </label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5 text-gray-700 dark:text-gray-300">
              {t('transactions.to')}
            </label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5 text-gray-700 dark:text-gray-300">
              {t('common.search')}
            </label>
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('ledger.searchDescription')}
                className="w-full pl-9 pr-4 py-2 text-xs border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Chart */}
      {chartData.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            {t('ledger.balanceOverTime')}
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="balance" stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Ledger Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                  {t('ledger.date')}
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                  {t('transactions.type')}
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                  {t('common.description')}
                </th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                  {t('ledger.debit')}
                </th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                  {t('ledger.credit')}
                </th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                  {t('ledger.balance')}
                </th>
              </tr>
            </thead>
            <tbody>
              {/* Opening Balance Row */}
              <tr className="bg-blue-50 dark:bg-blue-900/10 border-b border-gray-200 dark:border-gray-700">
                <td className="py-3 px-4 text-gray-900 dark:text-gray-100 font-semibold">
                  {t('ledger.opening')}
                </td>
                <td className="py-3 px-4 text-gray-900 dark:text-gray-100">—</td>
                <td className="py-3 px-4 text-gray-900 dark:text-gray-100">{t('ledger.openingBalance')}</td>
                <td className="py-3 px-4 text-right text-gray-900 dark:text-gray-100">—</td>
                <td className="py-3 px-4 text-right text-gray-900 dark:text-gray-100">—</td>
                <td className="py-3 px-4 text-right font-semibold text-gray-900 dark:text-gray-100">
                  {c(openingBalance)}
                </td>
              </tr>

              {ledgerEntries.map((entry) => (
                <tr
                  key={entry.id}
                  className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <td className="py-3 px-4 text-gray-900 dark:text-gray-100">
                    {d(entry.date)}
                  </td>
                  <td className="py-3 px-4 text-gray-900 dark:text-gray-100 capitalize">
                    {entry.type === 'selling' ? t('transactions.sales') : entry.type === 'purchase' ? t('transactions.purchases') : t('transactions.expenses')}
                  </td>
                  <td className="py-3 px-4 text-gray-900 dark:text-gray-100">
                    {entry.description}
                  </td>
                  <td className="py-3 px-4 text-right text-green-600 dark:text-green-400">
                    {entry.debit > 0 ? c(entry.debit) : '—'}
                  </td>
                  <td className="py-3 px-4 text-right text-red-600 dark:text-red-400">
                    {entry.credit > 0 ? c(entry.credit) : '—'}
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-gray-900 dark:text-gray-100">
                    {c(entry.balance)}
                  </td>
                </tr>
              ))}

              {/* Closing Balance Row */}
              <tr className="bg-gray-100 dark:bg-gray-800 border-t-2 border-gray-300 dark:border-gray-600">
                <td className="py-3 px-4 text-gray-900 dark:text-gray-100 font-semibold">
                  {t('ledger.closing')}
                </td>
                <td className="py-3 px-4 text-gray-900 dark:text-gray-100">—</td>
                <td className="py-3 px-4 text-gray-900 dark:text-gray-100 font-semibold">
                  {t('ledger.closingBalance')}
                </td>
                <td className="py-3 px-4 text-right text-gray-900 dark:text-gray-100">—</td>
                <td className="py-3 px-4 text-right text-gray-900 dark:text-gray-100">—</td>
                <td className="py-3 px-4 text-right font-bold text-lg text-gray-900 dark:text-gray-100">
                  {c(closingBalance)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
      </div>
    </div>
  );
}


import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDataStore } from '../../../../store/dataStore';
import { Card } from '../../../../components/ui/Card';
import { useTranslation } from '../../../../utils/i18n';
import { Button } from '../../../../components/ui/Button';
import { FiArrowLeft, FiSearch, FiFilter, FiDownload, FiTrendingUp, FiDollarSign, FiCreditCard, FiActivity, FiUsers } from 'react-icons/fi';

export default function KPIDetailPage() {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();
  const { t, c, d, n } = useTranslation();
  const { transactions, parties, getTotalSales, getTotalReceivable, getTotalPayable, getCashInHand } = useDataStore();
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

  const getPageData = () => {
    switch (type) {
      case 'sales':
        return {
          title: t('dashboard.totalSales'),
          value: getTotalSales(),
          description: t('allSalesTransactions'),
          transactions: transactions.filter((t) => t.type === 'selling'),
          icon: FiTrendingUp,
          gradient: 'from-emerald-500 to-teal-600',
          bgGradient: 'from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20',
          borderColor: 'border-emerald-100 dark:border-emerald-800/30',
          badgeColor: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300',
        };
      case 'receivable':
        return {
          title: t('dashboard.totalReceivable'),
          value: getTotalReceivable(),
          description: t('amountsToReceive'),
          parties: parties.filter((p) => p.balance > 0),
          icon: FiUsers,
          gradient: 'from-blue-500 to-indigo-600',
          bgGradient: 'from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20',
          borderColor: 'border-blue-100 dark:border-blue-800/30',
          badgeColor: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300',
        };
      case 'payable':
        return {
          title: t('dashboard.totalPayable'),
          value: getTotalPayable(),
          description: t('amountsToPay'),
          parties: parties.filter((p) => p.balance < 0),
          icon: FiCreditCard,
          gradient: 'from-red-500 to-pink-600',
          bgGradient: 'from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20',
          borderColor: 'border-red-100 dark:border-red-800/30',
          badgeColor: 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300',
        };
      case 'cash':
        return {
          title: t('dashboard.cashInHand'),
          value: getCashInHand(),
          description: t('currentCash'),
          transactions: transactions.filter((t) => t.type === 'selling' || t.type === 'purchase'),
          icon: FiDollarSign,
          gradient: 'from-amber-500 to-orange-600',
          bgGradient: 'from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20',
          borderColor: 'border-amber-100 dark:border-amber-800/30',
          badgeColor: 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300',
        };
      case 'balance':
        return {
          title: t('dashboard.netBalance'),
          value: getTotalReceivable() - getTotalPayable(),
          description: t('netPosition'),
          transactions: transactions,
          icon: FiActivity,
          gradient: 'from-purple-500 to-violet-600',
          bgGradient: 'from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20',
          borderColor: 'border-purple-100 dark:border-purple-800/30',
          badgeColor: 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300',
        };
      default:
        return null;
    }
  };

  const pageData = getPageData();

  // Filter functions
  const filterByDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    switch (dateFilter) {
      case 'today':
        return date >= today;
      case 'week':
        return date >= weekAgo;
      case 'month':
        return date >= monthAgo;
      default:
        return true;
    }
  };

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    if (!pageData?.transactions) return [];
    return pageData.transactions.filter((t) => {
      const matchesSearch =
        searchQuery === '' ||
        t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.partyName?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDate = filterByDate(t.date);
      return matchesSearch && matchesDate;
    });
  }, [pageData?.transactions, searchQuery, dateFilter]);

  // Filter parties
  const filteredParties = useMemo(() => {
    if (!pageData?.parties) return [];
    return pageData.parties.filter((p) => {
      return (
        searchQuery === '' ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.phone?.includes(searchQuery)
      );
    });
  }, [pageData?.parties, searchQuery]);

  if (!pageData) {
    return (
      <div className="space-y-6">
        <div>{t('common.pageNotFound')}</div>
      </div>
    );
  }

  const Icon = pageData.icon;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-4 pb-6 sm:pb-8">
      <div className="max-w-1600px mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
        {/* Header - Interactive Style */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div className="flex items-center gap-3 sm:gap-4">
            <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')}>
              <FiArrowLeft className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">{t('common.back')}</span>
            </Button>
            <div className={`group flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl bg-linear-to-r ${pageData.bgGradient} border ${pageData.borderColor} hover:shadow-lg transition-all duration-300 cursor-default`}>
              <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-linear-to-br ${pageData.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  {pageData.title}
                  <span className={`hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${pageData.badgeColor}`}>
                    {t('kpi.details') || 'Details'}
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">{pageData.description}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Total Card - Enhanced */}
        <Card className={`p-6 sm:p-8 bg-linear-to-r ${pageData.gradient} text-white mb-6 shadow-xl`}>
          <div className="text-center">
            <p className="text-sm sm:text-base text-white/80 mb-2">{t('common.total')}</p>
            <p className="text-4xl sm:text-5xl lg:text-6xl font-bold">{c(pageData.value)}</p>
            <p className="text-sm text-white/60 mt-2">
              {pageData.transactions ? `${n(filteredTransactions.length)} ${t('transactions.records') || 'records'}` : 
               pageData.parties ? `${n(filteredParties.length)} ${t('parties.contacts') || 'contacts'}` : ''}
            </p>
          </div>
        </Card>

        {/* Search and Filter Bar */}
        <Card className="p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('common.search') + '...'}
                className="w-full pl-12 pr-4 py-3 border-2 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Date Filter */}
            {pageData.transactions && (
              <div className="flex gap-2 flex-wrap">
                {(['all', 'today', 'week', 'month'] as const).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setDateFilter(filter)}
                    className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      dateFilter === filter
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {filter === 'all' && t('common.all')}
                    {filter === 'today' && t('common.today')}
                    {filter === 'week' && t('common.thisWeek')}
                    {filter === 'month' && t('common.thisMonth')}
                  </button>
                ))}
              </div>
            )}
          </div>
        </Card>

      {/* Transactions List */}
      {pageData.transactions && (
        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">
              {t('relatedTransactions')}
            </h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {filteredTransactions.length} {t('common.items')}
            </span>
          </div>
          {filteredTransactions.length > 0 ? (
            <div className="space-y-3">
              {filteredTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="group flex items-center justify-between p-3 sm:p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => navigate(`/transactions?id=${transaction.id}`)}
                >
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div
                      className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${
                        transaction.type === 'selling'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-600'
                          : transaction.type === 'purchase'
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
                          : 'bg-red-100 dark:bg-red-900/30 text-red-600'
                      }`}
                    >
                      {transaction.type === 'selling' ? '📈' : transaction.type === 'purchase' ? '📦' : '💸'}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {transaction.partyName || transaction.description}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                        {transaction.type === 'selling'
                          ? t('transactions.sales')
                          : transaction.type === 'purchase'
                          ? t('transactions.purchases')
                          : t('transactions.expenses')}{' '}
                        • {d(transaction.date)}
                      </p>
                    </div>
                  </div>
                  <p
                    className={`text-base sm:text-lg font-bold ${
                      transaction.type === 'selling' ? 'text-green-600' : 'text-gray-900 dark:text-gray-100'
                    }`}
                  >
                    {transaction.type === 'selling' ? '+' : '-'}
                    {c(transaction.amount)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <FiSearch className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>{t('common.noResults')}</p>
            </div>
          )}
        </Card>
      )}

      {/* Parties List */}
      {pageData.parties && (
        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">
              {t('relatedParties')}
            </h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {filteredParties.length} {t('common.items')}
            </span>
          </div>
          {filteredParties.length > 0 ? (
            <div className="space-y-3">
              {filteredParties.map((party) => (
                <div
                  key={party.id}
                  className="group flex items-center justify-between p-3 sm:p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => navigate(`/ledger/${party.id}`)}
                >
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div
                      className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${
                        party.type === 'customer'
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
                          : 'bg-purple-100 dark:bg-purple-900/30 text-purple-600'
                      }`}
                    >
                      {party.type === 'customer' ? '👤' : '🏢'}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">{party.name}</p>
                      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                        {party.type === 'customer' ? t('parties.customer') : t('parties.supplier')}
                        {party.phone && ` • ${party.phone}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-base sm:text-lg font-bold ${
                        party.balance > 0 ? 'text-green-600' : party.balance < 0 ? 'text-red-600' : 'text-gray-600'
                      }`}
                    >
                      {c(Math.abs(party.balance))}
                    </p>
                    <p className="text-xs text-gray-500">
                      {party.balance > 0 ? t('ledger.toReceive') : party.balance < 0 ? t('ledger.toPay') : t('ledger.settled')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <FiSearch className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>{t('common.noResults')}</p>
            </div>
          )}
        </Card>
      )}
      </div>
    </div>
  );
}


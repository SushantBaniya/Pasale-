import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDataStore } from '../../../../store/dataStore';
import { useTranslation } from '../../../../utils/i18n';
import {
  FiArrowLeft,
  FiSearch,
  FiTrendingUp,
  FiDollarSign,
  FiCreditCard,
  FiActivity,
  FiUsers,
} from 'react-icons/fi';

export default function KPIDetailPage() {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();
  const { t, c, d, n } = useTranslation();
  const { transactions, parties, getTotalSales, getTotalReceivable, getTotalPayable, getCashInHand } = useDataStore();

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
          gradient: 'from-blue-500 to-blue-600',
          accentColor: 'blue',
        };
      case 'receivable':
        return {
          title: t('dashboard.totalReceivable'),
          value: getTotalReceivable(),
          description: t('amountsToReceive'),
          parties: parties.filter((p) => p.balance > 0),
          icon: FiUsers,
          gradient: 'from-purple-500 to-purple-600',
          accentColor: 'purple',
        };
      case 'payable':
        return {
          title: t('dashboard.totalPayable'),
          value: getTotalPayable(),
          description: t('amountsToPay'),
          parties: parties.filter((p) => p.balance < 0),
          icon: FiCreditCard,
          gradient: 'from-red-500 to-red-600',
          accentColor: 'red',
        };
      case 'cash':
        return {
          title: t('dashboard.cashInHand'),
          value: getCashInHand(),
          description: t('currentCash'),
          transactions: transactions.filter((t) => t.type === 'selling' || t.type === 'purchase'),
          icon: FiDollarSign,
          gradient: 'from-green-500 to-green-600',
          accentColor: 'green',
        };
      case 'balance':
        return {
          title: t('dashboard.netBalance'),
          value: getTotalReceivable() - getTotalPayable(),
          description: t('netPosition'),
          transactions: transactions,
          icon: FiActivity,
          gradient: 'from-indigo-500 to-indigo-600',
          accentColor: 'indigo',
        };
      default:
        return null;
    }
  };

  const pageData = getPageData();

  const filterByDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    switch (dateFilter) {
      case 'today': return date >= today;
      case 'week': return date >= weekAgo;
      case 'month': return date >= monthAgo;
      default: return true;
    }
  };

  const filteredTransactions = useMemo(() => {
    if (!pageData?.transactions) return [];
    return pageData.transactions.filter((t) => {
      const matchesSearch = searchQuery === ''
        || t.description?.toLowerCase().includes(searchQuery.toLowerCase())
        || t.partyName?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch && filterByDate(t.date);
    });
  }, [pageData?.transactions, searchQuery, dateFilter]);

  const filteredParties = useMemo(() => {
    if (!pageData?.parties) return [];
    return pageData.parties.filter((p) =>
      searchQuery === ''
      || p.name.toLowerCase().includes(searchQuery.toLowerCase())
      || p.phone?.includes(searchQuery)
    );
  }, [pageData?.parties, searchQuery]);

  if (!pageData) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">{t('common.pageNotFound')}</p>
      </div>
    );
  }

  const Icon = pageData.icon;

  return (
    <div className="space-y-5 pb-8">

      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/dashboard')}
          className="w-9 h-9 rounded-lg border border-gray-200 dark:border-gray-800 flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <FiArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{pageData.title}</h1>
          <p className="text-xs text-gray-400 mt-0.5">{pageData.description}</p>
        </div>
      </div>

      {/* ── Value Card ── */}
      <div className={`rounded-xl p-6 bg-gradient-to-br ${pageData.gradient} text-white`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-white/70 mb-1">Total Amount</p>
            <p className="text-4xl font-bold">{c(pageData.value)}</p>
            <p className="text-xs text-white/50 mt-2">
              {pageData.transactions
                ? `${filteredTransactions.length} records`
                : pageData.parties
                  ? `${filteredParties.length} contacts`
                  : ''}
            </p>
          </div>
          <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center">
            <Icon className="w-7 h-7 text-white" />
          </div>
        </div>
      </div>

      {/* ── Search + Filter ── */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`${t('common.search')}...`}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        {pageData.transactions && (
          <div className="flex gap-1.5 flex-wrap">
            {(['all', 'today', 'week', 'month'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setDateFilter(f)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${dateFilter === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
              >
                {f === 'all' ? t('common.all')
                  : f === 'today' ? t('common.today')
                    : f === 'week' ? t('common.thisWeek')
                      : t('common.thisMonth')}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Transactions List ── */}
      {pageData.transactions && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
              {t('relatedTransactions')}
            </h2>
            <span className="text-xs text-gray-400">
              {filteredTransactions.length} {t('common.items')}
            </span>
          </div>

          {filteredTransactions.length > 0 ? (
            <div className="divide-y divide-gray-50 dark:divide-gray-800">
              {filteredTransactions.map((tx) => (
                <button
                  key={tx.id}
                  onClick={() => navigate(`/transactions?id=${tx.id}`)}
                  className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold ${tx.type === 'selling'
                      ? 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                      : tx.type === 'purchase'
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                        : 'bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400'
                      }`}>
                      {tx.type === 'selling' ? '↑' : tx.type === 'purchase' ? '↓' : '−'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[200px]">
                        {tx.partyName || tx.description}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {tx.type === 'selling'
                          ? t('transactions.sales')
                          : tx.type === 'purchase'
                            ? t('transactions.purchases')
                            : t('transactions.expenses')}
                        {' · '}{d(tx.date)}
                      </p>
                    </div>
                  </div>
                  <span className={`text-sm font-semibold ${tx.type === 'selling'
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-gray-700 dark:text-gray-300'
                    }`}>
                    {tx.type === 'selling' ? '+' : '−'}{c(tx.amount)}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center">
              <FiSearch className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-400">{t('common.noResults')}</p>
            </div>
          )}
        </div>
      )}

      {/* ── Parties List ── */}
      {pageData.parties && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
              {t('relatedParties')}
            </h2>
            <span className="text-xs text-gray-400">
              {filteredParties.length} {t('common.items')}
            </span>
          </div>

          {filteredParties.length > 0 ? (
            <div className="divide-y divide-gray-50 dark:divide-gray-800">
              {filteredParties.map((party) => (
                <button
                  key={party.id}
                  onClick={() => navigate(`/ledger/${party.id}`)}
                  className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold ${party.type === 'customer'
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                      : 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                      }`}>
                      {party.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{party.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {party.type === 'customer' ? t('parties.customer') : t('parties.supplier')}
                        {party.phone && ` · ${party.phone}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${party.balance > 0
                      ? 'text-green-600 dark:text-green-400'
                      : party.balance < 0
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-gray-400'
                      }`}>
                      {c(Math.abs(party.balance))}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {party.balance > 0
                        ? t('ledger.toReceive')
                        : party.balance < 0
                          ? t('ledger.toPay')
                          : t('ledger.settled')}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center">
              <FiSearch className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-400">{t('common.noResults')}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
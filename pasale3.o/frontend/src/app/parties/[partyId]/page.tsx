import React, { useMemo, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useDataStore } from '../../../store/dataStore';
import { formatDate } from '../../../utils/nepaliDate';
import { useTranslation } from '../../../utils/i18n';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { AddNewDialog } from '../../../components/dashboard/AddNewDialog';
import { PartyActionDropdown } from '../../../components/parties/PartyActionDropdown';
import {
  FiArrowLeft,
  FiPhone,
  FiMail,
  FiMapPin,
  FiArrowUpRight,
  FiArrowDownLeft,
  FiPlus,
  FiFileText,
  FiCreditCard,
  FiLayers,
  FiMoreVertical,
  FiTrash2,
  FiX,
  FiFilter,
  FiDownload,
} from 'react-icons/fi';

type TransactionTab = 'all' | 'sale' | 'purchase' | 'payment' | 'quotation' | 'return';

export default function PartyDetailPage() {
  const { partyId } = useParams<{ partyId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t, c, n, d, language } = useTranslation();
  const { parties, transactions } = useDataStore();

  const [activeTab, setActiveTab] = useState<TransactionTab>(
    (searchParams.get('tab') as TransactionTab) || 'all'
  );
  const [showAddDialog, setShowAddDialog] = useState(false);

  const party = parties.find((p) => p.id === partyId);

  if (!party) {
    return (
      <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6 flex items-center justify-center">
        <Card className="text-center p-12">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Party Not Found</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-6">The party you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/parties')}>
            <FiArrowLeft className="w-4 h-4 mr-2" />
            Back to Parties
          </Button>
        </Card>
      </div>
    );
  }

  const partyTransactions = useMemo(() => {
    return transactions
      .filter(
        (tx) =>
          tx.partyId === party.id ||
          (tx.partyName && tx.partyName.toLowerCase() === party.name.toLowerCase())
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, party]);

  const filteredTransactions = useMemo(() => {
    if (activeTab === 'all') return partyTransactions;

    let filtered = partyTransactions.filter((tx) => {
      switch (activeTab) {
        case 'sale':
          return tx.type === 'selling';
        case 'purchase':
          return tx.type === 'purchase';
        case 'payment':
          return tx.type === 'payment_in' || tx.type === 'payment_out';
        case 'quotation':
          return tx.type === 'quotation';
        case 'return':
          return tx.type === 'sales_return' || tx.type === 'purchase_return';
        default:
          return true;
      }
    });

    return filtered;
  }, [partyTransactions, activeTab]);

  const getPartyBalance = () => {
    return partyTransactions.reduce((balance, tx) => {
      if (tx.type === 'selling') {
        return balance + tx.amount;
      } else if (tx.type === 'purchase') {
        return balance - tx.amount;
      }
      return balance;
    }, 0);
  };

  const balance = getPartyBalance();
  const totalSales = partyTransactions
    .filter((tx) => tx.type === 'selling')
    .reduce((sum, tx) => sum + tx.amount, 0);
  const totalPurchases = partyTransactions
    .filter((tx) => tx.type === 'purchase')
    .reduce((sum, tx) => sum + tx.amount, 0);

  return (
    <>
      <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        {/* Header */}
        <div
          className={`${party.type === 'customer'
            ? 'bg-linear-to-r from-blue-500 to-blue-600'
            : 'bg-linear-to-r from-purple-500 to-purple-600'
            } text-white py-8 px-4 sm:px-6`}
        >
          <div className="max-w-6xl mx-auto">
            <button
              onClick={() => navigate('/parties')}
              className="flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors"
            >
              <FiArrowLeft className="w-4 h-4" />
              Back to Parties
            </button>

            <div className="flex items-center gap-6 mb-8">
              <div
                className={`w-20 h-20 rounded-2xl flex items-center justify-center text-4xl font-bold ${party.type === 'customer'
                  ? 'bg-white/20'
                  : 'bg-white/20'
                  }`}
              >
                {party.name.charAt(0).toUpperCase()}
              </div>

              <div className="flex-1">
                <h1 className="text-3xl sm:text-4xl font-bold mb-2">{party.name}</h1>
                <p className="text-white/80 text-sm sm:text-base">
                  {party.type === 'customer' ? 'Customer' : 'Supplier'} • {n(partyTransactions.length)} transactions
                </p>
              </div>

              <div className="text-right hidden sm:block">
                <p className="text-white/80 text-sm">Current Balance</p>
                <p
                  className={`text-3xl font-bold ${balance >= 0 ? 'text-green-300' : 'text-red-300'
                    }`}
                >
                  {c(Math.abs(balance))}
                </p>
                <p className="text-white/80 text-sm mt-1">
                  {balance >= 0 ? 'To Receive' : 'To Pay'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="p-6">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Balance</p>
              <p className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {c(Math.abs(balance))}
              </p>
              <p className="text-xs text-gray-400 mt-2">{balance >= 0 ? 'To Receive' : 'To Pay'}</p>
            </Card>

            <Card className="p-6">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Total Sales</p>
              <p className="text-2xl font-bold text-emerald-600">{c(totalSales)}</p>
              <p className="text-xs text-gray-400 mt-2">{n(partyTransactions.filter((t) => t.type === 'selling').length)} invoices</p>
            </Card>

            <Card className="p-6">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Total Purchases</p>
              <p className="text-2xl font-bold text-blue-600">{c(totalPurchases)}</p>
              <p className="text-xs text-gray-400 mt-2">{n(partyTransactions.filter((t) => t.type === 'purchase').length)} invoices</p>
            </Card>

            <Card className="p-6">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Total Transactions</p>
              <p className="text-2xl font-bold text-purple-600">{n(partyTransactions.length)}</p>
              <p className="text-xs text-gray-400 mt-2">All transactions</p>
            </Card>
          </div>

          {/* Contact Info Card */}
          <Card className="p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Contact Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {party.phone && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2 mb-1">
                    <FiPhone className="w-4 h-4" />
                    Phone
                  </p>
                  <p className="text-gray-900 dark:text-gray-100 font-medium">{party.phone}</p>
                </div>
              )}
              {party.email && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2 mb-1">
                    <FiMail className="w-4 h-4" />
                    Email
                  </p>
                  <p className="text-gray-900 dark:text-gray-100 font-medium">{party.email}</p>
                </div>
              )}
              {party.address && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2 mb-1">
                    <FiMapPin className="w-4 h-4" />
                    Address
                  </p>
                  <p className="text-gray-900 dark:text-gray-100 font-medium">{party.address}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Transactions Section */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Transactions</h2>
              <PartyActionDropdown party={party} />
            </div>

            {/* Transaction Tabs */}
            <div className="flex overflow-x-auto gap-2 mb-6 pb-3 border-b border-gray-200 dark:border-gray-700">
              {(
                [
                  { id: 'all', label: 'All', icon: FiLayers },
                  { id: 'sale', label: 'Sales', icon: FiArrowUpRight },
                  { id: 'purchase', label: 'Purchases', icon: FiArrowDownLeft },
                  { id: 'payment', label: 'Payments', icon: FiCreditCard },
                  { id: 'quotation', label: 'Quotations', icon: FiFileText },
                  { id: 'return', label: 'Returns', icon: FiDownload },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition-all ${activeTab === tab.id
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Transactions List */}
            {filteredTransactions.length === 0 ? (
              <Card className="p-12 text-center">
                <FiFilter className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">No Transactions</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  No {activeTab !== 'all' ? activeTab : 'transactions'} found for this party.
                </p>
                <Button onClick={() => setShowAddDialog(true)}>
                  <FiPlus className="w-4 h-4 mr-2" />
                  Add First Transaction
                </Button>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredTransactions.map((tx) => (
                  <Card
                    key={tx.id}
                    className="p-4 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${tx.type === 'selling'
                            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600'
                            : tx.type === 'purchase'
                              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-600'
                            }`}
                        >
                          {tx.type === 'selling' ? (
                            <FiArrowUpRight className="w-6 h-6" />
                          ) : tx.type === 'purchase' ? (
                            <FiArrowDownLeft className="w-6 h-6" />
                          ) : (
                            <FiCreditCard className="w-6 h-6" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 dark:text-gray-100 capitalize">
                            {tx.type.replace('_', ' ')}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {tx.description || 'No description'}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {formatDate(tx.date, language)}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p
                          className={`font-bold text-lg ${tx.type === 'selling'
                            ? 'text-emerald-600'
                            : 'text-gray-900 dark:text-gray-100'
                            }`}
                        >
                          {tx.type === 'selling' ? '+' : '-'}{c(tx.amount)}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showAddDialog && (
        <AddNewDialog onClose={() => setShowAddDialog(false)} />
      )}
    </>
  );
}

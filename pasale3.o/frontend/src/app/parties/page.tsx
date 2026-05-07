import React, { useMemo, useState } from 'react';
import { useDataStore } from '../../store/dataStore';
import { formatDate } from '../../utils/nepaliDate';
import { useTranslation } from '../../utils/i18n';
import {
  FiSearch,
  FiPlus,
  FiPrinter,
  FiBell,
  FiMoreVertical,
  FiArrowUpRight,
  FiArrowDownLeft,
  FiFileText,
} from 'react-icons/fi';
import { AddPaymentModal } from '../../components/parties/AddPaymentModal';
import { EditPartyModal } from '../../components/parties/EditPartyModal';

export default function PartiesPage() {
  const { t, c, n, language } = useTranslation();
  const { parties, transactions } = useDataStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPartyId, setSelectedPartyId] = useState<string | null>(null);
  
  const [showAddPartyModal, setShowAddPartyModal] = useState(false);
  const [showEditPartyModal, setShowEditPartyModal] = useState(false);
  const [showPaymentInModal, setShowPaymentInModal] = useState(false);
  const [showPaymentOutModal, setShowPaymentOutModal] = useState(false);

  // Filtered parties list for sidebar
  const filteredParties = useMemo(() => {
    return parties.filter((p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [parties, searchQuery]);

  const selectedParty = useMemo(() => {
    return parties.find(p => p.id === selectedPartyId) || null;
  }, [parties, selectedPartyId]);

  const partyTransactions = useMemo(() => {
    if (!selectedPartyId) return [];
    return transactions
      .filter(tx => tx.partyId === selectedPartyId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, selectedPartyId]);

  const getPartyBalance = (partyId: string) => {
    const party = parties.find(p => p.id === partyId);
    if (!party) return 0;
    
    // Balance calculation includes opening balance and payment txns
    // In our simplified mock dataStore, `party.balance` tracks everything or we sum it.
    // Let's rely on party.balance for the list if available, or compute.
    return party.balance; 
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 pt-16 overflow-hidden">
      {/* Left Sidebar - Parties List */}
      <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full z-10">
        
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              Parties ({filteredParties.length})
            </h2>
            <button
              onClick={() => {
                setSelectedPartyId(null);
                setShowAddPartyModal(true);
              }}
              className="flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <FiPlus className="w-4 h-4 mr-1" /> Add Party
            </button>
          </div>

          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search parties..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-gray-100 dark:bg-gray-900 border-none rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="mt-3">
             <select className="w-full bg-gray-100 dark:bg-gray-900 border-none rounded-lg text-sm px-3 py-2 text-gray-700 dark:text-gray-300">
               <option>All Payment</option>
               <option>To Receive</option>
               <option>To Pay</option>
             </select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredParties.length === 0 ? (
             <div className="p-4 text-center text-gray-500 text-sm">No parties found</div>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredParties.map((party) => {
                const balance = getPartyBalance(party.id);
                return (
                  <li
                    key={party.id}
                    onClick={() => setSelectedPartyId(party.id)}
                    className={`p-4 cursor-pointer transition-colors ${
                      selectedPartyId === party.id
                        ? 'bg-blue-50 dark:bg-blue-900/20'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold shrink-0 text-sm">
                          {party.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">{party.name}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                         <p className={`font-semibold text-sm ${
                           balance > 0 ? 'text-blue-600' : balance < 0 ? 'text-red-600' : 'text-gray-500'
                         }`}>
                           Rs. {Math.abs(balance).toFixed(2)}
                         </p>
                         <p className={`text-[10px] uppercase font-medium ${
                           balance > 0 ? 'text-blue-600' : balance < 0 ? 'text-red-600' : 'text-gray-400'
                         }`}>
                           {balance > 0 ? 'To Receive' : balance < 0 ? 'To Give' : 'Settled'}
                         </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Right Content - Party Details */}
      <div className="flex-1 bg-white dark:bg-gray-900 h-full overflow-y-auto">
        {!selectedParty ? (
           <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <FiSearch className="w-16 h-16 mb-4 text-gray-300" />
              <h2 className="text-xl font-medium">Select a party to view details</h2>
           </div>
        ) : (
          <div className="p-6">
            {/* Party Header */}
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-200 dark:border-gray-800">
               <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-blue-500 text-white flex items-center justify-center text-xl font-bold">
                     {selectedParty.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                     <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{selectedParty.name}</h1>
                     <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mt-1">
                        <button onClick={() => setShowEditPartyModal(true)} className="hover:text-blue-500 font-medium">Manage Party</button>
                        <button className="hover:text-gray-700 flex items-center gap-1"><FiPrinter className="w-4 h-4"/> Print</button>
                     </div>
                  </div>
               </div>
               
               <div className="text-right">
                  <p className="text-gray-500 text-sm">{getPartyBalance(selectedParty.id) >= 0 ? 'Receivable' : 'Payable'}</p>
                  <p className={`text-2xl font-bold ${getPartyBalance(selectedParty.id) >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                     Rs. {Math.abs(getPartyBalance(selectedParty.id)).toFixed(2)}
                  </p>
                  <button className="text-gray-500 text-sm hover:text-gray-700 flex items-center justify-end gap-1 w-full mt-1">
                     <FiBell className="w-3.5 h-3.5"/> Send Reminder
                  </button>
               </div>
            </div>

            {/* Transactions Section */}
            <div>
               <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                     Transactions ({partyTransactions.length})
                  </h3>
                  <div className="flex gap-2">
                     <button 
                        onClick={() => setShowPaymentInModal(true)}
                        className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm"
                     >
                        <FiArrowDownLeft className="w-4 h-4 mr-2" /> Payment In
                     </button>
                     <button 
                        onClick={() => setShowPaymentOutModal(true)}
                        className="flex items-center px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg shadow-sm"
                     >
                        <FiArrowUpRight className="w-4 h-4 mr-2" /> Payment Out
                     </button>
                  </div>
               </div>

               <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                     <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-800 text-sm text-gray-500 dark:text-gray-400">
                           <th className="py-3 px-4 font-medium">TYPE</th>
                           <th className="py-3 px-4 font-medium">DATE</th>
                           <th className="py-3 px-4 font-medium text-right">TOTAL</th>
                           <th className="py-3 px-4 font-medium text-center">STATUS</th>
                           <th className="py-3 px-4 font-medium text-right">BALANCE</th>
                           <th className="py-3 px-4 font-medium">REMARKS</th>
                           <th className="py-3 px-4"></th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {partyTransactions.length === 0 ? (
                           <tr>
                              <td colSpan={7} className="py-8 text-center text-gray-500">No transactions found</td>
                           </tr>
                        ) : (
                           partyTransactions.map((tx) => (
                              <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 text-sm">
                                 <td className="py-4 px-4 font-medium text-blue-600">
                                    {tx.type === 'payment_in' ? 'Payment In' : tx.type === 'payment_out' ? 'Payment Out' : tx.type}
                                    <span className="text-gray-400 font-normal ml-1">#{tx.id.substring(tx.id.length - 4)}</span>
                                 </td>
                                 <td className="py-4 px-4 text-gray-600 dark:text-gray-400">
                                    {formatDate(tx.date, language)}
                                 </td>
                                 <td className="py-4 px-4 text-right font-medium text-gray-900 dark:text-gray-100">
                                    Rs. {tx.amount.toFixed(2)}
                                 </td>
                                 <td className="py-4 px-4 text-center text-gray-400">—</td>
                                 <td className={`py-4 px-4 text-right font-medium ${getPartyBalance(selectedParty.id) >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
                                    Rs. {Math.abs(getPartyBalance(selectedParty.id)).toFixed(2)}
                                 </td>
                                 <td className="py-4 px-4 text-gray-500 truncate max-w-[150px]">
                                    {tx.description}
                                 </td>
                                 <td className="py-4 px-4 text-right">
                                    <button className="text-gray-400 hover:text-gray-600 p-1">
                                       <FiMoreVertical />
                                    </button>
                                 </td>
                              </tr>
                           ))
                        )}
                     </tbody>
                  </table>
               </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <AddPaymentModal
        isOpen={showPaymentInModal}
        onClose={() => setShowPaymentInModal(false)}
        type="payment_in"
        defaultPartyId={selectedPartyId || undefined}
      />
      
      <AddPaymentModal
        isOpen={showPaymentOutModal}
        onClose={() => setShowPaymentOutModal(false)}
        type="payment_out"
        defaultPartyId={selectedPartyId || undefined}
      />

      <EditPartyModal
        isOpen={showAddPartyModal}
        onClose={() => setShowAddPartyModal(false)}
      />

      <EditPartyModal
        isOpen={showEditPartyModal}
        onClose={() => setShowEditPartyModal(false)}
        party={selectedParty || undefined}
      />
    </div>
  );
}

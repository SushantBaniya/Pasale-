import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDataStore } from '../../store/dataStore';
import {
    FiPlus,
    FiArrowUpRight,
    FiArrowDownLeft,
    FiCreditCard,
    FiFileText,
    FiPackage,
    FiMoreVertical
} from 'react-icons/fi';

interface PartyActionDropdownProps {
    party: {
        id: string;
        name: string;
        type: 'customer' | 'supplier';
    };
    className?: string;
    variant?: 'primary' | 'icon';
}

export const PartyActionDropdown: React.FC<PartyActionDropdownProps> = ({
    party,
    className = '',
    variant = 'primary'
}) => {
    const navigate = useNavigate();
    const { addTransaction } = useDataStore();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleAction = (type: string, path: string, txnType: string, description: string) => {
        setIsOpen(false);

        // Pre-fill transaction data store if needed, mostly we just navigate with query params
        // But generating a temp ID or clearing state might be good.
        // Ideally, we just navigate and let the billing page handle it via URL params.
        // However, the previous implementation in page.tsx was calling addTransaction immediately.
        // This seems weird for a "Create Invoice" action (usually you fill it out first).
        // But to match existing logic which seemed to create a draft:

        // Actually, looking at the previous code:
        // It called addTransaction with Amount 0 and then navigated.
        // We will follow that pattern but ideally this should be "Start new transaction" state.

        const txnDescription = description.replace('{party}', party.name);

        addTransaction({
            id: Date.now().toString(),
            type: txnType as any,
            amount: 0,
            date: new Date().toISOString(),
            description: txnDescription,
            partyId: party.id,
            partyName: party.name,
        });

        navigate(path);
    };

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            {variant === 'primary' ? (
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium transition-all shadow-lg hover:shadow-xl active:scale-95 ${isOpen ? 'bg-blue-800' : 'bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
                        }`}
                >
                    <FiPlus className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-45' : ''}`} />
                    <span>Add New</span>
                </button>
            ) : (
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                    <FiMoreVertical className="w-5 h-5 text-gray-500" />
                </button>
            )}

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-2 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-2">
                            Create New
                        </p>
                    </div>

                    <div className="p-1">
                        <button
                            onClick={() => handleAction('sales', `/billing?partyId=${party.id}&type=sales`, 'selling', 'Sale from {party}')}
                            className="w-full text-left px-3 py-2.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg flex items-center gap-3 transition-colors group"
                        >
                            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                                <FiArrowUpRight className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Sales Invoice</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Bill to customer</p>
                            </div>
                        </button>

                        <button
                            onClick={() => handleAction('purchase', `/billing?partyId=${party.id}&type=purchase`, 'purchase', 'Purchase from {party}')}
                            className="w-full text-left px-3 py-2.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg flex items-center gap-3 transition-colors group"
                        >
                            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                                <FiArrowDownLeft className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Purchase Invoice</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Bill from supplier</p>
                            </div>
                        </button>

                        <button
                            onClick={() => handleAction('payment', `/transactions?partyId=${party.id}&type=payment`, 'payment_out', 'Payment to/from {party}')}
                            className="w-full text-left px-3 py-2.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg flex items-center gap-3 transition-colors group"
                        >
                            <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform">
                                <FiCreditCard className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Record Payment</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">In or Out</p>
                            </div>
                        </button>

                        <div className="my-1 border-t border-gray-100 dark:border-gray-700"></div>

                        <button
                            onClick={() => handleAction('quotation', `/billing?partyId=${party.id}&type=quotation`, 'quotation', 'Quotation for {party}')}
                            className="w-full text-left px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg flex items-center gap-3 transition-colors group"
                        >
                            <div className="w-8 h-8 rounded-lg bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center text-cyan-600 group-hover:scale-110 transition-transform">
                                <FiFileText className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Quotation</span>
                        </button>

                        <button
                            onClick={() => handleAction('return', `/transactions?partyId=${party.id}&type=return`, 'sales_return', 'Return from {party}')}
                            className="w-full text-left px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg flex items-center gap-3 transition-colors group"
                        >
                            <div className="w-8 h-8 rounded-lg bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center text-pink-600 group-hover:scale-110 transition-transform">
                                <FiPackage className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Return / Adjustment</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

import React, { useState, useEffect } from 'react';
import { FiX, FiUser } from 'react-icons/fi';
import { Button } from '../ui/Button';
import { Party } from '../../store/dataStore';
import { useDataStore } from '../../store/dataStore';

interface EditPartyModalProps {
  isOpen: boolean;
  onClose: () => void;
  party?: Party; // If provided, edit mode. Otherwise, create mode.
  defaultType?: 'customer' | 'supplier';
}

export function EditPartyModal({ isOpen, onClose, party, defaultType = 'customer' }: EditPartyModalProps) {
  const { addParty, updateParty } = useDataStore();
  
  const [activeTab, setActiveTab] = useState<'credit' | 'additional'>('credit');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [creditLimit, setCreditLimit] = useState('');
  const [openingBalance, setOpeningBalance] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (party) {
        setFullName(party.name || '');
        setPhoneNumber(party.phone || '');
        setAddress(party.address || '');
        setEmail(party.email || '');
        setPanNumber(party.panNumber || '');
        setCreditLimit(party.creditLimit ? party.creditLimit.toString() : '');
        setOpeningBalance(party.balance ? party.balance.toString() : '');
      } else {
        setFullName('');
        setPhoneNumber('');
        setAddress('');
        setEmail('');
        setPanNumber('');
        setCreditLimit('');
        setOpeningBalance('');
      }
      setActiveTab('credit');
    }
  }, [isOpen, party]);

  if (!isOpen) return null;

  const title = party ? 'Edit Party' : 'Add Party';

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName) return;

    if (party) {
      updateParty({
        ...party,
        name: fullName,
        phone: phoneNumber,
        address,
        email,
        panNumber,
        creditLimit: creditLimit ? parseFloat(creditLimit) : undefined,
      });
    } else {
      addParty({
        id: Date.now().toString(),
        name: fullName,
        type: defaultType,
        phone: phoneNumber,
        address,
        email,
        panNumber,
        creditLimit: creditLimit ? parseFloat(creditLimit) : undefined,
        balance: openingBalance ? parseFloat(openingBalance) : 0,
      });
    }
    
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#1A1A1A] rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b #E5D8CC dark:border-[#222222]">
          <h2 className="text-xl font-bold #3D2B1A dark:text-[#E0E0E0]">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:#8A7060 dark:hover:text-gray-300 hover:#EDE5DA dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-4 sm:p-6 overflow-y-auto">
          <form id="party-form" onSubmit={handleSave} className="space-y-6">
            
            {/* Top Section */}
            <div className="flex items-start gap-4">
              <div className="flex flex-col items-center justify-center w-16 h-16 rounded-full border border-dashed border-gray-300 dark:border-[#333333] #FAF7F3 dark:bg-[#111111] text-gray-400 cursor-pointer hover:border-[#D4623A] hover:text-[#D4623A] transition-colors">
                <FiUser className="w-6 h-6 mb-1" />
                <span className="text-[10px] font-medium">Upload</span>
              </div>
              <div className="flex-1 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-[#CCCCCC] mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter full name"
                    className="w-full px-3 py-2 #FAF7F3 dark:bg-[#111111] border #E5D8CC dark:border-[#222222] rounded-lg focus:ring-2 focus:ring-[#D4623A] outline-none #3D2B1A dark:text-[#E0E0E0]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-[#CCCCCC] mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Enter phone number"
                    className="w-full px-3 py-2 #FAF7F3 dark:bg-[#111111] border #E5D8CC dark:border-[#222222] rounded-lg focus:ring-2 focus:ring-[#D4623A] outline-none #3D2B1A dark:text-[#E0E0E0]"
                  />
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div>
              <div className="flex border-b #E5D8CC dark:border-[#222222]">
                <button
                  type="button"
                  onClick={() => setActiveTab('credit')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'credit'
                      ? 'border-[#D4623A] text-[#D4623A] dark:text-[#D4623A]'
                      : 'border-transparent #8A7060 hover:text-gray-700 dark:text-[#555555] dark:hover:text-gray-300'
                  }`}
                >
                  Credit Info
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('additional')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'additional'
                      ? 'border-[#D4623A] text-[#D4623A] dark:text-[#D4623A]'
                      : 'border-transparent #8A7060 hover:text-gray-700 dark:text-[#555555] dark:hover:text-gray-300'
                  }`}
                >
                  Additional Info
                </button>
              </div>

              {/* Tab Content */}
              <div className="pt-4">
                {activeTab === 'credit' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-[#CCCCCC] mb-1">Opening Balance</label>
                      <input
                        type="number"
                        disabled={!!party} // Cannot edit opening balance later in simple form
                        value={openingBalance}
                        onChange={(e) => setOpeningBalance(e.target.value)}
                        placeholder="0.00"
                        className="w-full px-3 py-2 #FAF7F3 dark:bg-[#111111] border #E5D8CC dark:border-[#222222] rounded-lg focus:ring-2 focus:ring-[#D4623A] outline-none #3D2B1A dark:text-[#E0E0E0] disabled:opacity-60"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-[#CCCCCC] mb-1">Credit Limit</label>
                      <input
                        type="number"
                        value={creditLimit}
                        onChange={(e) => setCreditLimit(e.target.value)}
                        placeholder="0.00"
                        className="w-full px-3 py-2 #FAF7F3 dark:bg-[#111111] border #E5D8CC dark:border-[#222222] rounded-lg focus:ring-2 focus:ring-[#D4623A] outline-none #3D2B1A dark:text-[#E0E0E0]"
                      />
                    </div>
                  </div>
                )}

                {activeTab === 'additional' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-[#CCCCCC] mb-1">Address</label>
                        <input
                          type="text"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder="Enter party's address"
                          className="w-full px-3 py-2 #FAF7F3 dark:bg-[#111111] border #E5D8CC dark:border-[#222222] rounded-lg focus:ring-2 focus:ring-[#D4623A] outline-none #3D2B1A dark:text-[#E0E0E0]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-[#CCCCCC] mb-1">Email</label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Enter party's email"
                          className="w-full px-3 py-2 #FAF7F3 dark:bg-[#111111] border #E5D8CC dark:border-[#222222] rounded-lg focus:ring-2 focus:ring-[#D4623A] outline-none #3D2B1A dark:text-[#E0E0E0]"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-[#CCCCCC] mb-1">PAN Number</label>
                      <input
                        type="text"
                        value={panNumber}
                        onChange={(e) => setPanNumber(e.target.value)}
                        placeholder="Enter number"
                        className="w-full px-3 py-2 #FAF7F3 dark:bg-[#111111] border #E5D8CC dark:border-[#222222] rounded-lg focus:ring-2 focus:ring-[#D4623A] outline-none #3D2B1A dark:text-[#E0E0E0]"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 flex justify-end">
          <button
            type="submit"
            form="party-form"
            className="px-6 py-2 rounded-lg text-white font-medium shadow-md transition-colors bg-[#D4623A] hover:bg-[#B8502E]"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

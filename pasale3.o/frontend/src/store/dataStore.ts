import { create } from 'zustand';

// Types
export interface Transaction {
  id: string;
  type: 'purchase' | 'selling' | 'expense' | 'payment_in' | 'payment_out' | 'quotation' | 'sales_return' | 'purchase_return' | 'income';
  amount: number;
  date: string;
  description: string;
  partyId?: string;
  partyName?: string;
  items?: TransactionItem[];
}

export interface TransactionItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Party {
  id: string;
  name: string;
  type: 'customer' | 'supplier';
  phone?: string;
  email?: string;
  address?: string;
  balance: number; // Positive = receivable, Negative = payable
}

export interface Expense {
  id: string;
  category: string;
  amount: number;
  date: string;
  description: string;
  isNecessary: boolean;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  date: string;
  read: boolean;
}

interface DataState {
  transactions: Transaction[];
  parties: Party[];
  expenses: Expense[];
  notifications: Notification[];
  addTransaction: (transaction: Transaction) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  addParty: (party: Party) => void;
  updateParty: (party: Party) => void;
  addExpense: (expense: Expense) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'date' | 'read'>) => void;
  markNotificationAsRead: (id: string) => void;
  dismissNotification: (id: string) => void;
  getTotalSales: () => number;
  getTotalReceivable: () => number;
  getTotalPayable: () => number;
  getCashInHand: () => number;
  getMonthlyExpenses: () => { month: string; income: number; expense: number }[];
}

const getStoredData = (): Partial<DataState> => {
  if (typeof window === 'undefined') {
    return {};
  }
  try {
    const stored = localStorage.getItem('pasale-data');
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        transactions: parsed.transactions || [],
        parties: parsed.parties || [],
        expenses: parsed.expenses || [],
        notifications: parsed.notifications || [],
      };
    }
  } catch (e) {
    // Ignore parse errors
  }
  return {};
};

const initialState = {
  transactions: [],
  parties: [],
  expenses: [],
  notifications: [],
};

const storedData = getStoredData();

export const useDataStore = create<DataState>((set, get) => ({
  transactions: storedData.transactions || initialState.transactions,
  parties: storedData.parties || initialState.parties,
  expenses: storedData.expenses || initialState.expenses,
  notifications: storedData.notifications || initialState.notifications,

  addTransaction: (transaction) => {
    set((state) => {
      const newState = {
        ...state,
        transactions: [transaction, ...state.transactions],
      };
      // Persist to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('pasale-data', JSON.stringify({
          transactions: newState.transactions,
          parties: newState.parties,
          expenses: newState.expenses,
          notifications: newState.notifications,
        }));
      }
      return newState;
    });

    // Add notification for new transaction
    get().addNotification({
      title: 'New Transaction',
      message: `${transaction.type} of Rs. ${transaction.amount}`,
      type: 'info',
    });
  },

  deleteTransaction: (id) => {
    set((state) => {
      const newState = {
        ...state,
        transactions: state.transactions.filter((t) => t.id !== id),
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem('pasale-data', JSON.stringify({
          transactions: newState.transactions,
          parties: newState.parties,
          expenses: newState.expenses,
          notifications: newState.notifications,
        }));
      }
      return newState;
    });
  },

  updateTransaction: (id, updates) => {
    set((state) => {
      const newState = {
        ...state,
        transactions: state.transactions.map((t) =>
          t.id === id ? { ...t, ...updates } : t
        ),
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem('pasale-data', JSON.stringify({
          transactions: newState.transactions,
          parties: newState.parties,
          expenses: newState.expenses,
          notifications: newState.notifications,
        }));
      }
      return newState;
    });
  },

  addParty: (party) => {
    set((state) => {
      const newState = {
        ...state,
        parties: [...state.parties, party],
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem('pasale-data', JSON.stringify({
          transactions: newState.transactions,
          parties: newState.parties,
          expenses: newState.expenses,
          notifications: newState.notifications,
        }));
      }
      return newState;
    });
  },

  updateParty: (party) => {
    set((state) => {
      const newState = {
        ...state,
        parties: state.parties.map((p) => (p.id === party.id ? party : p)),
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem('pasale-data', JSON.stringify({
          transactions: newState.transactions,
          parties: newState.parties,
          expenses: newState.expenses,
          notifications: newState.notifications,
        }));
      }
      return newState;
    });
  },

  addExpense: (expense) => {
    set((state) => {
      const newState = {
        ...state,
        expenses: [expense, ...state.expenses],
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem('pasale-data', JSON.stringify({
          transactions: newState.transactions,
          parties: newState.parties,
          expenses: newState.expenses,
          notifications: newState.notifications,
        }));
      }
      return newState;
    });
  },

  addNotification: (notification) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      date: new Date().toISOString(),
      read: false,
    };
    set((state) => {
      const newState = {
        ...state,
        notifications: [newNotification, ...state.notifications],
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem('pasale-data', JSON.stringify({
          transactions: newState.transactions,
          parties: newState.parties,
          expenses: newState.expenses,
          notifications: newState.notifications,
        }));
      }
      return newState;
    });
  },

  markNotificationAsRead: (id) => {
    set((state) => {
      const newState = {
        ...state,
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n
        ),
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem('pasale-data', JSON.stringify({
          transactions: newState.transactions,
          parties: newState.parties,
          expenses: newState.expenses,
          notifications: newState.notifications,
        }));
      }
      return newState;
    });
  },

  dismissNotification: (id) => {
    set((state) => {
      const newState = {
        ...state,
        notifications: state.notifications.filter((n) => n.id !== id),
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem('pasale-data', JSON.stringify({
          transactions: newState.transactions,
          parties: newState.parties,
          expenses: newState.expenses,
          notifications: newState.notifications,
        }));
      }
      return newState;
    });
  },

  getTotalSales: () => {
    const state = get();
    return state.transactions
      .filter((t) => t.type === 'selling')
      .reduce((sum, t) => sum + t.amount, 0);
  },

  getTotalReceivable: () => {
    const state = get();
    return state.parties
      .filter((p) => p.balance > 0)
      .reduce((sum, p) => sum + p.balance, 0);
  },

  getTotalPayable: () => {
    const state = get();
    return state.parties
      .filter((p) => p.balance < 0)
      .reduce((sum, p) => sum + Math.abs(p.balance), 0);
  },

  getCashInHand: () => {
    const state = get();
    const sales = state.getTotalSales();
    const purchases = state.transactions
      .filter((t) => t.type === 'purchase')
      .reduce((sum, t) => sum + t.amount, 0);
    const expenses = state.expenses.reduce((sum, e) => sum + e.amount, 0);
    return sales - purchases - expenses;
  },

  getMonthlyExpenses: () => {
    const state = get();
    const months = ['Baisakh', 'Jestha', 'Ashadh', 'Shrawan', 'Bhadra', 'Aswin',
      'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra'];
    const currentMonth = new Date().getMonth();

    return months.slice(0, currentMonth + 1).map((month, index) => {
      const monthExpenses = state.expenses.filter((e) => {
        const expenseDate = new Date(e.date);
        return expenseDate.getMonth() === index;
      });

      const monthIncome = state.transactions
        .filter((t) => {
          const transDate = new Date(t.date);
          return transDate.getMonth() === index && t.type === 'selling';
        })
        .reduce((sum, t) => sum + t.amount, 0);

      const monthExpense = monthExpenses.reduce((sum, e) => sum + e.amount, 0);

      return {
        month,
        income: monthIncome,
        expense: monthExpense,
      };
    });
  },
}));

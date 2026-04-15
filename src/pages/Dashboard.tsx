import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { IdeaToMusic } from '../components/IdeaToMusic';
import { Link, useLocation } from 'react-router-dom';

interface Transaction {
  id: string;
  amount: number;
  type: 'add' | 'use';
  description: string;
  createdAt: string;
}

export const Dashboard: React.FC = () => {
  const { user, userData } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const txs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Transaction[];
      setTransactions(txs);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'transactions');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const navItems = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/studio', label: 'Studio Engine' },
    { path: '/library', label: 'Library' },
    { path: '/pricing', label: 'Billing' },
    { path: '/settings', label: 'Settings' },
  ];

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto p-6 lg:p-10 flex flex-col lg:flex-row gap-8">
      <aside className="w-full lg:w-[250px] flex-shrink-0 flex flex-col gap-2">
        <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 px-3">Menu</div>
        {navItems.map(item => (
          <Link 
            key={item.path}
            to={item.path} 
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              location.pathname === item.path 
                ? 'bg-zinc-100 text-zinc-900' 
                : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </aside>

      <div className="flex-1 flex flex-col gap-6">
        <div className="bg-white border border-zinc-200 p-8 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 shadow-sm">
          <div>
            <div className="text-sm font-medium text-zinc-500 mb-1">Active Sessions</div>
            <div className="text-4xl font-bold text-zinc-900">04</div>
          </div>
          <div>
            <div className="text-sm font-medium text-zinc-500 mb-1">System Status</div>
            <div className="text-green-600 font-medium flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              Operational
            </div>
          </div>
          <Link 
            to="/pricing"
            className="bg-zinc-900 text-white px-6 py-2.5 rounded-lg font-medium text-sm hover:bg-zinc-800 transition-colors"
          >
            Recharge Credits
          </Link>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <IdeaToMusic />

          <div className="bg-white border border-zinc-200 rounded-2xl p-6 flex-1 flex flex-col shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-zinc-900">Recent Transactions</h3>
              <span className="text-xs font-medium text-zinc-500 bg-zinc-100 px-2 py-1 rounded">Live Sync</span>
            </div>

            <div className="grid grid-cols-[1fr_100px_80px] py-3 border-b border-zinc-100 text-xs font-medium text-zinc-500 uppercase tracking-wider">
              <span>Description</span>
              <span>Time</span>
              <span className="text-right">Amount</span>
            </div>

            <div className="divide-y divide-zinc-100 flex-1 overflow-y-auto max-h-[400px]">
              {loading ? (
                <div className="py-8 text-center text-zinc-500 text-sm">Loading transactions...</div>
              ) : transactions.length === 0 ? (
                <div className="py-8 text-center text-zinc-500 text-sm">No transactions found.</div>
              ) : (
                transactions.map((tx) => (
                  <div key={tx.id} className="grid grid-cols-[1fr_100px_80px] py-4 text-sm items-center">
                    <span className="text-zinc-900 truncate pr-4 font-medium">{tx.description}</span>
                    <span className="text-zinc-500">{new Date(tx.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    <span className={cn(
                      "font-mono text-right font-medium",
                      tx.type === 'add' ? "text-green-600" : "text-zinc-900"
                    )}>
                      {tx.type === 'add' ? '+' : '-'}{tx.amount.toFixed(2)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

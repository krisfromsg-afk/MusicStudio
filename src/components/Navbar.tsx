import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { loginWithGoogle, logout } from '../lib/firebase';
import { motion } from 'motion/react';
import { LogIn, LogOut, User as UserIcon, Settings, Zap } from 'lucide-react';
import { AdminSettingsModal } from './AdminSettingsModal';

export const Navbar: React.FC = () => {
  const { user, userData } = useAuth();
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  const isAdmin = user?.email === 'krisfromsg@gmail.com';

  return (
    <>
      <nav className="h-16 bg-white border-b border-zinc-200 flex items-center justify-between px-6 lg:px-10 z-50 sticky top-0">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-sans font-bold text-lg tracking-tight text-zinc-900">
              Wormhole Studio
            </span>
          </Link>
          
          {user && (
            <div className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-500">
              <Link to="/dashboard" className="hover:text-zinc-900 transition-colors">Dashboard</Link>
              <Link to="/studio" className="hover:text-zinc-900 transition-colors">Studio Engine</Link>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              {isAdmin && (
                <button 
                  onClick={() => setIsAdminModalOpen(true)}
                  className="text-zinc-500 hover:text-zinc-900 transition-colors p-2 rounded-full hover:bg-zinc-100"
                  title="Admin Settings"
                >
                  <Settings className="w-5 h-5" />
                </button>
              )}

              <div className="flex items-center gap-3 bg-zinc-50 border border-zinc-200 px-3 py-1.5 rounded-full">
                <span className="text-xs font-medium text-zinc-500">Credits:</span>
                <motion.span 
                  key={userData?.credits}
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  className="font-mono font-semibold text-zinc-900 text-sm"
                >
                  {userData?.credits !== undefined ? userData.credits.toFixed(2) : '...'}
                </motion.span>
                <Link to="/pricing" className="ml-1 text-xs font-medium text-zinc-900 hover:text-zinc-600 transition-colors">
                  Get More
                </Link>
              </div>

              <div className="relative group flex items-center gap-2 cursor-pointer">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-zinc-100 border border-zinc-200">
                  {userData?.photoURL ? (
                    <img src={userData.photoURL} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <UserIcon className="w-4 h-4 text-zinc-400" />
                    </div>
                  )}
                </div>
                
                {/* Dropdown */}
                <div className="absolute right-0 top-full mt-2 w-48 py-1 bg-white border border-zinc-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 origin-top-right">
                  <div className="px-4 py-2 border-b border-zinc-100 mb-1">
                    <p className="text-sm font-medium text-zinc-900 truncate">{userData?.displayName}</p>
                    <p className="text-xs text-zinc-500 truncate">{userData?.email}</p>
                  </div>
                  <button
                    onClick={logout}
                    className="w-full text-left px-4 py-2 text-sm text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 flex items-center gap-2 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </div>
              </div>
            </>
          ) : (
            <button
              onClick={loginWithGoogle}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-lg font-medium text-sm hover:bg-zinc-800 transition-colors"
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </button>
          )}
        </div>
      </nav>

      <AdminSettingsModal 
        isOpen={isAdminModalOpen} 
        onClose={() => setIsAdminModalOpen(false)} 
      />
    </>
  );
};

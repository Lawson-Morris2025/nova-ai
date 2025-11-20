import React, { useState } from 'react';
import { User, X, LogOut, ShieldCheck, Mail } from 'lucide-react';
import { User as UserType } from './types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserType;
  onLogout: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, user, onLogout }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden animate-[scale-in_0.2s_ease-out]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800 bg-gray-900/50">
          <h2 className="text-xl font-bold text-white">Account Settings</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          
          {/* Profile Card */}
          <div className="flex items-center space-x-4 p-4 bg-gray-800/50 rounded-xl border border-gray-700/50">
            <div className="relative">
              {user.avatar ? (
                <img src={user.avatar} alt="User" className="w-16 h-16 rounded-full border-2 border-primary-500" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold text-2xl border-2 border-primary-400">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="absolute bottom-0 right-0 bg-green-500 w-4 h-4 rounded-full border-2 border-gray-800"></div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{user.name}</h3>
              <div className="flex items-center text-gray-400 text-sm mt-1">
                <Mail size={14} className="mr-1.5" />
                {user.email}
              </div>
            </div>
          </div>

          {/* Security Badge */}
          <div className="flex items-start space-x-3 p-3 bg-emerald-900/20 border border-emerald-900/50 rounded-lg">
             <ShieldCheck className="text-emerald-500 mt-0.5" size={20} />
             <div>
               <p className="text-sm font-medium text-emerald-400">Account Secured</p>
               <p className="text-xs text-emerald-600/80 mt-0.5">Your sessions are stored locally on this device.</p>
             </div>
          </div>

          <div className="border-t border-gray-800 pt-2"></div>

          {/* Logout Action */}
          <button 
            onClick={() => {
              onLogout();
              onClose();
            }}
            className="w-full flex items-center justify-center space-x-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 font-medium py-3 px-4 rounded-xl transition-all"
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>

        </div>
      </div>
    </div>
  );
};
import React from 'react';
import {
  Sparkles,
  Plus,
  LogOut,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { UserProfile } from '../types';

interface NavbarProps {
  user: UserProfile;
  isSaving: boolean;
  onNewEntry: () => void;
  onSignOut: () => void;
  totalEntriesCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  isSaving,
  onNewEntry,
  onSignOut,
}) => {
  return (
    <header className="h-14 border-b border-[#3D3030] bg-[#221A1A]/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between shrink-0 z-30 select-none">
      {/* Left section: Brand Logo */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#D0888F] via-[#C47B82] to-[#E5A862] p-0.5 shadow-sm shadow-[#D0888F]/20 flex items-center justify-center">
            <div className="w-full h-full bg-[#221A1A] rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[#D0888F]" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold text-sm sm:text-base text-[#F5EFEB] tracking-tight">
              Kite AI
            </span>

            {/* Clean, Single Unified Status Pill */}
            <div className="hidden sm:inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#2A2121] border border-[#3D3030] text-[11px] font-medium text-[#C7BCB8]">
              {isSaving ? (
                <>
                  <Loader2 className="w-3 h-3 text-[#E5A862] animate-spin" />
                  <span className="text-[#E5A862]">Saving...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>Synced</span>
                </>
              )}
              <span className="text-[#8F827E]">&bull;</span>
              <span className="text-[#D0888F] font-mono text-[10px]">3.7 Flash</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right section: New Reflection Button & User Profile */}
      <div className="flex items-center gap-2.5 sm:gap-4">
        <button
          id="btn-navbar-new-entry"
          onClick={onNewEntry}
          className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 bg-[#D0888F] hover:bg-[#C47B82] active:bg-[#B36D74] text-[#1A1414] font-bold rounded-xl text-xs transition-all shadow-md shadow-[#D0888F]/20 cursor-pointer active:scale-95"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span className="hidden sm:inline">New Reflection</span>
          <span className="sm:hidden">New</span>
        </button>

        <div className="h-4 w-px bg-[#3D3030]" />

        {/* User Profile */}
        <div className="flex items-center gap-2.5">
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName || 'User'}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-[#3D3030] object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#2A2121] text-[#D0888F] border border-[#3D3030] flex items-center justify-center font-bold text-xs">
              {(user.displayName || user.email || 'U')[0].toUpperCase()}
            </div>
          )}

          <div className="hidden lg:flex flex-col text-left max-w-[130px]">
            <p className="text-xs font-semibold text-[#F5EFEB] truncate">
              {user.displayName || 'Journal Author'}
            </p>
            <p className="text-[10px] text-[#8F827E] truncate font-mono">
              {user.email || 'Firestore Auth'}
            </p>
          </div>

          <button
            id="btn-sign-out"
            onClick={onSignOut}
            title="Sign Out"
            className="p-1.5 sm:p-2 rounded-xl text-[#C7BCB8] hover:text-[#D0888F] hover:bg-[#2A2121] transition-colors border border-transparent hover:border-[#3D3030] cursor-pointer"
            aria-label="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

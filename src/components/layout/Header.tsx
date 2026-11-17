import React, { useState } from 'react';
import {
  ShieldCheck,
  PlusCircle,
  Menu,
  X,
  LogIn,
  LogOut,
  User,
  Cloud,
  CloudOff,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { useForensics } from '../../context/ForensicsContext';

interface HeaderProps {
  currentView: string;
  onNavigate: (view: string) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  mobileMenuOpen,
  setMobileMenuOpen,
}) => {
  const {
    evidences,
    custodyEvents,
    user,
    authLoading,
    signInWithGoogle,
    signOut,
    isCloudMode,
    setIsCloudMode,
    cloudSyncLoading,
  } = useForensics();

  const [signingIn, setSigningIn] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handleSignIn = async () => {
    try {
      setSigningIn(true);
      await signInWithGoogle();
    } catch (e) {
      console.error(e);
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <header className="border-b border-slate-800 bg-slate-900/95 backdrop-blur sticky top-0 z-40 no-print">
      <div className="flex items-center justify-between gap-8 px-4 sm:px-6 py-3 max-w-7xl mx-auto">
        {/* Zone 1: Brand wordmark (single text element) */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded"
          >
            <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span className="text-base font-bold tracking-tight text-white whitespace-nowrap">
              DSL <span className="text-cyan-400 font-semibold">Forensics</span>
            </span>
          </button>
        </div>

        {/* Zone 2: 4-5 single-line text navigation links */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-300">
          <button
            onClick={() => onNavigate('dashboard')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              currentView === 'dashboard'
                ? 'text-cyan-400 font-semibold border-b-2 border-cyan-400'
                : 'hover:text-white'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => onNavigate('records')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              currentView === 'records'
                ? 'text-cyan-400 font-semibold border-b-2 border-cyan-400'
                : 'hover:text-white'
            }`}
          >
            Evidence Registry
          </button>
          <button
            onClick={() => onNavigate('custody')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              currentView === 'custody'
                ? 'text-cyan-400 font-semibold border-b-2 border-cyan-400'
                : 'hover:text-white'
            }`}
          >
            Chain of Custody
          </button>
          <button
            onClick={() => onNavigate('verify')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              currentView === 'verify'
                ? 'text-cyan-400 font-semibold border-b-2 border-cyan-400'
                : 'hover:text-white'
            }`}
          >
            Integrity Verification
          </button>
          <button
            onClick={() => onNavigate('dsa')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              currentView === 'dsa'
                ? 'text-cyan-400 font-semibold border-b-2 border-cyan-400'
                : 'hover:text-white'
            }`}
          >
            DSA Lab
          </button>
        </nav>

        {/* Zone 3: 1 primary action + Auth Controls */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Cloud Sync Status Indicator */}
          {user ? (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-950/40 border border-emerald-800/60 text-[11px] text-emerald-300 font-mono">
              {cloudSyncLoading ? (
                <RefreshCw className="w-3 h-3 animate-spin text-emerald-400" />
              ) : (
                <Cloud className="w-3 h-3 text-emerald-400" />
              )}
              <span>Firestore Live</span>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800/60 border border-slate-700/60 text-[11px] text-slate-300 font-mono">
              <CloudOff className="w-3 h-3 text-slate-400" />
              <span>Demo Mode</span>
            </div>
          )}

          {/* User Profile or Google Sign In */}
          {authLoading ? (
            <div className="w-7 h-7 rounded-full bg-slate-800 animate-pulse" />
          ) : user ? (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-1.5 p-1 rounded-full border border-slate-700 hover:border-slate-500 bg-slate-800 transition-colors"
                title={user.email || 'Investigator Profile'}
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Examiner'}
                    className="w-6 h-6 rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-cyan-900 text-cyan-200 text-xs flex items-center justify-center font-bold">
                    {(user.displayName || user.email || 'E')[0].toUpperCase()}
                  </div>
                )}
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-lg bg-slate-900 border border-slate-700 shadow-xl py-2 z-50 text-xs">
                  <div className="px-3 py-2 border-b border-slate-800">
                    <div className="font-semibold text-white truncate">
                      {user.displayName || 'Forensic Examiner'}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate font-mono">
                      {user.email}
                    </div>
                  </div>

                  <div className="px-3 py-2 border-b border-slate-800 space-y-1.5">
                    <div className="text-[10px] text-slate-500 uppercase font-mono">Data Source</div>
                    <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                      <input
                        type="checkbox"
                        checked={isCloudMode}
                        onChange={e => setIsCloudMode(e.target.checked)}
                        className="rounded bg-slate-950 border-slate-700 text-cyan-500 focus:ring-0"
                      />
                      <span>Cloud Firestore Sync</span>
                    </label>
                  </div>

                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      signOut();
                    }}
                    className="w-full px-3 py-2 text-left text-rose-400 hover:bg-slate-800/80 flex items-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={handleSignIn}
              disabled={signingIn}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded transition-colors whitespace-nowrap"
            >
              <LogIn className="w-3.5 h-3.5 text-cyan-400" />
              <span>{signingIn ? 'Connecting...' : 'Google Sign-In'}</span>
            </button>
          )}

          {/* Primary Action Button */}
          <button
            onClick={() => onNavigate('add')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded transition-colors whitespace-nowrap shadow-sm shadow-cyan-950"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Intake</span>
          </button>

          {/* Mobile hamburger button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-slate-800"
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </header>
  );
};

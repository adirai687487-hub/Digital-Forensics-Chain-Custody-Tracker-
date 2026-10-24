import React from 'react';
import { ShieldCheck, PlusCircle, Menu, X, Database } from 'lucide-react';
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
  const { evidences, custodyEvents } = useForensics();

  return (
    <header className="border-b border-slate-800 bg-slate-900/95 backdrop-blur sticky top-0 z-40 no-print">
      <div className="flex items-center justify-between gap-8 px-4 sm:px-6 py-3.5 max-w-7xl mx-auto">
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

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 mr-1 tabular-nums font-mono">
            <span>{evidences.length} Artifacts</span>
            <span aria-hidden="true">·</span>
            <span>{custodyEvents.length} Events</span>
          </div>

          <button
            onClick={() => onNavigate('add')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-md transition-colors whitespace-nowrap shadow-sm shadow-cyan-950"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Intake Evidence</span>
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

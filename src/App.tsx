/**
 * DSL — Digital Forensics Chain of Custody Tracker
 * Subtitle: Evidence Integrity & Investigation Management System
 * Academic Research: Ajeenkya DY Patil University, School of Engineering
 */

import React, { useState } from 'react';
import { ForensicsProvider } from './context/ForensicsContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { DashboardView } from './components/dashboard/DashboardView';
import { AddEvidenceView } from './components/evidence/AddEvidenceView';
import { EvidenceListView } from './components/evidence/EvidenceListView';
import { ChainOfCustodyView } from './components/custody/ChainOfCustodyView';
import { SearchView } from './components/search/SearchView';
import { IntegrityVerificationView } from './components/verification/IntegrityVerificationView';
import { EvidenceTreeView } from './components/tree/EvidenceTreeView';
import { DsaDemonstrationView } from './components/dsa/DsaDemonstrationView';
import { PrintableReportsView } from './components/reports/PrintableReportsView';
import { AboutDefenseView } from './components/about/AboutDefenseView';

export default function App() {
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [contextEvidenceId, setContextEvidenceId] = useState<string | undefined>(undefined);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  const handleNavigate = (view: string, id?: string) => {
    setCurrentView(view);
    if (id) {
      setContextEvidenceId(id);
    }
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <ForensicsProvider>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
        {/* Top Bar Header */}
        <Header
          currentView={currentView}
          onNavigate={handleNavigate}
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
        />

        {/* Main Application Container */}
        <div className="flex-1 flex overflow-hidden max-w-7xl w-full mx-auto">
          {/* Desktop Sidebar */}
          <div className="hidden lg:block h-[calc(100vh-65px)] sticky top-[65px]">
            <Sidebar currentView={currentView} onNavigate={handleNavigate} />
          </div>

          {/* Mobile Navigation Drawer */}
          {mobileMenuOpen && (
            <div className="lg:hidden fixed inset-0 z-50 bg-black/80 flex">
              <div className="w-72 bg-slate-900 h-full shadow-2xl">
                <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                  <span className="text-sm font-bold text-white">Navigation Menu</span>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-slate-400 hover:text-white text-xs p-1"
                  >
                    ✕ Close
                  </button>
                </div>
                <Sidebar
                  currentView={currentView}
                  onNavigate={handleNavigate}
                  onCloseMobile={() => setMobileMenuOpen(false)}
                />
              </div>
              <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
            </div>
          )}

          {/* Main Content Area */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
            {currentView === 'dashboard' && (
              <DashboardView onNavigate={handleNavigate} />
            )}

            {currentView === 'add' && (
              <AddEvidenceView onNavigate={handleNavigate} />
            )}

            {currentView === 'records' && (
              <EvidenceListView onNavigate={handleNavigate} />
            )}

            {currentView === 'custody' && (
              <ChainOfCustodyView
                initialEvidenceId={contextEvidenceId}
                onNavigate={handleNavigate}
              />
            )}

            {currentView === 'search' && (
              <SearchView onNavigate={handleNavigate} />
            )}

            {currentView === 'verify' && (
              <IntegrityVerificationView
                initialEvidenceId={contextEvidenceId}
                onNavigate={handleNavigate}
              />
            )}

            {currentView === 'tree' && (
              <EvidenceTreeView onNavigate={handleNavigate} />
            )}

            {currentView === 'dsa' && (
              <DsaDemonstrationView onNavigate={handleNavigate} />
            )}

            {currentView === 'reports' && (
              <PrintableReportsView
                initialEvidenceId={contextEvidenceId}
                onNavigate={handleNavigate}
              />
            )}

            {currentView === 'about' && (
              <AboutDefenseView />
            )}
          </main>
        </div>
      </div>
    </ForensicsProvider>
  );
}

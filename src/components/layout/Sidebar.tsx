import React from 'react';
import {
  LayoutDashboard,
  PlusCircle,
  FileBox,
  Link2,
  Search,
  ShieldCheck,
  FolderTree,
  Binary,
  FileText,
  Info,
  Scale,
} from 'lucide-react';
import { useForensics } from '../../context/ForensicsContext';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  onCloseMobile,
}) => {
  const { evidences, custodyEvents, verificationLogs } = useForensics();

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
      section: 'Overview',
    },
    {
      id: 'add',
      label: 'Add Evidence',
      icon: PlusCircle,
      badge: 'New',
      section: 'Intake & Records',
    },
    {
      id: 'records',
      label: 'Evidence Records',
      icon: FileBox,
      badge: evidences.length.toString(),
      section: 'Intake & Records',
    },
    {
      id: 'custody',
      label: 'Chain of Custody',
      icon: Link2,
      badge: custodyEvents.length.toString(),
      section: 'Audit & Integrity',
    },
    {
      id: 'search',
      label: 'Evidence Search',
      icon: Search,
      badge: 'BST',
      section: 'Audit & Integrity',
    },
    {
      id: 'verify',
      label: 'Integrity Verification',
      icon: ShieldCheck,
      badge: verificationLogs.length.toString(),
      section: 'Audit & Integrity',
    },
    {
      id: 'tree',
      label: 'Evidence Tree',
      icon: FolderTree,
      badge: null,
      section: 'Structures & Lab',
    },
    {
      id: 'dsa',
      label: 'DSA Demonstration',
      icon: Binary,
      badge: 'Viva',
      section: 'Structures & Lab',
    },
    {
      id: 'reports',
      label: 'Evidence Reports',
      icon: FileText,
      badge: 'Export',
      section: 'Output',
    },
    {
      id: 'about',
      label: 'Examiner Guide & About',
      icon: Info,
      badge: 'Defense',
      section: 'Academic',
    },
  ];

  const handleSelect = (id: string) => {
    onNavigate(id);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <aside className="w-64 bg-slate-900/60 border-r border-slate-800 flex flex-col shrink-0 h-full overflow-y-auto no-print">
      {/* Forensic System Subtitle / Banner */}
      <div className="p-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400">
          <Scale className="w-3.5 h-3.5" />
          <span>Forensic Integrity System</span>
        </div>
        <p className="text-[11px] text-slate-400 mt-1 leading-snug">
          ISO/IEC 27037 & NIST SP 800-86 standards framework simulation
        </p>
      </div>

      {/* Nav List */}
      <div className="p-3 space-y-1 flex-1">
        {navItems.map((item, idx) => {
          const isActive = currentView === item.id;
          const Icon = item.icon;
          const showSectionHeading =
            idx === 0 || item.section !== navItems[idx - 1].section;

          return (
            <React.Fragment key={item.id}>
              {showSectionHeading && (
                <div className="pt-3 pb-1 px-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  {item.section}
                </div>
              )}
              <button
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-md transition-colors text-left ${
                  isActive
                    ? 'bg-cyan-500/10 text-cyan-300 font-semibold border border-cyan-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-cyan-400' : 'text-slate-400'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-mono tabular-nums ${
                      isActive
                        ? 'bg-cyan-400/20 text-cyan-300'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            </React.Fragment>
          );
        })}
      </div>

      {/* Academic Defense Credit Badge */}
      <div className="p-3 m-3 rounded-lg border border-slate-800 bg-slate-950/60 text-slate-400 text-[11px]">
        <div className="text-slate-200 font-semibold mb-0.5">Undergraduate Defense</div>
        <div className="text-[10px] text-slate-300">Ajeenkya DY Patil University</div>
        <div className="text-[10px] text-slate-400 mt-1 font-mono">
          Joe Jelson J · Ayush Rai
        </div>
      </div>
    </aside>
  );
};

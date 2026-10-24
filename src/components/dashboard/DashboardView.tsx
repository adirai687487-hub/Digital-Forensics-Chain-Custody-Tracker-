import React from 'react';
import {
  FileBox,
  Link2,
  ShieldCheck,
  AlertTriangle,
  PlusCircle,
  Search,
  CheckCircle2,
  ArrowRight,
  HardDrive,
  Cpu,
  Clock,
  UserCheck,
} from 'lucide-react';
import { useForensics } from '../../context/ForensicsContext';
import { truncateHash, formatBytes } from '../../utils/crypto';

interface DashboardViewProps {
  onNavigate: (view: string, contextId?: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const { evidences, custodyEvents, verificationLogs, bstInstance } = useForensics();

  // Metric Computations
  const totalEvidence = evidences.length;
  const totalEvents = custodyEvents.length;
  const totalVerifications = verificationLogs.length;

  const verifiedCount = evidences.filter(e => e.lastVerificationStatus === 'VERIFIED').length;
  const tamperedCount = evidences.filter(e => e.lastVerificationStatus === 'TAMPERED').length;
  const unverifiedCount = evidences.filter(e => e.lastVerificationStatus === 'UNVERIFIED' || !e.lastVerificationStatus).length;

  const totalBytes = evidences.reduce((acc, curr) => acc + (curr.fileSizeBytes || 0), 0);

  // Group by Case
  const casesMap = new Map<string, { id: string; name: string; count: number }>();
  evidences.forEach(e => {
    if (!casesMap.has(e.caseId)) {
      casesMap.set(e.caseId, { id: e.caseId, name: e.caseName, count: 0 });
    }
    casesMap.get(e.caseId)!.count++;
  });
  const casesList = Array.from(casesMap.values());

  // Recent custody events (last 5)
  const recentEvents = [...custodyEvents].reverse().slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Top Banner / Disclaimer */}
      <div className="p-4 rounded-lg bg-cyan-950/30 border border-cyan-800/40 text-slate-300 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wide">
              Academic Research Defense Platform
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-xs text-slate-400">DSA Engineering Demonstration</span>
          </div>
          <h1 className="text-lg md:text-xl font-bold text-white mt-1">
            DSL — Digital Forensics Chain of Custody Tracker
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Evidence Integrity & Investigation Management System powered by Linked Lists, Binary Search Trees, and Hierarchical Tree Traversals.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => onNavigate('add')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Intake Evidence</span>
          </button>
          <button
            onClick={() => onNavigate('dsa')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded transition-colors"
          >
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>DSA Lab</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1: Total Evidence */}
        <div className="p-4 rounded-lg bg-slate-900/80 border border-slate-800 flex items-start justify-between">
          <div>
            <div className="text-xs text-slate-400 font-medium">Total Evidence Items</div>
            <div className="text-2xl font-bold text-white mt-1 font-mono tabular-nums">
              {totalEvidence}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Indexed in BST ({bstInstance.getNodeCount()} unique hashes)
            </div>
          </div>
          <div className="p-2 rounded bg-slate-800/80 text-cyan-400 border border-slate-700">
            <FileBox className="w-5 h-5" />
          </div>
        </div>

        {/* Stat 2: Chain of Custody Events */}
        <div className="p-4 rounded-lg bg-slate-900/80 border border-slate-800 flex items-start justify-between">
          <div>
            <div className="text-xs text-slate-400 font-medium">Chain of Custody Events</div>
            <div className="text-2xl font-bold text-white mt-1 font-mono tabular-nums">
              {totalEvents}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Preserved in Linked List (O(1) tail appends)
            </div>
          </div>
          <div className="p-2 rounded bg-slate-800/80 text-emerald-400 border border-slate-700">
            <Link2 className="w-5 h-5" />
          </div>
        </div>

        {/* Stat 3: Integrity Health */}
        <div className="p-4 rounded-lg bg-slate-900/80 border border-slate-800 flex items-start justify-between">
          <div>
            <div className="text-xs text-slate-400 font-medium">Integrity Status</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-2xl font-bold text-white font-mono tabular-nums">
                {verifiedCount}
              </span>
              <span className="text-xs text-emerald-400 font-medium">Verified</span>
              {tamperedCount > 0 && (
                <span className="text-xs text-rose-400 font-medium">({tamperedCount} Tampered)</span>
              )}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {unverifiedCount} awaiting verification
            </div>
          </div>
          <div className="p-2 rounded bg-slate-800/80 text-cyan-400 border border-slate-700">
            {tamperedCount > 0 ? (
              <AlertTriangle className="w-5 h-5 text-rose-400" />
            ) : (
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            )}
          </div>
        </div>

        {/* Stat 4: Forensic Bitstream Volume */}
        <div className="p-4 rounded-lg bg-slate-900/80 border border-slate-800 flex items-start justify-between">
          <div>
            <div className="text-xs text-slate-400 font-medium">Total Acquired Data</div>
            <div className="text-2xl font-bold text-white mt-1 font-mono tabular-nums">
              {formatBytes(totalBytes)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {casesList.length} active investigation cases
            </div>
          </div>
          <div className="p-2 rounded bg-slate-800/80 text-indigo-400 border border-slate-700">
            <HardDrive className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 2-Column Split: Active Investigations & Recent Chain of Custody */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Active Cases & Quick Integrity Verification Action (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Active Cases Card */}
          <div className="p-4 rounded-lg bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-sm font-semibold text-white">Active Forensic Cases</h2>
              <button
                onClick={() => onNavigate('records')}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1"
              >
                <span>View all</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="divide-y divide-slate-800/60 mt-2">
              {casesList.map(c => (
                <div key={c.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-medium text-slate-200">{c.name}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{c.id}</div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-800 text-slate-300">
                    {c.count} items
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Integrity Check Widget */}
          <div className="p-4 rounded-lg bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-semibold text-white">Integrity Hash Verification</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Verify cryptographic authenticity of any evidence file in your custody against baseline SHA-256 hash.
            </p>

            <div className="mt-3.5 space-y-2">
              <button
                onClick={() => onNavigate('verify')}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold text-slate-900 bg-cyan-400 hover:bg-cyan-300 rounded transition-colors"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Launch Integrity Verifier</span>
              </button>
              <button
                onClick={() => onNavigate('search')}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded transition-colors"
              >
                <Search className="w-4 h-4 text-slate-400" />
                <span>Search Evidence by SHA-256 via BST</span>
              </button>
            </div>
          </div>

          {/* Forensic Standard Notice */}
          <div className="p-3.5 rounded-lg border border-slate-800/90 bg-slate-950 text-slate-400 text-xs space-y-1">
            <div className="font-semibold text-slate-300 flex items-center gap-1.5">
              <span>Notice on Demonstration Storage</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              In real digital forensics, evidence records must reside on Write-Once-Read-Many (WORM) optical storage or hardware-secured relational databases with HSM cryptographic signing. This application uses browser localStorage strictly for demonstration purposes.
            </p>
          </div>
        </div>

        {/* Right Column: Live Chain of Custody Event Stream (7 cols) */}
        <div className="lg:col-span-7">
          <div className="p-4 rounded-lg bg-slate-900/80 border border-slate-800 h-full flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Link2 className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-semibold text-white">
                  Chronological Chain of Custody Stream
                </h2>
              </div>
              <button
                onClick={() => onNavigate('custody')}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1"
              >
                <span>Full Chain History</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="mt-3 space-y-3 flex-1 overflow-y-auto">
              {recentEvents.map((evt, idx) => {
                const isTransfer = evt.action === 'TRANSFERRED';
                const isVerified = evt.action === 'VERIFIED';
                const isCollected = evt.action === 'COLLECTED';

                return (
                  <div
                    key={evt.id}
                    className="p-3 rounded border border-slate-800 bg-slate-950/60 relative group hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded font-mono ${
                            isCollected
                              ? 'bg-blue-900/40 text-blue-300 border border-blue-700/50'
                              : isTransfer
                              ? 'bg-amber-900/40 text-amber-300 border border-amber-700/50'
                              : isVerified
                              ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-700/50'
                              : 'bg-purple-900/40 text-purple-300 border border-purple-700/50'
                          }`}
                        >
                          {evt.action}
                        </span>
                        <span className="text-xs font-semibold text-slate-200">
                          {evt.evidenceName || evt.evidenceId}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400 whitespace-nowrap">
                        {new Date(evt.timestamp).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 mt-2 leading-relaxed">{evt.purpose}</p>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-800/60 font-mono">
                      <span>Custodian: {evt.toInvestigator}</span>
                      <span>·</span>
                      <span>Loc: {evt.location}</span>
                      <span>·</span>
                      <span title={evt.hashAtEvent}>
                        SHA-256: {truncateHash(evt.hashAtEvent, 6, 6)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-800 mt-3 flex items-center justify-between text-xs text-slate-400">
              <span className="text-[11px]">
                Linked List Node Sequence: Head ({custodyEvents[0]?.id || 'none'}) → Tail ({custodyEvents[custodyEvents.length - 1]?.id || 'none'})
              </span>
              <button
                onClick={() => onNavigate('custody')}
                className="text-cyan-400 hover:text-cyan-300 font-medium"
              >
                + Append Custody Event
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

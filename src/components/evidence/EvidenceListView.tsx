import React, { useState } from 'react';
import {
  FileBox,
  Search,
  ShieldCheck,
  AlertTriangle,
  Link2,
  FolderTree,
  Copy,
  Check,
  Filter,
  PlusCircle,
  FileText,
  Clock,
} from 'lucide-react';
import { useForensics } from '../../context/ForensicsContext';
import { EvidenceType, VerificationStatus } from '../../types/forensics';
import { truncateHash, formatBytes } from '../../utils/crypto';

interface EvidenceListViewProps {
  onNavigate: (view: string, id?: string) => void;
}

export const EvidenceListView: React.FC<EvidenceListViewProps> = ({ onNavigate }) => {
  const { evidences } = useForensics();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCase, setSelectedCase] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  // Extract distinct cases
  const distinctCases = Array.from(new Set(evidences.map(e => e.caseId)));

  // Filtered evidence items
  const filteredEvidences = evidences.filter(e => {
    const matchesSearch =
      searchQuery === '' ||
      e.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.caseId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.originalHash.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.currentCustodian.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCase = selectedCase === 'all' || e.caseId === selectedCase;
    const matchesType = selectedType === 'all' || e.type === selectedType;
    const matchesStatus =
      selectedStatus === 'all' ||
      (selectedStatus === 'UNVERIFIED' && (!e.lastVerificationStatus || e.lastVerificationStatus === 'UNVERIFIED')) ||
      e.lastVerificationStatus === selectedStatus;

    return matchesSearch && matchesCase && matchesType && matchesStatus;
  });

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase tracking-wide">
            Master Evidence Repository
          </div>
          <h1 className="text-xl font-bold text-white mt-1">Evidence Records & Registry</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Active forensic inventory indexed in the Binary Search Tree for O(log n) hash lookups.
          </p>
        </div>

        <button
          onClick={() => onNavigate('add')}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded transition-colors self-start sm:self-auto"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Intake New Evidence</span>
        </button>
      </div>

      {/* Filter and Search Controls */}
      <div className="p-4 rounded-lg bg-slate-900/90 border border-slate-800 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Filter by ID, name, case, custodian, or hash..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          {/* Case Filter */}
          <div>
            <select
              value={selectedCase}
              onChange={e => setSelectedCase(e.target.value)}
              className="w-full py-2 px-3 text-xs bg-slate-950 border border-slate-700 rounded text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            >
              <option value="all">All Investigation Cases</option>
              {distinctCases.map(c => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="w-full py-2 px-3 text-xs bg-slate-950 border border-slate-700 rounded text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            >
              <option value="all">All Verification States</option>
              <option value="VERIFIED">Verified Baseline</option>
              <option value="TAMPERED">Tamper Alert</option>
              <option value="UNVERIFIED">Pending Verification</option>
            </select>
          </div>
        </div>

        {/* Filter Count Summary */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
          <div className="flex items-center gap-2">
            <span>Showing <strong className="text-white font-mono">{filteredEvidences.length}</strong> of <span className="font-mono">{evidences.length}</span> evidence items</span>
            {(searchQuery || selectedCase !== 'all' || selectedStatus !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCase('all');
                  setSelectedStatus('all');
                }}
                className="text-cyan-400 hover:underline text-[11px] ml-2"
              >
                Reset filters
              </button>
            )}
          </div>
          <span className="text-[11px] text-slate-400">
            Fictional demo dataset for academic presentation
          </span>
        </div>
      </div>

      {/* High-Density Evidence Table */}
      <div className="rounded-lg border border-slate-800 bg-slate-900/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/70 text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Evidence ID & Type</th>
                <th className="py-3 px-4">Artifact Name & Size</th>
                <th className="py-3 px-4">SHA-256 Fingerprint</th>
                <th className="py-3 px-4">Case & Seizure Authority</th>
                <th className="py-3 px-4">Current Custodian</th>
                <th className="py-3 px-4">Integrity Status</th>
                <th className="py-3 px-4 text-right">Forensic Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredEvidences.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <FileBox className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                    <p className="text-sm font-medium text-slate-400">No evidence records found matching criteria</p>
                    <p className="text-xs text-slate-500 mt-1">Try clearing your search query or filters.</p>
                  </td>
                </tr>
              ) : (
                filteredEvidences.map(evidence => {
                  const isVerified = evidence.lastVerificationStatus === 'VERIFIED';
                  const isTampered = evidence.lastVerificationStatus === 'TAMPERED';

                  return (
                    <tr
                      key={evidence.id}
                      className="hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* ID & Type */}
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-cyan-300">{evidence.id}</div>
                        <div className="text-[11px] text-slate-400">{evidence.type}</div>
                      </td>

                      {/* Name & Size */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-200 max-w-xs truncate" title={evidence.name}>
                          {evidence.name}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {formatBytes(evidence.fileSizeBytes)}
                        </div>
                      </td>

                      {/* SHA-256 Hash */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-300">
                          <span title={evidence.originalHash}>
                            {truncateHash(evidence.originalHash, 8, 8)}
                          </span>
                          <button
                            onClick={() => handleCopyHash(evidence.originalHash)}
                            className="text-slate-400 hover:text-cyan-300 transition-colors p-1"
                            title="Copy full 64-char SHA-256"
                          >
                            {copiedHash === evidence.originalHash ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Case Info */}
                      <td className="py-3 px-4">
                        <div className="text-slate-300 font-mono text-[11px]">{evidence.caseId}</div>
                        <div className="text-[11px] text-slate-400 max-w-[180px] truncate" title={evidence.caseName}>
                          {evidence.caseName}
                        </div>
                      </td>

                      {/* Custodian */}
                      <td className="py-3 px-4">
                        <div className="text-slate-200 font-medium">{evidence.currentCustodian}</div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[140px]" title={evidence.storageLocation}>
                          {evidence.storageLocation}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        {isVerified && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Verified</span>
                          </span>
                        )}
                        {isTampered && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-400">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Tampered!</span>
                          </span>
                        )}
                        {!isVerified && !isTampered && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Unverified</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onNavigate('verify', evidence.id)}
                            className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-slate-800 rounded transition-colors"
                            title="Verify Hash Integrity"
                          >
                            <ShieldCheck className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onNavigate('custody', evidence.id)}
                            className="p-1.5 text-slate-400 hover:text-emerald-300 hover:bg-slate-800 rounded transition-colors"
                            title="View Chain of Custody Timeline"
                          >
                            <Link2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onNavigate('reports', evidence.id)}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                            title="Generate Official Custody Report"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

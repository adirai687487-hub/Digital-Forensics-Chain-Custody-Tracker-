import React, { useState } from 'react';
import {
  Search,
  Binary,
  ShieldCheck,
  FileBox,
  ArrowRight,
  GitFork,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  CornerDownRight,
} from 'lucide-react';
import { useForensics } from '../../context/ForensicsContext';
import { Evidence, BSTSearchStep } from '../../types/forensics';
import { truncateHash, formatBytes } from '../../utils/crypto';

interface SearchViewProps {
  onNavigate: (view: string, id?: string) => void;
}

export const SearchView: React.FC<SearchViewProps> = ({ onNavigate }) => {
  const { evidences, searchByHashInBST, searchAll, bstInstance } = useForensics();

  const [activeTab, setActiveTab] = useState<'bst_hash' | 'general'>('bst_hash');
  
  // BST Hash Search State
  const [hashInput, setHashInput] = useState('');
  const [bstResult, setBstResult] = useState<{
    matches: Evidence[];
    steps: BSTSearchStep[];
    comparisons: number;
    found: boolean;
    searched: boolean;
  }>({
    matches: [],
    steps: [],
    comparisons: 0,
    found: false,
    searched: false,
  });

  // General Search State
  const [generalQuery, setGeneralQuery] = useState('');
  const [generalResults, setGeneralResults] = useState<Evidence[]>([]);
  const [hasGeneralSearched, setHasGeneralSearched] = useState(false);

  // Quick sample hashes from dataset
  const sampleHashes = [
    {
      label: 'laptop_image.dd (EVD-101)',
      hash: '8a91bc724a2ef69e120f4c3b99ef871b0521e4a3c448bb90192e412356789abc',
    },
    {
      label: 'browser_history.log (EVD-102)',
      hash: '72bc91aa561234efc8901234567890abcdef1234567890abcdef1234567890ab',
    },
    {
      label: 'Duplicate Payload (EVD-105 & EVD-106)',
      hash: 'e7f1234567890abcdef1234567890abcdef1234567890abcdef1234567890abc',
    },
    {
      label: 'Non-Existent Unregistered Hash',
      hash: 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
    },
  ];

  const handleBstSearch = (e?: React.FormEvent, customHash?: string) => {
    if (e) e.preventDefault();
    const target = (customHash || hashInput).trim().toLowerCase();
    if (!target) return;

    if (customHash) setHashInput(customHash);

    const result = searchByHashInBST(target);
    setBstResult({
      matches: result.matches,
      steps: result.steps,
      comparisons: result.comparisons,
      found: result.found,
      searched: true,
    });
  };

  const handleGeneralSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!generalQuery.trim()) return;
    const res = searchAll(generalQuery);
    setGeneralResults(res);
    setHasGeneralSearched(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase tracking-wide">
            Forensic Query Engine
          </div>
          <h1 className="text-xl font-bold text-white mt-1">Evidence Search</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Query across evidence metadata or execute direct cryptographic lookup via Binary Search Tree (BST).
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('bst_hash')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'bst_hash'
                ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            BST Hash Lookup (O(log n))
          </button>
          <button
            onClick={() => setActiveTab('general')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'general'
                ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Metadata Search (ID / Case / Name)
          </button>
        </div>
      </div>

      {/* Mode 1: Binary Search Tree Hash Lookup */}
      {activeTab === 'bst_hash' && (
        <div className="space-y-6">
          {/* Search Box Card */}
          <div className="p-5 rounded-lg bg-slate-900/90 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Binary className="w-4 h-4 text-cyan-400" />
                <h2 className="text-sm font-semibold text-white">
                  Binary Search Tree Hash Index Search
                </h2>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                In-Memory BST: {bstInstance.getNodeCount()} nodes · Height: {bstInstance.getTreeHeight()}
              </span>
            </div>

            <form onSubmit={handleBstSearch} className="space-y-3">
              <div className="relative">
                <input
                  type="text"
                  value={hashInput}
                  onChange={e => setHashInput(e.target.value)}
                  placeholder="Enter complete 64-character SHA-256 fingerprint (e.g. 8a91bc72...)"
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2.5 text-xs font-mono text-cyan-300 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
                  <span className="text-[11px]">Test with demo hashes:</span>
                  {sampleHashes.map((s, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleBstSearch(undefined, s.hash)}
                      className="px-2 py-0.5 text-[10px] bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-slate-300 transition-colors"
                    >
                      {s.label}
                    </button>
                  ))}
                </div>

                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded transition-colors whitespace-nowrap"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Traverse BST</span>
                </button>
              </div>
            </form>
          </div>

          {/* Search Execution Results & Path Visualization */}
          {bstResult.searched && (
            <div className="space-y-6">
              {/* Algorithm Execution Metrics Card */}
              <div className="p-4 rounded-lg bg-slate-900/90 border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="space-y-1">
                  <div className="text-slate-400">Search Outcome</div>
                  <div className="font-semibold text-white flex items-center gap-1.5 text-sm">
                    {bstResult.found ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-400">
                          Evidence Found ({bstResult.matches.length} {bstResult.matches.length === 1 ? 'record' : 'records (Duplicate Hash)'})
                        </span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 text-rose-400" />
                        <span className="text-rose-400">No Hash Match in Custody</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-slate-400">BST Tree Comparisons Made</div>
                  <div className="font-mono font-bold text-cyan-300 text-sm">
                    {bstResult.comparisons} node comparison(s)
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Worst-case linear comparison would take {evidences.length} steps
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-slate-400">Complexity Evaluation</div>
                  <div className="font-mono text-slate-200">
                    O(log n) tree depth traversal
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Theoretical max comparisons for height {bstInstance.getTreeHeight()}: {bstInstance.getTreeHeight()}
                  </div>
                </div>
              </div>

              {/* Step-by-Step Traversal Trace (Examiner Visual Walkthrough) */}
              <div className="p-4 rounded-lg bg-slate-900/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <GitFork className="w-4 h-4 text-indigo-400" />
                    <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
                      BST Traversal Trace Steps (Visual Proof for Examiners)
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Slide 7: Compare target hash & branch left/right
                  </span>
                </div>

                <div className="space-y-2 mt-2">
                  {bstResult.steps.map((st, i) => {
                    const isFound = st.direction === 'FOUND';
                    const isLeft = st.direction === 'LEFT';
                    const isRight = st.direction === 'RIGHT';

                    return (
                      <div
                        key={i}
                        className={`p-3 rounded border text-xs font-mono flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                          isFound
                            ? 'bg-emerald-950/40 border-emerald-800 text-emerald-200'
                            : 'bg-slate-950/70 border-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-cyan-400 font-bold">Step {st.stepNumber}:</span>
                          <span className="text-slate-400">Node Hash [{truncateHash(st.currentHash, 6, 6)}]</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <CornerDownRight className="w-3.5 h-3.5 text-slate-500" />
                          <span>
                            {st.comparison === 'EQUAL' && 'Target == Node Hash -> Exact Match Found!'}
                            {st.comparison === 'LESS_THAN' && 'Target < Node Hash -> Branching to LEFT Subtree'}
                            {st.comparison === 'GREATER_THAN' && 'Target > Node Hash -> Branching to RIGHT Subtree'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Matching Evidence Cards */}
              {bstResult.matches.length > 0 && (
                <div className="space-y-3">
                  <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Mapped Evidence Records
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {bstResult.matches.map(item => (
                      <div
                        key={item.id}
                        className="p-4 rounded-lg bg-slate-900 border border-slate-700/80 space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="font-mono text-cyan-300 font-bold text-xs">{item.id}</span>
                            <h4 className="text-sm font-semibold text-white mt-0.5">{item.name}</h4>
                            <div className="text-[11px] text-slate-400">{item.type} · {formatBytes(item.fileSizeBytes)}</div>
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                            {item.caseId}
                          </span>
                        </div>

                        <div className="text-xs text-slate-300 space-y-1 bg-slate-950/60 p-2.5 rounded border border-slate-800">
                          <div><span className="text-slate-500">Custodian:</span> {item.currentCustodian}</div>
                          <div><span className="text-slate-500">Location:</span> {item.storageLocation}</div>
                          <div><span className="text-slate-500">Seized by:</span> {item.investigatorName} ({item.investigatorBadge})</div>
                        </div>

                        <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                          <button
                            onClick={() => onNavigate('custody', item.id)}
                            className="text-cyan-400 hover:underline flex items-center gap-1"
                          >
                            <span>Inspect custody chain</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => onNavigate('verify', item.id)}
                            className="text-emerald-400 hover:underline flex items-center gap-1"
                          >
                            <span>Verify integrity</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Mode 2: General Metadata Search */}
      {activeTab === 'general' && (
        <div className="space-y-6">
          <div className="p-5 rounded-lg bg-slate-900/90 border border-slate-800 space-y-4">
            <h2 className="text-sm font-semibold text-white">General Evidence Repository Query</h2>
            <form onSubmit={handleGeneralSearch} className="flex gap-2">
              <input
                type="text"
                value={generalQuery}
                onChange={e => setGeneralQuery(e.target.value)}
                placeholder="Search by Evidence ID, Artifact Name, Case ID, or Investigator..."
                className="flex-1 bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded transition-colors flex items-center gap-1.5"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Search</span>
              </button>
            </form>
          </div>

          {hasGeneralSearched && (
            <div className="space-y-3">
              <div className="text-xs text-slate-400">
                Found <strong className="text-white font-mono">{generalResults.length}</strong> matching record(s) for query "{generalQuery}"
              </div>

              {generalResults.length === 0 ? (
                <div className="p-8 text-center bg-slate-900/50 rounded-lg border border-slate-800 text-slate-400 text-xs">
                  No matching evidence records found.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {generalResults.map(item => (
                    <div
                      key={item.id}
                      className="p-4 rounded-lg bg-slate-900 border border-slate-800 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-cyan-300">{item.id}</span>
                        <span className="text-[11px] text-slate-400 font-mono">{item.caseId}</span>
                      </div>
                      <div className="font-semibold text-white">{item.name}</div>
                      <div className="text-slate-400 text-[11px] font-mono">{truncateHash(item.originalHash, 8, 8)}</div>
                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                        <span className="text-slate-400">Custodian: {item.currentCustodian}</span>
                        <button
                          onClick={() => onNavigate('custody', item.id)}
                          className="text-cyan-400 hover:underline text-[11px]"
                        >
                          View custody trail
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

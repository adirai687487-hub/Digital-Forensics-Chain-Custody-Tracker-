import React, { useState } from 'react';
import {
  Binary,
  Link2,
  FolderTree,
  Cpu,
  ArrowRight,
  GitFork,
  CheckCircle2,
  HelpCircle,
  Play,
  RotateCcw,
  Layers,
  ArrowDown,
  Table,
  Zap,
} from 'lucide-react';
import { useForensics } from '../../context/ForensicsContext';
import { truncateHash } from '../../utils/crypto';
import { BSTNodeData } from '../../types/forensics';

interface DsaDemonstrationViewProps {
  onNavigate: (view: string, id?: string) => void;
}

export const DsaDemonstrationView: React.FC<DsaDemonstrationViewProps> = ({ onNavigate }) => {
  const { bstInstance, custodyEvents, evidenceTree, evidences } = useForensics();

  const [activeDsaTab, setActiveDsaTab] = useState<'bst' | 'linked_list' | 'complexity' | 'traversal'>('bst');

  // Traversal order selection for BST
  const [traversalType, setTraversalType] = useState<'IN_ORDER' | 'PRE_ORDER' | 'POST_ORDER'>('IN_ORDER');

  // Interactive Live Benchmark
  const [benchmarkResult, setBenchmarkResult] = useState<{
    bstSearchTimeMs: number;
    linearSearchTimeMs: number;
    bstComparisons: number;
    linearComparisons: number;
    targetHash: string;
  } | null>(null);

  // Get traversals from BST instance
  const inOrderData = bstInstance.inOrder();
  const preOrderData = bstInstance.preOrder();
  const postOrderData = bstInstance.postOrder();

  const currentTraversal =
    traversalType === 'IN_ORDER'
      ? inOrderData
      : traversalType === 'PRE_ORDER'
      ? preOrderData
      : postOrderData;

  // Run live comparative benchmark between BST O(log n) vs Linear Search O(n)
  const handleRunBenchmark = () => {
    if (evidences.length === 0) return;
    const target = evidences[evidences.length - 1].originalHash;

    // Benchmark BST
    const t0 = performance.now();
    const bstRes = bstInstance.searchWithSteps(target);
    const t1 = performance.now();

    // Benchmark Linear Array Search
    const t2 = performance.now();
    let linearComps = 0;
    for (let i = 0; i < evidences.length; i++) {
      linearComps++;
      if (evidences[i].originalHash === target) break;
    }
    const t3 = performance.now();

    setBenchmarkResult({
      bstSearchTimeMs: Number((t1 - t0).toFixed(4)),
      linearSearchTimeMs: Number((t3 - t2).toFixed(4)),
      bstComparisons: bstRes.comparisons,
      linearComparisons: linearComps,
      targetHash: target,
    });
  };

  // Helper to render BST tree nodes recursively in a hierarchical visual view
  const renderBstVisualTree = (node: BSTNodeData | null, depth = 0, side = 'root'): React.ReactNode => {
    if (!node) return null;

    const hasDuplicates = node.evidenceIds.length > 1;

    return (
      <div key={`${node.hash}-${depth}`} className="flex flex-col items-center my-1">
        {/* Node Box */}
        <div
          className={`p-2.5 rounded border text-center transition-all ${
            hasDuplicates
              ? 'bg-amber-950/40 border-amber-500/80 text-amber-200'
              : 'bg-slate-900 border-cyan-500/50 text-cyan-200'
          }`}
          title={`Full Hash: ${node.hash}\nMapped IDs: ${node.evidenceIds.join(', ')}`}
        >
          <div className="text-[10px] uppercase font-mono text-slate-400">
            {side === 'root' ? 'ROOT NODE' : `${side.toUpperCase()} BRANCH`} · Depth {depth}
          </div>
          <div className="font-mono text-xs font-bold text-white mt-0.5">
            {truncateHash(node.hash, 6, 6)}
          </div>
          <div className="text-[10px] text-cyan-400 font-mono mt-1">
            {node.evidenceIds.length} Evidence {node.evidenceIds.length === 1 ? 'ID' : 'IDs (DUPLICATE BUCKET)'}: [{node.evidenceIds.join(', ')}]
          </div>
        </div>

        {/* Children Branches */}
        {(node.left || node.right) && (
          <div className="flex gap-4 md:gap-8 pt-3 relative">
            <div className="flex flex-col items-center">
              {node.left ? (
                <>
                  <div className="text-[10px] text-slate-500 font-mono mb-1">← Left (&lt;)</div>
                  {renderBstVisualTree(node.left, depth + 1, 'left')}
                </>
              ) : (
                <div className="text-[10px] text-slate-600 font-mono italic p-2 border border-dashed border-slate-800 rounded">
                  Null Left
                </div>
              )}
            </div>

            <div className="flex flex-col items-center">
              {node.right ? (
                <>
                  <div className="text-[10px] text-slate-500 font-mono mb-1">Right (&gt;) →</div>
                  {renderBstVisualTree(node.right, depth + 1, 'right')}
                </>
              ) : (
                <div className="text-[10px] text-slate-600 font-mono italic p-2 border border-dashed border-slate-800 rounded">
                  Null Right
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase tracking-wide">
            Undergraduate Research Defense Laboratory
          </div>
          <h1 className="text-xl font-bold text-white mt-1">
            Data Structures & Algorithms Demonstration
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Ajeenkya DY Patil University Project: Practical applications of Linked Lists, Binary Search Trees, and Hierarchical Recursion.
          </p>
        </div>

        {/* DSA Nav Buttons */}
        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1 self-start sm:self-auto overflow-x-auto">
          <button
            onClick={() => setActiveDsaTab('bst')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
              activeDsaTab === 'bst'
                ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Binary Search Tree (Hash Index)
          </button>
          <button
            onClick={() => setActiveDsaTab('linked_list')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
              activeDsaTab === 'linked_list'
                ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Linked List (Custody Chain)
          </button>
          <button
            onClick={() => setActiveDsaTab('complexity')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
              activeDsaTab === 'complexity'
                ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Complexity & Viva Matrix
          </button>
        </div>
      </div>

      {/* SECTION 1: BINARY SEARCH TREE DEMONSTRATION */}
      {activeDsaTab === 'bst' && (
        <div className="space-y-6">
          {/* Theory & Architecture Banner (Matches Slide 7) */}
          <div className="p-4 rounded-lg bg-slate-900/80 border border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1">
              <span className="text-cyan-400 font-semibold uppercase text-[11px] font-mono">
                Slide 7: struct BSTNode
              </span>
              <p className="text-slate-300 font-mono text-[11px] leading-relaxed">
                string hash; <br />
                int evidenceID; // + duplicate bucket <br />
                BSTNode* left; <br />
                BSTNode* right;
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-emerald-400 font-semibold uppercase text-[11px]">
                Duplicate Hash Support
              </span>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                In malware outbreaks or multi-host breaches, multiple evidence items share identical SHA-256 hashes. Our BST node groups them in an evidence array bucket rather than dropping collisions.
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-indigo-400 font-semibold uppercase text-[11px]">
                Asymptotic Complexity
              </span>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                Average Search: <strong className="text-white font-mono">O(log n)</strong><br />
                Worst Case (Unbalanced): <strong className="text-rose-300 font-mono">O(n)</strong><br />
                In-Order Traversal: <strong className="text-cyan-300 font-mono">O(n) Sorted Array</strong>
              </p>
            </div>
          </div>

          {/* Interactive Benchmark Button */}
          <div className="p-4 rounded-lg bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
                  Live Asymptotic Comparison: BST Search O(log n) vs Linear Search O(n)
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Execute live lookup on the latest cataloged evidence item to compare comparison steps.
              </p>
            </div>

            <button
              onClick={handleRunBenchmark}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded transition-colors whitespace-nowrap self-start sm:self-auto"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Run Live Benchmark</span>
            </button>
          </div>

          {/* Benchmark Output Card */}
          {benchmarkResult && (
            <div className="p-4 rounded-lg bg-slate-950 border border-amber-500/40 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-3 rounded bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-cyan-400 font-bold">Binary Search Tree (O(log n)):</span>
                <div className="text-white font-semibold text-sm">
                  {benchmarkResult.bstComparisons} tree node comparisons
                </div>
                <div className="text-slate-400 text-[11px]">
                  Execution time: {benchmarkResult.bstSearchTimeMs} ms
                </div>
              </div>

              <div className="p-3 rounded bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-rose-400 font-bold">Unindexed Linear Search (O(n)):</span>
                <div className="text-white font-semibold text-sm">
                  {benchmarkResult.linearComparisons} sequential inspections
                </div>
                <div className="text-slate-400 text-[11px]">
                  Requires linear scanning through entire inventory
                </div>
              </div>
            </div>
          )}

          {/* Visual BST Hierarchy Canvas */}
          <div className="p-5 rounded-lg bg-slate-950 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <GitFork className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
                  In-Memory BST Visual Graph ({bstInstance.getNodeCount()} Nodes · Height {bstInstance.getTreeHeight()})
                </h3>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                Lexicographical Hex Ordering (0-9, a-f)
              </span>
            </div>

            <div className="overflow-x-auto p-4 flex justify-center min-h-[280px]">
              {renderBstVisualTree(bstInstance.getRoot())}
            </div>
          </div>

          {/* BST Traversals Display (In-Order, Pre-Order, Post-Order) */}
          <div className="p-5 rounded-lg bg-slate-900/80 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
                  BST Traversal Algorithm Output (Slide 11 Option 6)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Notice how In-Order traversal naturally yields alphabetically sorted SHA-256 hashes!
                </p>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded border border-slate-800">
                <button
                  onClick={() => setTraversalType('IN_ORDER')}
                  className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
                    traversalType === 'IN_ORDER'
                      ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  In-Order (Sorted)
                </button>
                <button
                  onClick={() => setTraversalType('PRE_ORDER')}
                  className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
                    traversalType === 'PRE_ORDER'
                      ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Pre-Order
                </button>
                <button
                  onClick={() => setTraversalType('POST_ORDER')}
                  className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
                    traversalType === 'POST_ORDER'
                      ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Post-Order
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] text-slate-500 font-mono">
                    <th className="py-2 px-3">#</th>
                    <th className="py-2 px-3">Tree Depth</th>
                    <th className="py-2 px-3">Full SHA-256 Hash Key</th>
                    <th className="py-2 px-3">Mapped Evidence IDs</th>
                    <th className="py-2 px-3">Duplicate Detection</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                  {currentTraversal.map((item, idx) => {
                    const isDup = item.evidenceIds.length > 1;
                    return (
                      <tr key={idx} className="hover:bg-slate-800/40">
                        <td className="py-2 px-3 text-slate-500">{idx + 1}</td>
                        <td className="py-2 px-3 text-indigo-400">Depth {item.depth}</td>
                        <td className="py-2 px-3 text-cyan-300 select-all">{item.hash}</td>
                        <td className="py-2 px-3 text-white font-bold">
                          {item.evidenceIds.join(', ')}
                        </td>
                        <td className="py-2 px-3">
                          {isDup ? (
                            <span className="text-amber-400 font-sans font-semibold">
                              Yes ({item.evidenceIds.length} copies)
                            </span>
                          ) : (
                            <span className="text-slate-500 font-sans">Unique</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: LINKED LIST DEMONSTRATION */}
      {activeDsaTab === 'linked_list' && (
        <div className="space-y-6">
          {/* Theory Banner (Slide 6) */}
          <div className="p-4 rounded-lg bg-slate-900/80 border border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1">
              <span className="text-emerald-400 font-semibold uppercase text-[11px] font-mono">
                Slide 6: struct Evidence
              </span>
              <p className="text-slate-300 font-mono text-[11px] leading-relaxed">
                int id; <br />
                string name, type, hash; <br />
                string timestamp, investigator; <br />
                Evidence* next;
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-cyan-400 font-semibold uppercase text-[11px]">
                Why Linked List for Chain of Custody?
              </span>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                Each new custody event is appended to the tail without shifting existing memory records. The history is strictly chronological and tamper-evident: altering an interior node breaks the pointer chain.
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-indigo-400 font-semibold uppercase text-[11px]">
                Complexity Analysis
              </span>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                Append with tail pointer: <strong className="text-emerald-400 font-mono">O(1)</strong><br />
                Search by Event ID: <strong className="text-amber-300 font-mono">O(n)</strong><br />
                Chronological traversal: <strong className="text-cyan-300 font-mono">O(n)</strong>
              </p>
            </div>
          </div>

          {/* Interactive Memory Pointer Chain Map */}
          <div className="p-5 rounded-lg bg-slate-950 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Link2 className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
                  Live Pointer Chain: Head Pointer → Nodes → Tail Pointer
                </h3>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                Total Nodes: {custodyEvents.length}
              </span>
            </div>

            {/* Pointer Chain Visualization */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
                <span>Head Pointer [0x7ffe0001] →</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {custodyEvents.map((evt, idx) => {
                  const isLast = idx === custodyEvents.length - 1;

                  return (
                    <div
                      key={evt.id}
                      className="p-3 rounded-lg bg-slate-900 border border-slate-700/80 space-y-2 text-xs relative"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-cyan-300">
                          Node #{idx + 1} [{evt.id}]
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                          {evt.action}
                        </span>
                      </div>

                      <div className="text-slate-200 font-medium truncate" title={evt.evidenceName}>
                        {evt.evidenceName || evt.evidenceId}
                      </div>

                      <div className="text-[11px] text-slate-400">
                        {evt.fromInvestigator} → {evt.toInvestigator}
                      </div>

                      <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] font-mono">
                        <span className="text-slate-500">
                          *next: {isLast ? 'nullptr / NULL' : `[Node #${idx + 2}]`}
                        </span>
                        {isLast && (
                          <span className="text-emerald-400 font-semibold">
                            ← Tail Pointer [O(1) Append Target]
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: COMPLEXITY & DEFENSE MATRIX (Slide 13 & 14) */}
      {activeDsaTab === 'complexity' && (
        <div className="space-y-6">
          {/* Complexity Table (Direct from Slide 13) */}
          <div className="p-5 rounded-lg bg-slate-900/80 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Table className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
                  Slide 13: Time & Space Complexity Reference Matrix
                </h3>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                Academic Project Defense Specifications
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/70 text-[11px] text-cyan-400 uppercase font-mono">
                    <th className="py-3 px-4">Operation</th>
                    <th className="py-3 px-4">Typical / Average Time</th>
                    <th className="py-3 px-4">Worst-Case Time</th>
                    <th className="py-3 px-4">Auxiliary Space Complexity</th>
                    <th className="py-3 px-4">Data Structure Applied</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                  <tr className="hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-bold text-white">Linked List Append</td>
                    <td className="py-3 px-4 text-emerald-400">O(1) with tail pointer</td>
                    <td className="py-3 px-4 text-slate-400">O(n) if linear search needed</td>
                    <td className="py-3 px-4 text-cyan-300">O(1) node allocation</td>
                    <td className="py-3 px-4 font-sans text-slate-400">Custody Event Chain</td>
                  </tr>

                  <tr className="hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-bold text-white">Linked List Search by ID</td>
                    <td className="py-3 px-4 text-amber-400">O(n)</td>
                    <td className="py-3 px-4 text-amber-400">O(n)</td>
                    <td className="py-3 px-4 text-cyan-300">O(1) extra pointers</td>
                    <td className="py-3 px-4 font-sans text-slate-400">Custody Audit Ledger</td>
                  </tr>

                  <tr className="hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-bold text-white">BST Hash Search</td>
                    <td className="py-3 px-4 text-emerald-400">O(log n)</td>
                    <td className="py-3 px-4 text-rose-400">O(n) (degenerate tree)</td>
                    <td className="py-3 px-4 text-cyan-300">O(1) iterative / O(log n) stack</td>
                    <td className="py-3 px-4 font-sans text-slate-400">Fast Fingerprint Lookup</td>
                  </tr>

                  <tr className="hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-bold text-white">BST Insertion</td>
                    <td className="py-3 px-4 text-emerald-400">O(log n)</td>
                    <td className="py-3 px-4 text-rose-400">O(n) (skewed tree)</td>
                    <td className="py-3 px-4 text-cyan-300">O(1) node allocation</td>
                    <td className="py-3 px-4 font-sans text-slate-400">Evidence Registry Index</td>
                  </tr>

                  <tr className="hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-bold text-white">Evidence Tree Traversal</td>
                    <td className="py-3 px-4 text-indigo-400">O(n) nodes visited</td>
                    <td className="py-3 px-4 text-indigo-400">O(n) total nodes</td>
                    <td className="py-3 px-4 text-amber-300">O(h) stack memory (depth h)</td>
                    <td className="py-3 px-4 font-sans text-slate-400">Recursive Directory / Zip Walk</td>
                  </tr>

                  <tr className="hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-bold text-white">SHA-256 Hash Calculation</td>
                    <td className="py-3 px-4 text-cyan-400">O(file size bytes)</td>
                    <td className="py-3 px-4 text-cyan-400">O(file size bytes)</td>
                    <td className="py-3 px-4 text-cyan-300">O(1) 64-byte chunk buffer</td>
                    <td className="py-3 px-4 font-sans text-slate-400">Web Crypto API FIPS 180-4</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Advantages & Limitations (Slide 14 & 15) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Advantages */}
            <div className="p-4 rounded-lg bg-emerald-950/20 border border-emerald-800/50 space-y-2">
              <h4 className="text-sm font-bold text-emerald-300">
                Advantages of DSA-Driven Architecture (Slide 14)
              </h4>
              <ul className="space-y-1.5 text-slate-300 list-disc list-inside">
                <li>Multiple DSA concepts seamlessly integrated into one production-grade application.</li>
                <li>Clear chronological custody trail: Linked list guarantees append-only historical audit.</li>
                <li>Fast average hash lookup with BST ($O(\log n)$) without linear scan penalty.</li>
                <li>Recursive tree structure naturally models nested directories, zip archives, and raw partitions.</li>
                <li>Decoupled memory design allows straightforward migration to enterprise SQL or graph databases.</li>
              </ul>
            </div>

            {/* Limitations & Future Enhancements */}
            <div className="p-4 rounded-lg bg-amber-950/20 border border-amber-800/50 space-y-2">
              <h4 className="text-sm font-bold text-amber-300">
                Limitations & Future Enhancements (Slide 14 & 15)
              </h4>
              <ul className="space-y-1.5 text-slate-300 list-disc list-inside">
                <li>Normal BST can become unbalanced ($O(n)$ worst-case); upgrading to an <strong>AVL Tree or Red-Black Tree</strong> guarantees strict $O(\log n)$ balance via rotations.</li>
                <li>Browser localStorage is non-immutable and designed for academic demonstration; production systems require certified WORM storage and hardware security modules (HSMs).</li>
                <li>Hash matching detects modification but does not identify the actor; requires digital signatures.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

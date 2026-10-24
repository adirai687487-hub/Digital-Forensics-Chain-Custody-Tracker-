import React, { useState } from 'react';
import {
  Info,
  GraduationCap,
  ShieldAlert,
  Database,
  RotateCcw,
  Trash2,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  FileCheck,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { useForensics } from '../../context/ForensicsContext';

export const AboutDefenseView: React.FC = () => {
  const {
    resetToDemoData,
    clearAllData,
    exportDatabaseJson,
    importDatabaseJson,
    evidences,
    custodyEvents,
  } = useForensics();

  const [importJsonText, setImportJsonText] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [activeFaq, setActiveFaq] = useState<number | null>(0);

  const handleReset = () => {
    if (window.confirm('Reset all evidence, custody events, and trees to university demo data?')) {
      resetToDemoData();
    }
  };

  const handleClear = () => {
    if (window.confirm('WARNING: Clear entire in-memory and localStorage database?')) {
      clearAllData();
    }
  };

  const handleDownloadBackup = () => {
    const json = exportDatabaseJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Forensics_DSA_Database_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    if (!importJsonText.trim()) return;
    const res = importDatabaseJson(importJsonText);
    if (res.success) {
      setImportStatus('Database successfully restored from JSON!');
      setImportJsonText('');
    } else {
      setImportStatus(`Import Error: ${res.error}`);
    }
  };

  const vivaQuestions = [
    {
      q: 'Why did you select a Singly Linked List for the Chain of Custody?',
      a: 'In digital forensics, custody records are strictly chronological and append-only (NIST SP 800-86). Each new transfer event is appended to the tail node in O(1) time without shifting existing elements in memory. Singly linked pointers also form a natural cryptographic link where deleting or altering an interior event node breaks the pointer chain and invalidates the audit trail.',
    },
    {
      q: 'Why use a Binary Search Tree (BST) for hash lookup instead of a hash table or linear array?',
      a: 'A linear array requires O(n) sequential comparisons, which is inefficient across thousands of forensic artifacts. A standard BST achieves average-case O(log n) search and insertion by comparing SHA-256 strings lexicographically. Furthermore, an In-Order traversal of our BST yields an alphabetically sorted index of cryptographic fingerprints in O(n) time, enabling sorted forensic report generation without an external sort phase.',
    },
    {
      q: 'How does your BST handle duplicate hashes when identical files appear across multiple computers?',
      a: 'Our BSTNode implementation (struct BSTNode) stores an array bucket of evidenceIds (evidenceIds: string[]) for each unique 64-character hash key. If identical malware or exfiltrated files exist on multiple machines (e.g., EVD-2026-105 on workstation WS-ENG-04 and EVD-2026-106 on finance server SRV-FIN-01), the hash key resolves to a single tree node referencing both evidence items.',
    },
    {
      q: 'What is the worst-case limitation of a standard BST, and how would you resolve it?',
      a: 'As noted in Slide 14 & 15, if evidence hashes are inserted in pre-sorted order, a standard BST degenerates into a linear linked list with O(n) worst-case search and insertion. In production, this is solved by upgrading to a self-balancing tree such as an AVL Tree or Red-Black Tree, which guarantees strict O(log n) balance through tree rotations.',
    },
    {
      q: 'Why is recursion used for the Evidence Tree, and what is its memory complexity?',
      a: 'Forensic targets are inherently hierarchical: a physical machine contains drives, drives contain partitions, partitions contain directories, and directories contain nested archive containers (.zip, .tar.gz) which encapsulate files. Recursive traversal (displayTree(root)) visits all n nodes in O(n) time with O(h) auxiliary memory on the call stack, where h is the maximum nesting depth.',
    },
    {
      q: 'Why is browser localStorage not suitable for real court-admissible forensic storage?',
      a: 'Browser localStorage is client-side, mutable, and lacks hardware write-blocking or cryptographic non-repudiation. In real criminal forensics, evidence records must reside on Write-Once-Read-Many (WORM) optical storage, secure relational databases with role-based access control (RBAC), and hardware security modules (HSMs) generating digital signatures.',
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase tracking-wide">
          Undergraduate Research Project Defense
        </div>
        <h1 className="text-xl font-bold text-white mt-1">
          Project Defense Guide & Academic Documentation
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          DSL — Digital Forensics Chain of Custody Tracker: Management Using DSA.
        </p>
      </div>

      {/* University & Author Credit Card */}
      <div className="p-5 rounded-lg bg-slate-900/90 border border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-cyan-400 font-semibold text-sm">
            <GraduationCap className="w-5 h-5" />
            <span>Academic Affiliation</span>
          </div>
          <div className="text-xs text-slate-300 space-y-1">
            <div className="font-bold text-white text-sm">Ajeenkya DY Patil University</div>
            <div>School of Engineering · Undergraduate Research Project Defense</div>
            <div className="text-slate-400">
              Project Domain: Cybersecurity · Digital Forensics · Data Structures & Algorithms
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
            Student Research Presenters
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-950 rounded border border-slate-800 space-y-1">
              <div className="font-bold text-white">Joe Jelson J</div>
              <div className="text-cyan-400 font-mono text-[11px]">E25B000152</div>
              <div className="text-slate-500 text-[10px]">Undergraduate Researcher</div>
            </div>

            <div className="p-3 bg-slate-950 rounded border border-slate-800 space-y-1">
              <div className="font-bold text-white">Ayush Rai</div>
              <div className="text-cyan-400 font-mono text-[11px]">E25B000195</div>
              <div className="text-slate-500 text-[10px]">Undergraduate Researcher</div>
            </div>
          </div>
        </div>
      </div>

      {/* College Examiner Demo Checklist */}
      <div className="p-5 rounded-lg bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2">
          <FileCheck className="w-4 h-4 text-emerald-400" />
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
            College Examiner Live Demonstration Script
          </h2>
        </div>
        <p className="text-xs text-slate-400">
          Follow this 7-step sequence during project evaluation to demonstrate each slide objective:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded bg-slate-950 border border-slate-800 space-y-1">
            <div className="font-bold text-cyan-300">1. Dashboard Live Triage</div>
            <p className="text-slate-400 text-[11px]">
              Show live evidence count ({evidences.length}), custody events ({custodyEvents.length}), and BST node status.
            </p>
          </div>

          <div className="p-3 rounded bg-slate-950 border border-slate-800 space-y-1">
            <div className="font-bold text-cyan-300">2. Real Web Crypto SHA-256 Hashing</div>
            <p className="text-slate-400 text-[11px]">
              Open "Add Evidence", drop any file, and demonstrate real-time in-browser SHA-256 calculation.
            </p>
          </div>

          <div className="p-3 rounded bg-slate-950 border border-slate-800 space-y-1">
            <div className="font-bold text-cyan-300">3. Singly Linked List Append-Only Chain</div>
            <p className="text-slate-400 text-[11px]">
              Navigate to "Chain of Custody", click "Append Custody Event", and verify O(1) tail pointer addition.
            </p>
          </div>

          <div className="p-3 rounded bg-slate-950 border border-slate-800 space-y-1">
            <div className="font-bold text-cyan-300">4. BST Hash Lookup & Duplicate Resolution</div>
            <p className="text-slate-400 text-[11px]">
              Open "Evidence Search" or "DSA Lab", test hash <code className="text-white">e7f1234...</code> to show 2 mapped evidence items.
            </p>
          </div>

          <div className="p-3 rounded bg-slate-950 border border-slate-800 space-y-1">
            <div className="font-bold text-cyan-300">5. Hash Integrity & Tamper Detection</div>
            <p className="text-slate-400 text-[11px]">
              Open "Integrity Verification", click "Simulate 1-Bit Tamper", and show instant alert + red bitwise highlight.
            </p>
          </div>

          <div className="p-3 rounded bg-slate-950 border border-slate-800 space-y-1">
            <div className="font-bold text-cyan-300">6. Recursive Evidence Tree & Call Stack</div>
            <p className="text-slate-400 text-[11px]">
              Open "Evidence Tree", click "Simulate Recursion", and watch the live call-stack depth O(h) progression.
            </p>
          </div>
        </div>
      </div>

      {/* Viva / Defense Q&A Guide */}
      <div className="p-5 rounded-lg bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
            Examiner Viva Voce Defense Q&A Preparation
          </h2>
        </div>

        <div className="space-y-2">
          {vivaQuestions.map((item, idx) => {
            const isOpen = activeFaq === idx;
            return (
              <div
                key={idx}
                className="rounded border border-slate-800 bg-slate-950/70 overflow-hidden"
              >
                <button
                  onClick={() => setActiveFaq(isOpen ? null : idx)}
                  className="w-full p-3.5 text-left text-xs font-semibold text-slate-200 flex items-center justify-between hover:bg-slate-800/40 transition-colors"
                >
                  <span className="pr-4">{item.q}</span>
                  {isOpen ? (
                    <ChevronDown className="w-4 h-4 text-cyan-400 shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-3.5 pb-3.5 text-xs text-slate-400 leading-relaxed border-t border-slate-800/60 pt-2.5">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Storage & Backup Management */}
      <div className="p-5 rounded-lg bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-indigo-400" />
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
            Demonstration Storage Management
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
            <span>Restore Fictional Demo Dataset</span>
          </button>

          <button
            onClick={handleDownloadBackup}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export Database JSON</span>
          </button>

          <button
            onClick={handleClear}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-300 bg-rose-950/40 hover:bg-rose-900/40 border border-rose-800/60 rounded transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All Data</span>
          </button>
        </div>

        {/* JSON Import Section */}
        <div className="pt-3 border-t border-slate-800 space-y-2">
          <label className="block text-xs font-medium text-slate-300">
            Import Database JSON Backup:
          </label>
          <div className="flex gap-2">
            <textarea
              value={importJsonText}
              onChange={e => setImportJsonText(e.target.value)}
              placeholder="Paste JSON database payload here..."
              rows={2}
              className="flex-1 bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs font-mono text-cyan-300 focus:outline-none focus:ring-1 focus:ring-cyan-500 resize-none"
            />
            <button
              onClick={handleImport}
              disabled={!importJsonText.trim()}
              className="px-4 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 rounded transition-colors self-end"
            >
              Restore JSON
            </button>
          </div>
          {importStatus && (
            <div className="text-[11px] text-emerald-400 font-mono mt-1">{importStatus}</div>
          )}
        </div>
      </div>

      {/* Legal & Academic Disclaimer */}
      <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-400 space-y-2">
        <div className="flex items-center gap-2 text-slate-300 font-semibold">
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          <span>Academic Simulation & Forensic Boundary Notice</span>
        </div>
        <p className="text-[11px] leading-relaxed">
          This system is an academic research software prototype built to demonstrate the integration of fundamental Data Structures & Algorithms (Linked Lists, Binary Search Trees, and Hierarchical Tree Traversals) in digital forensics. All case identifiers, hashes, and evidence narratives are fictional simulations. This application does not claim legal forensic certification or compliance with criminal judicial standards.
        </p>
      </div>
    </div>
  );
};

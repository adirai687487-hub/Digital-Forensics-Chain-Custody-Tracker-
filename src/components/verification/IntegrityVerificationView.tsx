import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Copy,
  Check,
  FileCheck2,
  Lock,
  ArrowRight,
  Sliders,
} from 'lucide-react';
import { useForensics } from '../../context/ForensicsContext';
import {
  hashFile,
  hashString,
  compareHashes,
  simulateTamperedHash,
  truncateHash,
  formatBytes,
} from '../../utils/crypto';
import { VerificationStatus } from '../../types/forensics';

interface IntegrityVerificationViewProps {
  initialEvidenceId?: string;
  onNavigate: (view: string, id?: string) => void;
}

export const IntegrityVerificationView: React.FC<IntegrityVerificationViewProps> = ({
  initialEvidenceId,
  onNavigate,
}) => {
  const { evidences, verifyEvidenceIntegrity, verificationLogs } = useForensics();

  const [selectedEvidenceId, setSelectedEvidenceId] = useState<string>(
    initialEvidenceId || evidences[0]?.id || ''
  );

  const selectedEvidence = evidences.find(e => e.id === selectedEvidenceId) || evidences[0];

  // Verification Input State
  const [comparisonMethod, setComparisonMethod] = useState<'upload' | 'text' | 'tamper_test'>('upload');
  const [computedHash, setComputedHash] = useState('');
  const [comparisonSource, setComparisonSource] = useState('Live Web Crypto file hashing');
  const [examinerName, setExaminerName] = useState('Joe Jelson J');
  const [isHashing, setIsHashing] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [uploadedFileSize, setUploadedFileSize] = useState<number>(0);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  // Result state
  const [verificationResult, setVerificationResult] = useState<{
    run: boolean;
    isMatch: boolean;
    storedHash: string;
    computedHash: string;
    matchPercentage: number;
    mismatchIndices: number[];
    timestamp: string;
  } | null>(null);

  // Drag and drop
  const [isDragging, setIsDragging] = useState(false);

  // Handle file upload and calculate SHA-256
  const processUploadedFile = async (file: File) => {
    setIsHashing(true);
    setUploadedFileName(file.name);
    setUploadedFileSize(file.size);
    setComparisonSource(`Uploaded comparison file: ${file.name} (${formatBytes(file.size)})`);

    try {
      const hash = await hashFile(file);
      setComputedHash(hash);
      runComparison(hash, `Uploaded comparison file: ${file.name}`);
    } catch (e: any) {
      console.error(e);
    } finally {
      setIsHashing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processUploadedFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processUploadedFile(e.dataTransfer.files[0]);
    }
  };

  // Run the core comparison
  const runComparison = (hashToTest: string, sourceDesc: string) => {
    if (!selectedEvidence) return;

    const cleanComputed = hashToTest.trim().toLowerCase();
    const comparison = compareHashes(selectedEvidence.originalHash, cleanComputed);

    // Save to context and append verification event to custody linked list
    verifyEvidenceIntegrity(
      selectedEvidence.id,
      cleanComputed,
      sourceDesc || comparisonSource,
      examinerName
    );

    setVerificationResult({
      run: true,
      isMatch: comparison.isMatch,
      storedHash: selectedEvidence.originalHash,
      computedHash: cleanComputed,
      matchPercentage: comparison.matchPercentage,
      mismatchIndices: comparison.mismatchIndices,
      timestamp: new Date().toISOString(),
    });
  };

  // Quick test: simulate legitimate match
  const handleSimulateLegitimateMatch = () => {
    if (!selectedEvidence) return;
    setComputedHash(selectedEvidence.originalHash);
    setComparisonSource('Baseline mirror verification (Identical byte-for-byte stream)');
    runComparison(selectedEvidence.originalHash, 'Baseline mirror verification');
  };

  // Quick test: simulate tamper
  const handleSimulateTamper = () => {
    if (!selectedEvidence) return;
    const tampered = simulateTamperedHash(selectedEvidence.originalHash);
    setComputedHash(tampered);
    setComparisonSource('Tampered Bitstream Simulation (Byte flip at index 14)');
    runComparison(tampered, 'Tampered Bitstream Simulation (Injected byte modification)');
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(text);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase tracking-wide">
            Cryptographic Integrity Engine
          </div>
          <h1 className="text-xl font-bold text-white mt-1">
            Hash-Based Integrity Verification
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Slide 9 Implementation: Stored SHA-256 == Current SHA-256. Proves byte-level tamper resistance.
          </p>
        </div>

        {/* Selected Evidence Item Quick Selector */}
        <div className="flex items-center gap-2">
          <label htmlFor="verify-evidence-select" className="text-xs text-slate-400 whitespace-nowrap">Evidence Target:</label>
          <select
            id="verify-evidence-select"
            value={selectedEvidenceId}
            onChange={e => {
              setSelectedEvidenceId(e.target.value);
              setVerificationResult(null);
              setComputedHash('');
            }}
            className="bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
          >
            {evidences.map(ev => (
              <option key={ev.id} value={ev.id}>
                {ev.id} — {ev.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Target Evidence Baseline Card */}
      {selectedEvidence && (
        <div className="p-4 rounded-lg bg-slate-900/90 border border-slate-800 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-cyan-300">
                {selectedEvidence.id}
              </span>
              <span className="text-xs font-semibold text-white">
                {selectedEvidence.name}
              </span>
              <span className="text-[11px] text-slate-400">
                ({selectedEvidence.type} · {formatBytes(selectedEvidence.fileSizeBytes)})
              </span>
            </div>
            <div className="text-[11px] font-mono text-slate-400">
              Case: {selectedEvidence.caseId}
            </div>
          </div>

          <div className="p-3 rounded bg-slate-950 border border-slate-800/80 space-y-1.5">
            <div className="text-[11px] text-slate-400 font-medium flex items-center justify-between">
              <span>Original Registered Hash (Stored Baseline):</span>
              <button
                onClick={() => handleCopy(selectedEvidence.originalHash)}
                className="text-slate-400 hover:text-cyan-300 text-[11px] flex items-center gap-1 font-mono"
              >
                {copiedHash === selectedEvidence.originalHash ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy Hash</span>
                  </>
                )}
              </button>
            </div>
            <div className="font-mono text-xs text-cyan-300 break-all select-all">
              {selectedEvidence.originalHash}
            </div>
          </div>
        </div>
      )}

      {/* Verification Input & Testing Sandbox */}
      <div className="p-5 rounded-lg bg-slate-900/90 border border-slate-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <RefreshCw className={`w-4 h-4 text-cyan-400 ${isHashing ? 'animate-spin' : ''}`} />
            <h2 className="text-sm font-semibold text-white">Calculate & Verify Current Hash</h2>
          </div>

          {/* Quick Demo Examiner Simulators */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Examiner Sandbox:</span>
            <button
              onClick={handleSimulateLegitimateMatch}
              className="px-2.5 py-1 text-xs bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-700/60 text-emerald-300 rounded transition-colors font-medium"
            >
              Simulate Match (100% OK)
            </button>
            <button
              onClick={handleSimulateTamper}
              className="px-2.5 py-1 text-xs bg-rose-950/60 hover:bg-rose-900/60 border border-rose-700/60 text-rose-300 rounded transition-colors font-medium"
            >
              Simulate 1-Bit Tamper
            </button>
          </div>
        </div>

        {/* Drag and Drop Zone */}
        <div
          onDragOver={e => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
            isDragging
              ? 'border-cyan-400 bg-cyan-950/20'
              : 'border-slate-700 hover:border-slate-600 bg-slate-950/50'
          }`}
          onClick={() => document.getElementById('verify-file-input')?.click()}
        >
          <input
            id="verify-file-input"
            type="file"
            className="hidden"
            onChange={handleFileChange}
          />
          <UploadCloud className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
          <p className="text-xs font-medium text-slate-200">
            {isHashing
              ? 'Calculating cryptographic SHA-256...'
              : uploadedFileName
              ? `Verification Target Loaded: ${uploadedFileName} (${formatBytes(uploadedFileSize)})`
              : 'Drop comparison file to calculate SHA-256 and verify against baseline'}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Uses Web Crypto API (crypto.subtle.digest) inside the browser.
          </p>
        </div>

        {/* Manual Hash Paste or Inspection Input */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-300">
            Current / Computed SHA-256 Hash to Validate:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={computedHash}
              onChange={e => setComputedHash(e.target.value)}
              placeholder="Paste 64-character SHA-256 hash or calculate from file above..."
              className="flex-1 bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs font-mono text-cyan-300 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
            <button
              onClick={() => runComparison(computedHash, 'Manual hash verification input')}
              disabled={!computedHash.trim()}
              className="px-4 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 rounded transition-colors whitespace-nowrap"
            >
              Verify Integrity
            </button>
          </div>
        </div>

        {/* Examiner Name */}
        <div className="flex items-center gap-3 pt-2">
          <label className="text-xs text-slate-400">Verifying Examiner:</label>
          <input
            type="text"
            value={examinerName}
            onChange={e => setExaminerName(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
        </div>
      </div>

      {/* Verification Result Showcase */}
      {verificationResult && verificationResult.run && (
        <div
          className={`p-5 rounded-lg border space-y-4 ${
            verificationResult.isMatch
              ? 'bg-emerald-950/20 border-emerald-700/60'
              : 'bg-rose-950/20 border-rose-700/60'
          }`}
        >
          {/* Main Verdict Banner (Slide 9 Exact Representation) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              {verificationResult.isMatch ? (
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
              ) : (
                <ShieldAlert className="w-6 h-6 text-rose-400" />
              )}
              <div>
                <h3 className="text-base font-bold text-white">
                  {verificationResult.isMatch
                    ? 'YES → INTEGRITY VERIFIED'
                    : 'NO → POSSIBLE TAMPERING / CORRUPTION DETECTED'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {verificationResult.isMatch
                    ? 'Stored SHA-256 == Current SHA-256. Cryptographic match is 100% exact.'
                    : `Hash mismatch at character index ${verificationResult.mismatchIndices[0]}. The file has been modified or corrupted!`}
                </p>
              </div>
            </div>

            <span
              className={`text-xs font-mono font-bold px-3 py-1 rounded self-start sm:self-auto ${
                verificationResult.isMatch
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
              }`}
            >
              Match: {verificationResult.matchPercentage}%
            </span>
          </div>

          {/* Side-by-Side Character Comparison Visualizer */}
          <div className="space-y-3 font-mono text-xs">
            <div className="text-slate-400 text-[11px] font-sans">
              Side-by-side character comparison matrix:
            </div>

            {/* Stored Hash Row */}
            <div className="p-3 bg-slate-950 rounded border border-slate-800 space-y-1">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                Baseline Registered SHA-256:
              </div>
              <div className="break-all tracking-wider text-slate-300 select-all">
                {verificationResult.storedHash}
              </div>
            </div>

            {/* Computed Hash Row with Highlighting */}
            <div className="p-3 bg-slate-950 rounded border border-slate-800 space-y-1">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                Current Computed SHA-256:
              </div>
              <div className="break-all tracking-wider">
                {verificationResult.computedHash.split('').map((char, idx) => {
                  const isMismatch = verificationResult.mismatchIndices.includes(idx);
                  return (
                    <span
                      key={idx}
                      className={
                        isMismatch
                          ? 'bg-rose-600 text-white font-bold px-0.5 rounded underline decoration-rose-300'
                          : 'text-emerald-400'
                      }
                      title={isMismatch ? `Mismatch at index ${idx}: expected "${verificationResult.storedHash[idx]}", got "${char}"` : undefined}
                    >
                      {char}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Audit Trail Note */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400">
            <div>
              A <strong className="text-white font-mono">VERIFIED</strong> audit event has been automatically appended to the Chain of Custody Linked List.
            </div>
            <button
              onClick={() => onNavigate('custody', selectedEvidence.id)}
              className="text-cyan-400 hover:underline flex items-center gap-1 font-medium whitespace-nowrap"
            >
              <span>View custody ledger</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Historical Verification Audit Logs */}
      <div className="p-5 rounded-lg bg-slate-900/80 border border-slate-800 space-y-3">
        <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          Recent Verification Audits ({verificationLogs.length} total checks logged)
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] text-slate-500 uppercase font-mono">
                <th className="py-2 px-3">Audit ID</th>
                <th className="py-2 px-3">Evidence ID</th>
                <th className="py-2 px-3">Status</th>
                <th className="py-2 px-3">Examiner</th>
                <th className="py-2 px-3">Source & Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono text-[11px]">
              {verificationLogs.slice(0, 5).map(log => (
                <tr key={log.id} className="hover:bg-slate-800/30">
                  <td className="py-2 px-3 text-cyan-400">{log.id}</td>
                  <td className="py-2 px-3 font-semibold text-white">{log.evidenceId}</td>
                  <td className="py-2 px-3">
                    {log.status === 'VERIFIED' ? (
                      <span className="text-emerald-400 font-sans font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Verified
                      </span>
                    ) : (
                      <span className="text-rose-400 font-sans font-medium flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Tampered
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-slate-300 font-sans">{log.examiner}</td>
                  <td className="py-2 px-3 text-slate-400 font-sans">
                    <div>{log.comparisonSource}</div>
                    <div className="text-[10px] text-slate-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

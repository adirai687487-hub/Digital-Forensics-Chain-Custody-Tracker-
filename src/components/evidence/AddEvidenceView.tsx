import React, { useState } from 'react';
import {
  UploadCloud,
  FileCheck2,
  AlertCircle,
  CheckCircle2,
  PlusCircle,
  Hash,
  Shield,
  FileText,
  Clock,
  MapPin,
  User,
  BadgeAlert,
} from 'lucide-react';
import { useForensics } from '../../context/ForensicsContext';
import { EvidenceType } from '../../types/forensics';
import { hashFile, hashString, formatBytes } from '../../utils/crypto';

interface AddEvidenceViewProps {
  onNavigate: (view: string, id?: string) => void;
}

export const AddEvidenceView: React.FC<AddEvidenceViewProps> = ({ onNavigate }) => {
  const { addEvidence, evidences } = useForensics();

  // Form State
  const [evidenceId, setEvidenceId] = useState(
    `EVD-${new Date().getFullYear()}-${(evidences.length + 101).toString()}`
  );
  const [caseId, setCaseId] = useState('CASE-CR-2026-8912');
  const [caseName, setCaseName] = useState('Operation Dark Ledger (Corporate Cyber Intrusion)');
  const [name, setName] = useState('');
  const [type, setType] = useState<EvidenceType>('Disk Image');
  const [originalHash, setOriginalHash] = useState('');
  const [fileSizeBytes, setFileSizeBytes] = useState<number>(0);
  const [collectionTimestamp, setCollectionTimestamp] = useState(
    new Date().toISOString().slice(0, 16)
  );
  const [collectionLocation, setCollectionLocation] = useState('Executive Suite 402, Financial Tower, Pune, MH');
  const [investigatorName, setInvestigatorName] = useState('Ayush Rai');
  const [investigatorBadge, setInvestigatorBadge] = useState('DFIR-8821');
  const [seizureAuthority, setSeizureAuthority] = useState('Court Search Warrant #SW-2026-441A');
  const [storageLocation, setStorageLocation] = useState('Primary Evidence Locker #4B (Cyber Lab)');
  const [currentCustodian, setCurrentCustodian] = useState('Ayush Rai');
  const [notes, setNotes] = useState('');

  // File Upload & Hashing State
  const [isHashing, setIsHashing] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [hashCalculationMethod, setHashCalculationMethod] = useState<string>('');

  // Status and Validation
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Drag and Drop
  const [isDragging, setIsDragging] = useState(false);

  // File selected handler -> Web Crypto API SHA-256 calculation
  const handleFileProcess = async (file: File) => {
    setIsHashing(true);
    setError(null);
    setUploadedFileName(file.name);
    if (!name) {
      setName(file.name);
    }
    setFileSizeBytes(file.size);

    try {
      const startTime = performance.now();
      const computed = await hashFile(file);
      const durationMs = Math.round(performance.now() - startTime);

      setOriginalHash(computed);
      setHashCalculationMethod(`Calculated via Web Crypto API (SHA-256) in ${durationMs}ms`);
    } catch (err: any) {
      setError(`Failed to compute file hash: ${err.message}`);
    } finally {
      setIsHashing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileProcess(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  // Generate a test mock hash using text string hashing
  const handleQuickTemplate = (templateType: 'disk' | 'memory' | 'log') => {
    if (templateType === 'disk') {
      setName('workstation_ssd_image.dd');
      setType('Disk Image');
      setFileSizeBytes(256000000000);
      setNotes('Bitstream RAW image seized with hardware write-blocker attached.');
      hashString(`workstation_ssd_image_${Date.now()}`).then(h => {
        setOriginalHash(h);
        setHashCalculationMethod('Calculated via Web Crypto API (SHA-256 baseline template)');
      });
    } else if (templateType === 'memory') {
      setName('ram_acquisition.raw');
      setType('Memory Dump');
      setFileSizeBytes(17179869184); // 16 GB
      setNotes('Volatile memory captured using LiME kernel driver before system power-down.');
      hashString(`ram_acquisition_${Date.now()}`).then(h => {
        setOriginalHash(h);
        setHashCalculationMethod('Calculated via Web Crypto API (SHA-256 baseline template)');
      });
    } else {
      setName('auth_audit.log');
      setType('System Log');
      setFileSizeBytes(4194304); // 4 MB
      setNotes('Linux syslog containing failed SSH brute force authentication events.');
      hashString(`auth_audit_${Date.now()}`).then(h => {
        setOriginalHash(h);
        setHashCalculationMethod('Calculated via Web Crypto API (SHA-256 baseline template)');
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name.trim()) {
      setError('Evidence item name or filename is required.');
      return;
    }

    if (!originalHash.trim() || originalHash.trim().length !== 64) {
      setError('Valid 64-character SHA-256 hash is required. Please upload a file or compute a cryptographic hash.');
      return;
    }

    const result = addEvidence(
      {
        id: evidenceId.trim(),
        caseId: caseId.trim(),
        caseName: caseName.trim(),
        name: name.trim(),
        type,
        originalHash: originalHash.trim().toLowerCase(),
        hashAlgorithm: 'SHA-256',
        fileSizeBytes,
        collectionTimestamp: new Date(collectionTimestamp).toISOString(),
        collectionLocation: collectionLocation.trim(),
        investigatorName: investigatorName.trim(),
        investigatorBadge: investigatorBadge.trim(),
        seizureAuthority: seizureAuthority.trim(),
        storageLocation: storageLocation.trim(),
        currentCustodian: currentCustodian.trim(),
        notes: notes.trim(),
      },
      currentCustodian.trim(),
      storageLocation.trim()
    );

    if (result.success) {
      setSuccess(`Evidence ${evidenceId} successfully cataloged and indexed into the in-memory BST! Initial custody node appended to the chronological Linked List.`);
      // Reset evidence ID for next entry
      setEvidenceId(`EVD-${new Date().getFullYear()}-${(evidences.length + 102).toString()}`);
      setName('');
      setOriginalHash('');
      setFileSizeBytes(0);
      setUploadedFileName('');
    } else {
      setError(result.error || 'Failed to add evidence.');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase tracking-wide">
            Evidence Intake Portal
          </div>
          <h1 className="text-xl font-bold text-white mt-1">Add New Forensic Evidence</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Cryptographic intake registration in compliance with ISO/IEC 27037 standards.
          </p>
        </div>

        {/* Quick Forensic Templates */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Autofill:</span>
          <button
            type="button"
            onClick={() => handleQuickTemplate('disk')}
            className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded transition-colors"
          >
            Disk Image
          </button>
          <button
            type="button"
            onClick={() => handleQuickTemplate('memory')}
            className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded transition-colors"
          >
            Memory Dump
          </button>
          <button
            type="button"
            onClick={() => handleQuickTemplate('log')}
            className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded transition-colors"
          >
            System Log
          </button>
        </div>
      </div>

      {/* Alert Messages */}
      {error && (
        <div className="p-3.5 rounded-lg bg-rose-950/40 border border-rose-800/80 text-rose-200 flex items-start gap-2.5 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
          <div className="flex-1 font-medium">{error}</div>
        </div>
      )}

      {success && (
        <div className="p-3.5 rounded-lg bg-emerald-950/40 border border-emerald-800/80 text-emerald-200 flex items-start gap-2.5 text-xs">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
          <div className="flex-1">
            <div className="font-semibold">{success}</div>
            <div className="mt-2 flex gap-3">
              <button
                onClick={() => onNavigate('records')}
                className="text-xs underline text-cyan-300 hover:text-cyan-200 font-medium"
              >
                View in Evidence Records
              </button>
              <button
                onClick={() => onNavigate('custody')}
                className="text-xs underline text-cyan-300 hover:text-cyan-200 font-medium"
              >
                Inspect Chain of Custody
              </button>
            </div>
          </div>
        </div>
      )}

      {/* File Hashing Web Crypto Zone */}
      <div className="p-5 rounded-lg bg-slate-900/90 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Hash className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-semibold text-white">Cryptographic Fingerprint (Web Crypto API SHA-256)</h2>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">FIPS 180-4 SHA-256</span>
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
          onClick={() => document.getElementById('evidence-file-input')?.click()}
        >
          <input
            id="evidence-file-input"
            type="file"
            className="hidden"
            onChange={handleFileChange}
          />
          <UploadCloud className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
          <p className="text-xs font-medium text-slate-200">
            {isHashing
              ? 'Computing SHA-256 hash in browser...'
              : uploadedFileName
              ? `File loaded: ${uploadedFileName} (${formatBytes(fileSizeBytes)})`
              : 'Drag and drop forensic file here, or click to browse'}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Browser calculates exact SHA-256 locally via window.crypto.subtle. No data leaves your machine.
          </p>
        </div>

        {/* Calculated Hash Display Field */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Calculated Baseline SHA-256 Hash <span className="text-rose-400">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={originalHash}
              onChange={e => {
                setOriginalHash(e.target.value);
                setHashCalculationMethod('Manual / Air-gap import');
              }}
              placeholder="e.g. 8a91bc724a2ef69e120f4c3b99ef871b0521e4a3c448bb90192e412356789abc"
              className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs font-mono text-cyan-300 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              required
            />
          </div>
          {hashCalculationMethod && (
            <div className="text-[11px] text-slate-400 mt-1 font-mono">
              {hashCalculationMethod}
            </div>
          )}
        </div>
      </div>

      {/* Main Intake Form */}
      <form onSubmit={handleSubmit} className="p-5 rounded-lg bg-slate-900/90 border border-slate-800 space-y-6">
        <h2 className="text-sm font-semibold text-white pb-3 border-b border-slate-800">
          Case & Evidence Identification Details
        </h2>

        {/* Row 1: Case ID, Case Name */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Case Identification ID <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={caseId}
              onChange={e => setCaseId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Case Title / Operation Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={caseName}
              onChange={e => setCaseName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
              required
            />
          </div>
        </div>

        {/* Row 2: Evidence ID, Artifact Name, Type */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Unique Evidence Item ID <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={evidenceId}
              onChange={e => setEvidenceId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
              required
            />
            <div className="text-[10px] text-slate-400 mt-1">Unique item tracking identifier</div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Evidence Name / File Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. laptop_image.dd"
              className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Evidence Forensic Type <span className="text-rose-400">*</span>
            </label>
            <select
              value={type}
              onChange={e => setType(e.target.value as EvidenceType)}
              className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
            >
              <option value="Disk Image">Disk Image (.dd, .e01, .raw)</option>
              <option value="Memory Dump">Memory Dump (.raw, .vmem, .dmp)</option>
              <option value="Network PCAP">Network PCAP (.pcap, .pcapng)</option>
              <option value="System Log">System Log (.evtx, .log)</option>
              <option value="Email Archive">Email Archive (.pst, .mbox)</option>
              <option value="Document">Document / Container (.kdbx, .pdf)</option>
              <option value="Mobile Extraction">Mobile Extraction (.tar, .ab)</option>
              <option value="Binary / Executable">Binary / Executable (.exe, .bin, .dll)</option>
              <option value="Database Dump">Database Dump (.sql, .db)</option>
            </select>
          </div>
        </div>

        {/* Row 3: Collection Timestamp, Seizure Authority */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Seizure / Collection Timestamp <span className="text-rose-400">*</span>
            </label>
            <input
              type="datetime-local"
              value={collectionTimestamp}
              onChange={e => setCollectionTimestamp(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Legal Authority / Warrant Number <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={seizureAuthority}
              onChange={e => setSeizureAuthority(e.target.value)}
              placeholder="e.g. Warrant #SW-2026-441A or IR Mandate"
              className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
              required
            />
          </div>
        </div>

        {/* Row 4: Investigator, Badge, Custodian */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Recovering Investigator <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={investigatorName}
              onChange={e => setInvestigatorName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Badge / License ID <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={investigatorBadge}
              onChange={e => setInvestigatorBadge(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Initial Assigned Custodian <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={currentCustodian}
              onChange={e => setCurrentCustodian(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
              required
            />
          </div>
        </div>

        {/* Row 5: Physical Storage Location, Collection Location */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Physical Scene of Collection <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={collectionLocation}
              onChange={e => setCollectionLocation(e.target.value)}
              placeholder="e.g. Room 402, Server Cabinet B"
              className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Vault / Storage Locker Location <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={storageLocation}
              onChange={e => setStorageLocation(e.target.value)}
              placeholder="e.g. Evidence Locker #4B (Cyber Lab)"
              className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
              required
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Forensic Intake Notes & Acquisition Chain Details
          </label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
            placeholder="Document hardware write-blocker serial number, cable adapters used, physical condition of device, etc."
            className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 resize-none"
          />
        </div>

        {/* Submit Actions */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
          <div className="text-[11px] text-slate-400">
            * All recorded events are append-only to preserve evidentiary integrity.
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('records')}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isHashing}
              className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 rounded transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Complete Evidence Intake</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

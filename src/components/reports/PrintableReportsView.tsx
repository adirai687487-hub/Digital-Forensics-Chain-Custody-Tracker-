import React, { useState } from 'react';
import {
  Printer,
  Download,
  FileText,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Scale,
  Calendar,
  User,
  MapPin,
} from 'lucide-react';
import { useForensics } from '../../context/ForensicsContext';
import { truncateHash, formatBytes } from '../../utils/crypto';

interface PrintableReportsViewProps {
  initialEvidenceId?: string;
  onNavigate: (view: string, id?: string) => void;
}

export const PrintableReportsView: React.FC<PrintableReportsViewProps> = ({
  initialEvidenceId,
  onNavigate,
}) => {
  const { evidences, custodyEvents, verificationLogs } = useForensics();

  const [selectedEvidenceId, setSelectedEvidenceId] = useState<string>(
    initialEvidenceId || evidences[0]?.id || ''
  );

  const selectedEvidence =
    evidences.find(e => e.id === selectedEvidenceId) || evidences[0];

  const evidenceEvents = custodyEvents.filter(
    e => e.evidenceId === selectedEvidence?.id
  );

  const handlePrint = () => {
    window.print();
  };

  // CSV Export for Evidences
  const handleExportEvidencesCsv = () => {
    const headers = [
      'Evidence ID',
      'Case ID',
      'Case Title',
      'Artifact Name',
      'Forensic Type',
      'Size (Bytes)',
      'SHA-256 Hash',
      'Collection Timestamp',
      'Collection Location',
      'Investigator Name',
      'Investigator Badge',
      'Legal Authority',
      'Storage Location',
      'Current Custodian',
      'Verification Status',
      'Notes',
    ];

    const rows = evidences.map(e => [
      `"${e.id}"`,
      `"${e.caseId}"`,
      `"${e.caseName.replace(/"/g, '""')}"`,
      `"${e.name.replace(/"/g, '""')}"`,
      `"${e.type}"`,
      e.fileSizeBytes,
      `"${e.originalHash}"`,
      `"${e.collectionTimestamp}"`,
      `"${e.collectionLocation.replace(/"/g, '""')}"`,
      `"${e.investigatorName.replace(/"/g, '""')}"`,
      `"${e.investigatorBadge}"`,
      `"${e.seizureAuthority.replace(/"/g, '""')}"`,
      `"${e.storageLocation.replace(/"/g, '""')}"`,
      `"${e.currentCustodian.replace(/"/g, '""')}"`,
      `"${e.lastVerificationStatus || 'UNVERIFIED'}"`,
      `"${(e.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Forensic_Evidence_Master_Ledger_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV Export for Custody Events
  const handleExportCustodyCsv = () => {
    const headers = [
      'Event ID',
      'Evidence ID',
      'Artifact Name',
      'Custody Action',
      'Timestamp (UTC)',
      'Released By (From)',
      'Received By (To)',
      'Transfer Purpose',
      'Storage / Lab Location',
      'Integrity Snapshot SHA-256',
      'Previous Event ID',
      'Notes',
    ];

    const rows = custodyEvents.map(e => [
      `"${e.id}"`,
      `"${e.evidenceId}"`,
      `"${(e.evidenceName || '').replace(/"/g, '""')}"`,
      `"${e.action}"`,
      `"${e.timestamp}"`,
      `"${e.fromInvestigator.replace(/"/g, '""')}"`,
      `"${e.toInvestigator.replace(/"/g, '""')}"`,
      `"${e.purpose.replace(/"/g, '""')}"`,
      `"${e.location.replace(/"/g, '""')}"`,
      `"${e.hashAtEvent}"`,
      `"${e.previousEventId || ''}"`,
      `"${(e.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Forensic_Chain_of_Custody_Events_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* View Header & Action Toolbar (Hidden during print) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800 no-print">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase tracking-wide">
            Court-Ready Documentation
          </div>
          <h1 className="text-xl font-bold text-white mt-1">
            Printable Evidence Reports & CSV Export
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Standard ISO/IEC 27037 & NIST SP 800-86 formal chain of custody certificates.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportEvidencesCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export Evidence CSV</span>
          </button>
          <button
            onClick={handleExportCustodyCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export Custody CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded transition-colors shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Custody Certificate</span>
          </button>
        </div>
      </div>

      {/* Evidence Picker Toolbar (no-print) */}
      <div className="p-4 rounded-lg bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-3">
          <label htmlFor="report-evidence-select" className="text-xs font-medium text-slate-300">
            Generate Formal Report for Artifact:
          </label>
          <select
            id="report-evidence-select"
            value={selectedEvidenceId}
            onChange={e => setSelectedEvidenceId(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
          >
            {evidences.map(ev => (
              <option key={ev.id} value={ev.id}>
                {ev.id} — {ev.name} ({ev.caseId})
              </option>
            ))}
          </select>
        </div>

        <span className="text-[11px] text-slate-400">
          Tip: Use browser print dialog to save as clean PDF.
        </span>
      </div>

      {/* FORMAL PRINTABLE REPORT PAPER (Styled for both dark screen & crisp black/white print) */}
      {selectedEvidence && (
        <div className="printable-area bg-white text-slate-900 p-8 sm:p-10 rounded-lg shadow-xl border border-slate-300 font-sans max-w-4xl mx-auto space-y-6">
          {/* Header Banner */}
          <div className="border-b-2 border-slate-900 pb-4 flex items-start justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
                Department of Digital Forensics & Cyber Investigation
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-950 mt-1">
                EVIDENCE CHAIN OF CUSTODY CERTIFICATE
              </h2>
              <div className="text-xs text-slate-600 mt-0.5">
                Standard Form DFIR-27037 · In compliance with Federal Rules of Evidence Rule 901
              </div>
            </div>

            <div className="text-right font-mono text-xs text-slate-700">
              <div className="font-bold text-slate-950">FORM REF: {selectedEvidence.id}</div>
              <div>ISSUED: {new Date().toISOString().slice(0, 10)}</div>
              <div className="text-[10px] text-slate-500">CLASSIFICATION: LAW ENFORCEMENT / COURT</div>
            </div>
          </div>

          {/* Section 1: Case Identification */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1">
              1. Investigation Case Metadata
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Case Identifier</span>
                <span className="font-mono font-bold text-slate-950">{selectedEvidence.caseId}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-500 block text-[10px] uppercase">Case Title / Operation</span>
                <span className="font-bold text-slate-950">{selectedEvidence.caseName}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Legal Warrant Authority</span>
                <span className="font-mono text-slate-900">{selectedEvidence.seizureAuthority}</span>
              </div>
            </div>
          </div>

          {/* Section 2: Evidence Item Description */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1">
              2. Evidence Item Identification & Cryptographic Baseline
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Item Name / Filename</span>
                <span className="font-mono font-bold text-slate-950">{selectedEvidence.name}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Forensic Artifact Type</span>
                <span className="font-medium text-slate-900">{selectedEvidence.type}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Bitstream File Size</span>
                <span className="font-mono text-slate-900">{formatBytes(selectedEvidence.fileSizeBytes)} ({selectedEvidence.fileSizeBytes.toLocaleString()} bytes)</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Date / Time of Seizure</span>
                <span className="font-mono text-slate-900">{new Date(selectedEvidence.collectionTimestamp).toUTCString()}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Seizing Officer / Badge</span>
                <span className="text-slate-900">{selectedEvidence.investigatorName} ({selectedEvidence.investigatorBadge})</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Seizure Location</span>
                <span className="text-slate-900">{selectedEvidence.collectionLocation}</span>
              </div>
            </div>

            {/* Cryptographic Hash Box */}
            <div className="p-3 bg-slate-100 border border-slate-300 rounded font-mono text-xs space-y-1 mt-2">
              <div className="text-[10px] font-bold text-slate-700 uppercase">
                Acquisition Baseline Cryptographic Fingerprint (SHA-256):
              </div>
              <div className="text-slate-950 font-bold break-all select-all tracking-wider">
                {selectedEvidence.originalHash}
              </div>
              <div className="text-[10px] text-slate-500 font-sans">
                Computed via Web Crypto API FIPS 180-4 standard upon initial physical acquisition.
              </div>
            </div>
          </div>

          {/* Section 3: Complete Custody Transfer Ledger */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1">
              3. Chronological Chain of Custody History (Linked Ledger)
            </h3>
            <table className="w-full text-left text-xs border border-slate-300 border-collapse">
              <thead>
                <tr className="bg-slate-200 text-slate-800 text-[10px] font-bold uppercase">
                  <th className="p-2 border border-slate-300">Node #</th>
                  <th className="p-2 border border-slate-300">Date / Time (UTC)</th>
                  <th className="p-2 border border-slate-300">Released By</th>
                  <th className="p-2 border border-slate-300">Received By</th>
                  <th className="p-2 border border-slate-300">Action / Operational Purpose</th>
                  <th className="p-2 border border-slate-300">Verified Hash Snapshot</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {evidenceEvents.map((evt, idx) => (
                  <tr key={evt.id} className="text-[11px]">
                    <td className="p-2 border border-slate-300 font-mono font-bold">{evt.id}</td>
                    <td className="p-2 border border-slate-300 font-mono whitespace-nowrap">
                      {new Date(evt.timestamp).toISOString().replace('T', ' ').slice(0, 16)}
                    </td>
                    <td className="p-2 border border-slate-300">{evt.fromInvestigator}</td>
                    <td className="p-2 border border-slate-300 font-semibold">{evt.toInvestigator}</td>
                    <td className="p-2 border border-slate-300">
                      <div className="font-bold text-[10px] uppercase text-slate-700">{evt.action}</div>
                      <div>{evt.purpose}</div>
                      <div className="text-[10px] text-slate-500">Loc: {evt.location}</div>
                    </td>
                    <td className="p-2 border border-slate-300 font-mono text-[10px]" title={evt.hashAtEvent}>
                      {truncateHash(evt.hashAtEvent, 6, 6)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Section 4: Cryptographic Verification Attestation */}
          <div className="p-3 bg-slate-50 border border-slate-300 rounded text-xs space-y-2">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide">
              4. Evidence Integrity Attestation
            </h4>
            <p className="text-slate-700 text-[11px] leading-relaxed">
              I hereby certify that the evidence item described above has been preserved, transferred, and examined in strict compliance with ISO/IEC 27037 standards for digital evidence handling. The cryptographic SHA-256 hash has been verified across each transfer stage without variance or bitwise corruption.
            </p>
          </div>

          {/* Section 5: Signature Blocks */}
          <div className="pt-6 grid grid-cols-2 sm:grid-cols-3 gap-6 text-xs">
            <div className="space-y-4">
              <div className="border-b border-slate-400 pb-8 text-center text-slate-400 text-[10px] italic">
                (Digital / Physical Signature)
              </div>
              <div>
                <span className="font-bold text-slate-950 block">{selectedEvidence.investigatorName}</span>
                <span className="text-slate-500 text-[10px]">Lead Evidence Seizure Officer</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="border-b border-slate-400 pb-8 text-center text-slate-400 text-[10px] italic">
                (Digital / Physical Signature)
              </div>
              <div>
                <span className="font-bold text-slate-950 block">{selectedEvidence.currentCustodian}</span>
                <span className="text-slate-500 text-[10px]">Current Laboratory Custodian</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="border-b border-slate-400 pb-8 text-center text-slate-400 text-[10px] italic">
                (Official Seal)
              </div>
              <div>
                <span className="font-bold text-slate-950 block">Laboratory Director</span>
                <span className="text-slate-500 text-[10px]">Cyber Forensic Services</span>
              </div>
            </div>
          </div>

          {/* Academic Footer */}
          <div className="pt-4 border-t border-slate-300 text-center text-[10px] text-slate-500 font-mono">
            Generated via DSL — Digital Forensics Chain of Custody Tracker · Ajeenkya DY Patil University Project Defense
          </div>
        </div>
      )}
    </div>
  );
};

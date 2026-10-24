import React, { useState } from 'react';
import {
  Link2,
  PlusCircle,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowDown,
  Clock,
  User,
  MapPin,
  FileCheck,
  Search,
  Lock,
} from 'lucide-react';
import { useForensics } from '../../context/ForensicsContext';
import { CustodyAction, CustodyEvent } from '../../types/forensics';
import { truncateHash } from '../../utils/crypto';

interface ChainOfCustodyViewProps {
  initialEvidenceId?: string;
  onNavigate: (view: string, id?: string) => void;
}

export const ChainOfCustodyView: React.FC<ChainOfCustodyViewProps> = ({
  initialEvidenceId,
  onNavigate,
}) => {
  const { evidences, custodyEvents, appendCustodyEvent, linkedListInstance } = useForensics();

  const [selectedEvidenceId, setSelectedEvidenceId] = useState<string>(
    initialEvidenceId || 'all'
  );

  // Append Event Modal / Form State
  const [showAppendModal, setShowAppendModal] = useState(false);
  const [formEvidenceId, setFormEvidenceId] = useState<string>(
    initialEvidenceId && initialEvidenceId !== 'all'
      ? initialEvidenceId
      : evidences[0]?.id || ''
  );
  const [formAction, setFormAction] = useState<CustodyAction>('TRANSFERRED');
  const [formFrom, setFormFrom] = useState('Ayush Rai (Lead Examiner)');
  const [formTo, setFormTo] = useState('Joe Jelson J (Forensic Analyst)');
  const [formPurpose, setFormPurpose] = useState('Handover for bitstream disk extraction and artifact analysis');
  const [formLocation, setFormLocation] = useState('Forensic Lab Station #02, Pune');
  const [formNotes, setFormNotes] = useState('Transferred in Faraday RF-shielded anti-static evidence pouch.');
  const [appendError, setAppendError] = useState<string | null>(null);
  const [appendSuccess, setAppendSuccess] = useState<string | null>(null);

  // Filter events
  const displayedEvents = custodyEvents.filter(evt =>
    selectedEvidenceId === 'all' ? true : evt.evidenceId === selectedEvidenceId
  );

  // Validate chain
  const chainValidation = linkedListInstance.validateChainOrder();

  const handleOpenAppend = (evidenceIdToSelect?: string) => {
    if (evidenceIdToSelect && evidenceIdToSelect !== 'all') {
      setFormEvidenceId(evidenceIdToSelect);
      const ev = evidences.find(e => e.id === evidenceIdToSelect);
      if (ev) {
        setFormFrom(ev.currentCustodian);
      }
    }
    setShowAppendModal(true);
    setAppendError(null);
    setAppendSuccess(null);
  };

  const handleAppendSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAppendError(null);

    const targetEvidence = evidences.find(ev => ev.id === formEvidenceId);
    if (!targetEvidence) {
      setAppendError('Please select a valid evidence item.');
      return;
    }

    const result = appendCustodyEvent({
      evidenceId: formEvidenceId,
      action: formAction,
      fromInvestigator: formFrom.trim(),
      toInvestigator: formTo.trim(),
      purpose: formPurpose.trim(),
      location: formLocation.trim(),
      hashAtEvent: targetEvidence.originalHash,
      notes: formNotes.trim(),
    });

    if (result.success) {
      setAppendSuccess(`Custody event ${result.eventId} successfully appended to the chronological Linked List!`);
      setTimeout(() => {
        setShowAppendModal(false);
        setAppendSuccess(null);
      }, 1500);
    } else {
      setAppendError(result.error || 'Failed to append custody event.');
    }
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wide">
            Append-Only Audit Ledger
          </div>
          <h1 className="text-xl font-bold text-white mt-1">Chronological Chain of Custody</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Strict append-only custody trail modeled via Singly Linked List (O(1) tail insertion, immutable past records).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleOpenAppend(selectedEvidenceId)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Append Custody Event</span>
          </button>
        </div>
      </div>

      {/* Filter and Integrity Audit Ribbon */}
      <div className="p-4 rounded-lg bg-slate-900/90 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Evidence Selector */}
        <div className="flex items-center gap-3">
          <label htmlFor="evidence-select" className="text-xs font-medium text-slate-300 whitespace-nowrap">
            Filter Chain by Artifact:
          </label>
          <select
            id="evidence-select"
            value={selectedEvidenceId}
            onChange={e => setSelectedEvidenceId(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
          >
            <option value="all">Complete Master Ledger ({custodyEvents.length} events)</option>
            {evidences.map(ev => (
              <option key={ev.id} value={ev.id}>
                {ev.id} — {ev.name}
              </option>
            ))}
          </select>
        </div>

        {/* Chain Integrity Badge */}
        <div className="flex items-center gap-2 text-xs">
          {chainValidation.isValid ? (
            <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 px-3 py-1 rounded">
              <ShieldCheck className="w-4 h-4" />
              <span>Chain Integrity: Unbroken Linked Sequence (Verified)</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-rose-400 bg-rose-950/40 border border-rose-800/60 px-3 py-1 rounded">
              <AlertCircle className="w-4 h-4" />
              <span>Chain Warning: {chainValidation.reason}</span>
            </div>
          )}
        </div>
      </div>

      {/* Historical Custody Timeline (Linked List Visualization) */}
      <div className="space-y-4">
        {displayedEvents.length === 0 ? (
          <div className="p-12 text-center rounded-lg border border-slate-800 bg-slate-900/50 text-slate-400">
            <Link2 className="w-8 h-8 mx-auto mb-2 text-slate-600" />
            <p className="text-sm font-medium">No custody events recorded for this artifact yet.</p>
            <button
              onClick={() => handleOpenAppend(selectedEvidenceId)}
              className="mt-3 text-xs text-cyan-400 hover:underline"
            >
              Append the first transfer event
            </button>
          </div>
        ) : (
          displayedEvents.map((evt, idx) => {
            const isFirst = idx === 0;
            const isLast = idx === displayedEvents.length - 1;
            const isTransfer = evt.action === 'TRANSFERRED';
            const isVerified = evt.action === 'VERIFIED';
            const isCollected = evt.action === 'COLLECTED';

            return (
              <React.Fragment key={evt.id}>
                <div className="p-4 rounded-lg bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-colors relative">
                  {/* Top line: Node identifier, action tag, and timestamp */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-xs font-bold text-cyan-400">
                        Node #{idx + 1} [{evt.id}]
                      </span>
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
                      <span className="text-xs font-medium text-slate-200">
                        {evt.evidenceName || evt.evidenceId}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>{new Date(evt.timestamp).toUTCString()}</span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-12 gap-4 text-xs">
                    {/* Transfer Route */}
                    <div className="md:col-span-5 space-y-1.5 bg-slate-950/60 p-3 rounded border border-slate-800/80">
                      <div className="text-[11px] text-slate-400 font-medium">Custody Transfer Route</div>
                      <div className="flex items-center gap-2 text-slate-300">
                        <span className="text-slate-400">From:</span>
                        <span className="font-semibold text-white">{evt.fromInvestigator}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-300">
                        <span className="text-slate-400">To:</span>
                        <span className="font-semibold text-emerald-300">{evt.toInvestigator}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-400 text-[11px] pt-1 border-t border-slate-800/60">
                        <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                        <span className="truncate">{evt.location}</span>
                      </div>
                    </div>

                    {/* Purpose and Notes */}
                    <div className="md:col-span-7 flex flex-col justify-between">
                      <div>
                        <div className="text-[11px] text-slate-400 font-medium mb-1">
                          Operational Reason & Procedure
                        </div>
                        <p className="text-slate-300 leading-relaxed">{evt.purpose}</p>
                        {evt.notes && (
                          <p className="text-slate-400 text-[11px] mt-1.5 italic">
                            Notes: {evt.notes}
                          </p>
                        )}
                      </div>

                      {/* Cryptographic Snapshot */}
                      <div className="mt-3 pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <Lock className="w-3 h-3 text-cyan-400" />
                          <span>Snapshot SHA-256:</span>
                          <span className="text-cyan-300" title={evt.hashAtEvent}>
                            {truncateHash(evt.hashAtEvent, 10, 10)}
                          </span>
                        </div>
                        {evt.previousEventId && (
                          <div className="text-slate-500">
                            Prev Node: {evt.previousEventId}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Linked List Pointer Arrow */}
                {!isLast && (
                  <div className="flex flex-col items-center justify-center py-0.5 text-cyan-500/60">
                    <div className="h-3 w-px bg-cyan-500/30"></div>
                    <div className="flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-mono bg-slate-900 border border-slate-800 text-slate-400">
                      <span>pointer: Node-&gt;next</span>
                      <ArrowDown className="w-3 h-3 text-cyan-400" />
                    </div>
                    <div className="h-3 w-px bg-cyan-500/30"></div>
                  </div>
                )}
              </React.Fragment>
            );
          })
        )}
      </div>

      {/* Append Custody Event Modal */}
      {showAppendModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-lg max-w-lg w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Link2 className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-semibold text-white">Append Custody Transfer Event</h2>
              </div>
              <button
                onClick={() => setShowAppendModal(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            {appendError && (
              <div className="p-3 rounded bg-rose-950/50 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{appendError}</span>
              </div>
            )}

            {appendSuccess && (
              <div className="p-3 rounded bg-emerald-950/50 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{appendSuccess}</span>
              </div>
            )}

            <form onSubmit={handleAppendSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Target Evidence Artifact <span className="text-rose-400">*</span>
                </label>
                <select
                  value={formEvidenceId}
                  onChange={e => {
                    setFormEvidenceId(e.target.value);
                    const ev = evidences.find(item => item.id === e.target.value);
                    if (ev) setFormFrom(ev.currentCustodian);
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  required
                >
                  {evidences.map(ev => (
                    <option key={ev.id} value={ev.id}>
                      {ev.id} — {ev.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Custody Action Type <span className="text-rose-400">*</span>
                </label>
                <select
                  value={formAction}
                  onChange={e => setFormAction(e.target.value as CustodyAction)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                >
                  <option value="TRANSFERRED">TRANSFERRED (Transfer to another examiner/station)</option>
                  <option value="ANALYZED">ANALYZED (Mounted or examined in write-block lab)</option>
                  <option value="STORED">STORED (Returned to secure vault/locker)</option>
                  <option value="VERIFIED">VERIFIED (Cryptographic checksum check performed)</option>
                  <option value="RELEASED">RELEASED (Presented in court or released under judicial order)</option>
                  <option value="DISPOSED">DISPOSED (Secure sanitization per retention schedule)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Releasing Investigator (From) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formFrom}
                    onChange={e => setFormFrom(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Receiving Custodian (To) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formTo}
                    onChange={e => setFormTo(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Reason for Transfer / Purpose <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={formPurpose}
                  onChange={e => setFormPurpose(e.target.value)}
                  placeholder="e.g. Sent for memory forensics triage and decryption"
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Destination Storage / Lab Location <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={formLocation}
                  onChange={e => setFormLocation(e.target.value)}
                  placeholder="e.g. Primary Evidence Locker #4B (Cyber Lab)"
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Custody Notes & Physical Seal Integrity
                </label>
                <textarea
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500 resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAppendModal(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded transition-colors"
                >
                  Append to Chain
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

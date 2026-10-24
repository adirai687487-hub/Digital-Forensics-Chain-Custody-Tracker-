/**
 * Forensics & DSA Application Context
 * Manages forensic evidence lifecycle, chain-of-custody linked list, in-memory BST,
 * and recursive evidence trees with persistent state.
 */

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  Evidence,
  CustodyEvent,
  EvidenceTreeNode,
  VerificationLog,
  VerificationStatus,
  BSTSearchStep,
} from '../types/forensics';
import {
  INITIAL_EVIDENCES,
  INITIAL_CUSTODY_EVENTS,
  INITIAL_EVIDENCE_TREE,
  INITIAL_VERIFICATION_LOGS,
} from '../data/mockForensicData';
import { CustodyLinkedList } from '../dsa/LinkedList';
import { BinarySearchTree } from '../dsa/BinarySearchTree';
import { EvidenceTreeManager } from '../dsa/EvidenceTree';
import { compareHashes } from '../utils/crypto';

interface ForensicsContextType {
  evidences: Evidence[];
  custodyEvents: CustodyEvent[];
  evidenceTree: EvidenceTreeNode;
  verificationLogs: VerificationLog[];
  
  // Data structures
  bstInstance: BinarySearchTree;
  linkedListInstance: CustodyLinkedList;
  
  // Actions
  addEvidence: (
    evidence: Omit<Evidence, 'isFictionalDemo' | 'lastVerificationStatus'>,
    initialCustodian: string,
    initialLocation: string
  ) => { success: boolean; error?: string };
  
  appendCustodyEvent: (
    event: Omit<CustodyEvent, 'id' | 'timestamp' | 'previousEventId'>
  ) => { success: boolean; eventId?: string; error?: string };
  
  verifyEvidenceIntegrity: (
    evidenceId: string,
    computedHash: string,
    comparisonSource: string,
    examiner: string
  ) => {
    isMatch: boolean;
    status: VerificationStatus;
    storedHash: string;
    computedHash: string;
    logId: string;
  };
  
  searchByHashInBST: (targetHash: string) => {
    matches: Evidence[];
    steps: BSTSearchStep[];
    comparisons: number;
    found: boolean;
  };
  
  searchAll: (query: string) => Evidence[];
  
  addTreeNode: (
    parentId: string,
    node: Omit<EvidenceTreeNode, 'id' | 'children'>
  ) => boolean;
  
  resetToDemoData: () => void;
  clearAllData: () => void;
  exportDatabaseJson: () => string;
  importDatabaseJson: (jsonString: string) => { success: boolean; error?: string };
}

const STORAGE_KEYS = {
  EVIDENCES: 'dsl_dfir_evidences_v1',
  CUSTODY: 'dsl_dfir_custody_v1',
  TREE: 'dsl_dfir_tree_v1',
  VERIFICATIONS: 'dsl_dfir_verifications_v1',
};

const ForensicsContext = createContext<ForensicsContextType | undefined>(undefined);

export const ForensicsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Persistent state initialized from localStorage with demo fallbacks
  const [evidences, setEvidences] = useState<Evidence[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.EVIDENCES);
      return saved ? JSON.parse(saved) : INITIAL_EVIDENCES;
    } catch (e) {
      console.warn('Failed to load evidences from localStorage', e);
      return INITIAL_EVIDENCES;
    }
  });

  const [custodyEvents, setCustodyEvents] = useState<CustodyEvent[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CUSTODY);
      return saved ? JSON.parse(saved) : INITIAL_CUSTODY_EVENTS;
    } catch (e) {
      console.warn('Failed to load custody from localStorage', e);
      return INITIAL_CUSTODY_EVENTS;
    }
  });

  const [evidenceTree, setEvidenceTree] = useState<EvidenceTreeNode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TREE);
      return saved ? JSON.parse(saved) : INITIAL_EVIDENCE_TREE;
    } catch (e) {
      console.warn('Failed to load tree from localStorage', e);
      return INITIAL_EVIDENCE_TREE;
    }
  });

  const [verificationLogs, setVerificationLogs] = useState<VerificationLog[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.VERIFICATIONS);
      return saved ? JSON.parse(saved) : INITIAL_VERIFICATION_LOGS;
    } catch (e) {
      console.warn('Failed to load verifications from localStorage', e);
      return INITIAL_VERIFICATION_LOGS;
    }
  });

  // Rebuild the in-memory Binary Search Tree from the current evidences list
  // Meets requirement: "Rebuild the in-memory BST from saved records after reload."
  const bstInstance = useMemo(() => {
    return BinarySearchTree.rebuildFromEvidences(evidences);
  }, [evidences]);

  // Rebuild the in-memory Linked List from the current custody events
  const linkedListInstance = useMemo(() => {
    return CustodyLinkedList.fromArray(custodyEvents);
  }, [custodyEvents]);

  // Save to localStorage whenever state changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.EVIDENCES, JSON.stringify(evidences));
    } catch (e) {
      console.warn('LocalStorage save failed for evidences', e);
    }
  }, [evidences]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CUSTODY, JSON.stringify(custodyEvents));
    } catch (e) {
      console.warn('LocalStorage save failed for custody', e);
    }
  }, [custodyEvents]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.TREE, JSON.stringify(evidenceTree));
    } catch (e) {
      console.warn('LocalStorage save failed for tree', e);
    }
  }, [evidenceTree]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.VERIFICATIONS, JSON.stringify(verificationLogs));
    } catch (e) {
      console.warn('LocalStorage save failed for verifications', e);
    }
  }, [verificationLogs]);

  /**
   * Add new evidence item
   * 1. Validates unique ID and SHA-256 format
   * 2. Adds to evidences state
   * 3. Creates and appends initial 'COLLECTED' custody event in Linked List
   */
  const addEvidence = useCallback(
    (
      evidenceData: Omit<Evidence, 'isFictionalDemo' | 'lastVerificationStatus'>,
      initialCustodian: string,
      initialLocation: string
    ) => {
      const cleanId = evidenceData.id.trim();
      if (!cleanId) {
        return { success: false, error: 'Evidence ID is required.' };
      }

      if (evidences.some(e => e.id.toLowerCase() === cleanId.toLowerCase())) {
        return { success: false, error: `Evidence ID "${cleanId}" already exists. Evidence IDs must be unique.` };
      }

      const cleanHash = evidenceData.originalHash.trim().toLowerCase();
      if (!cleanHash || cleanHash.length !== 64 || !/^[0-9a-f]{64}$/i.test(cleanHash)) {
        return { success: false, error: 'Invalid SHA-256 hash. Must be 64 hexadecimal characters.' };
      }

      const newEvidence: Evidence = {
        ...evidenceData,
        id: cleanId,
        originalHash: cleanHash,
        isFictionalDemo: true, // Clearly labeled fictional demo data
        lastVerificationStatus: 'UNVERIFIED',
      };

      // Generate initial intake custody event
      const initialEventId = `EVT-${Date.now().toString().slice(-6)}`;
      const initialEvent: CustodyEvent = {
        id: initialEventId,
        evidenceId: cleanId,
        evidenceName: evidenceData.name,
        action: 'COLLECTED',
        fromInvestigator: evidenceData.seizureAuthority || 'Scene of Collection',
        toInvestigator: initialCustodian || evidenceData.investigatorName,
        purpose: `Initial intake and secure storage under authorization: ${evidenceData.seizureAuthority}`,
        location: initialLocation || evidenceData.storageLocation,
        timestamp: evidenceData.collectionTimestamp || new Date().toISOString(),
        hashAtEvent: cleanHash,
        previousEventId: null,
        notes: evidenceData.notes || 'Evidence received into initial custody.',
      };

      setEvidences(prev => [newEvidence, ...prev]);
      setCustodyEvents(prev => [...prev, initialEvent]);

      return { success: true };
    },
    [evidences]
  );

  /**
   * Append a new custody event (TRANSFER, ANALYZE, VERIFY, etc.)
   * Append-only: historical events are preserved permanently.
   */
  const appendCustodyEvent = useCallback(
    (eventData: Omit<CustodyEvent, 'id' | 'timestamp' | 'previousEventId'>) => {
      const targetEvidence = evidences.find(e => e.id === eventData.evidenceId);
      if (!targetEvidence) {
        return { success: false, error: `Target evidence item ${eventData.evidenceId} not found.` };
      }

      // Find the last event for this evidence item to chain previousEventId
      const evidenceEvents = custodyEvents.filter(e => e.evidenceId === eventData.evidenceId);
      const lastEvent = evidenceEvents.length > 0 ? evidenceEvents[evidenceEvents.length - 1] : null;

      const newEventId = `EVT-${Date.now().toString().slice(-6)}`;
      const timestamp = new Date().toISOString();

      const newEvent: CustodyEvent = {
        ...eventData,
        id: newEventId,
        evidenceName: targetEvidence.name,
        timestamp,
        previousEventId: lastEvent ? lastEvent.id : null,
      };

      // Update current custodian and location on evidence record
      setEvidences(prev =>
        prev.map(item => {
          if (item.id === eventData.evidenceId) {
            return {
              ...item,
              currentCustodian: eventData.toInvestigator,
              storageLocation: eventData.location,
            };
          }
          return item;
        })
      );

      // Append event to linked list history
      setCustodyEvents(prev => [...prev, newEvent]);

      return { success: true, eventId: newEventId };
    },
    [evidences, custodyEvents]
  );

  /**
   * Perform Forensic Integrity Verification
   * Compares stored SHA-256 against computed SHA-256
   */
  const verifyEvidenceIntegrity = useCallback(
    (
      evidenceId: string,
      computedHash: string,
      comparisonSource: string,
      examiner: string
    ) => {
      const target = evidences.find(e => e.id === evidenceId);
      if (!target) {
        throw new Error(`Evidence ${evidenceId} not found.`);
      }

      const comparison = compareHashes(target.originalHash, computedHash);
      const status: VerificationStatus = comparison.isMatch ? 'VERIFIED' : 'TAMPERED';
      const timestamp = new Date().toISOString();
      const logId = `VER-${Date.now().toString().slice(-6)}`;

      const newLog: VerificationLog = {
        id: logId,
        evidenceId,
        evidenceName: target.name,
        storedHash: target.originalHash,
        computedHash: computedHash.trim().toLowerCase(),
        timestamp,
        status,
        examiner,
        mismatchIndex: comparison.mismatchIndices[0],
        comparisonSource,
      };

      // Update evidence verification status
      setEvidences(prev =>
        prev.map(e =>
          e.id === evidenceId
            ? { ...e, lastVerificationStatus: status, lastVerifiedTimestamp: timestamp }
            : e
        )
      );

      // Append verification log
      setVerificationLogs(prev => [newLog, ...prev]);

      // Append VERIFIED or TAMPER-DETECTED event to Custody Linked List
      const eventId = `EVT-${Date.now().toString().slice(-6)}`;
      const custodyEvt: CustodyEvent = {
        id: eventId,
        evidenceId,
        evidenceName: target.name,
        action: 'VERIFIED',
        fromInvestigator: examiner,
        toInvestigator: target.currentCustodian,
        purpose: comparison.isMatch
          ? `Integrity check PASSED. Computed SHA-256 matches stored baseline 100%.`
          : `WARNING: Integrity check FAILED. Computed hash mismatch at index ${comparison.mismatchIndices[0]}. Possible unauthorized file modification or corruption!`,
        location: target.storageLocation,
        timestamp,
        hashAtEvent: computedHash.trim().toLowerCase(),
        previousEventId: null,
        notes: `Verification Source: ${comparisonSource} | Examiner: ${examiner}`,
      };

      setCustodyEvents(prev => [...prev, custodyEvt]);

      return {
        isMatch: comparison.isMatch,
        status,
        storedHash: target.originalHash,
        computedHash: computedHash.trim().toLowerCase(),
        logId,
      };
    },
    [evidences]
  );

  /**
   * Search by exact SHA-256 in the Binary Search Tree
   * Returns matching evidences and the exact search steps / path taken through the BST!
   */
  const searchByHashInBST = useCallback(
    (targetHash: string) => {
      const searchResult = bstInstance.searchWithSteps(targetHash);
      const matchingIds = searchResult.foundNode ? searchResult.foundNode.evidenceIds : [];
      const matches = evidences.filter(e => matchingIds.includes(e.id));

      return {
        matches,
        steps: searchResult.steps,
        comparisons: searchResult.comparisons,
        found: matches.length > 0,
      };
    },
    [bstInstance, evidences]
  );

  /**
   * Global multi-criteria search (ID, name, case, investigator, or hash)
   */
  const searchAll = useCallback(
    (query: string) => {
      const q = query.trim().toLowerCase();
      if (!q) return evidences;

      return evidences.filter(
        e =>
          e.id.toLowerCase().includes(q) ||
          e.name.toLowerCase().includes(q) ||
          e.caseId.toLowerCase().includes(q) ||
          e.caseName.toLowerCase().includes(q) ||
          e.investigatorName.toLowerCase().includes(q) ||
          e.currentCustodian.toLowerCase().includes(q) ||
          e.originalHash.toLowerCase().includes(q) ||
          e.type.toLowerCase().includes(q)
      );
    },
    [evidences]
  );

  /**
   * Attach a child node to the hierarchical Evidence Tree
   */
  const addTreeNode = useCallback(
    (parentId: string, nodeData: Omit<EvidenceTreeNode, 'id' | 'children'>) => {
      const newId = `node-${Date.now().toString().slice(-6)}`;
      const newNode: EvidenceTreeNode = {
        ...nodeData,
        id: newId,
        children: [],
      };

      const cloneTree: EvidenceTreeNode = JSON.parse(JSON.stringify(evidenceTree));
      const attached = EvidenceTreeManager.addChildNode(cloneTree, parentId, newNode);
      if (attached) {
        setEvidenceTree(cloneTree);
        return true;
      }
      return false;
    },
    [evidenceTree]
  );

  /**
   * Reset all records to initial fictional university demo data
   */
  const resetToDemoData = useCallback(() => {
    setEvidences(INITIAL_EVIDENCES);
    setCustodyEvents(INITIAL_CUSTODY_EVENTS);
    setEvidenceTree(INITIAL_EVIDENCE_TREE);
    setVerificationLogs(INITIAL_VERIFICATION_LOGS);
    localStorage.removeItem(STORAGE_KEYS.EVIDENCES);
    localStorage.removeItem(STORAGE_KEYS.CUSTODY);
    localStorage.removeItem(STORAGE_KEYS.TREE);
    localStorage.removeItem(STORAGE_KEYS.VERIFICATIONS);
  }, []);

  /**
   * Clear all records
   */
  const clearAllData = useCallback(() => {
    setEvidences([]);
    setCustodyEvents([]);
    setVerificationLogs([]);
    setEvidenceTree({
      id: 'root-empty',
      name: 'Primary Evidence Store (Empty)',
      type: 'device',
      children: [],
    });
    localStorage.clear();
  }, []);

  /**
   * Export database as JSON
   */
  const exportDatabaseJson = useCallback(() => {
    const payload = {
      version: '1.0',
      exportTimestamp: new Date().toISOString(),
      disclaimer: 'FICTIONAL ACADEMIC RESEARCH DEMO DATA - Ajeenkya DY Patil University',
      evidences,
      custodyEvents,
      evidenceTree,
      verificationLogs,
    };
    return JSON.stringify(payload, null, 2);
  }, [evidences, custodyEvents, evidenceTree, verificationLogs]);

  /**
   * Import database from JSON
   */
  const importDatabaseJson = useCallback((jsonString: string) => {
    try {
      const data = JSON.parse(jsonString);
      if (!Array.isArray(data.evidences) || !Array.isArray(data.custodyEvents)) {
        return { success: false, error: 'Invalid JSON schema: Missing evidences or custodyEvents arrays.' };
      }
      setEvidences(data.evidences);
      setCustodyEvents(data.custodyEvents);
      if (data.evidenceTree) setEvidenceTree(data.evidenceTree);
      if (Array.isArray(data.verificationLogs)) setVerificationLogs(data.verificationLogs);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'JSON parse error' };
    }
  }, []);

  const value = {
    evidences,
    custodyEvents,
    evidenceTree,
    verificationLogs,
    bstInstance,
    linkedListInstance,
    addEvidence,
    appendCustodyEvent,
    verifyEvidenceIntegrity,
    searchByHashInBST,
    searchAll,
    addTreeNode,
    resetToDemoData,
    clearAllData,
    exportDatabaseJson,
    importDatabaseJson,
  };

  return <ForensicsContext.Provider value={value}>{children}</ForensicsContext.Provider>;
};

export const useForensics = (): ForensicsContextType => {
  const context = useContext(ForensicsContext);
  if (!context) {
    throw new Error('useForensics must be used within a ForensicsProvider');
  }
  return context;
};

/**
 * Forensics & DSA Application Context with Firebase Authentication & Cloud Firestore Backend
 * Supports both Live Cloud Firestore persistence and Academic Demo Mode.
 */

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import {
  collection,
  query,
  where,
  onSnapshot,
  setDoc,
  doc,
  updateDoc,
  getDocs,
} from 'firebase/firestore';
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
import {
  auth,
  db,
  signInWithGoogle as authSignInWithGoogle,
  signOutUser as authSignOutUser,
  handleFirestoreError,
  testConnection,
  OperationType,
} from '../lib/firebase';

interface ForensicsContextType {
  // Authentication & Cloud Sync
  user: User | null;
  authLoading: boolean;
  isCloudMode: boolean;
  setIsCloudMode: (active: boolean) => void;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  firestoreConnected: boolean;
  cloudSyncLoading: boolean;
  syncError: string | null;
  seedCloudWithDemoData: () => Promise<{ success: boolean; error?: string }>;

  // Data
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
  ) => Promise<{ success: boolean; error?: string }>;

  appendCustodyEvent: (
    event: Omit<CustodyEvent, 'id' | 'timestamp' | 'previousEventId'>
  ) => Promise<{ success: boolean; eventId?: string; error?: string }>;

  verifyEvidenceIntegrity: (
    evidenceId: string,
    computedHash: string,
    comparisonSource: string,
    examiner: string
  ) => Promise<{
    isMatch: boolean;
    status: VerificationStatus;
    storedHash: string;
    computedHash: string;
    logId: string;
  }>;

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
  CLOUD_MODE: 'dsl_dfir_cloud_mode_v1',
};

const ForensicsContext = createContext<ForensicsContextType | undefined>(undefined);

export const ForensicsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [firestoreConnected, setFirestoreConnected] = useState(false);
  const [cloudSyncLoading, setCloudSyncLoading] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Cloud Mode state (defaults to true if user is logged in, or local demo mode if logged out)
  const [isCloudMode, setIsCloudModeState] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CLOUD_MODE);
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const setIsCloudMode = (val: boolean) => {
    setIsCloudModeState(val);
    try {
      localStorage.setItem(STORAGE_KEYS.CLOUD_MODE, JSON.stringify(val));
    } catch (e) {
      console.warn('LocalStorage save failed for cloud mode', e);
    }
  };

  // Local state fallback / demo data
  const [localEvidences, setLocalEvidences] = useState<Evidence[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.EVIDENCES);
      return saved ? JSON.parse(saved) : INITIAL_EVIDENCES;
    } catch {
      return INITIAL_EVIDENCES;
    }
  });

  const [localCustodyEvents, setLocalCustodyEvents] = useState<CustodyEvent[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CUSTODY);
      return saved ? JSON.parse(saved) : INITIAL_CUSTODY_EVENTS;
    } catch {
      return INITIAL_CUSTODY_EVENTS;
    }
  });

  const [localVerificationLogs, setLocalVerificationLogs] = useState<VerificationLog[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.VERIFICATIONS);
      return saved ? JSON.parse(saved) : INITIAL_VERIFICATION_LOGS;
    } catch {
      return INITIAL_VERIFICATION_LOGS;
    }
  });

  // Cloud Firestore state
  const [cloudEvidences, setCloudEvidences] = useState<Evidence[]>([]);
  const [cloudCustodyEvents, setCloudCustodyEvents] = useState<CustodyEvent[]>([]);
  const [cloudVerificationLogs, setCloudVerificationLogs] = useState<VerificationLog[]>([]);

  // Tree state (local or cloud)
  const [evidenceTree, setEvidenceTree] = useState<EvidenceTreeNode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TREE);
      return saved ? JSON.parse(saved) : INITIAL_EVIDENCE_TREE;
    } catch {
      return INITIAL_EVIDENCE_TREE;
    }
  });

  // Decide active data based on whether user is logged in and isCloudMode is true
  const useCloudData = isCloudMode && user !== null;
  const evidences = useCloudData ? cloudEvidences : localEvidences;
  const custodyEvents = useCloudData ? cloudCustodyEvents : localCustodyEvents;
  const verificationLogs = useCloudData ? cloudVerificationLogs : localVerificationLogs;

  // Initialize and validate Firestore connection on mount
  useEffect(() => {
    testConnection().then(connected => {
      setFirestoreConnected(connected);
    });
  }, []);

  // Monitor Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async currentUser => {
      setUser(currentUser);
      setAuthLoading(false);
      setSyncError(null);

      if (currentUser) {
        setIsCloudMode(true);
        // Ensure user profile document exists in Firestore
        try {
          const userRef = doc(db, 'users', currentUser.uid);
          await setDoc(
            userRef,
            {
              uid: currentUser.uid,
              email: currentUser.email || 'anonymous',
              displayName: currentUser.displayName || 'Forensic Examiner',
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          );
        } catch (err) {
          console.warn('Could not update user profile doc:', err);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Listen to Firestore updates when user is authenticated and cloud mode is active
  useEffect(() => {
    if (!user || !isCloudMode) {
      return;
    }

    setCloudSyncLoading(true);
    setSyncError(null);

    // 1. Evidence Query
    const evidencePath = 'evidence';
    const evidenceQuery = query(
      collection(db, evidencePath),
      where('ownerUid', '==', user.uid)
    );

    const unsubEvidence = onSnapshot(
      evidenceQuery,
      snapshot => {
        const loaded: Evidence[] = [];
        snapshot.forEach(docSnap => {
          loaded.push(docSnap.data() as Evidence);
        });
        setCloudEvidences(loaded);
        setCloudSyncLoading(false);
      },
      error => {
        setCloudSyncLoading(false);
        setSyncError(`Error syncing evidence from Firestore: ${error.message}`);
        try {
          handleFirestoreError(error, OperationType.LIST, evidencePath);
        } catch (e) {
          // Handled
        }
      }
    );

    // 2. Custody Events Query
    const custodyPath = 'custody_events';
    const custodyQuery = query(
      collection(db, custodyPath),
      where('ownerUid', '==', user.uid)
    );

    const unsubCustody = onSnapshot(
      custodyQuery,
      snapshot => {
        const loaded: CustodyEvent[] = [];
        snapshot.forEach(docSnap => {
          loaded.push(docSnap.data() as CustodyEvent);
        });
        // Sort chronologically
        loaded.sort(
          (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
        setCloudCustodyEvents(loaded);
      },
      error => {
        try {
          handleFirestoreError(error, OperationType.LIST, custodyPath);
        } catch (e) {
          // Handled
        }
      }
    );

    // 3. Verification Logs Query
    const verifPath = 'verification_logs';
    const verifQuery = query(
      collection(db, verifPath),
      where('ownerUid', '==', user.uid)
    );

    const unsubVerif = onSnapshot(
      verifQuery,
      snapshot => {
        const loaded: VerificationLog[] = [];
        snapshot.forEach(docSnap => {
          loaded.push(docSnap.data() as VerificationLog);
        });
        loaded.sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        setCloudVerificationLogs(loaded);
      },
      error => {
        try {
          handleFirestoreError(error, OperationType.LIST, verifPath);
        } catch (e) {
          // Handled
        }
      }
    );

    return () => {
      unsubEvidence();
      unsubCustody();
      unsubVerif();
    };
  }, [user, isCloudMode]);

  // Rebuild the in-memory Binary Search Tree from the current evidences list
  const bstInstance = useMemo(() => {
    return BinarySearchTree.rebuildFromEvidences(evidences);
  }, [evidences]);

  // Rebuild the in-memory Linked List from the current custody events
  const linkedListInstance = useMemo(() => {
    return CustodyLinkedList.fromArray(custodyEvents);
  }, [custodyEvents]);

  // LocalStorage sync for offline / demo mode
  useEffect(() => {
    if (!useCloudData) {
      try {
        localStorage.setItem(STORAGE_KEYS.EVIDENCES, JSON.stringify(localEvidences));
      } catch (e) {
        console.warn('LocalStorage save failed for evidences', e);
      }
    }
  }, [localEvidences, useCloudData]);

  useEffect(() => {
    if (!useCloudData) {
      try {
        localStorage.setItem(STORAGE_KEYS.CUSTODY, JSON.stringify(localCustodyEvents));
      } catch (e) {
        console.warn('LocalStorage save failed for custody', e);
      }
    }
  }, [localCustodyEvents, useCloudData]);

  useEffect(() => {
    if (!useCloudData) {
      try {
        localStorage.setItem(STORAGE_KEYS.VERIFICATIONS, JSON.stringify(localVerificationLogs));
      } catch (e) {
        console.warn('LocalStorage save failed for verifications', e);
      }
    }
  }, [localVerificationLogs, useCloudData]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.TREE, JSON.stringify(evidenceTree));
    } catch (e) {
      console.warn('LocalStorage save failed for tree', e);
    }
  }, [evidenceTree]);

  // Auth helper methods
  const signInWithGoogle = useCallback(async () => {
    setSyncError(null);
    try {
      await authSignInWithGoogle();
    } catch (err: any) {
      setSyncError(`Sign-in failed: ${err.message}`);
      throw err;
    }
  }, []);

  const signOut = useCallback(async () => {
    setSyncError(null);
    try {
      await authSignOutUser();
      setIsCloudMode(false);
    } catch (err: any) {
      setSyncError(`Sign-out failed: ${err.message}`);
    }
  }, []);

  /**
   * One-click action to copy baseline university demo records into the user's Firestore cloud account
   */
  const seedCloudWithDemoData = useCallback(async () => {
    if (!user) {
      return { success: false, error: 'Please sign in with Google to seed cloud database.' };
    }

    try {
      setCloudSyncLoading(true);

      // Write each demo evidence item with ownerUid
      for (const item of INITIAL_EVIDENCES) {
        const itemWithUid: Evidence = {
          ...item,
          ownerUid: user.uid,
          isFictionalDemo: false,
        };
        await setDoc(doc(db, 'evidence', item.id), itemWithUid);
      }

      // Write each demo custody event with ownerUid
      for (const evt of INITIAL_CUSTODY_EVENTS) {
        const evtWithUid: CustodyEvent = {
          ...evt,
          ownerUid: user.uid,
        };
        await setDoc(doc(db, 'custody_events', evt.id), evtWithUid);
      }

      // Write each demo verification log
      for (const log of INITIAL_VERIFICATION_LOGS) {
        const logWithUid: VerificationLog = {
          ...log,
          ownerUid: user.uid,
        };
        await setDoc(doc(db, 'verification_logs', log.id), logWithUid);
      }

      setCloudSyncLoading(false);
      return { success: true };
    } catch (err: any) {
      setCloudSyncLoading(false);
      return { success: false, error: err.message };
    }
  }, [user]);

  /**
   * Add new evidence item
   * Writes to Cloud Firestore if user is authenticated and cloud mode is active.
   */
  const addEvidence = useCallback(
    async (
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
        isFictionalDemo: !useCloudData,
        ownerUid: user?.uid,
        lastVerificationStatus: 'UNVERIFIED',
      };

      // Initial intake custody event
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
        ownerUid: user?.uid,
        notes: evidenceData.notes || 'Evidence received into initial custody.',
      };

      if (useCloudData && user) {
        // Save to Firestore
        try {
          await setDoc(doc(db, 'evidence', cleanId), newEvidence);
          await setDoc(doc(db, 'custody_events', initialEventId), initialEvent);
          return { success: true };
        } catch (err: any) {
          handleFirestoreError(err, OperationType.CREATE, `evidence/${cleanId}`);
        }
      } else {
        // Save to local state
        setLocalEvidences(prev => [newEvidence, ...prev]);
        setLocalCustodyEvents(prev => [...prev, initialEvent]);
        return { success: true };
      }
    },
    [evidences, useCloudData, user]
  );

  /**
   * Append a new custody event (TRANSFER, ANALYZE, VERIFY, etc.)
   * Strictly append-only: historical events are preserved permanently.
   */
  const appendCustodyEvent = useCallback(
    async (eventData: Omit<CustodyEvent, 'id' | 'timestamp' | 'previousEventId'>) => {
      const targetEvidence = evidences.find(e => e.id === eventData.evidenceId);
      if (!targetEvidence) {
        return { success: false, error: `Target evidence item ${eventData.evidenceId} not found.` };
      }

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
        ownerUid: user?.uid,
      };

      if (useCloudData && user) {
        try {
          // Write custody event document
          await setDoc(doc(db, 'custody_events', newEventId), newEvent);
          // Update evidence current custodian and location
          await updateDoc(doc(db, 'evidence', eventData.evidenceId), {
            currentCustodian: eventData.toInvestigator,
            storageLocation: eventData.location,
            updatedAt: timestamp,
          });
          return { success: true, eventId: newEventId };
        } catch (err: any) {
          handleFirestoreError(err, OperationType.CREATE, `custody_events/${newEventId}`);
        }
      } else {
        setLocalEvidences(prev =>
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
        setLocalCustodyEvents(prev => [...prev, newEvent]);
        return { success: true, eventId: newEventId };
      }
    },
    [evidences, custodyEvents, useCloudData, user]
  );

  /**
   * Perform Forensic Integrity Verification
   * Compares stored SHA-256 against computed SHA-256
   */
  const verifyEvidenceIntegrity = useCallback(
    async (
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
        ownerUid: user?.uid,
      };

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
        ownerUid: user?.uid,
        notes: `Verification Source: ${comparisonSource} | Examiner: ${examiner}`,
      };

      if (useCloudData && user) {
        try {
          await setDoc(doc(db, 'verification_logs', logId), newLog);
          await setDoc(doc(db, 'custody_events', eventId), custodyEvt);
          await updateDoc(doc(db, 'evidence', evidenceId), {
            lastVerificationStatus: status,
            lastVerifiedTimestamp: timestamp,
            updatedAt: timestamp,
          });
        } catch (err: any) {
          handleFirestoreError(err, OperationType.WRITE, `verification_logs/${logId}`);
        }
      } else {
        setLocalEvidences(prev =>
          prev.map(e =>
            e.id === evidenceId
              ? { ...e, lastVerificationStatus: status, lastVerifiedTimestamp: timestamp }
              : e
          )
        );
        setLocalVerificationLogs(prev => [newLog, ...prev]);
        setLocalCustodyEvents(prev => [...prev, custodyEvt]);
      }

      return {
        isMatch: comparison.isMatch,
        status,
        storedHash: target.originalHash,
        computedHash: computedHash.trim().toLowerCase(),
        logId,
      };
    },
    [evidences, useCloudData, user]
  );

  /**
   * Search by exact SHA-256 in the Binary Search Tree
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
   * Global multi-criteria search
   */
  const searchAll = useCallback(
    (queryStr: string) => {
      const q = queryStr.trim().toLowerCase();
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
   * Reset local records to initial fictional university demo data
   */
  const resetToDemoData = useCallback(() => {
    setLocalEvidences(INITIAL_EVIDENCES);
    setLocalCustodyEvents(INITIAL_CUSTODY_EVENTS);
    setEvidenceTree(INITIAL_EVIDENCE_TREE);
    setLocalVerificationLogs(INITIAL_VERIFICATION_LOGS);
    localStorage.removeItem(STORAGE_KEYS.EVIDENCES);
    localStorage.removeItem(STORAGE_KEYS.CUSTODY);
    localStorage.removeItem(STORAGE_KEYS.TREE);
    localStorage.removeItem(STORAGE_KEYS.VERIFICATIONS);
  }, []);

  /**
   * Clear all records
   */
  const clearAllData = useCallback(() => {
    setLocalEvidences([]);
    setLocalCustodyEvents([]);
    setLocalVerificationLogs([]);
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
      isCloudBackend: useCloudData,
      userEmail: user?.email || null,
      evidences,
      custodyEvents,
      evidenceTree,
      verificationLogs,
    };
    return JSON.stringify(payload, null, 2);
  }, [evidences, custodyEvents, evidenceTree, verificationLogs, useCloudData, user]);

  /**
   * Import database from JSON
   */
  const importDatabaseJson = useCallback((jsonString: string) => {
    try {
      const data = JSON.parse(jsonString);
      if (!Array.isArray(data.evidences) || !Array.isArray(data.custodyEvents)) {
        return { success: false, error: 'Invalid JSON schema: Missing evidences or custodyEvents arrays.' };
      }
      setLocalEvidences(data.evidences);
      setLocalCustodyEvents(data.custodyEvents);
      if (data.evidenceTree) setEvidenceTree(data.evidenceTree);
      if (Array.isArray(data.verificationLogs)) setLocalVerificationLogs(data.verificationLogs);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'JSON parse error' };
    }
  }, []);

  const value = {
    user,
    authLoading,
    isCloudMode,
    setIsCloudMode,
    signInWithGoogle,
    signOut,
    firestoreConnected,
    cloudSyncLoading,
    syncError,
    seedCloudWithDemoData,
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

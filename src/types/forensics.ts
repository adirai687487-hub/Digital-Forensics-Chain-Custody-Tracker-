/**
 * Forensic and DSA Types for Digital Forensics Chain of Custody Tracker
 * Academic Reference: Ajeenkya DY Patil University - School of Engineering
 */

export type CustodyAction =
  | 'COLLECTED'
  | 'TRANSFERRED'
  | 'ANALYZED'
  | 'STORED'
  | 'VERIFIED'
  | 'RELEASED'
  | 'DISPOSED';

export type EvidenceType =
  | 'Disk Image'
  | 'Memory Dump'
  | 'Network PCAP'
  | 'System Log'
  | 'Email Archive'
  | 'Document'
  | 'Mobile Extraction'
  | 'Binary / Executable'
  | 'Database Dump';

export type VerificationStatus = 'VERIFIED' | 'TAMPERED' | 'UNVERIFIED';

/**
 * Fundamental Evidence Record
 */
export interface Evidence {
  id: string; // e.g., 'EVD-2026-101'
  caseId: string; // e.g., 'CASE-CR-2026-8912'
  caseName: string;
  name: string; // e.g., 'laptop_image.dd'
  type: EvidenceType;
  originalHash: string; // SHA-256 (64 hex characters)
  hashAlgorithm: 'SHA-256';
  fileSizeBytes: number;
  collectionTimestamp: string; // ISO-8601
  collectionLocation: string;
  investigatorName: string;
  investigatorBadge: string;
  seizureAuthority: string; // e.g., 'Warrant #SW-2026-441A'
  storageLocation: string; // e.g., 'Evidence Locker #4B'
  currentCustodian: string;
  notes: string;
  isFictionalDemo: boolean;
  lastVerifiedTimestamp?: string;
  lastVerificationStatus?: VerificationStatus;
  treeNodeId?: string; // Link to Evidence Tree
}

/**
 * Custody Event Node in Linked List
 */
export interface CustodyEvent {
  id: string; // e.g., 'EVT-001'
  evidenceId: string;
  evidenceName?: string;
  action: CustodyAction;
  fromInvestigator: string;
  toInvestigator: string;
  purpose: string;
  location: string;
  timestamp: string; // ISO-8601
  hashAtEvent: string; // SHA-256 integrity snapshot
  previousEventId?: string | null;
  signatureReference?: string;
  notes?: string;
}

/**
 * Binary Search Tree Node for Hash Lookup
 * Maps a SHA-256 hash to one or more evidence IDs (handles duplicate hashes)
 */
export interface BSTNodeData {
  hash: string;
  evidenceIds: string[]; // Supports duplicate hashes
  left: BSTNodeData | null;
  right: BSTNodeData | null;
  height: number;
}

/**
 * Search Step for Visual BST Playback
 */
export interface BSTSearchStep {
  stepNumber: number;
  currentHash: string;
  comparison: 'EQUAL' | 'LESS_THAN' | 'GREATER_THAN';
  direction: 'FOUND' | 'LEFT' | 'RIGHT';
  evidenceIds?: string[];
  depth: number;
}

/**
 * Recursive Evidence Tree Node (e.g., Device -> Disk -> Partition -> Folder -> Archive -> Files)
 */
export interface EvidenceTreeNode {
  id: string;
  name: string;
  type: 'device' | 'disk_image' | 'partition' | 'folder' | 'archive' | 'file';
  sizeBytes?: number;
  hash?: string;
  evidenceId?: string; // Linked evidence item ID if cataloged
  notes?: string;
  children: EvidenceTreeNode[];
}

/**
 * Tree Traversal Step for Visualizer
 */
export interface TreeTraversalStep {
  nodeId: string;
  nodeName: string;
  nodeType: string;
  depth: number;
  action: 'VISIT' | 'DESCEND' | 'RETURN';
  callStack: string[];
}

/**
 * Verification Record Log
 */
export interface VerificationLog {
  id: string;
  evidenceId: string;
  evidenceName: string;
  storedHash: string;
  computedHash: string;
  timestamp: string;
  status: VerificationStatus;
  examiner: string;
  mismatchIndex?: number;
  comparisonSource: string; // e.g. "Uploaded file: suspect_disk.img"
}

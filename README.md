# DSL — Digital Forensics Chain of Custody Tracker
### Evidence Integrity & Investigation Management System Powered by Data Structures & Algorithms

[![React](https://img.shields.io/badge/React-19.0-blue.svg?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF.svg?logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC.svg?logo=tailwind-css)](https://tailwindcss.com/)
[![Web Crypto API](https://img.shields.io/badge/Cryptography-FIPS_180--4_SHA--256-emerald.svg)](https://w3c.github.io/webcrypto/)
[![Academic Project](https://img.shields.io/badge/Defense-Ajeenkya_DY_Patil_University-maroon.svg)](#academic-attribution)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache_2.0-yellow.svg)](LICENSE)

---

## 1. Executive Summary & Problem Statement

In modern cybercrime investigations, incident responders and forensic examiners seize vast quantities of digital artifacts—raw physical disk images (`.dd`, `.e01`), volatile memory dumps (`.raw`), network packet captures (`.pcap`), database logs, and encrypted containers.

For digital evidence to remain admissible in a court of law under **Federal Rules of Evidence (FRE) Rule 901** and international digital forensic standards (**ISO/IEC 27037** & **NIST SP 800-86**), investigators must prove two critical invariants:
1. **Unbroken Chain of Custody**: A chronological, tamper-evident historical audit trail documenting every custody transfer, lab analysis, and physical storage location change without silent edits or deletions.
2. **Cryptographic Integrity**: Byte-level mathematical verification that an evidence item has not been altered, corrupted, or tampered with since the instant of seizure ($Stored\_SHA256 == Current\_SHA256$).

### The Educational DSA Objective
Many forensic concepts align directly with classical **Data Structures and Algorithms (DSA)**:
- **Append-only custody logging** mirrors a **Singly Linked List with tail pointer**.
- **Fast cryptographic fingerprint lookup** mirrors a **Binary Search Tree (BST)**.
- **Hierarchical disk/folder/archive architectures** mirror a **Recursive Tree**.

This project bridges theoretical computer science and digital forensics engineering, providing an interactive, full-stack web application for research presentations, defense examinations, and practical forensic workflow simulations.

---

## 2. Research Background & Academic Attribution

- **Institution**: School of Engineering, Ajeenkya DY Patil University, Pune, Maharashtra, India
- **Program**: Undergraduate Engineering Research Project Defense
- **Domain**: Cybersecurity · Digital Forensics · Data Structures & Algorithms (DSA)
- **Student Researchers**:
  - **Joe Jelson J** — PRN: `E25B000152`
  - **Ayush Rai** — PRN: `E25B000195`

---

## 3. System Architecture & DSA Mapping

The application is architected around three foundational data structures connected directly to forensic operations:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       FORENSIC INTAKE & INVENTORY                           │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
         ┌─────────────────────────────┼─────────────────────────────┐
         ▼                             ▼                             ▼
┌──────────────────┐         ┌──────────────────┐         ┌──────────────────┐
│   LINKED LIST    │         │   BINARY SEARCH  │         │  EVIDENCE TREE   │
│ (Chain of Custody│         │    TREE (BST)    │         │  (Hierarchical   │
│      Ledger)     │         │   (Hash Index)   │         │    Hierarchy)    │
└────────┬─────────┘         └────────┬─────────┘         └────────┬─────────┘
         │                            │                            │
         ▼                            ▼                            ▼
• Append with Tail: O(1)     • Avg Search: O(log n)       • Recursive Walk: O(n)
• Tamper-Evident History     • Duplicate Hash Buckets     • Call Stack: O(h)
• Chronological Order        • In-Order Sorted Output     • Nested Files/Archives
```

### 3.1. Singly Linked List — Chronological Chain of Custody
*(Reference: Project Defense Slide 6)*

Custody records represent an append-only timeline. Using an array requires potential dynamic reallocations and element shifting. A singly linked list with a dedicated `tail` pointer provides **$\mathcal{O}(1)$ insertion** to append new transfer events.

```cpp
struct Evidence {
    int id;
    string name;
    string type;
    string hash;
    string timestamp;
    string investigator;
    Evidence* next;
};
```

- **$\mathcal{O}(1)$ Append**: Appending new custody events directly to `tail->next` ensures instantaneous logging regardless of ledger length.
- **$\mathcal{O}(n)$ Traversal**: Validates chronological integrity and displays the full unbroken timeline from seizure to court presentation.
- **Tamper Evidence**: Deleting or editing an interior node breaks pointer continuity (`prev->next != curr`), immediately flagging an audit failure.

### 3.2. Binary Search Tree (BST) — Cryptographic Hash Index
*(Reference: Project Defense Slide 7)*

Comparing SHA-256 hashes across an unindexed repository requires $\mathcal{O}(n)$ sequential string inspections. By organizing hashes in a Binary Search Tree using lexicographical hex string comparisons (`0-9`, `a-f`), the system achieves **$\mathcal{O}(\log n)$ average search and insertion**.

```cpp
struct BSTNode {
    string hash;
    vector<int> evidenceIDs; // Duplicate hash bucket
    BSTNode* left;
    BSTNode* right;
};
```

- **Duplicate Hash Support**: In malware incidents or enterprise breaches, identical malicious binaries or duplicate data dumps exist across multiple endpoints. The implementation stores an array bucket (`evidenceIds: string[]`) per node to resolve hash collisions without data loss.
- **In-Order Traversal ($\mathcal{O}(n)$)**: Visited as `Left -> Root -> Right`, naturally generating a lexicographically sorted registry of cryptographic fingerprints.
- **Live Traversal Trace**: Visually tracks and logs each branch decision (`target < current.hash` $\to$ Branch Left; `target > current.hash` $\to$ Branch Right) to demonstrate the algorithm to examiners.

### 3.3. Recursive Evidence Tree — Nested Filesystems & Archives
*(Reference: Project Defense Slide 8)*

Digital evidence is inherently recursive: physical devices encapsulate disk images; disk images contain partition tables; partitions contain folder trees; folders contain compressed archives (`.zip`, `.tar.gz`); archives contain files.

```cpp
void displayTree(Node* root) {
    if (root == nullptr) return;
    cout << root->name << endl;
    for (Node* child : root->children)
        displayTree(child);
}
```

- **$\mathcal{O}(n)$ Time Complexity**: Recursively visits all $n$ nodes in the filesystem tree.
- **$\mathcal{O}(h)$ Auxiliary Space Complexity**: Consumes call-stack frames proportional to maximum nesting depth $h$.
- **Subtree Metrics**: Recursively aggregates total node count, file count, folder count, archive count, and cumulative byte volume.

### 3.4. Cryptographic Hashing Engine (Web Crypto API)
*(Reference: Project Defense Slide 9)*

Integrity verification uses the browser's native **Web Crypto API** (`crypto.subtle.digest('SHA-256', buffer)`) adhering to the **NIST FIPS 180-4** standard. No external cloud endpoints or mock strings are used for file hashing:
- Computes genuine 64-character lowercase hexadecimal SHA-256 fingerprints directly in the browser thread.
- Side-by-side character-level comparison visualizer highlights matching and mismatching indices.
- **Simulate 1-Bit Tamper**: Flips a single character in memory so examiners can test tamper detection without needing pre-corrupted files.

---

## 4. Asymptotic Complexity Reference Matrix

*(Reference: Project Defense Slide 13)*

| Operation | Typical / Average Time | Worst-Case Time | Auxiliary Space | Data Structure Applied |
|:---|:---:|:---:|:---:|:---|
| **Linked List Append** | $\mathcal{O}(1)$ *(with tail)* | $\mathcal{O}(n)$ *(linear scan)* | $\mathcal{O}(1)$ | Chronological Chain of Custody |
| **Linked List Search by ID** | $\mathcal{O}(n)$ | $\mathcal{O}(n)$ | $\mathcal{O}(1)$ | Custody Event Lookup |
| **BST Hash Search** | $\mathcal{O}(\log n)$ | $\mathcal{O}(n)$ *(skewed tree)* | $\mathcal{O}(1)$ iter / $\mathcal{O}(\log n)$ stack | Fast Hash-to-Evidence Lookup |
| **BST Node Insertion** | $\mathcal{O}(\log n)$ | $\mathcal{O}(n)$ *(skewed tree)* | $\mathcal{O}(1)$ | Evidence Registry Indexing |
| **Evidence Tree Traversal** | $\mathcal{O}(n)$ | $\mathcal{O}(n)$ | $\mathcal{O}(h)$ *(stack depth)* | Filesystem / Archive Recursion |
| **SHA-256 Calculation** | $\mathcal{O}(\text{file size})$ | $\mathcal{O}(\text{file size})$ | $\mathcal{O}(1)$ *(chunk buffer)* | Web Crypto API (NIST FIPS 180-4) |

---

## 5. Application Features & Modules

1. **Dashboard**:
   - Real-time counters for cataloged evidence, custody events, and integrity audits.
   - Active case triage (`Operation Dark Ledger` and `Project Cerberus`).
   - Recent custody activity feed showing head-to-tail linked list stream.

2. **Add Evidence (Intake Portal)**:
   - Drag-and-drop file uploader with live Web Crypto SHA-256 generation.
   - Unique Evidence ID enforcement, seizure authority, and chain metadata.
   - Automatically initializes the first `COLLECTED` node in the linked list and indexes the hash into the BST.

3. **Evidence Records (Registry)**:
   - High-density tabular repository with case, type, and verification status filters.
   - Truncated hash inspection with one-click full 64-char clipboard copy.
   - Direct shortcuts to custody timelines, hash verifiers, and court reports.

4. **Chain of Custody (Timeline)**:
   - Chronological audit ledger displaying visual node pointers (`pointer: Node->next`).
   - Append-only transfer modal for transfers, analyses, storage, and court releases.
   - Built-in chain integrity auditor detecting timestamp violations.

5. **Evidence Search**:
   - **BST Hash Search**: Enter a full or sample SHA-256 hash to watch live branch evaluations (`Left`, `Right`, `Match Found`) and duplicate resolution.
   - **Metadata Search**: Multi-attribute query across ID, title, case, or investigator.

6. **Integrity Verification**:
   - Drop comparison files to compute current SHA-256 and compare against baseline.
   - Side-by-side character comparison matrix highlighting exact discrepancies in red.
   - "Simulate 1-Bit Tamper" test sandbox for examiners.
   - Automatically logs verification results and appends `VERIFIED` custody nodes.

7. **Recursive Evidence Tree**:
   - Interactive explorer for devices, disks, partitions, folders, and archives.
   - Recursive subtree metrics calculator (nodes, files, folders, volume, max depth).
   - Live recursion simulation with real-time call-stack depth visualization.
   - Terminal-style ASCII tree generator.

8. **DSA Demonstration Laboratory**:
   - Interactive BST graph visualizer displaying node keys, depths, and duplicate buckets.
   - Live benchmark comparing BST $\mathcal{O}(\log n)$ against linear search $\mathcal{O}(n)$.
   - In-Order, Pre-Order, and Post-Order traversal tables.

9. **Printable Evidence Reports & CSV Export**:
   - Formal court-admissible custody certificates complying with ISO/IEC 27037 and FRE Rule 901.
   - Optimized `@media print` styling for clean black-and-white printing and PDF generation.
   - Full CSV export for Evidence Master Ledgers and Custody Event Logs.

10. **Examiner Defense Guide & Settings**:
    - College examiner live demonstration script.
    - Comprehensive Viva Voce Q&A guide with detailed answers.
    - JSON database export, import, and reset controls.

---

## 6. Project Structure

```
├── .aistudio/                     # AI Studio metadata
├── index.html                     # HTML5 entry point & font preconnects
├── metadata.json                  # Application metadata & permissions
├── package.json                   # Dependencies & build scripts
├── tsconfig.json                  # Strict TypeScript configuration
├── vite.config.ts                 # Vite build & bundler configuration
│
├── public/
│   └── assets/                    # Presentation slides & references
│
└── src/
    ├── main.tsx                   # React root entry point
    ├── App.tsx                    # Top-level view routing & layout
    ├── index.css                  # Tailwind CSS v4 & print stylesheet
    │
    ├── types/
    │   └── forensics.ts           # Domain models: Evidence, CustodyEvent, BSTNode, TreeNode
    │
    ├── utils/
    │   └── crypto.ts              # Web Crypto API hashing, hex diffing, byte formatting
    │
    ├── dsa/
    │   ├── LinkedList.ts          # Singly Linked List with O(1) tail pointer
    │   ├── BinarySearchTree.ts    # Real BST with duplicate buckets & traversal path tracing
    │   └── EvidenceTree.ts        # Recursive tree algorithms & call stack tracers
    │
    ├── data/
    │   └── mockForensicData.ts    # Fictional university demo dataset
    │
    ├── context/
    │   └── ForensicsContext.tsx   # React context, persistence, in-memory BST rebuilding
    │
    └── components/
        ├── layout/
        │   ├── Header.tsx         # 3-zone Top Bar Contract
        │   └── Sidebar.tsx        # Navigation sidebar with counter badges
        ├── dashboard/
        │   └── DashboardView.tsx  # Triage KPI cards & custody stream
        ├── evidence/
        │   ├── AddEvidenceView.tsx# Web Crypto hasher & intake form
        │   └── EvidenceListView.tsx# Master evidence registry table
        ├── custody/
        │   └── ChainOfCustodyView.tsx # Chronological timeline & append modal
        ├── search/
        │   └── SearchView.tsx     # BST step tracer & metadata search
        ├── verification/
        │   └── IntegrityVerificationView.tsx # Side-by-side hash verifier
        ├── tree/
        │   └── EvidenceTreeView.tsx # Recursive tree & call stack simulator
        ├── dsa/
        │   └── DsaDemonstrationView.tsx # Visual BST, live benchmark & complexity table
        ├── reports/
        │   └── PrintableReportsView.tsx # Formal court certificates & CSV export
        └── about/
            └── AboutDefenseView.tsx # Examiner script, viva Q&A & backup tools
```

---

## 7. Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm** or **bun**: Package manager

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/<your-username>/dsl-digital-forensics-chain-of-custody.git
   cd dsl-digital-forensics-chain-of-custody
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the local development server**:
   ```bash
   npm run dev
   ```
   Open your browser and navigate to `http://localhost:3000`.

4. **Build for production**:
   ```bash
   npm run build
   ```

5. **Run TypeScript linting and validation**:
   ```bash
   npm run lint
   ```

---

## 8. College Examiner Live Demonstration Script

When presenting this project to examiners, follow this 7-step sequence:

1. **Step 1 — Dashboard Live Triage**:
   - Point out real-time evidence and custody counts.
   - Explain active case distribution (`Operation Dark Ledger` and `Project Cerberus`).
2. **Step 2 — Web Crypto SHA-256 Hashing**:
   - Navigate to **Add Evidence**.
   - Drag and drop any local file into the hasher. Show that the SHA-256 hash is computed in real time via `crypto.subtle` in the browser.
3. **Step 3 — Linked List Custody Append**:
   - Go to **Chain of Custody**.
   - Click **Append Custody Event** to add a transfer.
   - Show how the event is appended to the tail in $\mathcal{O}(1)$ time without modifying historical nodes.
4. **Step 4 — BST Hash Search & Duplicate Resolution**:
   - Go to **Evidence Search** or **DSA Lab**.
   - Search hash `e7f1234567890abcdef1234567890abcdef1234567890abcdef1234567890abc`.
   - Show that the BST resolves to *both* `EVD-2026-105` and `EVD-2026-106`, demonstrating collision-free duplicate management.
5. **Step 5 — Tamper Detection Demonstration**:
   - Open **Integrity Verification**.
   - Click **Simulate 1-Bit Tamper**.
   - Point out how the comparison matrix turns red at the exact mismatch index and automatically appends a tamper alert to the custody ledger.
6. **Step 6 — Recursive Evidence Tree & Call Stack**:
   - Navigate to **Evidence Tree**.
   - Click **Simulate Recursion** and step through the call stack to demonstrate $\mathcal{O}(h)$ stack depth.
7. **Step 7 — Printable Reports & CSV Export**:
   - Go to **Evidence Reports** and preview the court certificate formatted for print.
   - Click **Export Evidence CSV** to demonstrate data portability.

---

## 9. Viva Voce Defense Q&A

<details>
<summary><strong>Q1: Why choose a Singly Linked List for the Chain of Custody over an array?</strong></summary>

> **Answer**: Custody records are strictly append-only and chronological. Using a dynamic array incurs overhead when capacity is reached, requiring memory reallocation and element copying. With a linked list and a maintained tail pointer, inserting a new custody event is guaranteed $\mathcal{O}(1)$. Moreover, linked pointers provide an architectural guarantee of immutability: altering an interior event node breaks pointer continuity.
</details>

<details>
<summary><strong>Q2: Why use a Binary Search Tree (BST) for hash searching?</strong></summary>

> **Answer**: A linear search takes $\mathcal{O}(n)$ time, which becomes unacceptable across large repositories. A BST provides $\mathcal{O}(\log n)$ average-case search and insertion by comparing SHA-256 hashes lexicographically. In addition, an In-Order traversal of our BST yields an alphabetically sorted list of fingerprints in $\mathcal{O}(n)$ time without requiring an external sorting algorithm.
</details>

<details>
<summary><strong>Q3: How does your BST handle duplicate hashes?</strong></summary>

> **Answer**: In real investigations, identical files (e.g., malware droppers or duplicate documents) frequently appear across different endpoints. Instead of overwriting or rejecting duplicates, each `BSTNode` maintains an array bucket of evidence IDs (`evidenceIds: string[]`). A search for a duplicate hash returns all associated evidence records.
</details>

<details>
<summary><strong>Q4: What is the worst-case limitation of a standard BST, and how can it be resolved?</strong></summary>

> **Answer**: If evidence hashes are inserted in pre-sorted order, a standard BST degenerates into a linear chain with $\mathcal{O}(n)$ worst-case search and insertion. In production systems, this is mitigated by using self-balancing trees like **AVL Trees** or **Red-Black Trees**, which maintain a balance factor through tree rotations to guarantee $\mathcal{O}(\log n)$ operations.
</details>

<details>
<summary><strong>Q5: Why is recursion appropriate for the Evidence Tree?</strong></summary>

> **Answer**: Forensic evidence targets are inherently hierarchical (Device $\to$ Disk $\to$ Partition $\to$ Folder $\to$ Archive $\to$ File). Recursion naturally traverses nested nodes of arbitrary depth in $\mathcal{O}(n)$ time, using $\mathcal{O}(h)$ auxiliary call-stack memory where $h$ is the maximum depth.
</details>

<details>
<summary><strong>Q6: Why is browser localStorage not suitable for production legal forensics?</strong></summary>

> **Answer**: Browser `localStorage` is client-side, mutable, and lacks cryptographic non-repudiation or hardware write-blocking. Real forensic platforms require Write-Once-Read-Many (WORM) storage, relational databases with role-based access control (RBAC), and hardware security modules (HSMs) generating digital signatures. `localStorage` is used here strictly for academic demonstration.
</details>

---

## 10. How to Publish on GitHub

Follow these steps to initialize and push this codebase to your GitHub account:

```bash
# 1. Initialize git repository
git init

# 2. Add all project files
git add .

# 3. Create initial commit
git commit -m "feat: initial commit - Digital Forensics Chain of Custody Tracker (DSL)"

# 4. Rename default branch to main
git branch -M main

# 5. Add your GitHub remote repository URL
git remote add origin https://github.com/<your-username>/<your-repo-name>.git

# 6. Push code to GitHub
git push -u origin main
```

---

## 11. Limitations & Future Enhancements

*(Reference: Project Defense Slides 14 & 15)*

- **Self-Balancing Trees**: Upgrade the standard BST to an **AVL Tree** or **Red-Black Tree** for guaranteed $\mathcal{O}(\log n)$ worst-case search.
- **Enterprise Storage**: Replace browser `localStorage` with a PostgreSQL database equipped with Row-Level Security (RLS) and cryptographic write-blocking.
- **Cryptographic Signatures**: Incorporate Ed25519 digital signatures and Hardware Security Module (HSM) attestation for non-repudiation.
- **Extended Algorithm Support**: Expand hash verification to support SHA-512, BLAKE3, and fuzzy hashing (SSDEEP).

---

## 12. Forensic Disclaimer & License

> **DISCLAIMER**: This application is an **academic research software prototype** created to demonstrate the practical application of fundamental Data Structures & Algorithms in digital forensics. All case identifiers, hashes, and evidence narratives are fictional simulations. This software does not provide legally certified evidence handling under criminal judicial standards.

Licensed under the [Apache License, Version 2.0](LICENSE).
Copyright © 2026 Joe Jelson J, Ayush Rai — Ajeenkya DY Patil University.

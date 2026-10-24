/**
 * Binary Search Tree (BST) Implementation for Hash-Based Evidence Lookup
 * Referenced in Project Slide 7 & 13:
 * struct BSTNode {
 *   string hash;
 *   int evidenceID; // extended to evidenceIds[] to support duplicate hashes
 *   BSTNode* left;
 *   BSTNode* right;
 * };
 *
 * Operations & Complexities:
 * - Insertion: Average O(log n), Worst O(n) (unbalanced degenerate tree)
 * - Search by Hash: Average O(log n), Worst O(n)
 * - In-Order Traversal: O(n) -> produces lexicographically sorted hash index
 * - Space Complexity: O(n)
 */

import { BSTNodeData, BSTSearchStep } from '../types/forensics';

export class BinarySearchTree {
  private root: BSTNodeData | null = null;
  private totalNodes: number = 0;
  private totalEvidenceMappings: number = 0;

  constructor() {
    this.root = null;
    this.totalNodes = 0;
    this.totalEvidenceMappings = 0;
  }

  /**
   * Insert a hash and its associated evidenceId into the BST.
   * If the hash already exists (duplicate hash scenario), append the evidenceId
   * to the existing node's evidenceIds list.
   *
   * Time Complexity: O(log n) average, O(n) worst case
   */
  public insert(hash: string, evidenceId: string): void {
    const cleanHash = hash.toLowerCase().trim();
    if (!cleanHash) return;

    this.root = this.insertRec(this.root, cleanHash, evidenceId);
    this.totalEvidenceMappings++;
  }

  private insertRec(node: BSTNodeData | null, hash: string, evidenceId: string): BSTNodeData {
    if (node === null) {
      this.totalNodes++;
      return {
        hash,
        evidenceIds: [evidenceId],
        left: null,
        right: null,
        height: 1,
      };
    }

    if (hash === node.hash) {
      // Duplicate hash found: append evidenceId if not already present
      if (!node.evidenceIds.includes(evidenceId)) {
        node.evidenceIds.push(evidenceId);
      }
      return node;
    }

    if (hash < node.hash) {
      node.left = this.insertRec(node.left, hash, evidenceId);
    } else {
      node.right = this.insertRec(node.right, hash, evidenceId);
    }

    // Update height
    node.height = 1 + Math.max(this.getHeight(node.left), this.getHeight(node.right));
    return node;
  }

  /**
   * Search for an exact hash in the BST and record the step-by-step traversal path
   * Time Complexity: O(log n) average, O(n) worst case
   */
  public searchWithSteps(targetHash: string): {
    foundNode: BSTNodeData | null;
    steps: BSTSearchStep[];
    comparisons: number;
  } {
    const cleanTarget = targetHash.toLowerCase().trim();
    const steps: BSTSearchStep[] = [];
    let current = this.root;
    let depth = 0;
    let stepCount = 0;

    while (current !== null) {
      stepCount++;
      depth++;

      if (cleanTarget === current.hash) {
        steps.push({
          stepNumber: stepCount,
          currentHash: current.hash,
          comparison: 'EQUAL',
          direction: 'FOUND',
          evidenceIds: [...current.evidenceIds],
          depth,
        });
        return {
          foundNode: current,
          steps,
          comparisons: stepCount,
        };
      } else if (cleanTarget < current.hash) {
        steps.push({
          stepNumber: stepCount,
          currentHash: current.hash,
          comparison: 'LESS_THAN',
          direction: 'LEFT',
          depth,
        });
        current = current.left;
      } else {
        steps.push({
          stepNumber: stepCount,
          currentHash: current.hash,
          comparison: 'GREATER_THAN',
          direction: 'RIGHT',
          depth,
        });
        current = current.right;
      }
    }

    return {
      foundNode: null,
      steps,
      comparisons: stepCount,
    };
  }

  /**
   * Fast hash lookup returning matching evidence IDs
   */
  public search(targetHash: string): string[] | null {
    const { foundNode } = this.searchWithSteps(targetHash);
    return foundNode ? foundNode.evidenceIds : null;
  }

  /**
   * In-Order Traversal (Left, Root, Right)
   * Produces elements in strictly sorted alphabetical order of hashes
   * Time Complexity: O(n)
   */
  public inOrder(): { hash: string; evidenceIds: string[]; depth: number }[] {
    const result: { hash: string; evidenceIds: string[]; depth: number }[] = [];
    this.inOrderRec(this.root, 0, result);
    return result;
  }

  private inOrderRec(
    node: BSTNodeData | null,
    depth: number,
    result: { hash: string; evidenceIds: string[]; depth: number }[]
  ): void {
    if (node !== null) {
      this.inOrderRec(node.left, depth + 1, result);
      result.push({ hash: node.hash, evidenceIds: node.evidenceIds, depth });
      this.inOrderRec(node.right, depth + 1, result);
    }
  }

  /**
   * Pre-Order Traversal (Root, Left, Right)
   */
  public preOrder(): { hash: string; evidenceIds: string[]; depth: number }[] {
    const result: { hash: string; evidenceIds: string[]; depth: number }[] = [];
    this.preOrderRec(this.root, 0, result);
    return result;
  }

  private preOrderRec(
    node: BSTNodeData | null,
    depth: number,
    result: { hash: string; evidenceIds: string[]; depth: number }[]
  ): void {
    if (node !== null) {
      result.push({ hash: node.hash, evidenceIds: node.evidenceIds, depth });
      this.preOrderRec(node.left, depth + 1, result);
      this.preOrderRec(node.right, depth + 1, result);
    }
  }

  /**
   * Post-Order Traversal (Left, Right, Root)
   */
  public postOrder(): { hash: string; evidenceIds: string[]; depth: number }[] {
    const result: { hash: string; evidenceIds: string[]; depth: number }[] = [];
    this.postOrderRec(this.root, 0, result);
    return result;
  }

  private postOrderRec(
    node: BSTNodeData | null,
    depth: number,
    result: { hash: string; evidenceIds: string[]; depth: number }[]
  ): void {
    if (node !== null) {
      this.postOrderRec(node.left, depth + 1, result);
      this.postOrderRec(node.right, depth + 1, result);
      result.push({ hash: node.hash, evidenceIds: node.evidenceIds, depth });
    }
  }

  /**
   * Get root of tree (used for tree layout visualization)
   */
  public getRoot(): BSTNodeData | null {
    return this.root;
  }

  public getNodeCount(): number {
    return this.totalNodes;
  }

  public getMappingCount(): number {
    return this.totalEvidenceMappings;
  }

  public getTreeHeight(): number {
    return this.getHeight(this.root);
  }

  private getHeight(node: BSTNodeData | null): number {
    if (node === null) return 0;
    return node.height;
  }

  /**
   * Clear the tree
   */
  public clear(): void {
    this.root = null;
    this.totalNodes = 0;
    this.totalEvidenceMappings = 0;
  }

  /**
   * Rebuild the in-memory BST completely from a list of evidence items
   * Satisfies prompt requirement: "Rebuild the in-memory BST from saved records after reload."
   */
  public static rebuildFromEvidences(
    evidences: { id: string; originalHash: string }[]
  ): BinarySearchTree {
    const tree = new BinarySearchTree();
    for (const item of evidences) {
      if (item.originalHash) {
        tree.insert(item.originalHash, item.id);
      }
    }
    return tree;
  }
}

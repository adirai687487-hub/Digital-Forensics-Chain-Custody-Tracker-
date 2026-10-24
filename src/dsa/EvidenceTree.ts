/**
 * Recursive Evidence Tree Structure for Hierarchical Forensic Artifacts
 * Referenced in Project Slide 8:
 * void displayTree(Node* root) {
 *   if (root == nullptr) return;
 *   cout << root->name << endl;
 *   for (Node* child : root->children)
 *     displayTree(child);
 * }
 *
 * Operations & Complexities:
 * - Traversal: O(n) where n is total node count
 * - Space Complexity: O(h) call stack memory, where h is max tree depth
 */

import { EvidenceTreeNode, TreeTraversalStep } from '../types/forensics';

export interface SubtreeMetrics {
  totalNodes: number;
  totalFiles: number;
  totalFolders: number;
  totalArchives: number;
  totalSizeBytes: number;
  maxDepth: number;
}

export class EvidenceTreeManager {
  /**
   * Recursive tree traversal matching Slide 8 displayTree logic
   * Generates step-by-step trace of function calls and call stack for visualization
   */
  public static traceRecursiveTraversal(
    root: EvidenceTreeNode,
    mode: 'PRE_ORDER' | 'POST_ORDER' = 'PRE_ORDER'
  ): TreeTraversalStep[] {
    const steps: TreeTraversalStep[] = [];
    const callStack: string[] = [];

    const recurse = (node: EvidenceTreeNode, depth: number) => {
      const frameName = `displayTree(${node.name})`;
      callStack.push(frameName);

      if (mode === 'PRE_ORDER') {
        steps.push({
          nodeId: node.id,
          nodeName: node.name,
          nodeType: node.type,
          depth,
          action: 'VISIT',
          callStack: [...callStack],
        });
      }

      for (const child of node.children) {
        recurse(child, depth + 1);
      }

      if (mode === 'POST_ORDER') {
        steps.push({
          nodeId: node.id,
          nodeName: node.name,
          nodeType: node.type,
          depth,
          action: 'VISIT',
          callStack: [...callStack],
        });
      }

      callStack.pop();
    };

    recurse(root, 0);
    return steps;
  }

  /**
   * Recursively calculates aggregate statistics of an evidence subtree
   * Time Complexity: O(n)
   * Auxiliary Space: O(h) recursion stack
   */
  public static calculateMetrics(root: EvidenceTreeNode): SubtreeMetrics {
    let totalNodes = 0;
    let totalFiles = 0;
    let totalFolders = 0;
    let totalArchives = 0;
    let totalSizeBytes = 0;
    let maxDepth = 0;

    const traverse = (node: EvidenceTreeNode, currentDepth: number) => {
      totalNodes++;
      if (currentDepth > maxDepth) maxDepth = currentDepth;

      if (node.type === 'file') totalFiles++;
      else if (node.type === 'folder') totalFolders++;
      else if (node.type === 'archive') totalArchives++;

      if (node.sizeBytes) {
        totalSizeBytes += node.sizeBytes;
      }

      for (const child of node.children) {
        traverse(child, currentDepth + 1);
      }
    };

    traverse(root, 1);

    return {
      totalNodes,
      totalFiles,
      totalFolders,
      totalArchives,
      totalSizeBytes,
      maxDepth,
    };
  }

  /**
   * Recursively searches for a node by ID in the tree
   */
  public static findNodeById(root: EvidenceTreeNode, id: string): EvidenceTreeNode | null {
    if (root.id === id) return root;
    for (const child of root.children) {
      const found = EvidenceTreeManager.findNodeById(child, id);
      if (found) return found;
    }
    return null;
  }

  /**
   * Recursively attaches a new child node under a target parent ID
   */
  public static addChildNode(
    root: EvidenceTreeNode,
    parentId: string,
    newNode: EvidenceTreeNode
  ): boolean {
    const parent = EvidenceTreeManager.findNodeById(root, parentId);
    if (parent) {
      parent.children.push(newNode);
      return true;
    }
    return false;
  }

  /**
   * Recursively produces an ASCII tree indentation view
   */
  public static generateAsciiTree(root: EvidenceTreeNode, prefix = '', isLast = true): string[] {
    const lines: string[] = [];
    const marker = isLast ? '└── ' : '├── ';
    const typeTag = `[${root.type.toUpperCase()}]`;
    const hashTag = root.hash ? ` (SHA-256: ${root.hash.slice(0, 8)}...)` : '';
    lines.push(`${prefix}${marker}${root.name} ${typeTag}${hashTag}`);

    const childPrefix = prefix + (isLast ? '    ' : '│   ');
    for (let i = 0; i < root.children.length; i++) {
      const child = root.children[i];
      const lastChild = i === root.children.length - 1;
      const subLines = EvidenceTreeManager.generateAsciiTree(child, childPrefix, lastChild);
      lines.push(...subLines);
    }
    return lines;
  }
}

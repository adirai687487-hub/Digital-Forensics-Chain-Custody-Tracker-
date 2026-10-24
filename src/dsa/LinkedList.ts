/**
 * Singly Linked List Implementation for Forensic Chain of Custody
 * Referenced in Project Slide 6:
 * struct Evidence {
 *   int id;
 *   string name;
 *   string type;
 *   string hash;
 *   string timestamp;
 *   string investigator;
 *   Evidence* next;
 * };
 *
 * Core Operations & Complexity:
 * - Append with tail pointer: O(1)
 * - Traversal / Display: O(n)
 * - Search by Event ID / Evidence ID: O(n)
 */

import { CustodyEvent } from '../types/forensics';

export class CustodyListNode {
  public data: CustodyEvent;
  public next: CustodyListNode | null = null;

  constructor(event: CustodyEvent) {
    this.data = event;
    this.next = null;
  }
}

export class CustodyLinkedList {
  private head: CustodyListNode | null = null;
  private tail: CustodyListNode | null = null;
  private size: number = 0;

  constructor() {
    this.head = null;
    this.tail = null;
    this.size = 0;
  }

  /**
   * Append a custody event to the chronological end of the chain
   * Time Complexity: O(1) using tail pointer
   */
  public append(event: CustodyEvent): CustodyListNode {
    const newNode = new CustodyListNode(event);

    if (!this.head) {
      this.head = newNode;
      this.tail = newNode;
    } else if (this.tail) {
      this.tail.next = newNode;
      this.tail = newNode;
    }

    this.size++;
    return newNode;
  }

  /**
   * Search for a custody event by Event ID
   * Time Complexity: O(n)
   */
  public findById(id: string): CustodyEvent | null {
    let current = this.head;
    while (current !== null) {
      if (current.data.id === id) {
        return current.data;
      }
      current = current.next;
    }
    return null;
  }

  /**
   * Retrieve all events for a specific evidence item in chronological order
   * Time Complexity: O(n)
   */
  public getEventsForEvidence(evidenceId: string): CustodyEvent[] {
    const result: CustodyEvent[] = [];
    let current = this.head;
    while (current !== null) {
      if (current.data.evidenceId === evidenceId) {
        result.push(current.data);
      }
      current = current.next;
    }
    return result;
  }

  /**
   * Convert linked list to array in chronological order (head to tail)
   * Time Complexity: O(n)
   */
  public toArray(): CustodyEvent[] {
    const arr: CustodyEvent[] = [];
    let current = this.head;
    while (current !== null) {
      arr.push({ ...current.data });
      current = current.next;
    }
    return arr;
  }

  /**
   * Rebuild the linked list from an array of custody events
   */
  public static fromArray(events: CustodyEvent[]): CustodyLinkedList {
    const list = new CustodyLinkedList();
    // Sort chronologically by timestamp if necessary
    const sorted = [...events].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    for (const evt of sorted) {
      list.append(evt);
    }
    return list;
  }

  /**
   * Returns total node count in the linked list
   */
  public length(): number {
    return this.size;
  }

  /**
   * Get head node reference (for visualizer)
   */
  public getHead(): CustodyListNode | null {
    return this.head;
  }

  /**
   * Get tail node reference (for visualizer)
   */
  public getTail(): CustodyListNode | null {
    return this.tail;
  }

  /**
   * Forensic Chain Integrity Validation
   * Checks for strict chronological consistency and unbroken chain links
   */
  public validateChainOrder(): { isValid: boolean; brokenIndex?: number; reason?: string } {
    if (!this.head || this.size <= 1) {
      return { isValid: true };
    }

    let prev = this.head;
    let curr = this.head.next;
    let index = 1;

    while (curr !== null) {
      const prevTime = new Date(prev.data.timestamp).getTime();
      const currTime = new Date(curr.data.timestamp).getTime();

      if (currTime < prevTime) {
        return {
          isValid: false,
          brokenIndex: index,
          reason: `Chronological violation at event ${curr.data.id}: timestamp is prior to predecessor ${prev.data.id}`,
        };
      }

      prev = curr;
      curr = curr.next;
      index++;
    }

    return { isValid: true };
  }
}

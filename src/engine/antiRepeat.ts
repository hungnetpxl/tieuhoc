/**
 * Anti-Repeat Algorithm for Math Questions
 * Prevents presenting the same arithmetic problem within a sliding window.
 */

export class AntiRepeatFilter {
  private history: Set<string>;
  private queue: string[];
  private windowSize: number;

  constructor(windowSize = 10) {
    this.history = new Set<string>();
    this.queue = [];
    this.windowSize = windowSize;
  }

  /**
   * Generates a unique key for an arithmetic question
   */
  private makeKey(numberA: number, numberB: number, operator: string): string {
    // Standardize key representation: "numA_op_numB"
    return `${numberA}_${operator}_${numberB}`;
  }

  /**
   * Checks if a question has been asked recently
   */
  public hasBeenAsked(numberA: number, numberB: number, operator: string): boolean {
    const key = this.makeKey(numberA, numberB, operator);
    return this.history.has(key);
  }

  /**
   * Records a question to the history sliding window
   */
  public recordQuestion(numberA: number, numberB: number, operator: string): void {
    const key = this.makeKey(numberA, numberB, operator);
    
    // Add to set and queue
    this.history.add(key);
    this.queue.push(key);

    // If window size exceeded, remove the oldest key
    if (this.queue.length > this.windowSize) {
      const oldestKey = this.queue.shift();
      if (oldestKey) {
        this.history.delete(oldestKey);
      }
    }
  }

  /**
   * Resets the filter history
   */
  public reset(): void {
    this.history.clear();
    this.queue = [];
  }
}

/**
 * Timer manager for handling phase timeouts
 */
export class TimerManager {
    private timers: Map<string, number> = new Map();
    
    /**
     * Creates a timeout that can be cleared
     */
    setTimeout(id: string, callback: () => void, timeoutMs: number): void {
      // Clear any existing timeout with this ID
      this.clearTimeout(id);
      
      // Create a new timeout
      const timerId = window.setTimeout(() => {
        this.timers.delete(id);
        callback();
      }, timeoutMs) as unknown as number;
      
      // Store the timer ID
      this.timers.set(id, timerId);
    }
    
    /**
     * Clears a specific timeout
     */
    clearTimeout(id: string): void {
      const timerId = this.timers.get(id);
      if (timerId !== undefined) {
        window.clearTimeout(timerId);
        this.timers.delete(id);
      }
    }
    
    /**
     * Clears all timeouts
     */
    clearAll(): void {
      this.timers.forEach((timerId) => {
        window.clearTimeout(timerId);
      });
      this.timers.clear();
    }
  }
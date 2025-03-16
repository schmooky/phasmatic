/**
 * Timer manager for handling phase timeouts
 */
export declare class TimerManager {
    private timers;
    /**
     * Creates a timeout that can be cleared
     */
    setTimeout(id: string, callback: () => void, timeoutMs: number): void;
    /**
     * Clears a specific timeout
     */
    clearTimeout(id: string): void;
    /**
     * Clears all timeouts
     */
    clearAll(): void;
}

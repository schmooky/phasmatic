/**
 * Timer manager for handling phase timeouts
 */
export class TimerManager {
    constructor() {
        this.timers = new Map();
    }
    /**
     * Creates a timeout that can be cleared
     */
    setTimeout(id, callback, timeoutMs) {
        // Clear any existing timeout with this ID
        this.clearTimeout(id);
        // Create a new timeout
        const timerId = window.setTimeout(() => {
            this.timers.delete(id);
            callback();
        }, timeoutMs);
        // Store the timer ID
        this.timers.set(id, timerId);
    }
    /**
     * Clears a specific timeout
     */
    clearTimeout(id) {
        const timerId = this.timers.get(id);
        if (timerId !== undefined) {
            window.clearTimeout(timerId);
            this.timers.delete(id);
        }
    }
    /**
     * Clears all timeouts
     */
    clearAll() {
        this.timers.forEach((timerId) => {
            window.clearTimeout(timerId);
        });
        this.timers.clear();
    }
}
//# sourceMappingURL=timer.js.map
/**
 * Base error class for Phasmatic errors
 */
export class PhasmaticError extends Error {
    constructor(message) {
        super(message);
        this.name = 'PhasmaticError';
    }
}
/**
 * Error thrown when a phase tries to transition to itself
 */
export class PhasmaticSelfTransitionError extends PhasmaticError {
    constructor(message) {
        super(message);
        this.name = 'PhasmaticSelfTransitionError';
    }
}
/**
 * Error thrown when a transition to an invalid phase is attempted
 */
export class PhasmaticInvalidTransitionError extends PhasmaticError {
    constructor(message) {
        super(message);
        this.name = 'PhasmaticInvalidTransitionError';
    }
}
/**
 * Error thrown when a phase execution fails
 */
export class PhasmaticExecutionError extends PhasmaticError {
    constructor(message, originalError) {
        super(message);
        this.originalError = originalError;
        this.name = 'PhasmaticExecutionError';
    }
}
//# sourceMappingURL=errors.js.map
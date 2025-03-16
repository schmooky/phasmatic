/**
 * Base error class for Phasmatic errors
 */
export declare class PhasmaticError extends Error {
    constructor(message: string);
}
/**
 * Error thrown when a phase tries to transition to itself
 */
export declare class PhasmaticSelfTransitionError extends PhasmaticError {
    constructor(message: string);
}
/**
 * Error thrown when a transition to an invalid phase is attempted
 */
export declare class PhasmaticInvalidTransitionError extends PhasmaticError {
    constructor(message: string);
}
/**
 * Error thrown when a phase execution fails
 */
export declare class PhasmaticExecutionError extends PhasmaticError {
    originalError: Error;
    constructor(message: string, originalError: Error);
}

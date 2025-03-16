/**
 * Simple handler function
 */
export type SimpleHandler = () => void;

/**
 * Function that adds a disposer to be called when phase ends
 */
export type PhaseDisposerType = (disposer: SimpleHandler) => void;

/**
 * Function that sets a timeout within the current phase
 */
export type PhaseTimeoutType = (seconds: number, handler: SimpleHandler) => void;

/**
 * Context passed to each phase handler
 */
export interface PhaseContext<T = any> {
  /** The context/store object */
  context: T;
  
  /** Add a disposer that will be called when exiting this phase */
  addDisposer: PhaseDisposerType;
  
  /** Set a timeout that will be cleared if the phase ends before it triggers */
  setTimeout: PhaseTimeoutType;
  
  /** Current phase name */
  currentPhase: string;
}

/**
 * Phase handler function signature
 * Return type is generic because it needs to be constrained in the decorator
 */
export type PhaseHandler<TContext, TReturn> = (
  context: PhaseContext<TContext>
) => TReturn | Promise<TReturn>;

/**
 * Metadata for a registered phase
 */
export interface PhaseMetadata<TContext> {
  name: string;
  handler: PhaseHandler<TContext, any>;
  possibleNextPhases: string[];
}

/**
 * Static registry key used on StateMachine instances
 */
export const PHASE_REGISTRY = Symbol('PHASE_REGISTRY');

/**
 * Error types specific to Phasmatic
 */
export enum PhasmaticErrorType {
  INVALID_PHASE = 'INVALID_PHASE',
  PHASE_EXECUTION_ERROR = 'PHASE_EXECUTION_ERROR',
  INVALID_TRANSITION = 'INVALID_TRANSITION',
  SELF_TRANSITION = 'SELF_TRANSITION',
}
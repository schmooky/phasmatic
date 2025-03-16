/**
 * Base error class for Phasmatic errors
 */
export class PhasmaticError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'PhasmaticError';
    }
  }
  
  /**
   * Error thrown when a phase tries to transition to itself
   */
  export class PhasmaticSelfTransitionError extends PhasmaticError {
    constructor(message: string) {
      super(message);
      this.name = 'PhasmaticSelfTransitionError';
    }
  }
  
  /**
   * Error thrown when a transition to an invalid phase is attempted
   */
  export class PhasmaticInvalidTransitionError extends PhasmaticError {
    constructor(message: string) {
      super(message);
      this.name = 'PhasmaticInvalidTransitionError';
    }
  }
  
  /**
   * Error thrown when a phase execution fails
   */
  export class PhasmaticExecutionError extends PhasmaticError {
    constructor(message: string, public originalError: Error) {
      super(message);
      this.name = 'PhasmaticExecutionError';
    }
  }
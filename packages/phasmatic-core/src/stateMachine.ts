import { makeObservable, observable, action, makeAutoObservable } from 'mobx';
import { 
  PHASE_REGISTRY, 
  PhaseContext, 
  PhaseDisposerType, 
  PhaseHandler, 
  PhaseMetadata, 
  PhaseTimeoutType, 
  SimpleHandler 
} from './types';
import { 
  PhasmaticError, 
  PhasmaticExecutionError, 
  PhasmaticInvalidTransitionError 
} from './errors';
import { TimerManager } from './timer';

/**
 * Base StateMachine class
 * TPhase is a union type of all possible phase names (usually an enum)
 */
export abstract class StateMachine<TPhase extends string, TContext = any> {
  /** Current active phase */
  public currentPhase: TPhase | null = null;
  
  /** Whether the machine is running */
  public isRunning: boolean = false;
  
  /** Whether to output debug information */
  protected debug: boolean;
  
  /** Function to call on errors */
  protected errorHandler?: (error: Error) => void;
  
  /** Initial phase to start with */
  private initialPhase: TPhase;
  
  /** Phase context that will be passed to handlers */
  private context: TContext;
  
  /** Timer manager for handling timeouts */
  private timerManager = new TimerManager();
  
  /** List of disposers for the current phase */
  private phaseDisposers: SimpleHandler[] = [];
  
  /** Registry of phase handlers */
  private phaseRegistry: Map<string, PhaseMetadata<TContext>>;
  
  /**
 * Creates a new state machine
 * @param context The context object to pass to phase handlers
 * @param initialPhase The phase to start with
 * @param debug Whether to output debug information
 * @param errorHandler Optional error handler
 */
constructor(
  context: TContext,
  initialPhase: TPhase,
  debug: boolean = false,
  errorHandler?: (error: Error) => void
) {
  this.context = context;
  this.initialPhase = initialPhase;
  this.debug = debug;
  this.errorHandler = errorHandler;
  
  // Get the phase registry from the constructor
  this.phaseRegistry = (this.constructor as any)[PHASE_REGISTRY] || new Map();
  
  // Make observable properties
  makeAutoObservable(this);
}
  
  /**
   * Starts the state machine
   */
  public start(): void {
    if (this.isRunning) {
      this.log('State machine is already running');
      return;
    }
    
    this.isRunning = true;
    this.transitionTo(this.initialPhase);
  }
  
  /**
   * Stops the state machine
   */
  public stop(): void {
    if (!this.isRunning) {
      return;
    }
    
    this.isRunning = false;
    this.disposeCurrentPhase();
    this.currentPhase = null;
  }
  
  /**
   * Resets the state machine back to the initial phase
   */
  public reset(): void {
    const wasRunning = this.isRunning;
    this.stop();
    
    if (wasRunning) {
      this.start();
    }
  }
  
/**
 * Sets the current phase without executing its handler
 * @param phase The phase to set
 */
protected setPhase(phase: TPhase | null): void {
  this.currentPhase = phase;
}
  
  /**
   * Transitions to a new phase and executes its handler
   * @param phase The phase to transition to
   */
  protected transitionTo(phase: TPhase): void {
    if (!this.isRunning) {
      throw new PhasmaticError('Cannot transition when state machine is not running');
    }
    
    // Make sure the phase exists
    if (!this.phaseRegistry.has(phase)) {
      throw new PhasmaticInvalidTransitionError(`Phase "${phase}" does not exist`);
    }
    
    // Log the transition
    this.log(`Transitioning to phase: ${phase}`);
    
    // Clean up the current phase
    this.disposeCurrentPhase();
    
    // Set the new phase
    this.setPhase(phase);
    
    // Execute the new phase handler
    this.executePhase(phase);
  }
  
  /**
   * Executes the handler for the given phase
   * @param phase The phase to execute
   */
  private async executePhase(phase: TPhase): Promise<void> {
    const phaseMetadata = this.phaseRegistry.get(phase);
    if (!phaseMetadata) {
      throw new PhasmaticInvalidTransitionError(`Phase "${phase}" does not exist`);
    }
    
    // Create the context for this phase
    const phaseContext: PhaseContext<TContext> = {
      context: this.context,
      addDisposer: this.addPhaseDisposer.bind(this),
      setTimeout: this.phaseTimeout.bind(this),
      currentPhase: phase
    };
    
    try {
      // Execute the phase handler
      const result = phaseMetadata.handler.call(this, phaseContext);
      let nextPhase: string;
      
      // Handle synchronous and asynchronous results
      if (result instanceof Promise) {
        nextPhase = await result;
      } else {
        nextPhase = result;
      }
      
      // Validate the next phase
      this.validateTransition(phase, nextPhase);
      
      // Transition to the next phase
      this.transitionTo(nextPhase as TPhase);
    } catch (error) {
      this.handleError(error);
    }
  }
  
  /**
   * Adds a disposer function that will be called when the current phase ends
   * @param disposer The disposer function
   */
  private addPhaseDisposer(disposer: SimpleHandler): void {
    this.phaseDisposers.push(disposer);
  }
  
  /**
   * Sets a timeout for the current phase
   * @param seconds The number of seconds to wait
   * @param handler The function to call when the timeout expires
   */
  private phaseTimeout(seconds: number, handler: SimpleHandler): void {
    const timeoutId = `timeout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create a timeout
    this.timerManager.setTimeout(timeoutId, handler, seconds * 1000);
    
    // Add a disposer to clear the timeout when the phase ends
    this.addPhaseDisposer(() => {
      this.timerManager.clearTimeout(timeoutId);
    });
  }
  
  /**
   * Disposes the current phase by calling all disposers
   */
  private disposeCurrentPhase(): void {
    // Clear all timeouts
    this.timerManager.clearAll();
    
    // Call all disposers in reverse order (LIFO)
    while (this.phaseDisposers.length > 0) {
      const disposer = this.phaseDisposers.pop();
      if (disposer) {
        try {
          disposer();
        } catch (error) {
          this.log(`Error in disposer: ${error}`);
        }
      }
    }
  }
  
  /**
   * Validates that a transition is allowed
   * @param fromPhase The phase transitioning from
   * @param toPhase The phase transitioning to
   */
  private validateTransition(fromPhase: string, toPhase: string): void {
    // Get the metadata for the current phase
    const fromPhaseMetadata = this.phaseRegistry.get(fromPhase);
    if (!fromPhaseMetadata) {
      throw new PhasmaticInvalidTransitionError(`Phase "${fromPhase}" does not exist`);
    }
    
    // Make sure the transition is allowed
    if (!fromPhaseMetadata.possibleNextPhases.includes(toPhase)) {
      throw new PhasmaticInvalidTransitionError(
        `Invalid transition from "${fromPhase}" to "${toPhase}". ` +
        `Allowed next phases are: ${fromPhaseMetadata.possibleNextPhases.join(', ')}`
      );
    }
    
    // Make sure the target phase exists
    if (!this.phaseRegistry.has(toPhase)) {
      throw new PhasmaticInvalidTransitionError(`Target phase "${toPhase}" does not exist`);
    }
  }
  
  /**
   * Handles an error that occurred during phase execution
   * @param error The error that occurred
   */
  private handleError(error: any): void {
    // Wrap the error
    const wrappedError = new PhasmaticExecutionError(
      `Error executing phase "${this.currentPhase}": ${error.message}`,
      error
    );
    
    // Log the error
    this.log(`Error: ${wrappedError.message}`);
    
    // Call the error handler if it exists
    if (this.errorHandler) {
      this.errorHandler(wrappedError);
    } else {
      // Otherwise, re-throw the error
      throw wrappedError;
    }
  }
  
  /**
   * Logs a message if debug is enabled
   * @param message The message to log
   */
  private log(message: string): void {
    if (this.debug) {
      console.log(`[Phasmatic] ${message}`);
    }
  }
}
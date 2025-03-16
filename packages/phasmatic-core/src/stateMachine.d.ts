/**
 * Base StateMachine class
 * TPhase is a union type of all possible phase names (usually an enum)
 */
export declare abstract class StateMachine<TPhase extends string, TContext = any> {
    /** Current active phase */
    currentPhase: TPhase | null;
    /** Whether the machine is running */
    isRunning: boolean;
    /** Whether to output debug information */
    protected debug: boolean;
    /** Function to call on errors */
    protected errorHandler?: (error: Error) => void;
    /** Initial phase to start with */
    private initialPhase;
    /** Phase context that will be passed to handlers */
    private context;
    /** Timer manager for handling timeouts */
    private timerManager;
    /** List of disposers for the current phase */
    private phaseDisposers;
    /** Registry of phase handlers */
    private phaseRegistry;
    /**
     * Creates a new state machine
     * @param context The context object to pass to phase handlers
     * @param initialPhase The phase to start with
     * @param debug Whether to output debug information
     * @param errorHandler Optional error handler
     */
    constructor(context: TContext, initialPhase: TPhase, debug?: boolean, errorHandler?: (error: Error) => void);
    /**
     * Starts the state machine
     */
    start(): void;
    /**
     * Stops the state machine
     */
    stop(): void;
    /**
     * Resets the state machine back to the initial phase
     */
    reset(): void;
    /**
     * Sets the current phase without executing its handler
     * @param phase The phase to set
     */
    protected setPhase(phase: TPhase | null): void;
    /**
     * Transitions to a new phase and executes its handler
     * @param phase The phase to transition to
     */
    protected transitionTo(phase: TPhase): void;
    /**
     * Executes the handler for the given phase
     * @param phase The phase to execute
     */
    private executePhase;
    /**
     * Adds a disposer function that will be called when the current phase ends
     * @param disposer The disposer function
     */
    private addPhaseDisposer;
    /**
     * Sets a timeout for the current phase
     * @param seconds The number of seconds to wait
     * @param handler The function to call when the timeout expires
     */
    private phaseTimeout;
    /**
     * Disposes the current phase by calling all disposers
     */
    private disposeCurrentPhase;
    /**
     * Validates that a transition is allowed
     * @param fromPhase The phase transitioning from
     * @param toPhase The phase transitioning to
     */
    private validateTransition;
    /**
     * Handles an error that occurred during phase execution
     * @param error The error that occurred
     */
    private handleError;
    /**
     * Logs a message if debug is enabled
     * @param message The message to log
     */
    private log;
}

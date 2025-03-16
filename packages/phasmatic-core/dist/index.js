'use strict';

var mobx = require('mobx');
require('reflect-metadata');

/**
 * Static registry key used on StateMachine instances
 */
const PHASE_REGISTRY = Symbol('PHASE_REGISTRY');
/**
 * Error types specific to Phasmatic
 */
exports.PhasmaticErrorType = void 0;
(function (PhasmaticErrorType) {
    PhasmaticErrorType["INVALID_PHASE"] = "INVALID_PHASE";
    PhasmaticErrorType["PHASE_EXECUTION_ERROR"] = "PHASE_EXECUTION_ERROR";
    PhasmaticErrorType["INVALID_TRANSITION"] = "INVALID_TRANSITION";
    PhasmaticErrorType["SELF_TRANSITION"] = "SELF_TRANSITION";
})(exports.PhasmaticErrorType || (exports.PhasmaticErrorType = {}));

/**
 * Base error class for Phasmatic errors
 */
class PhasmaticError extends Error {
    constructor(message) {
        super(message);
        this.name = 'PhasmaticError';
    }
}
/**
 * Error thrown when a phase tries to transition to itself
 */
class PhasmaticSelfTransitionError extends PhasmaticError {
    constructor(message) {
        super(message);
        this.name = 'PhasmaticSelfTransitionError';
    }
}
/**
 * Error thrown when a transition to an invalid phase is attempted
 */
class PhasmaticInvalidTransitionError extends PhasmaticError {
    constructor(message) {
        super(message);
        this.name = 'PhasmaticInvalidTransitionError';
    }
}
/**
 * Error thrown when a phase execution fails
 */
class PhasmaticExecutionError extends PhasmaticError {
    constructor(message, originalError) {
        super(message);
        this.originalError = originalError;
        this.name = 'PhasmaticExecutionError';
    }
}

/**
 * Timer manager for handling phase timeouts
 */
class TimerManager {
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

/**
 * Base StateMachine class
 * TPhase is a union type of all possible phase names (usually an enum)
 */
class StateMachine {
    /**
   * Creates a new state machine
   * @param context The context object to pass to phase handlers
   * @param initialPhase The phase to start with
   * @param debug Whether to output debug information
   * @param errorHandler Optional error handler
   */
    constructor(context, initialPhase, debug = false, errorHandler) {
        /** Current active phase */
        this.currentPhase = null;
        /** Whether the machine is running */
        this.isRunning = false;
        /** Timer manager for handling timeouts */
        this.timerManager = new TimerManager();
        /** List of disposers for the current phase */
        this.phaseDisposers = [];
        this.context = context;
        this.initialPhase = initialPhase;
        this.debug = debug;
        this.errorHandler = errorHandler;
        // Get the phase registry from the constructor
        this.phaseRegistry = this.constructor[PHASE_REGISTRY] || new Map();
        // Make observable properties
        mobx.makeAutoObservable(this);
    }
    /**
     * Starts the state machine
     */
    start() {
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
    stop() {
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
    reset() {
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
    setPhase(phase) {
        this.currentPhase = phase;
    }
    /**
     * Transitions to a new phase and executes its handler
     * @param phase The phase to transition to
     */
    transitionTo(phase) {
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
    async executePhase(phase) {
        const phaseMetadata = this.phaseRegistry.get(phase);
        if (!phaseMetadata) {
            throw new PhasmaticInvalidTransitionError(`Phase "${phase}" does not exist`);
        }
        // Create the context for this phase
        const phaseContext = {
            context: this.context,
            addDisposer: this.addPhaseDisposer.bind(this),
            setTimeout: this.phaseTimeout.bind(this),
            currentPhase: phase
        };
        try {
            // Execute the phase handler
            const result = phaseMetadata.handler.call(this, phaseContext);
            let nextPhase;
            // Handle synchronous and asynchronous results
            if (result instanceof Promise) {
                nextPhase = await result;
            }
            else {
                nextPhase = result;
            }
            // Validate the next phase
            this.validateTransition(phase, nextPhase);
            // Transition to the next phase
            this.transitionTo(nextPhase);
        }
        catch (error) {
            this.handleError(error);
        }
    }
    /**
     * Adds a disposer function that will be called when the current phase ends
     * @param disposer The disposer function
     */
    addPhaseDisposer(disposer) {
        this.phaseDisposers.push(disposer);
    }
    /**
     * Sets a timeout for the current phase
     * @param seconds The number of seconds to wait
     * @param handler The function to call when the timeout expires
     */
    phaseTimeout(seconds, handler) {
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
    disposeCurrentPhase() {
        // Clear all timeouts
        this.timerManager.clearAll();
        // Call all disposers in reverse order (LIFO)
        while (this.phaseDisposers.length > 0) {
            const disposer = this.phaseDisposers.pop();
            if (disposer) {
                try {
                    disposer();
                }
                catch (error) {
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
    validateTransition(fromPhase, toPhase) {
        // Get the metadata for the current phase
        const fromPhaseMetadata = this.phaseRegistry.get(fromPhase);
        if (!fromPhaseMetadata) {
            throw new PhasmaticInvalidTransitionError(`Phase "${fromPhase}" does not exist`);
        }
        // Make sure the transition is allowed
        if (!fromPhaseMetadata.possibleNextPhases.includes(toPhase)) {
            throw new PhasmaticInvalidTransitionError(`Invalid transition from "${fromPhase}" to "${toPhase}". ` +
                `Allowed next phases are: ${fromPhaseMetadata.possibleNextPhases.join(', ')}`);
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
    handleError(error) {
        // Wrap the error
        const wrappedError = new PhasmaticExecutionError(`Error executing phase "${this.currentPhase}": ${error.message}`, error);
        // Log the error
        this.log(`Error: ${wrappedError.message}`);
        // Call the error handler if it exists
        if (this.errorHandler) {
            this.errorHandler(wrappedError);
        }
        else {
            // Otherwise, re-throw the error
            throw wrappedError;
        }
    }
    /**
     * Logs a message if debug is enabled
     * @param message The message to log
     */
    log(message) {
        if (this.debug) {
            console.log(`[Phasmatic] ${message}`);
        }
    }
}

/**
 * Phase decorator - registers a method as a state handler
 * @param phaseName The name of the phase this method handles
 */
function Phase(phaseName) {
    return function (target, propertyKey, descriptor) {
        // Get the return type from the method's metadata
        const returnType = Reflect.getMetadata('design:returntype', target, propertyKey);
        // Extract possible next phases from the return type
        // This uses TypeScript's built-in type system
        const possibleNextPhases = extractPossibleNextPhases(returnType);
        // Ensure the phase can't transition to itself
        if (possibleNextPhases.includes(phaseName)) {
            throw new PhasmaticSelfTransitionError(`Phase ${phaseName} cannot transition to itself. This would create an infinite loop.`);
        }
        // Get or create the registry on the class prototype
        if (!target.constructor[PHASE_REGISTRY]) {
            target.constructor[PHASE_REGISTRY] = new Map();
        }
        // Add this phase to the registry
        target.constructor[PHASE_REGISTRY].set(phaseName, {
            name: phaseName,
            handler: descriptor.value,
            possibleNextPhases
        });
        return descriptor;
    };
}
/**
 * Extract possible next phases from a TypeScript return type
 * This is a helper that works with the TypeScript compiler API
 */
function extractPossibleNextPhases(returnType) {
    // For Promise<T> types, we extract the T
    if (returnType?.name === 'Promise') {
        const typeArgs = Reflect.getMetadata('design:paramtypes', returnType);
        if (typeArgs && typeArgs.length > 0) {
            return extractPossibleNextPhases(typeArgs[0]);
        }
    }
    // For union types (T1 | T2 | T3)
    if (returnType?.types) {
        return returnType.types.flatMap(extractPossibleNextPhases);
    }
    // For literal types (string literals)
    if (typeof returnType === 'string') {
        return [returnType];
    }
    // For enum values 
    if (typeof returnType === 'object' && returnType !== null) {
        return Object.values(returnType);
    }
    return [];
}

/**
 * Generates a Mermaid flowchart string from a state machine class
 * @param stateMachineClass The state machine class to generate a flowchart for
 * @returns A Mermaid flowchart string
 */
function generateFlowchart(stateMachineClass) {
    // Get the phase registry
    const phaseRegistry = stateMachineClass[PHASE_REGISTRY];
    if (!phaseRegistry) {
        throw new Error('No phase registry found. Make sure you have decorated your phase methods with @Phase.');
    }
    // Build the flowchart
    let flowchart = 'stateDiagram-v2\n';
    // Add state transitions
    phaseRegistry.forEach((metadata, phaseName) => {
        metadata.possibleNextPhases.forEach(nextPhase => {
            flowchart += `    ${phaseName} --> ${nextPhase}\n`;
        });
    });
    return flowchart;
}

exports.PHASE_REGISTRY = PHASE_REGISTRY;
exports.Phase = Phase;
exports.PhasmaticError = PhasmaticError;
exports.PhasmaticExecutionError = PhasmaticExecutionError;
exports.PhasmaticInvalidTransitionError = PhasmaticInvalidTransitionError;
exports.PhasmaticSelfTransitionError = PhasmaticSelfTransitionError;
exports.StateMachine = StateMachine;
exports.TimerManager = TimerManager;
exports.generateFlowchart = generateFlowchart;
//# sourceMappingURL=index.js.map

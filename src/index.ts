/**
 * Phasmatic - A TypeScript state machine for gaming applications
 * 
 * @packageDocumentation
 */

// Import reflect-metadata for decorator support
import 'reflect-metadata';
import { Phase, PhaseOptions, PhaseMetadata, PHASE_METADATA } from './decorators.js';

/**
 * Represents a factory function that creates a visualizer for a state machine flowchart
 */
export type FlowchartGenerator<T extends PhaseMachineContext> = (stateMachine: PhaseMachineClass<T>) => string;

/**
 * Base type for phase machine classes that can be passed to utilities
 */
export type PhaseMachineClass<T extends PhaseMachineContext = PhaseMachineContext> = new (...args: any[]) => PhaseMachine<any, T>;

/**
 * Basic interface for objects that can be used as context in a phase machine
 */
export interface PhaseMachineContext {
  [key: string]: any;
}

/**
 * Abstract base class for phase-based state machines
 * 
 * @typeParam P - Union type of all possible phase names
 * @typeParam C - Type of the context object
 */
export abstract class PhaseMachine<P extends string, C extends PhaseMachineContext = PhaseMachineContext> {
  /**
   * Current phase of the state machine
   */
  protected _currentPhase: P;
  
  /**
   * Flag to indicate if transitions should be skipped for skippable phases
   */
  private _skipActivated: boolean = false;
  
  /**
   * Flag to prevent concurrent transitions
   */
  private _transitioning: boolean = false;
  
  /**
   * Event handlers for phase transitions
   */
  private _eventHandlers: {
    phaseEnter: Map<P, ((context: C) => void)[]>;
    phaseExit: Map<P, ((context: C) => void)[]>;
    phaseTransition: ((from: P, to: P, context: C) => void)[];
  } = {
    phaseEnter: new Map(),
    phaseExit: new Map(),
    phaseTransition: [],
  };
  
  /**
   * Creates a new PhaseMachine
   * 
   * @param initialPhase - The starting phase of the state machine
   * @param context - The context object that will be used by phase methods
   */
  constructor(initialPhase: P, public context: C) {
    this._currentPhase = initialPhase;
    this.validatePhases();
  }

  /**
   * Validates that all registered phases are properly decorated
   * and have valid return types
   */
  private validatePhases(): void {
    const metadata: PhaseMetadata<P>[] = this.getPhaseMetadata();
    
    // Check that all phase methods exist and are callable
    for (const item of metadata) {
      const method = this[item.method as keyof this];
      if (typeof method !== 'function') {
        throw new Error(`Phase method ${item.method} does not exist or is not a function`);
      }
    }
  }

  /**
   * Retrieves phase metadata from the prototype
   */
  private getPhaseMetadata(): PhaseMetadata<P>[] {
    const prototype = Object.getPrototypeOf(this);
    return Reflect.getMetadata(PHASE_METADATA, prototype) || [];
  }

  /**
   * Gets the current phase of the state machine
   */
  public get currentPhase(): P {
    return this._currentPhase;
  }

  /**
   * Gets whether phase skipping is activated
   */
  public get skipActivated(): boolean {
    return this._skipActivated;
  }

  /**
   * Sets whether phase skipping is activated
   */
  public set skipActivated(value: boolean) {
    this._skipActivated = value;
  }

  /**
   * Starts the state machine from the current phase
   * 
   * @returns Promise that resolves when the transition completes
   */
  public async start(): Promise<void> {
    return this.executePhase(this._currentPhase);
  }

  /**
   * Transitions to a specific phase
   * 
   * @param phase - The phase to transition to
   * @returns Promise that resolves when the transition completes
   * @throws Error if the phase doesn't exist or the transition isn't allowed
   */
  public async transition(phase: P): Promise<void> {
    if (this._transitioning) {
      throw new Error('Cannot transition while another transition is in progress');
    }
    
    try {
      this._transitioning = true;
      return await this.executePhase(phase);
    } finally {
      this._transitioning = false;
    }
  }

  /**
   * Executes a phase method and handles the transition to the next phase
   * 
   * @param phase - The phase to execute
   * @returns Promise that resolves when the phase and any subsequent phases complete
   * @public - Made public for testing purposes
   */
  public async executePhase(phase: P): Promise<void> {
    // Find phase metadata
    const metadata = this.getPhaseMetadata().find(m => m.phase === phase);
    if (!metadata) {
      throw new Error(`Phase ${phase} is not registered`);
    }

    // Check if we should skip this phase
    if (this._skipActivated && metadata.options.skippable) {
      // Find a valid phase method that's not skippable
      const phaseMethod = this[metadata.method as keyof this] as Function;
      const result = await phaseMethod.call(this);
      if (typeof result === 'string') {
        // Continue to the next phase
        return this.executePhase(result as P);
      }
      return;
    }

    // Track phases to detect cycles
    const maxPhaseTransitions = 100; // Arbitrary limit to prevent infinite loops
    let phaseTransitions = 0;
    const visitedPhases = new Set<P>();
    visitedPhases.add(phase);

    // Trigger exit event for current phase
    const prevPhase = this._currentPhase;
    this.triggerExitEvent(prevPhase);
    
    // Update current phase
    this._currentPhase = phase;
    
    // Trigger enter event for new phase
    this.triggerEnterEvent(phase);
    
    // Trigger transition event
    this.triggerTransitionEvent(prevPhase, phase);
    
    // Execute the phase method
    const method = this[metadata.method as keyof this] as Function;
    
    try {
      // Execute the phase method
      const result = await method.call(this);
      
      // If the method returned a new phase, transition to it
      if (typeof result === 'string') {
        const nextPhase = result as P;
        
        // Check for potential infinite loops
        phaseTransitions++;
        if (phaseTransitions > maxPhaseTransitions) {
          console.warn(`Detected possible infinite loop: over ${maxPhaseTransitions} phase transitions`);
          return;
        }
        
        // Check if we're revisiting a phase that could cause a cycle
        if (visitedPhases.has(nextPhase)) {
          console.warn(`Cycle detected: phase ${nextPhase} has already been visited`);
          
          // In production code, you might want to continue anyway or implement
          // more sophisticated cycle detection based on your application needs.
          // For now, we'll continue but log a warning
        }
        
        return this.executePhase(nextPhase);
      }
    } catch (error) {
      console.error(`Error executing phase ${phase}:`, error);
      throw error;
    }
  }
  /**
   * Adds an event handler for when a specific phase is entered
   * 
   * @param phase - The phase to listen for
   * @param handler - The callback function
   */
  public onPhaseEnter(phase: P, handler: (context: C) => void): void {
    if (!this._eventHandlers.phaseEnter.has(phase)) {
      this._eventHandlers.phaseEnter.set(phase, []);
    }
    this._eventHandlers.phaseEnter.get(phase)!.push(handler);
  }

  /**
   * Adds an event handler for when a specific phase is exited
   * 
   * @param phase - The phase to listen for
   * @param handler - The callback function
   */
  public onPhaseExit(phase: P, handler: (context: C) => void): void {
    if (!this._eventHandlers.phaseExit.has(phase)) {
      this._eventHandlers.phaseExit.set(phase, []);
    }
    this._eventHandlers.phaseExit.get(phase)!.push(handler);
  }

  /**
   * Adds an event handler for any phase transition
   * 
   * @param handler - The callback function
   */
  public onPhaseTransition(handler: (from: P, to: P, context: C) => void): void {
    this._eventHandlers.phaseTransition.push(handler);
  }

  /**
   * Triggers all registered enter event handlers for a phase
   * 
   * @param phase - The phase being entered
   */
  protected triggerEnterEvent(phase: P): void {
    const handlers = this._eventHandlers.phaseEnter.get(phase) || [];
    for (const handler of handlers) {
      handler(this.context);
    }
  }

  /**
   * Triggers all registered exit event handlers for a phase
   * 
   * @param phase - The phase being exited
   */
  protected triggerExitEvent(phase: P): void {
    const handlers = this._eventHandlers.phaseExit.get(phase) || [];
    for (const handler of handlers) {
      handler(this.context);
    }
  }

  /**
   * Triggers all registered transition event handlers
   * 
   * @param from - The phase being exited
   * @param to - The phase being entered
   */
  protected triggerTransitionEvent(from: P, to: P): void {
    for (const handler of this._eventHandlers.phaseTransition) {
      handler(from, to, this.context);
    }
  }

  /**
   * Gets all registered phases in the state machine
   * 
   * @returns Array of phase names
   */
  public getPhases(): P[] {
    const metadata = this.getPhaseMetadata();
    return metadata.map(m => m.phase);
  }

  /**
   * Gets all possible transitions from a specific phase
   * 
   * @param phase - The phase to check
   * @returns Array of phases that can be transitioned to
   */
  public getTransitionsFrom(phase: P): P[] {
    const metadata = this.getPhaseMetadata().find(m => m.phase === phase);
    if (!metadata) {
      return [];
    }
    
    // Get all phases for transition info
    // Note: In a full implementation, we would analyze return types
    const allPhases = this.getPhases();
    return allPhases.filter(p => p !== phase);
  }
}

/**
 * Generates a flowchart representation of a state machine using Mermaid syntax
 * 
 * @param machineClass - The state machine class to generate a flowchart for
 * @returns A string containing the Mermaid diagram code
 * 
 * @example
 * ```ts
 * const diagram = generateFlowchart(GameMachine);
 * console.log(diagram);
 * ```
 */
export function generateFlowchart<T extends PhaseMachineContext>(machineClass: PhaseMachineClass<T>): string {
  // Create an instance of the machine to inspect its structure
  const instance = new machineClass();
  
  // Start building the Mermaid diagram
  let diagram = 'stateDiagram-v2\n';
  
  // Add initial state
  diagram += `    [*] --> ${instance.currentPhase}\n`;
  
  // Add transitions between states
  const phases = instance.getPhases();
  
  for (const phase of phases) {
    const transitions = instance.getTransitionsFrom(phase);
    
    for (const target of transitions) {
      diagram += `    ${phase} --> ${target}\n`;
    }
  }
  
  return diagram;
}

// Export decorator
export { Phase, PhaseOptions };
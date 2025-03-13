import 'reflect-metadata';

/**
 * Symbol used to store phase metadata on class prototypes
 */
export const PHASE_METADATA = Symbol('PHASE_METADATA');

/**
 * Options to configure phase execution behavior
 */
export interface PhaseOptions {
  /**
   * Whether this phase can be skipped when skipActivated is true
   * @default false
   */
  skippable?: boolean;
}

/**
 * Internal metadata used to store registered phases
 */
export interface PhaseMetadata<P extends string = string> {
  phase: P;
  method: string;
  options: PhaseOptions;
  transitions: P[];
}

/**
 * Phase Decorator - Registers a method as a phase handler in the state machine
 * 
 * @param phase - The name of the phase this method handles
 * @param options - Optional configuration for the phase
 * 
 * @example
 * ```ts
 * class GameMachine extends PhaseMachine<GamePhase, GameContext> {
 *   @Phase('idle')
 *   async idle(): Promise<'spinning'> {
 *     // idle phase logic
 *     return 'spinning';
 *   }
 * }
 * ```
 */
export function Phase<P extends string>(phase: P, options: PhaseOptions = {}): MethodDecorator {
  return function(
    //@ts-ignore
    target: Object, 
    propertyKey: string | symbol, 
    descriptor: PropertyDescriptor
  ): PropertyDescriptor {
    if (typeof propertyKey !== 'string') {
      throw new Error('Phase decorator can only be applied to methods with string names');
    }

    // Get metadata to register this phase
    const metadata: PhaseMetadata[] = Reflect.getMetadata(PHASE_METADATA, target) || [];
    
    // Add this phase to the metadata
    metadata.push({
      phase,
      method: propertyKey,
      options,
      transitions: [],
    });
    
    // Store metadata on the prototype
    Reflect.defineMetadata(PHASE_METADATA, metadata, target);
    
    return descriptor;
  };
}
import { StateMachineDefinition, CodegenOptions } from './types';
/**
 * Generates a game flow folder structure based on a state machine definition
 */
export declare function generateGameFlow(definition: StateMachineDefinition, options: CodegenOptions): Promise<void>;

import { PHASE_REGISTRY, PhaseMetadata } from './types';

/**
 * Generates a Mermaid flowchart string from a state machine class
 * @param stateMachineClass The state machine class to generate a flowchart for
 * @returns A Mermaid flowchart string
 */
export function generateFlowchart<T extends string>(
  stateMachineClass: any
): string {
  // Get the phase registry
  const phaseRegistry: Map<string, PhaseMetadata<any>> = stateMachineClass[PHASE_REGISTRY];
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
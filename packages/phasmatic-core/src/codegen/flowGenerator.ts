import * as fs from 'fs';
import * as path from 'path';
import { StateMachineDefinition, CodegenOptions, PhaseDefinition } from './types';

/**
 * Generates a game flow folder structure based on a state machine definition
 */
export async function generateGameFlow(
  definition: StateMachineDefinition,
  options: CodegenOptions
): Promise<void> {
  console.log(`Generating game flow for ${definition.name}...`);
  
  // Create output directory if it doesn't exist
  const outputDir = path.resolve(options.outputDir);
  const gameFlowDir = path.join(outputDir, 'game-flow');
  const phasesDir = path.join(gameFlowDir, 'phases');
  
  ensureDirectoryExists(gameFlowDir);
  ensureDirectoryExists(phasesDir);
  
  // Generate phase enum
  generatePhaseEnum(definition, gameFlowDir);
  
  // Generate context type
  generateContextType(definition, gameFlowDir, options);
  
  // Generate state machine
  if (options.separatePhaseFiles) {
    // Generate each phase in a separate file
    generatePhaseFiles(definition, phasesDir, options);
    generateStateMachineWithImports(definition, gameFlowDir, options);
  } else {
    // Generate all phases in a single file
    generateStateMachineSingleFile(definition, gameFlowDir, options);
  }
  
  // Generate index file
  generateIndexFile(definition, gameFlowDir, options);
  
  // Generate test files if requested
  if (options.generateTests) {
    generateTests(definition, gameFlowDir, options);
  }
  
  // Generate visualization if requested
  if (options.includeVisualization) {
    generateVisualization(definition, gameFlowDir, options);
  }
  
  console.log(`Game flow generated successfully in ${gameFlowDir}`);
}

/**
 * Creates a directory if it doesn't exist
 */
function ensureDirectoryExists(directory: string): void {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
}

/**
 * Generates the phase enum file
 */
function generatePhaseEnum(
  definition: StateMachineDefinition,
  outputDir: string
): void {
  const phaseNames = definition.phases.map(phase => phase.name);
  
  const content = `// This file is auto-generated. Do not edit manually.

/**
 * ${definition.phaseEnumName} - Phases for the ${definition.name} state machine
 */
export enum ${definition.phaseEnumName} {
${phaseNames.map(name => `  ${name} = '${name}'`).join(',\n')}
}
`;
  
  fs.writeFileSync(path.join(outputDir, 'phases.ts'), content);
}

/**
 * Generates the context type file
 */
function generateContextType(
  definition: StateMachineDefinition,
  outputDir: string,
  options: CodegenOptions
): void {
  const properties = definition.contextProperties || [];
  
  let content = `// This file is auto-generated. Do not edit manually.

/**
 * ${definition.contextTypeName} - Context for the ${definition.name} state machine
 */
export interface ${definition.contextTypeName} {
${properties.map(prop => {
  const comment = prop.description ? `  /** ${prop.description} */\n` : '';
  return `${comment}  ${prop.name}: ${prop.type};`;
}).join('\n\n')}
}
`;
  
  if (options.useMobx) {
    // Add MobX store class implementation
    content += `
import { makeObservable, observable, action } from 'mobx';

/**
 * Implementation of the ${definition.contextTypeName} using MobX
 */
export class ${definition.name}Store implements ${definition.contextTypeName} {
${properties.map(prop => {
  return `  @observable ${prop.name}: ${prop.type};`;
}).join('\n')}

  constructor() {
    ${properties.map(prop => {
      // Initialize with default values based on type
      let defaultValue = 'undefined';
      
      if (prop.type === 'string') defaultValue = '""';
      else if (prop.type === 'number') defaultValue = '0';
      else if (prop.type === 'boolean') defaultValue = 'false';
      else if (prop.type.includes('[]')) defaultValue = '[]';
      else if (prop.type.includes('Record')) defaultValue = '{}';
      
      return `this.${prop.name} = ${defaultValue};`;
    }).join('\n    ')}
    
    makeObservable(this);
  }
  
${properties.filter(prop => !prop.type.includes('()')).map(prop => {
  const setterName = `set${prop.name.charAt(0).toUpperCase() + prop.name.slice(1)}`;
  return `  @action
  ${setterName}(value: ${prop.type}): void {
    this.${prop.name} = value;
  }`;
}).join('\n\n')}
}
`;
  }
  
  fs.writeFileSync(path.join(outputDir, 'context.ts'), content);
}

/**
 * Generates individual files for each phase
 */
function generatePhaseFiles(
  definition: StateMachineDefinition,
  phasesDir: string,
  options: CodegenOptions
): void {
  definition.phases.forEach(phase => {
    const fileName = `${phase.name.toLowerCase()}.ts`;
    const content = generatePhaseFunction(definition, phase, options);
    
    fs.writeFileSync(path.join(phasesDir, fileName), content);
  });
}

/**
 * Generates the phase handler function
 */
function generatePhaseFunction(
  definition: StateMachineDefinition,
  phase: PhaseDefinition,
  options: CodegenOptions
): string {
  // Create the return type as a union of possible next phases
  const returnType = phase.nextPhases.length === 1
    ? `${definition.phaseEnumName}.${phase.nextPhases[0]}`
    : phase.nextPhases.map(p => `${definition.phaseEnumName}.${p}`).join(' | ');
  
  // Generate code comments about conditions
  const conditionComments = phase.conditions && Object.keys(phase.conditions).length > 0
    ? `/**
 * Conditions for phase transitions:
${Object.entries(phase.conditions)
  .map(([targetPhase, condition]) => ` * - To ${targetPhase}: ${condition}`)
  .join('\n')}
 */`
    : '';
  
  return `// This file is auto-generated. You should modify it with your own implementation.
import { PhaseContext } from 'phasmatic';
import { ${definition.phaseEnumName} } from '../phases';
import { ${definition.contextTypeName} } from '../context';

${conditionComments}

/**
 * ${phase.description || `Handler for the ${phase.name} phase`}
 */
export async function ${phase.name.toLowerCase()}(
  ctx: PhaseContext<${definition.contextTypeName}>
): Promise<${returnType}> {
  // TODO: Implement your phase logic here
${phase.code ? phase.code : `  console.log('Executing ${phase.name} phase');
  
  // Example implementation
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return ${definition.phaseEnumName}.${phase.nextPhases[0]};`}
}
`;
}

/**
 * Generates the state machine file with imports for each phase
 */
function generateStateMachineWithImports(
  definition: StateMachineDefinition,
  outputDir: string,
  options: CodegenOptions
): void {
  const content = `// This file is auto-generated. Do not edit manually.
import { StateMachine, Phase, PhaseContext } from 'phasmatic';
import { ${definition.phaseEnumName} } from './phases';
import { ${definition.contextTypeName} } from './context';

${definition.phases.map(phase => {
  return `import { ${phase.name.toLowerCase()} } from './phases/${phase.name.toLowerCase()}';`;
}).join('\n')}

/**
 * ${definition.description || `${definition.name} state machine`}
 */
export class ${definition.name} extends StateMachine<${definition.phaseEnumName}, ${definition.contextTypeName}> {
  constructor(context: ${definition.contextTypeName}) {
    super(context, ${definition.phaseEnumName}.${definition.initialPhase});
  }
  
${definition.phases.map(phase => {
  // Create the return type as a union of possible next phases
  const returnType = phase.nextPhases.length === 1
    ? `${definition.phaseEnumName}.${phase.nextPhases[0]}`
    : phase.nextPhases.map(p => `${definition.phaseEnumName}.${p}`).join(' | ');
  
  return `  /**
   * ${phase.description || `Handler for the ${phase.name} phase`}
   */
  @Phase(${definition.phaseEnumName}.${phase.name})
  async ${phase.name.toLowerCase()}(ctx: PhaseContext<${definition.contextTypeName}>): Promise<${returnType}> {
    return ${phase.name.toLowerCase()}(ctx);
  }`;
}).join('\n\n')}
}
`;
  
  fs.writeFileSync(path.join(outputDir, 'state-machine.ts'), content);
}

/**
 * Generates the state machine file with all phases in one file
 */
/**
 * Generates the state machine file with all phases in one file
 */
function generateStateMachineSingleFile(
  definition: StateMachineDefinition,
  outputDir: string,
  options: CodegenOptions
): void {
  const content = `// This file is auto-generated. Do not edit manually.
import { StateMachine, Phase, PhaseContext } from 'phasmatic';
import { ${definition.phaseEnumName} } from './phases';
import { ${definition.contextTypeName} } from './context';

/**
 * ${definition.description || `${definition.name} state machine`}
 */
export class ${definition.name} extends StateMachine<${definition.phaseEnumName}, ${definition.contextTypeName}> {
  constructor(context: ${definition.contextTypeName}) {
    super(context, ${definition.phaseEnumName}.${definition.initialPhase});
  }
  
${definition.phases.map(phase => {
  // Create the return type as a union of possible next phases
  const returnType = phase.nextPhases.length === 1
    ? `${definition.phaseEnumName}.${phase.nextPhases[0]}`
    : phase.nextPhases.map(p => `${definition.phaseEnumName}.${p}`).join(' | ');
  
  // Generate code comments about conditions
  const conditionComments = phase.conditions && Object.keys(phase.conditions).length > 0
    ? `  /**
   * Conditions for phase transitions:
${Object.entries(phase.conditions)
  .map(([targetPhase, condition]) => `   * - To ${targetPhase}: ${condition}`)
  .join('\n')}
   */`
    : '';
  
  return `  /**
   * ${phase.description || `Handler for the ${phase.name} phase`}
   */
  @Phase(${definition.phaseEnumName}.${phase.name})
  async ${phase.name.toLowerCase()}(ctx: PhaseContext<${definition.contextTypeName}>): Promise<${returnType}> {
    ${conditionComments}
    // TODO: Implement your phase logic here
${phase.code ? phase.code : `    console.log('Executing ${phase.name} phase');
    
    // Example implementation
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return ${definition.phaseEnumName}.${phase.nextPhases[0]};`}
  }`;
}).join('\n\n')}
}
`;
  
  fs.writeFileSync(path.join(outputDir, 'state-machine.ts'), content);
}
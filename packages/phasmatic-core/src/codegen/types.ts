/**
 * Definition of a phase in the state machine
 */
export interface PhaseDefinition {
    /** Name of the phase */
    name: string;
    
    /** Description of what happens in this phase */
    description?: string;
    
    /** Possible next phases this phase can transition to */
    nextPhases: string[];
    
    /** Conditions for transitioning to different phases (key is the phase name) */
    conditions?: Record<string, string>;
    
    /** Any properties this phase requires from the context */
    requiredProperties?: string[];
    
    /** Code to execute in this phase (will be inserted into the template) */
    code?: string;
  }
  
  /**
   * Definition of a state machine
   */
  export interface StateMachineDefinition {
    /** Name of the state machine class */
    name: string;
    
    /** Description of what this state machine does */
    description?: string;
    
    /** Type name for the phase enum */
    phaseEnumName: string;
    
    /** Type name for the context */
    contextTypeName: string;
    
    /** Initial phase to start with */
    initialPhase: string;
    
    /** List of all phases in this state machine */
    phases: PhaseDefinition[];
    
    /** Properties required by the context */
    contextProperties?: Array<{
      name: string;
      type: string;
      description?: string;
    }>;
  }
  
  /**
   * Options for code generation
   */
  export interface CodegenOptions {
    /** Output directory for the generated code */
    outputDir: string;
    
    /** Whether to generate separate files for each phase */
    separatePhaseFiles?: boolean;
    
    /** Whether to generate tests */
    generateTests?: boolean;
    
    /** Whether to format the code with Prettier */
    formatCode?: boolean;
    
    /** Whether to use MobX for state management */
    useMobx?: boolean;
    
    /** Whether to include ReactFlow visualization */
    includeVisualization?: boolean;
  }
  
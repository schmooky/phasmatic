import 'reflect-metadata';
import { PhaseMachine, Phase, generateFlowchart } from '../src/index.js';

// Simple game phase type for testing
type TestPhase = 'init' | 'running' | 'paused' | 'complete';

// Simple context for testing
interface TestContext {
  counter: number;
  flag: boolean;
  data: string[];
}

// Create a test machine with simplified phases
class TestMachine extends PhaseMachine<TestPhase, TestContext> {
  constructor(initialPhase: TestPhase = 'init') {
    super(initialPhase, { counter: 0, flag: false, data: [] });
  }

  @Phase('init')
  async init(): Promise<'running'> {
    this.context.counter++;
    this.context.data.push('init');
    return 'running';
  }

  @Phase('running')
  async running(): Promise<'paused' | 'complete'> {
    this.context.counter++;
    this.context.data.push('running');
    return this.context.flag ? 'complete' : 'paused';
  }

  @Phase('paused', { skippable: true })
  async paused(): Promise<'running'> {
    this.context.counter++;
    this.context.data.push('paused');
    return 'running';
  }

  @Phase('complete')
  async complete(): Promise<void> {
    // Terminal state - doesn't return another phase
    this.context.counter++;
    this.context.data.push('complete');
    // Return undefined to stay in this phase
    return;
  }
}

describe('PhaseMachine', () => {
  describe('Basic Functionality', () => {
    it('should initialize with the correct initial phase', () => {
      const machine = new TestMachine();
      expect(machine.currentPhase).toBe('init');
    });

    it('should have the correct initial context', () => {
      const machine = new TestMachine();
      expect(machine.context).toEqual({ counter: 0, flag: false, data: [] });
    });

    it('should transition through phases correctly', async () => {
      const machine = new TestMachine();
      
      // Start from init -> running
      await machine.start();
      expect(machine.currentPhase).toBe('running');
      expect(machine.context.counter).toBe(2); // init and running
      expect(machine.context.data).toEqual(['init', 'running']);
      
      // Run again -> should go to paused
      await machine.transition('running');
      expect(machine.currentPhase).toBe('paused');
      expect(machine.context.counter).toBe(3); // init, running, paused
      expect(machine.context.data).toEqual(['init', 'running', 'paused']);
      
      // From paused -> back to running
      await machine.transition('running');
      expect(machine.currentPhase).toBe('running');
      expect(machine.context.counter).toBe(4); // init, running, paused, running
      expect(machine.context.data).toEqual(['init', 'running', 'paused', 'running']);
    });
    
    it('should handle terminal phases correctly', async () => {
      const machine = new TestMachine();
      
      // Set flag to go to complete
      machine.context.flag = true;
      
      // Start from init -> running -> complete
      await machine.start();
      
      // Should have transitioned to complete phase
      expect(machine.currentPhase).toBe('complete');
      expect(machine.context.data).toEqual(['init', 'running', 'complete']);
      expect(machine.context.counter).toBe(3); // init, running, complete
    });
  });

  describe('Phase Skipping', () => {
    it('should skip skippable phases when skipActivated is true', async () => {
      const machine = new TestMachine();
      machine.skipActivated = true;
      
      // Start from init -> running
      await machine.start();
      expect(machine.currentPhase).toBe('running');
      
      // Run again -> should skip paused and go back to running
      await machine.transition('running');
      
      // Should have skipped paused phase
      expect(machine.context.data).not.toContain('paused');
      expect(machine.currentPhase).toBe('running');
    });
    
    it('should not skip non-skippable phases', async () => {
      const machine = new TestMachine();
      machine.skipActivated = true;
      machine.context.flag = true; // Go to complete instead of paused
      
      // Start from init -> running -> complete
      await machine.start();
      
      // Should have executed complete phase (non-skippable)
      expect(machine.currentPhase).toBe('complete');
      expect(machine.context.data).toContain('complete');
    });
  });

  describe('Event Handlers', () => {
    it('should trigger phase enter events', async () => {
      const machine = new TestMachine();
      const enterHandler = jest.fn();
      
      machine.onPhaseEnter('running', enterHandler);
      await machine.start();
      
      expect(enterHandler).toHaveBeenCalledWith(machine.context);
      expect(enterHandler).toHaveBeenCalledTimes(1);
    });
    
    it('should trigger phase exit events', async () => {
      const machine = new TestMachine();
      const exitHandler = jest.fn();
      
      machine.onPhaseExit('init', exitHandler);
      await machine.start();
      
      expect(exitHandler).toHaveBeenCalledWith(machine.context);
      expect(exitHandler).toHaveBeenCalledTimes(1);
    });
    
    it('should trigger phase transition events', async () => {
      const machine = new TestMachine();
      const transitionHandler = jest.fn();
      
      machine.onPhaseTransition(transitionHandler);
      await machine.start();
      
      expect(transitionHandler).toHaveBeenCalledWith('init', 'running', machine.context);
      expect(transitionHandler).toHaveBeenCalledTimes(1);
    });
  });

  describe('Flowchart Generation', () => {
    it('should generate a valid Mermaid flowchart', () => {
      const flowchart = generateFlowchart(TestMachine);
      
      // Should be a string with Mermaid syntax
      expect(typeof flowchart).toBe('string');
      expect(flowchart).toMatch(/^stateDiagram-v2/);
      
      // Should contain all phase transitions
      expect(flowchart).toContain('init --> running');
      expect(flowchart).toContain('running --> paused');
      expect(flowchart).toContain('running --> complete');
      expect(flowchart).toContain('paused --> running');
      
      // Should have the correct initial state
      expect(flowchart).toContain('[*] --> init');
    });
  });

  describe('Error Handling', () => {
    it('should throw an error when transitioning to a non-existent phase', async () => {
      const machine = new TestMachine();
      
      // @ts-expect-error - Intentionally passing invalid phase
      await expect(machine.transition('nonexistent')).rejects.toThrow();
    });
    
    it('should prevent concurrent transitions', async () => {
      const machine = new TestMachine();
      
      // Start first transition
      const promise1 = machine.start();
      
      // Try to start second transition immediately
      const promise2 = machine.transition('running');
      
      // Second transition should be rejected
      await expect(promise2).rejects.toThrow('Cannot transition while another transition is in progress');
      
      // First transition should still complete successfully
      await promise1;
      expect(machine.currentPhase).toBe('running');
    });
  });
});
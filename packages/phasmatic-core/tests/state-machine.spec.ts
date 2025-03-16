// tests/stateMachine.spec.ts
import { StateMachine, Phase, PhaseContext } from '../../../src';
import { PhasmaticInvalidTransitionError, PhasmaticSelfTransitionError } from '../../../src/errors';

// Simple enum for testing
enum TestPhase {
  Init = 'Init',
  Loading = 'Loading',
  Ready = 'Ready',
  Running = 'Running',
  End = 'End',
  Error = 'Error'
}

// Simple context for testing
interface TestContext {
  value: number;
  isLoaded: boolean;
  hasError: boolean;
  disposerCalled: boolean;
}

describe('StateMachine', () => {
  // Basic state machine for testing
  class TestStateMachine extends StateMachine<TestPhase, TestContext> {
    constructor(context: TestContext) {
      super(context, TestPhase.Init, true);
    }
    
    @Phase(TestPhase.Init)
    async init(ctx: PhaseContext<TestContext>): Promise<TestPhase.Loading> {
      ctx.context.value += 1;
      return TestPhase.Loading;
    }
    
    @Phase(TestPhase.Loading)
    async loading(ctx: PhaseContext<TestContext>): Promise<TestPhase.Ready | TestPhase.Error> {
      if (ctx.context.hasError) {
        return TestPhase.Error;
      }
      
      // Add a disposer to test cleanup
      ctx.addDisposer(() => {
        ctx.context.disposerCalled = true;
      });
      
      // Add value and simulate loading
      ctx.context.value += 2;
      ctx.context.isLoaded = true;
      
      return TestPhase.Ready;
    }
    
    @Phase(TestPhase.Ready)
    async ready(ctx: PhaseContext<TestContext>): Promise<TestPhase.Running> {
      ctx.context.value += 3;
      return TestPhase.Running;
    }
    
    @Phase(TestPhase.Running)
    async running(ctx: PhaseContext<TestContext>): Promise<TestPhase.End> {
      ctx.context.value += 4;
      return TestPhase.End;
    }
    
    @Phase(TestPhase.End)
    async end(ctx: PhaseContext<TestContext>): Promise<TestPhase.Init> {
      ctx.context.value += 5;
      return TestPhase.Init;
    }
    
    @Phase(TestPhase.Error)
    async error(ctx: PhaseContext<TestContext>): Promise<TestPhase.Init> {
      return TestPhase.Init;
    }
  }
  
  // Invalid state machine that tries to transition to self
  // This won't compile, but we test it at runtime
  const invalidPhaseDecorator = () => {
    return () => {
      class InvalidStateMachine extends StateMachine<TestPhase, TestContext> {
        constructor(context: TestContext) {
          super(context, TestPhase.Init);
        }
        
        // This should throw an error because it tries to transition to self
        @Phase(TestPhase.Init)
        async init(ctx: PhaseContext<TestContext>): Promise<TestPhase.Init> {
          return TestPhase.Init;
        }
      }
      
      return new InvalidStateMachine({ value: 0, isLoaded: false, hasError: false, disposerCalled: false });
    };
  };
  
  test('should transition through phases correctly', async () => {
    // Arrange
    const context: TestContext = {
      value: 0,
      isLoaded: false,
      hasError: false,
      disposerCalled: false
    };
    
    const machine = new TestStateMachine(context);
    
    // Act
    machine.start();
    
    // Need to wait for async transitions
    // In a real test, you'd use a more robust approach like MobX reactions
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Assert
    expect(context.value).toBe(10); // 1 + 2 + 3 + 4 = 10 (end phase not run yet)
    expect(machine.currentPhase).toBe(TestPhase.End);
    expect(context.disposerCalled).toBe(true);
  });
  
  test('should handle errors and transition to error state', async () => {
    // Arrange
    const context: TestContext = {
      value: 0,
      isLoaded: false,
      hasError: true, // This will trigger error path
      disposerCalled: false
    };
    
    const machine = new TestStateMachine(context);
    
    // Act
    machine.start();
    
    // Need to wait for async transitions
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Assert
    expect(context.value).toBe(1); // Only init phase ran
    expect(machine.currentPhase).toBe(TestPhase.Error);
  });
  
  test('should call disposers when transitioning', async () => {
    // Arrange
    const context: TestContext = {
      value: 0,
      isLoaded: false,
      hasError: false,
      disposerCalled: false
    };
    
    const machine = new TestStateMachine(context);
    
    // Act
    machine.start();
    
    // Need to wait for async transitions
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Assert
    expect(context.disposerCalled).toBe(true);
  });
  
  test('should prevent self-transitions', () => {
    // Arrange & Act & Assert
    expect(invalidPhaseDecorator()).toThrow(PhasmaticSelfTransitionError);
  });
  
  test('should stop the state machine', async () => {
    // Arrange
    const context: TestContext = {
      value: 0,
      isLoaded: false,
      hasError: false,
      disposerCalled: false
    };
    
    const machine = new TestStateMachine(context);
    
    // Act
    machine.start();
    await new Promise(resolve => setTimeout(resolve, 20));
    machine.stop();
    
    // Assert
    expect(machine.isRunning).toBe(false);
    expect(machine.currentPhase).toBeNull();
  });
  
  test('should reset the state machine', async () => {
    // Arrange
    const context: TestContext = {
      value: 0,
      isLoaded: false,
      hasError: false,
      disposerCalled: false
    };
    
    const machine = new TestStateMachine(context);
    
    // Act
    machine.start();
    await new Promise(resolve => setTimeout(resolve, 50));
    const phaseBeforeReset = machine.currentPhase;
    machine.reset();
    
    // Assert
    expect(machine.isRunning).toBe(true);
    expect(machine.currentPhase).not.toBe(phaseBeforeReset);
    expect(machine.currentPhase).toBe(TestPhase.Init); // Reset to initial phase
  });
});

// tests/flowchart.spec.ts
import { generateFlowchart } from '../../../src/flowchart';
import { StateMachine, Phase, PhaseContext } from '../../../src';

describe('Flowchart Generator', () => {
  // Simple enum for testing
  enum FlowPhase {
    A = 'A',
    B = 'B',
    C = 'C'
  }
  
  // Simple state machine to test flowchart generation
  class FlowStateMachine extends StateMachine<FlowPhase> {
    constructor() {
      super({}, FlowPhase.A);
    }
    
    @Phase(FlowPhase.A)
    a(ctx: PhaseContext): Promise<FlowPhase.B> {
      return Promise.resolve(FlowPhase.B);
    }
    
    @Phase(FlowPhase.B)
    b(ctx: PhaseContext): Promise<FlowPhase.C> {
      return Promise.resolve(FlowPhase.C);
    }
    
    @Phase(FlowPhase.C)
    c(ctx: PhaseContext): Promise<FlowPhase.A> {
      return Promise.resolve(FlowPhase.A);
    }
  }
  
  test('should generate correct flowchart', () => {
    // Act
    const flowchart = generateFlowchart(FlowStateMachine);
    
    // Assert
    expect(flowchart).toContain('stateDiagram-v2');
    expect(flowchart).toContain('A --> B');
    expect(flowchart).toContain('B --> C');
    expect(flowchart).toContain('C --> A');
  });
  
  test('should throw error for invalid state machine', () => {
    // Arrange
    class InvalidMachine {}
    
    // Act & Assert
    expect(() => generateFlowchart(InvalidMachine)).toThrow();
  });
});

// tests/decorators.spec.ts
import { Phase } from '../../../src/decorators';
import { PHASE_REGISTRY } from '../../../src/types';
import { PhasmaticSelfTransitionError } from '../../../src/errors';

describe('Phase Decorator', () => {
  test('should register phases in the registry', () => {
    // Arrange
    enum TestPhase {
      One = 'One',
      Two = 'Two'
    }
    
    // Act
    class TestClass {
      @Phase(TestPhase.One)
      methodOne() {
        return TestPhase.Two;
      }
      
      @Phase(TestPhase.Two)
      methodTwo() {
        return TestPhase.One;
      }
    }
    
    // Assert
    expect(TestClass[PHASE_REGISTRY]).toBeDefined();
    expect(TestClass[PHASE_REGISTRY].size).toBe(2);
    expect(TestClass[PHASE_REGISTRY].has(TestPhase.One)).toBe(true);
    expect(TestClass[PHASE_REGISTRY].has(TestPhase.Two)).toBe(true);
  });
  
  test('should not allow self-transitions', () => {
    // Arrange
    enum TestPhase {
      Loop = 'Loop'
    }
    
    // Act & Assert
    expect(() => {
      class InvalidClass {
        @Phase(TestPhase.Loop)
        loop() {
          return TestPhase.Loop; // Self-transition
        }
      }
    }).toThrow(PhasmaticSelfTransitionError);
  });
});
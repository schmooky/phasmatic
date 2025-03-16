var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
// tests/stateMachine.spec.ts
import { StateMachine, Phase, PhaseContext } from '../../../src';
import { PhasmaticSelfTransitionError } from '../../../src/errors';
// Simple enum for testing
var TestPhase;
(function (TestPhase) {
    TestPhase["Init"] = "Init";
    TestPhase["Loading"] = "Loading";
    TestPhase["Ready"] = "Ready";
    TestPhase["Running"] = "Running";
    TestPhase["End"] = "End";
    TestPhase["Error"] = "Error";
})(TestPhase || (TestPhase = {}));
describe('StateMachine', () => {
    var _a, _b, _c, _d, _e, _f;
    // Basic state machine for testing
    class TestStateMachine extends StateMachine {
        constructor(context) {
            super(context, TestPhase.Init, true);
        }
        async init(ctx) {
            ctx.context.value += 1;
            return TestPhase.Loading;
        }
        async loading(ctx) {
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
        async ready(ctx) {
            ctx.context.value += 3;
            return TestPhase.Running;
        }
        async running(ctx) {
            ctx.context.value += 4;
            return TestPhase.End;
        }
        async end(ctx) {
            ctx.context.value += 5;
            return TestPhase.Init;
        }
        async error(ctx) {
            return TestPhase.Init;
        }
    }
    __decorate([
        Phase(TestPhase.Init),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [typeof (_a = typeof PhaseContext !== "undefined" && PhaseContext) === "function" ? _a : Object]),
        __metadata("design:returntype", Promise)
    ], TestStateMachine.prototype, "init", null);
    __decorate([
        Phase(TestPhase.Loading),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [typeof (_b = typeof PhaseContext !== "undefined" && PhaseContext) === "function" ? _b : Object]),
        __metadata("design:returntype", Promise)
    ], TestStateMachine.prototype, "loading", null);
    __decorate([
        Phase(TestPhase.Ready),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [typeof (_c = typeof PhaseContext !== "undefined" && PhaseContext) === "function" ? _c : Object]),
        __metadata("design:returntype", Promise)
    ], TestStateMachine.prototype, "ready", null);
    __decorate([
        Phase(TestPhase.Running),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [typeof (_d = typeof PhaseContext !== "undefined" && PhaseContext) === "function" ? _d : Object]),
        __metadata("design:returntype", Promise)
    ], TestStateMachine.prototype, "running", null);
    __decorate([
        Phase(TestPhase.End),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [typeof (_e = typeof PhaseContext !== "undefined" && PhaseContext) === "function" ? _e : Object]),
        __metadata("design:returntype", Promise)
    ], TestStateMachine.prototype, "end", null);
    __decorate([
        Phase(TestPhase.Error),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [typeof (_f = typeof PhaseContext !== "undefined" && PhaseContext) === "function" ? _f : Object]),
        __metadata("design:returntype", Promise)
    ], TestStateMachine.prototype, "error", null);
    // Invalid state machine that tries to transition to self
    // This won't compile, but we test it at runtime
    const invalidPhaseDecorator = () => {
        return () => {
            var _a;
            class InvalidStateMachine extends StateMachine {
                constructor(context) {
                    super(context, TestPhase.Init);
                }
                // This should throw an error because it tries to transition to self
                async init(ctx) {
                    return TestPhase.Init;
                }
            }
            __decorate([
                Phase(TestPhase.Init),
                __metadata("design:type", Function),
                __metadata("design:paramtypes", [typeof (_a = typeof PhaseContext !== "undefined" && PhaseContext) === "function" ? _a : Object]),
                __metadata("design:returntype", Promise)
            ], InvalidStateMachine.prototype, "init", null);
            return new InvalidStateMachine({ value: 0, isLoaded: false, hasError: false, disposerCalled: false });
        };
    };
    test('should transition through phases correctly', async () => {
        // Arrange
        const context = {
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
        const context = {
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
        const context = {
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
        const context = {
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
        const context = {
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
describe('Flowchart Generator', () => {
    var _a, _b, _c;
    // Simple enum for testing
    let FlowPhase;
    (function (FlowPhase) {
        FlowPhase["A"] = "A";
        FlowPhase["B"] = "B";
        FlowPhase["C"] = "C";
    })(FlowPhase || (FlowPhase = {}));
    // Simple state machine to test flowchart generation
    class FlowStateMachine extends StateMachine {
        constructor() {
            super({}, FlowPhase.A);
        }
        a(ctx) {
            return Promise.resolve(FlowPhase.B);
        }
        b(ctx) {
            return Promise.resolve(FlowPhase.C);
        }
        c(ctx) {
            return Promise.resolve(FlowPhase.A);
        }
    }
    __decorate([
        Phase(FlowPhase.A),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [typeof (_a = typeof PhaseContext !== "undefined" && PhaseContext) === "function" ? _a : Object]),
        __metadata("design:returntype", Promise)
    ], FlowStateMachine.prototype, "a", null);
    __decorate([
        Phase(FlowPhase.B),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [typeof (_b = typeof PhaseContext !== "undefined" && PhaseContext) === "function" ? _b : Object]),
        __metadata("design:returntype", Promise)
    ], FlowStateMachine.prototype, "b", null);
    __decorate([
        Phase(FlowPhase.C),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [typeof (_c = typeof PhaseContext !== "undefined" && PhaseContext) === "function" ? _c : Object]),
        __metadata("design:returntype", Promise)
    ], FlowStateMachine.prototype, "c", null);
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
        class InvalidMachine {
        }
        // Act & Assert
        expect(() => generateFlowchart(InvalidMachine)).toThrow();
    });
});
import { PHASE_REGISTRY } from '../../../src/types';
describe('Phase Decorator', () => {
    test('should register phases in the registry', () => {
        // Arrange
        let TestPhase;
        (function (TestPhase) {
            TestPhase["One"] = "One";
            TestPhase["Two"] = "Two";
        })(TestPhase || (TestPhase = {}));
        // Act
        class TestClass {
            methodOne() {
                return TestPhase.Two;
            }
            methodTwo() {
                return TestPhase.One;
            }
        }
        __decorate([
            Phase(TestPhase.One),
            __metadata("design:type", Function),
            __metadata("design:paramtypes", []),
            __metadata("design:returntype", void 0)
        ], TestClass.prototype, "methodOne", null);
        __decorate([
            Phase(TestPhase.Two),
            __metadata("design:type", Function),
            __metadata("design:paramtypes", []),
            __metadata("design:returntype", void 0)
        ], TestClass.prototype, "methodTwo", null);
        // Assert
        expect(TestClass[PHASE_REGISTRY]).toBeDefined();
        expect(TestClass[PHASE_REGISTRY].size).toBe(2);
        expect(TestClass[PHASE_REGISTRY].has(TestPhase.One)).toBe(true);
        expect(TestClass[PHASE_REGISTRY].has(TestPhase.Two)).toBe(true);
    });
    test('should not allow self-transitions', () => {
        // Arrange
        let TestPhase;
        (function (TestPhase) {
            TestPhase["Loop"] = "Loop";
        })(TestPhase || (TestPhase = {}));
        // Act & Assert
        expect(() => {
            class InvalidClass {
                loop() {
                    return TestPhase.Loop; // Self-transition
                }
            }
            __decorate([
                Phase(TestPhase.Loop),
                __metadata("design:type", Function),
                __metadata("design:paramtypes", []),
                __metadata("design:returntype", void 0)
            ], InvalidClass.prototype, "loop", null);
        }).toThrow(PhasmaticSelfTransitionError);
    });
});
//# sourceMappingURL=state-machine.spec.js.map
// examples/cli-slot-machine/tests/state-machine.test.ts
import { SlotMachine, SlotPhase } from '../state-machine';
import { SlotContext } from '../context';
import { Interface as ReadlineInterface } from 'readline';
import { EventEmitter } from 'events';

// Mock readline interface
class MockReadline extends EventEmitter implements Partial<ReadlineInterface> {
  nextAnswer: string = '';
  
  question(query: string, callback: (answer: string) => void): void {
    // Simulate user input with the next answer
    setTimeout(() => callback(this.nextAnswer), 10);
  }
  
  close(): void {
    // Mock implementation
  }
  
  setNextAnswer(answer: string): void {
    this.nextAnswer = answer;
  }
}

// Mock context factory
function createMockContext(): SlotContext & { mockRL: MockReadline } {
  const mockRL = new MockReadline() as MockReadline;
  
  const context: Partial<SlotContext> = {
    balance: 100,
    bet: 1,
    reels: ['🎰', '🎰', '🎰'],
    isSpinning: false,
    lastWin: 0,
    hasBonus: false,
    bonusSpinsRemaining: 0,
    rl: mockRL as unknown as ReadlineInterface,
    
    placeBet: jest.fn((amount: number) => {
      if (context.balance! >= amount) {
        context.bet = amount;
      }
    }),
    
    addWin: jest.fn((amount: number) => {
      context.lastWin = amount;
      context.balance! += amount;
    }),
    
    spin: jest.fn().mockImplementation(async () => {
      if (context.balance! < context.bet!) {
        throw new Error("Not enough balance");
      }
      
      context.balance! -= context.bet!;
      context.isSpinning = true;
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Predetermined results for testing
      const symbols = ['🍒', '🍒', '🍒'];
      const win = 10;
      const hasBonus = false;
      
      context.reels = symbols;
      context.isSpinning = false;
      context.lastWin = win;
      
      if (win > 0) {
        context.balance! += win;
      }
      
      return { win, symbols, hasBonus };
    }),
    
    getBet: jest.fn().mockImplementation(async () => {
      mockRL.setNextAnswer('5');
      return new Promise(resolve => {
        mockRL.question('', (answer) => {
          resolve(parseInt(answer, 10));
        });
      });
    }),
    
    showReels: jest.fn(),
    
    promptForAction: jest.fn().mockImplementation(async () => {
      return new Promise(resolve => {
        resolve('spin');
      });
    }),
    
    startBonusGame: jest.fn(() => {
      context.bonusSpinsRemaining = 5;
    }),
    
    triggerBonusRound: jest.fn(() => {
      context.hasBonus = true;
    })
  };
  
  return context as SlotContext & { mockRL: MockReadline };
}

// Helper function to wait for a phase
async function waitForPhase(machine: SlotMachine, phase: SlotPhase, timeout = 1000): Promise<void> {
  const start = Date.now();
  while (machine.currentPhase !== phase) {
    if (Date.now() - start > timeout) {
      throw new Error(`Timeout waiting for phase ${phase}, current phase is ${machine.currentPhase}`);
    }
    await new Promise(resolve => setTimeout(resolve, 10));
  }
}

describe('SlotMachine State Machine', () => {
  let context: SlotContext & { mockRL: MockReadline };
  let slotMachine: SlotMachine;
  
  beforeEach(() => {
    context = createMockContext();
    slotMachine = new SlotMachine(context);
    
    // Mock exit to prevent test from terminating
    jest.spyOn(process, 'exit').mockImplementation((() => {}) as any);
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  test('should transition from Init to Idle', async () => {
    // Arrange
    slotMachine.start();
    
    // Act & Assert
    await waitForPhase(slotMachine, SlotPhase.Idle);
    expect(slotMachine.currentPhase).toBe(SlotPhase.Idle);
  });
  
  test('should transition from Idle to Spin', async () => {
    // Arrange
    jest.spyOn(context, 'promptForAction').mockResolvedValueOnce('spin');
    slotMachine.start();
    
    // Wait for idle state
    await waitForPhase(slotMachine, SlotPhase.Idle);
    
    // Act & Assert - the promptForAction mock will trigger transition to Spin
    await waitForPhase(slotMachine, SlotPhase.Spin);
    expect(slotMachine.currentPhase).toBe(SlotPhase.Spin);
  });
  
  test('should transition from Spin to EvaluateWin', async () => {
    // Arrange
    jest.spyOn(context, 'promptForAction').mockResolvedValueOnce('spin');
    slotMachine.start();
    
    // Wait for spin state
    await waitForPhase(slotMachine, SlotPhase.Idle);
    await waitForPhase(slotMachine, SlotPhase.Spin);
    
    // Act & Assert
    await waitForPhase(slotMachine, SlotPhase.EvaluateWin);
    expect(slotMachine.currentPhase).toBe(SlotPhase.EvaluateWin);
    expect(context.spin).toHaveBeenCalled();
  });
  
  test('should transition from EvaluateWin to WinPresentation on win', async () => {
    // Arrange
    jest.spyOn(context, 'promptForAction').mockResolvedValueOnce('spin');
    context.lastWin = 10; // Ensure there's a win
    slotMachine.start();
    
    // Wait for evaluate win state
    await waitForPhase(slotMachine, SlotPhase.Idle);
    await waitForPhase(slotMachine, SlotPhase.Spin);
    await waitForPhase(slotMachine, SlotPhase.EvaluateWin);
    
    // Act & Assert
    await waitForPhase(slotMachine, SlotPhase.WinPresentation);
    expect(slotMachine.currentPhase).toBe(SlotPhase.WinPresentation);
  });
  
  test('should transition from WinPresentation to Idle', async () => {
    // Arrange
    jest.spyOn(context, 'promptForAction').mockResolvedValueOnce('spin');
    context.lastWin = 10; // Ensure there's a win
    slotMachine.start();
    
    // Wait for win presentation state
    await waitForPhase(slotMachine, SlotPhase.Idle);
    await waitForPhase(slotMachine, SlotPhase.Spin);
    await waitForPhase(slotMachine, SlotPhase.EvaluateWin);
    await waitForPhase(slotMachine, SlotPhase.WinPresentation);
    
    // Act & Assert
    await waitForPhase(slotMachine, SlotPhase.Idle, 2000); // Longer timeout for win animation
    expect(slotMachine.currentPhase).toBe(SlotPhase.Idle);
  });
  
  test('should transition from Idle to BonusGame when bonus is triggered', async () => {
    // Arrange
    context.hasBonus = true; // Trigger bonus game
    slotMachine.start();
    
    // Wait for idle state
    await waitForPhase(slotMachine, SlotPhase.Idle);
    
    // Act & Assert
    await waitForPhase(slotMachine, SlotPhase.BonusGame);
    expect(slotMachine.currentPhase).toBe(SlotPhase.BonusGame);
  });
  
  test('should transition from BonusGame to Spin', async () => {
    // Arrange
    context.hasBonus = true; // Trigger bonus game
    slotMachine.start();
    
    // Wait for bonus game state
    await waitForPhase(slotMachine, SlotPhase.Idle);
    await waitForPhase(slotMachine, SlotPhase.BonusGame);
    
    // Act & Assert
    await waitForPhase(slotMachine, SlotPhase.Spin);
    expect(slotMachine.currentPhase).toBe(SlotPhase.Spin);
    expect(context.startBonusGame).toHaveBeenCalled();
    expect(context.bonusSpinsRemaining).toBeGreaterThan(0);
  });
  
  test('should transition from Idle to PlaceBet', async () => {
    // Arrange
    jest.spyOn(context, 'promptForAction').mockResolvedValueOnce('bet');
    slotMachine.start();
    
    // Wait for idle state
    await waitForPhase(slotMachine, SlotPhase.Idle);
    
    // Act & Assert
    await waitForPhase(slotMachine, SlotPhase.PlaceBet);
    expect(slotMachine.currentPhase).toBe(SlotPhase.PlaceBet);
  });
  
  test('should transition from PlaceBet to Idle', async () => {
    // Arrange
    jest.spyOn(context, 'promptForAction').mockResolvedValueOnce('bet');
    slotMachine.start();
    
    // Wait for place bet state
    await waitForPhase(slotMachine, SlotPhase.Idle);
    await waitForPhase(slotMachine, SlotPhase.PlaceBet);
    
    // Act & Assert
    await waitForPhase(slotMachine, SlotPhase.Idle);
    expect(slotMachine.currentPhase).toBe(SlotPhase.Idle);
    expect(context.getBet).toHaveBeenCalled();
    expect(context.placeBet).toHaveBeenCalled();
  });
  
  test('should transition to GameOver when out of money', async () => {
    // Arrange
    context.balance = 0; // Player is out of money
    slotMachine.start();
    
    // Wait for idle state
    await waitForPhase(slotMachine, SlotPhase.Idle);
    
    // Act & Assert
    await waitForPhase(slotMachine, SlotPhase.GameOver);
    expect(slotMachine.currentPhase).toBe(SlotPhase.GameOver);
  });
  
  test('should transition from Idle to Exit', async () => {
    // Arrange
    jest.spyOn(context, 'promptForAction').mockResolvedValueOnce('exit');
    slotMachine.start();
    
    // Wait for idle state
    await waitForPhase(slotMachine, SlotPhase.Idle);
    
    // Act & Assert
    await waitForPhase(slotMachine, SlotPhase.Exit);
    expect(slotMachine.currentPhase).toBe(SlotPhase.Exit);
    expect(process.exit).toHaveBeenCalledWith(0);
  });
});
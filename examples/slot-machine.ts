// Import directly from source files
import { PhaseMachine, Phase } from '../src/index.js';

// Define all possible phases
type SlotPhase = 'idle' | 'betting' | 'spinning' | 'evaluating' | 'paying' | 'gameOver';

// Define the context structure
interface SlotContext {
  credits: number;
  bet: number;
  reels: string[][];
  winAmount: number;
  spinCount: number;
  maxSpins: number;
}

class SlotMachine extends PhaseMachine<SlotPhase, SlotContext> {
  constructor() {
    // Initialize with 'idle' phase and starting context
    super('idle', {
      credits: 100,
      bet: 0,
      reels: [],
      winAmount: 0,
      spinCount: 0,
      maxSpins: 5
    });
    
    // Set up event handlers for logging
    this.onPhaseTransition((from, to, context) => {
      console.log(`Transition: ${from} -> ${to}`);
      console.log(`Credits: ${context.credits}, Bet: ${context.bet}, Wins: ${context.winAmount}`);
    });
  }
  
  @Phase('idle')
  async idle(): Promise<'betting' | 'gameOver'> {
    console.log('Waiting for player input...');
    
    // Check if player has enough credits or has reached max spins
    if (this.context.credits <= 0 || this.context.spinCount >= this.context.maxSpins) {
      console.log('Game over - out of credits or reached max spins');
      return 'gameOver';
    }
    
    return 'betting';
  }
  
  @Phase('betting')
  async betting(): Promise<'spinning'> {
    // Simulate placing bet
    this.context.bet = Math.min(10, this.context.credits);
    this.context.credits -= this.context.bet;
    
    console.log(`Bet placed: ${this.context.bet} credits`);
    return 'spinning';
  }
  
  @Phase('spinning', { skippable: true })
  async spinning(): Promise<'evaluating'> {
    console.log('Spinning reels...');
    
    // Simulate spinning animation
    this.context.spinCount++;
    
    // Generate random results
    this.context.reels = [
      [this.getRandomSymbol(), this.getRandomSymbol(), this.getRandomSymbol()],
      [this.getRandomSymbol(), this.getRandomSymbol(), this.getRandomSymbol()],
      [this.getRandomSymbol(), this.getRandomSymbol(), this.getRandomSymbol()]
    ];
    
    console.log('Reels:');
    this.context.reels.forEach(row => {
      console.log(row.join(' '));
    });
    
    return 'evaluating';
  }
  
  @Phase('evaluating')
  async evaluating(): Promise<'paying' | 'idle'> {
    console.log('Evaluating results...');
    
    // Simple evaluation: 3 matching symbols on middle row wins
    const middleRow = this.context.reels[1];
    const hasWin = middleRow[0] === middleRow[1] && middleRow[1] === middleRow[2];
    
    if (hasWin) {
      const symbol = middleRow[0];
      const multiplier = this.getMultiplier(symbol);
      this.context.winAmount = this.context.bet * multiplier;
      console.log(`Winner! ${symbol} pays ${multiplier}x: ${this.context.winAmount} credits`);
      return 'paying';
    } else {
      console.log('No win this time');
      this.context.winAmount = 0;
      return 'idle';
    }
  }
  
  @Phase('paying')
  async paying(): Promise<'idle'> {
    console.log(`Paying out ${this.context.winAmount} credits`);
    
    // Add winnings to credits
    this.context.credits += this.context.winAmount;
    
    // Reset win amount
    this.context.winAmount = 0;
    
    return 'idle';
  }
  
  @Phase('gameOver')
  async gameOver(): Promise<void> {
    console.log('Game over!');
    console.log(`Final credits: ${this.context.credits}`);
    console.log(`Total spins: ${this.context.spinCount}`);
    
    // Terminal state - no more transitions
    return;
  }
  
  // Helper methods
  private getRandomSymbol(): string {
    const symbols = ['🍒', '🍋', '🍊', '🍇', '💎', '7️⃣'];
    return symbols[Math.floor(Math.random() * symbols.length)];
  }
  
  private getMultiplier(symbol: string): number {
    const multipliers: Record<string, number> = {
      '🍒': 2,
      '🍋': 3,
      '🍊': 4,
      '🍇': 5,
      '💎': 10,
      '7️⃣': 20
    };
    return multipliers[symbol] || 1;
  }
}

// Example usage
async function runDemo() {
  const slotMachine = new SlotMachine();
  
  console.log('=== SLOT MACHINE DEMO ===');
  
  // Start the machine
  await slotMachine.start();
  
  // Run several spins automatically
  while (slotMachine.currentPhase !== 'gameOver') {
    // Short delay between spins
    await new Promise(resolve => setTimeout(resolve, 500));
    await slotMachine.transition(slotMachine.currentPhase);
  }
  
  console.log('=== DEMO COMPLETE ===');
}

// Run the demo
runDemo().catch(console.error);
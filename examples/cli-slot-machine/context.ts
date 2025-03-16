// examples/cli-slot-machine/context.ts
import { makeObservable, observable, action } from 'mobx';
import { Interface as ReadlineInterface } from 'readline';
import chalk from 'chalk';

/**
 * Symbol map for slot machine reels
 */
export const SYMBOLS = ['🍒', '🍋', '🍊', '🍇', '🔔', '💎', '7️⃣'];

/**
 * Payouts for different symbol combinations
 */
export const PAYOUTS = {
  '🍒': 2,
  '🍋': 3,
  '🍊': 4,
  '🍇': 6,
  '🔔': 10,
  '💎': 15,
  '7️⃣': 20,
};

/**
 * Game context type
 */
export interface SlotContext {
  // Game state
  balance: number;
  bet: number;
  reels: string[];
  isSpinning: boolean;
  lastWin: number;
  hasBonus: boolean;
  bonusSpinsRemaining: number;
  
  // User interface
  rl: ReadlineInterface;
  
  // Actions
  spin(): Promise<{win: number, symbols: string[], hasBonus: boolean}>;
  getBet(): Promise<number>;
  placeBet(amount: number): void;
  addWin(amount: number): void;
  showReels(reels: string[]): void;
  promptForAction(): Promise<'spin' | 'bet' | 'exit'>;
  startBonusGame(): void;
  triggerBonusRound(): void;
}

/**
 * Creates a slot machine game context
 */
export function createContext(rl: ReadlineInterface): SlotContext {
  class GameContext implements SlotContext {
    @observable balance = 100;
    @observable bet = 1;
    @observable reels = ['🎰', '🎰', '🎰'];
    @observable isSpinning = false;
    @observable lastWin = 0;
    @observable hasBonus = false;
    @observable bonusSpinsRemaining = 0;
    
    rl: ReadlineInterface;
    
    constructor(rl: ReadlineInterface) {
      this.rl = rl;
      makeObservable(this);
    }
    
    @action
    placeBet(amount: number): void {
      if (amount > this.balance) {
        console.log(chalk.red(`You don't have enough balance. Your balance: $${this.balance}`));
        return;
      }
      
      this.bet = amount;
      console.log(chalk.green(`Bet set to $${amount}`));
    }
    
    @action
    addWin(amount: number): void {
      this.lastWin = amount;
      this.balance += amount;
      console.log(chalk.green.bold(`You won $${amount}!`));
    }
    
    @action
    async spin(): Promise<{win: number, symbols: string[], hasBonus: boolean}> {
      // Check if player has enough balance
      if (this.balance < this.bet) {
        throw new Error("Not enough balance to spin");
      }
      
      // Deduct bet amount
      this.balance -= this.bet;
      this.isSpinning = true;
      
      // Display spinning animation
      const spinningFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
      let frameIndex = 0;
      
      const spinner = setInterval(() => {
        process.stdout.write(`\r${spinningFrames[frameIndex]} Spinning...`);
        frameIndex = (frameIndex + 1) % spinningFrames.length;
      }, 80);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Generate random symbols
      const symbols = Array(3).fill(0).map(() => {
        const randomIndex = Math.floor(Math.random() * SYMBOLS.length);
        return SYMBOLS[randomIndex];
      });
      
      // Clear spinner
      clearInterval(spinner);
      process.stdout.write('\r                    \r');
      
      this.reels = symbols;
      this.isSpinning = false;
      
      // Check for bonus (three 7s)
      const hasBonus = symbols.every(s => s === '7️⃣');
      
      // Calculate win
      let win = 0;
      if (symbols[0] === symbols[1] && symbols[1] === symbols[2]) {
        // All three symbols match
        win = PAYOUTS[symbols[0] as keyof typeof PAYOUTS] * this.bet;
      } else if (symbols[0] === symbols[1] || symbols[1] === symbols[2]) {
        // Two adjacent symbols match
        win = Math.floor(PAYOUTS[symbols[1] as keyof typeof PAYOUTS] * this.bet * 0.3);
      }
      
      // Apply bonus multiplier if in bonus game
      if (this.bonusSpinsRemaining > 0) {
        win *= 2;
      }
      
      return { win, symbols, hasBonus };
    }
    
    @action
    async getBet(): Promise<number> {
      return new Promise((resolve) => {
        this.rl.question(chalk.yellow(`Enter your bet (1-${this.balance}): `), (answer) => {
          const bet = parseInt(answer, 10);
          if (isNaN(bet) || bet < 1 || bet > this.balance) {
            console.log(chalk.red(`Invalid bet. Please enter a value between 1 and ${this.balance}.`));
            resolve(this.bet); // Keep current bet
          } else {
            resolve(bet);
          }
        });
      });
    }
    
    @action
    showReels(reels: string[]): void {
      console.log('\n┌───┬───┬───┐');
      console.log(`│ ${reels[0]} │ ${reels[1]} │ ${reels[2]} │`);
      console.log('└───┴───┴───┘\n');
    }
    
    @action
    async promptForAction(): Promise<'spin' | 'bet' | 'exit'> {
      console.log(chalk.cyan(`Balance: $${this.balance} | Current Bet: $${this.bet}`));
      
      if (this.bonusSpinsRemaining > 0) {
        console.log(chalk.magenta(`🌟 BONUS MODE: ${this.bonusSpinsRemaining} spins remaining 🌟`));
      }
      
      return new Promise((resolve) => {
        this.rl.question(
          chalk.yellow('What would you like to do? (s)pin, (b)et, (e)xit: '), 
          (answer) => {
            const action = answer.trim().toLowerCase()[0];
            if (action === 's') resolve('spin');
            else if (action === 'b') resolve('bet');
            else if (action === 'e') resolve('exit');
            else {
              console.log(chalk.red('Invalid option. Try again.'));
              resolve(this.promptForAction());
            }
          }
        );
      });
    }
    
    @action
    startBonusGame(): void {
      this.bonusSpinsRemaining = 5;
      console.log(chalk.magenta.bold('🌟 BONUS ROUND ACTIVATED! 🌟'));
      console.log(chalk.magenta('You have 5 free spins with 2x multiplier on all wins!'));
    }
    
    @action
    triggerBonusRound(): void {
      this.hasBonus = true;
    }
  }
  
  return new GameContext(rl);
}
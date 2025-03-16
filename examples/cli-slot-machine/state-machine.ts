// examples/cli-slot-machine/state-machine.ts
import { StateMachine, Phase, PhaseContext } from '../../src';
import { SlotContext } from './context';
import chalk from 'chalk';

/**
 * Game phases for the slot machine
 */
export enum SlotPhase {
  Init = 'Init',
  Idle = 'Idle',
  PlaceBet = 'PlaceBet',
  Spin = 'Spin',
  EvaluateWin = 'EvaluateWin',
  WinPresentation = 'WinPresentation',
  BonusGame = 'BonusGame',
  GameOver = 'GameOver',
  Exit = 'Exit',
}

/**
 * Slot machine state machine implementation
 */
export class SlotMachine extends StateMachine<SlotPhase, SlotContext> {
  constructor(context: SlotContext) {
    super(context, SlotPhase.Init, true);
  }
  
  /**
   * Initialize the game
   */
  @Phase(SlotPhase.Init)
  async init(ctx: PhaseContext<SlotContext>): Promise<SlotPhase.Idle> {
    console.log(chalk.green('Initializing game...'));
    console.log(chalk.cyan(`Starting balance: $${ctx.context.balance}`));
    console.log(chalk.yellow('Instructions:'));
    console.log('- Spin the reels and match symbols to win');
    console.log('- Match 3 symbols for a big win, 2 for a small win');
    console.log('- Get three 7️⃣ to trigger the bonus round');
    console.log('');
    
    return SlotPhase.Idle;
  }
  
  /**
   * Idle state - waiting for player input
   */
  @Phase(SlotPhase.Idle)
  async idle(ctx: PhaseContext<SlotContext>): Promise<SlotPhase.PlaceBet | SlotPhase.Spin | SlotPhase.BonusGame | SlotPhase.Exit> {
    // Show current state
    ctx.context.showReels(ctx.context.reels);
    
    // Check if player is out of money
    if (ctx.context.balance <= 0) {
      console.log(chalk.red('You\'re out of money! Game over.'));
      return SlotPhase.GameOver;
    }
    
    // Check if bonus round was triggered
    if (ctx.context.hasBonus) {
      ctx.context.hasBonus = false;
      return SlotPhase.BonusGame;
    }
    
    // Check if already in bonus mode with remaining spins
    if (ctx.context.bonusSpinsRemaining > 0) {
      console.log(chalk.magenta(`Bonus spins remaining: ${ctx.context.bonusSpinsRemaining}`));
      return SlotPhase.Spin;
    }
    
    // Prompt player for action
    const action = await ctx.context.promptForAction();
    
    switch (action) {
      case 'spin':
        return SlotPhase.Spin;
      case 'bet':
        return SlotPhase.PlaceBet;
      case 'exit':
        return SlotPhase.Exit;
      default:
        // Should never happen due to promptForAction implementation
        return SlotPhase.Idle;
    }
  }
  
  /**
   * Place bet state
   */
  @Phase(SlotPhase.PlaceBet)
  async placeBet(ctx: PhaseContext<SlotContext>): Promise<SlotPhase.Idle> {
    const bet = await ctx.context.getBet();
    ctx.context.placeBet(bet);
    return SlotPhase.Idle;
  }
  
  /**
   * Spin state
   */
  @Phase(SlotPhase.Spin)
  async spin(ctx: PhaseContext<SlotContext>): Promise<SlotPhase.EvaluateWin | SlotPhase.Idle> {
    try {
      // Check if this is a bonus spin
      const isBonusSpin = ctx.context.bonusSpinsRemaining > 0;
      
      if (isBonusSpin) {
        ctx.context.bonusSpinsRemaining--;
        console.log(chalk.magenta(`🌟 BONUS SPIN! ${ctx.context.bonusSpinsRemaining} remaining 🌟`));
      } else {
        // Regular spin, check if enough balance
        if (ctx.context.balance < ctx.context.bet) {
          console.log(chalk.red(`Not enough balance to spin. Your balance: $${ctx.context.balance}`));
          return SlotPhase.Idle;
        }
      }
      
      // Spin the reels
      console.log(chalk.yellow(`Spinning the reels with bet $${ctx.context.bet}...`));
      const result = await ctx.context.spin();
      
      // Show the result
      ctx.context.showReels(result.symbols);
      
      // Check for bonus (three 7s)
      if (result.hasBonus) {
        ctx.context.triggerBonusRound();
      }
      
      return SlotPhase.EvaluateWin;
    } catch (error) {
      console.error(chalk.red('Error during spin:'), error);
      return SlotPhase.Idle;
    }
  }
  
  /**
   * Evaluate win state
   */
  @Phase(SlotPhase.EvaluateWin)
  async evaluateWin(ctx: PhaseContext<SlotContext>): Promise<SlotPhase.WinPresentation | SlotPhase.Idle> {
    // Check if player won anything in the last spin
    if (ctx.context.lastWin > 0) {
      return SlotPhase.WinPresentation;
    }
    
    // No win
    console.log(chalk.yellow('No win this time. Try again!'));
    return SlotPhase.Idle;
  }
  
  /**
   * Win presentation state
   */
  @Phase(SlotPhase.WinPresentation)
  async winPresentation(ctx: PhaseContext<SlotContext>): Promise<SlotPhase.Idle> {
    // Show win animation
    const win = ctx.context.lastWin;
    const symbols = ctx.context.reels.join(' ');
    
    console.log(chalk.green.bold('💰 YOU WON! 💰'));
    console.log(chalk.green(`$${win} added to your balance`));
    
    // Add small delay for effect
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return SlotPhase.Idle;
  }
  
  /**
   * Bonus game state
   */
  @Phase(SlotPhase.BonusGame)
  async bonusGame(ctx: PhaseContext<SlotContext>): Promise<SlotPhase.Spin> {
    // Start the bonus game
    ctx.context.startBonusGame();
    
    // Add some delay for effect
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Move to spin immediately to use a bonus spin
    return SlotPhase.Spin;
  }
  
  /**
   * Game over state
   */
  @Phase(SlotPhase.GameOver)
  async gameOver(ctx: PhaseContext<SlotContext>): Promise<SlotPhase.Exit> {
    console.log(chalk.red.bold('GAME OVER'));
    console.log(`You finished with $${ctx.context.balance}`);
    
    return new Promise(resolve => {
      ctx.context.rl.question(chalk.yellow('Press Enter to exit...'), () => {
        resolve(SlotPhase.Exit);
      });
    });
  }
  
  /**
   * Exit state
   */
  @Phase(SlotPhase.Exit)
  async exit(ctx: PhaseContext<SlotContext>): Promise<never> {
    console.log(chalk.green('Thanks for playing! Goodbye!'));
    ctx.context.rl.close();
    process.exit(0);
    
    // This should never be reached, but TypeScript requires a return
    return new Promise<never>(() => {});
  }
}
// examples/slot-game/index.ts
import { StateMachine, Phase, PhaseContext } from 'phasmatic';
import { when, reaction } from 'mobx';

// Define our phases enum
export enum SlotPhase {
  Init = 'Init',
  Load = 'Load',
  Idle = 'Idle',
  Spin = 'Spin',
  SpinResult = 'SpinResult',
  WinPresentation = 'WinPresentation',
  Bonus = 'Bonus',
  Error = 'Error',
}

// Define our context/store interface
interface SlotContext {
  // Game state
  isLoaded: boolean;
  isSpinning: boolean;
  hasWin: boolean;
  hasBonus: boolean;
  
  // Services
  network: {
    spin: () => Promise<{ win: number; bonus: boolean }>;
    isSpinRequestFinished: boolean;
    spinRequestStatus: 'idle' | 'pending' | 'done' | 'error';
  };
  
  // UI components
  reels: {
    start: () => Promise<void>;
    stop: () => Promise<void>;
    isAnticipation: boolean;
  };
  
  // Mediators
  spinButton: {
    setReadyToSpin: (callback: () => void) => () => void;
    setReadyToStop: (callback: () => void) => () => void;
    setSpinToStop: () => void;
  };
  
  // User interactions
  interaction: {
    addSpaceOnce: (callback: () => void) => () => void;
  };
  
  // Sound effects
  sound: {
    playEffect: (name: string) => () => void;
    stopEffects: () => void;
  };
  
  // Configuration
  settings: {
    speedMode: 'normal' | 'turbo';
  };
}

/**
 * Slot game state machine implementation
 */
export class SlotMachine extends StateMachine<SlotPhase, SlotContext> {
  constructor(context: SlotContext) {
    // Start with Init phase, enable debug logging
    super(context, SlotPhase.Init, true);
  }
  
  /**
   * Initialize the game
   */
  @Phase(SlotPhase.Init)
  async init(ctx: PhaseContext<SlotContext>): Promise<SlotPhase.Load> {
    console.log('Initializing game...');
    return SlotPhase.Load;
  }
  
  /**
   * Load game assets
   */
  @Phase(SlotPhase.Load)
  async load(ctx: PhaseContext<SlotContext>): Promise<SlotPhase.Idle> {
    console.log('Loading game assets...');
    
    // Wait for the game to be loaded
    await new Promise<void>(resolve => {
      // If already loaded, resolve immediately
      if (ctx.context.isLoaded) {
        resolve();
        return;
      }
      
      // Otherwise, wait until is
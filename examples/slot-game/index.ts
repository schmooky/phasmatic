// examples/slot-game/index.ts
import { observable, makeObservable, action } from 'mobx';
import { generateFlowchart } from '../../src';
import { SlotMachine, SlotPhase } from './phases';

/**
 * Example implementation of a slot game context
 * This would be your game's state/store
 */
class GameStore {
  // Observable state
  @observable isLoaded = false;
  @observable isSpinning = false;
  @observable hasWin = false;
  @observable hasBonus = false;
  
  // Network service
  network = {
    isSpinRequestFinished: false,
    spinRequestStatus: 'idle' as 'idle' | 'pending' | 'done' | 'error',
    
    spin: async () => {
      this.network.spinRequestStatus = 'pending';
      this.network.isSpinRequestFinished = false;
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate success with random outcome
      const win = Math.random() > 0.5 ? Math.floor(Math.random() * 1000) : 0;
      const bonus = Math.random() > 0.9; // 10% chance of bonus
      
      this.setHasWin(win > 0);
      this.setHasBonus(bonus);
      
      this.network.spinRequestStatus = 'done';
      this.network.isSpinRequestFinished = true;
      
      return { win, bonus };
    }
  };
  
  // Reels component
  reels = {
    isAnticipation: false,
    
    start: async () => {
      console.log('Reels: Starting animation');
      this.setSpinning(true);
      
      // Simulate reels starting
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Sometimes show anticipation
      if (Math.random() > 0.8) {
        this.reels.isAnticipation = true;
      }
    },
    
    stop: async () => {
      console.log('Reels: Stopping animation');
      
      // Simulate reels stopping
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      this.reels.isAnticipation = false;
      this.setSpinning(false);
    }
  };
  
  // Spin button
  spinButton = {
    setReadyToSpin: (callback: () => void) => {
      // In a real implementation, this would add event listeners
      const btn = document.getElementById('spin-button');
      const handler = () => callback();
      
      btn?.addEventListener('click', handler);
      console.log('Button: Set to SPIN mode');
      
      // Return a disposer function
      return () => {
        btn?.removeEventListener('click', handler);
      };
    },
    
    setReadyToStop: (callback?: () => void) => {
      const btn = document.getElementById('stop-button');
      const handler = () => callback?.();
      
      btn?.addEventListener('click', handler);
      console.log('Button: Set to STOP mode');
      
      return () => {
        btn?.removeEventListener('click', handler);
      };
    },
    
    setSpinToStop: () => {
      console.log('Button: Changed from SPIN to STOP');
    }
  };
  
  // Keyboard interaction
  interaction = {
    addSpaceOnce: (callback: () => void) => {
      const handler = (e: KeyboardEvent) => {
        if (e.code === 'Space') {
          callback();
          window.removeEventListener('keydown', handler);
        }
      };
      
      window.addEventListener('keydown', handler);
      
      return () => {
        window.removeEventListener('keydown', handler);
      };
    }
  };
  
  // Sound effects
  sound = {
    playEffect: (name: string) => {
      console.log(`Sound: Playing ${name}`);
      return () => {
        console.log(`Sound: Stopped ${name}`);
      };
    },
    
    stopEffects: () => {
      console.log('Sound: Stopped all effects');
    }
  };
  
  // Settings
  settings = {
    speedMode: 'normal' as 'normal' | 'turbo'
  };
  
  constructor() {
    makeObservable(this);
    
    // Simulate loading assets
    setTimeout(() => {
      this.setLoaded(true);
    }, 2000);
  }
  
  @action
  setLoaded(loaded: boolean) {
    this.isLoaded = loaded;
  }
  
  @action
  setSpinning(spinning: boolean) {
    this.isSpinning = spinning;
  }
  
  @action
  setHasWin(hasWin: boolean) {
    this.hasWin = hasWin;
  }
  
  @action
  setHasBonus(hasBonus: boolean) {
    this.hasBonus = hasBonus;
  }
}

/**
 * Main application entry point
 */
function initializeGame() {
  // Create our game store
  const gameStore = new GameStore();
  
  // Create the state machine with our store as the context
  const stateMachine = new SlotMachine(gameStore);
  
  // Generate a flowchart from our state machine
  const flowchart = generateFlowchart(SlotMachine);
  console.log('State Machine Flowchart:');
  console.log(flowchart);
  
  // Expose to window for debugging
  (window as any).gameStore = gameStore;
  (window as any).stateMachine = stateMachine;
  
  return {
    gameStore,
    stateMachine
  };
}

// Initialize the game when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const game = initializeGame();
  console.log('Game initialized!');
});

// For Node.js environments
if (typeof window === 'undefined') {
  console.log('Running in Node.js environment');
  const game = initializeGame();
}

export { initializeGame };
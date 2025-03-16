var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
// examples/slot-game/index.ts
import { observable, makeObservable, action } from 'mobx';
import { generateFlowchart } from '../../src';
import { SlotMachine } from './phases';
/**
 * Example implementation of a slot game context
 * This would be your game's state/store
 */
class GameStore {
    constructor() {
        // Observable state
        this.isLoaded = false;
        this.isSpinning = false;
        this.hasWin = false;
        this.hasBonus = false;
        // Network service
        this.network = {
            isSpinRequestFinished: false,
            spinRequestStatus: 'idle',
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
        this.reels = {
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
        this.spinButton = {
            setReadyToSpin: (callback) => {
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
            setReadyToStop: (callback) => {
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
        this.interaction = {
            addSpaceOnce: (callback) => {
                const handler = (e) => {
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
        this.sound = {
            playEffect: (name) => {
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
        this.settings = {
            speedMode: 'normal'
        };
        makeObservable(this);
        // Simulate loading assets
        setTimeout(() => {
            this.setLoaded(true);
        }, 2000);
    }
    setLoaded(loaded) {
        this.isLoaded = loaded;
    }
    setSpinning(spinning) {
        this.isSpinning = spinning;
    }
    setHasWin(hasWin) {
        this.hasWin = hasWin;
    }
    setHasBonus(hasBonus) {
        this.hasBonus = hasBonus;
    }
}
__decorate([
    observable,
    __metadata("design:type", Object)
], GameStore.prototype, "isLoaded", void 0);
__decorate([
    observable,
    __metadata("design:type", Object)
], GameStore.prototype, "isSpinning", void 0);
__decorate([
    observable,
    __metadata("design:type", Object)
], GameStore.prototype, "hasWin", void 0);
__decorate([
    observable,
    __metadata("design:type", Object)
], GameStore.prototype, "hasBonus", void 0);
__decorate([
    action,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Boolean]),
    __metadata("design:returntype", void 0)
], GameStore.prototype, "setLoaded", null);
__decorate([
    action,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Boolean]),
    __metadata("design:returntype", void 0)
], GameStore.prototype, "setSpinning", null);
__decorate([
    action,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Boolean]),
    __metadata("design:returntype", void 0)
], GameStore.prototype, "setHasWin", null);
__decorate([
    action,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Boolean]),
    __metadata("design:returntype", void 0)
], GameStore.prototype, "setHasBonus", null);
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
    window.gameStore = gameStore;
    window.stateMachine = stateMachine;
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
//# sourceMappingURL=index.js.map
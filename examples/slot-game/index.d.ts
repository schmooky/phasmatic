import { SlotMachine } from './phases';
/**
 * Example implementation of a slot game context
 * This would be your game's state/store
 */
declare class GameStore {
    isLoaded: boolean;
    isSpinning: boolean;
    hasWin: boolean;
    hasBonus: boolean;
    network: {
        isSpinRequestFinished: boolean;
        spinRequestStatus: "idle" | "pending" | "done" | "error";
        spin: () => Promise<{
            win: number;
            bonus: boolean;
        }>;
    };
    reels: {
        isAnticipation: boolean;
        start: () => Promise<void>;
        stop: () => Promise<void>;
    };
    spinButton: {
        setReadyToSpin: (callback: () => void) => () => void;
        setReadyToStop: (callback?: () => void) => () => void;
        setSpinToStop: () => void;
    };
    interaction: {
        addSpaceOnce: (callback: () => void) => () => void;
    };
    sound: {
        playEffect: (name: string) => () => void;
        stopEffects: () => void;
    };
    settings: {
        speedMode: "normal" | "turbo";
    };
    constructor();
    setLoaded(loaded: boolean): void;
    setSpinning(spinning: boolean): void;
    setHasWin(hasWin: boolean): void;
    setHasBonus(hasBonus: boolean): void;
}
/**
 * Main application entry point
 */
declare function initializeGame(): {
    gameStore: GameStore;
    stateMachine: SlotMachine;
};
export { initializeGame };

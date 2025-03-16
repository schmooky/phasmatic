import { StateMachine, PhaseContext } from 'phasmatic';
export declare enum SlotPhase {
    Init = "Init",
    Load = "Load",
    Idle = "Idle",
    Spin = "Spin",
    SpinResult = "SpinResult",
    WinPresentation = "WinPresentation",
    Bonus = "Bonus",
    Error = "Error"
}
interface SlotContext {
    isLoaded: boolean;
    isSpinning: boolean;
    hasWin: boolean;
    hasBonus: boolean;
    network: {
        spin: () => Promise<{
            win: number;
            bonus: boolean;
        }>;
        isSpinRequestFinished: boolean;
        spinRequestStatus: 'idle' | 'pending' | 'done' | 'error';
    };
    reels: {
        start: () => Promise<void>;
        stop: () => Promise<void>;
        isAnticipation: boolean;
    };
    spinButton: {
        setReadyToSpin: (callback: () => void) => () => void;
        setReadyToStop: (callback: () => void) => () => void;
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
        speedMode: 'normal' | 'turbo';
    };
}
/**
 * Slot game state machine implementation
 */
export declare class SlotMachine extends StateMachine<SlotPhase, SlotContext> {
    constructor(context: SlotContext);
    /**
     * Initialize the game
     */
    init(ctx: PhaseContext<SlotContext>): Promise<SlotPhase.Load>;
    /**
     * Load game assets
     */
    load(ctx: PhaseContext<SlotContext>): Promise<SlotPhase.Idle>;
}
export {};

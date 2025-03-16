import { Interface as ReadlineInterface } from 'readline';
/**
 * Symbol map for slot machine reels
 */
export declare const SYMBOLS: string[];
/**
 * Payouts for different symbol combinations
 */
export declare const PAYOUTS: {
    '\uD83C\uDF52': number;
    '\uD83C\uDF4B': number;
    '\uD83C\uDF4A': number;
    '\uD83C\uDF47': number;
    '\uD83D\uDD14': number;
    '\uD83D\uDC8E': number;
    '7\uFE0F\u20E3': number;
};
/**
 * Game context type
 */
export interface SlotContext {
    balance: number;
    bet: number;
    reels: string[];
    isSpinning: boolean;
    lastWin: number;
    hasBonus: boolean;
    bonusSpinsRemaining: number;
    rl: ReadlineInterface;
    spin(): Promise<{
        win: number;
        symbols: string[];
        hasBonus: boolean;
    }>;
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
export declare function createContext(rl: ReadlineInterface): SlotContext;

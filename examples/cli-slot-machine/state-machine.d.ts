import { StateMachine, PhaseContext } from '../../src';
import { SlotContext } from './context';
/**
 * Game phases for the slot machine
 */
export declare enum SlotPhase {
    Init = "Init",
    Idle = "Idle",
    PlaceBet = "PlaceBet",
    Spin = "Spin",
    EvaluateWin = "EvaluateWin",
    WinPresentation = "WinPresentation",
    BonusGame = "BonusGame",
    GameOver = "GameOver",
    Exit = "Exit"
}
/**
 * Slot machine state machine implementation
 */
export declare class SlotMachine extends StateMachine<SlotPhase, SlotContext> {
    constructor(context: SlotContext);
    /**
     * Initialize the game
     */
    init(ctx: PhaseContext<SlotContext>): Promise<SlotPhase.Idle>;
    /**
     * Idle state - waiting for player input
     */
    idle(ctx: PhaseContext<SlotContext>): Promise<SlotPhase.PlaceBet | SlotPhase.Spin | SlotPhase.BonusGame | SlotPhase.Exit>;
    /**
     * Place bet state
     */
    placeBet(ctx: PhaseContext<SlotContext>): Promise<SlotPhase.Idle>;
    /**
     * Spin state
     */
    spin(ctx: PhaseContext<SlotContext>): Promise<SlotPhase.EvaluateWin | SlotPhase.Idle>;
    /**
     * Evaluate win state
     */
    evaluateWin(ctx: PhaseContext<SlotContext>): Promise<SlotPhase.WinPresentation | SlotPhase.Idle>;
    /**
     * Win presentation state
     */
    winPresentation(ctx: PhaseContext<SlotContext>): Promise<SlotPhase.Idle>;
    /**
     * Bonus game state
     */
    bonusGame(ctx: PhaseContext<SlotContext>): Promise<SlotPhase.Spin>;
    /**
     * Game over state
     */
    gameOver(ctx: PhaseContext<SlotContext>): Promise<SlotPhase.Exit>;
    /**
     * Exit state
     */
    exit(ctx: PhaseContext<SlotContext>): Promise<never>;
}

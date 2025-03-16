var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b, _c, _d, _e, _f, _g, _h, _j;
// examples/cli-slot-machine/state-machine.ts
import { StateMachine, Phase, PhaseContext } from '../../src';
import chalk from 'chalk';
/**
 * Game phases for the slot machine
 */
export var SlotPhase;
(function (SlotPhase) {
    SlotPhase["Init"] = "Init";
    SlotPhase["Idle"] = "Idle";
    SlotPhase["PlaceBet"] = "PlaceBet";
    SlotPhase["Spin"] = "Spin";
    SlotPhase["EvaluateWin"] = "EvaluateWin";
    SlotPhase["WinPresentation"] = "WinPresentation";
    SlotPhase["BonusGame"] = "BonusGame";
    SlotPhase["GameOver"] = "GameOver";
    SlotPhase["Exit"] = "Exit";
})(SlotPhase || (SlotPhase = {}));
/**
 * Slot machine state machine implementation
 */
export class SlotMachine extends StateMachine {
    constructor(context) {
        super(context, SlotPhase.Init, true);
    }
    /**
     * Initialize the game
     */
    async init(ctx) {
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
    async idle(ctx) {
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
    async placeBet(ctx) {
        const bet = await ctx.context.getBet();
        ctx.context.placeBet(bet);
        return SlotPhase.Idle;
    }
    /**
     * Spin state
     */
    async spin(ctx) {
        try {
            // Check if this is a bonus spin
            const isBonusSpin = ctx.context.bonusSpinsRemaining > 0;
            if (isBonusSpin) {
                ctx.context.bonusSpinsRemaining--;
                console.log(chalk.magenta(`🌟 BONUS SPIN! ${ctx.context.bonusSpinsRemaining} remaining 🌟`));
            }
            else {
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
        }
        catch (error) {
            console.error(chalk.red('Error during spin:'), error);
            return SlotPhase.Idle;
        }
    }
    /**
     * Evaluate win state
     */
    async evaluateWin(ctx) {
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
    async winPresentation(ctx) {
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
    async bonusGame(ctx) {
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
    async gameOver(ctx) {
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
    async exit(ctx) {
        console.log(chalk.green('Thanks for playing! Goodbye!'));
        ctx.context.rl.close();
        process.exit(0);
        // This should never be reached, but TypeScript requires a return
        return new Promise(() => { });
    }
}
__decorate([
    Phase(SlotPhase.Init),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_a = typeof PhaseContext !== "undefined" && PhaseContext) === "function" ? _a : Object]),
    __metadata("design:returntype", Promise)
], SlotMachine.prototype, "init", null);
__decorate([
    Phase(SlotPhase.Idle),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof PhaseContext !== "undefined" && PhaseContext) === "function" ? _b : Object]),
    __metadata("design:returntype", Promise)
], SlotMachine.prototype, "idle", null);
__decorate([
    Phase(SlotPhase.PlaceBet),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_c = typeof PhaseContext !== "undefined" && PhaseContext) === "function" ? _c : Object]),
    __metadata("design:returntype", Promise)
], SlotMachine.prototype, "placeBet", null);
__decorate([
    Phase(SlotPhase.Spin),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_d = typeof PhaseContext !== "undefined" && PhaseContext) === "function" ? _d : Object]),
    __metadata("design:returntype", Promise)
], SlotMachine.prototype, "spin", null);
__decorate([
    Phase(SlotPhase.EvaluateWin),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_e = typeof PhaseContext !== "undefined" && PhaseContext) === "function" ? _e : Object]),
    __metadata("design:returntype", Promise)
], SlotMachine.prototype, "evaluateWin", null);
__decorate([
    Phase(SlotPhase.WinPresentation),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_f = typeof PhaseContext !== "undefined" && PhaseContext) === "function" ? _f : Object]),
    __metadata("design:returntype", Promise)
], SlotMachine.prototype, "winPresentation", null);
__decorate([
    Phase(SlotPhase.BonusGame),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_g = typeof PhaseContext !== "undefined" && PhaseContext) === "function" ? _g : Object]),
    __metadata("design:returntype", Promise)
], SlotMachine.prototype, "bonusGame", null);
__decorate([
    Phase(SlotPhase.GameOver),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_h = typeof PhaseContext !== "undefined" && PhaseContext) === "function" ? _h : Object]),
    __metadata("design:returntype", Promise)
], SlotMachine.prototype, "gameOver", null);
__decorate([
    Phase(SlotPhase.Exit),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_j = typeof PhaseContext !== "undefined" && PhaseContext) === "function" ? _j : Object]),
    __metadata("design:returntype", Promise)
], SlotMachine.prototype, "exit", null);
//# sourceMappingURL=state-machine.js.map
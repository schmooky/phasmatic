var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
// examples/cli-slot-machine/context.ts
import { makeObservable, observable, action } from 'mobx';
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
 * Creates a slot machine game context
 */
export function createContext(rl) {
    class GameContext {
        constructor(rl) {
            this.balance = 100;
            this.bet = 1;
            this.reels = ['🎰', '🎰', '🎰'];
            this.isSpinning = false;
            this.lastWin = 0;
            this.hasBonus = false;
            this.bonusSpinsRemaining = 0;
            this.rl = rl;
            makeObservable(this);
        }
        placeBet(amount) {
            if (amount > this.balance) {
                console.log(chalk.red(`You don't have enough balance. Your balance: $${this.balance}`));
                return;
            }
            this.bet = amount;
            console.log(chalk.green(`Bet set to $${amount}`));
        }
        addWin(amount) {
            this.lastWin = amount;
            this.balance += amount;
            console.log(chalk.green.bold(`You won $${amount}!`));
        }
        async spin() {
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
                win = PAYOUTS[symbols[0]] * this.bet;
            }
            else if (symbols[0] === symbols[1] || symbols[1] === symbols[2]) {
                // Two adjacent symbols match
                win = Math.floor(PAYOUTS[symbols[1]] * this.bet * 0.3);
            }
            // Apply bonus multiplier if in bonus game
            if (this.bonusSpinsRemaining > 0) {
                win *= 2;
            }
            return { win, symbols, hasBonus };
        }
        async getBet() {
            return new Promise((resolve) => {
                this.rl.question(chalk.yellow(`Enter your bet (1-${this.balance}): `), (answer) => {
                    const bet = parseInt(answer, 10);
                    if (isNaN(bet) || bet < 1 || bet > this.balance) {
                        console.log(chalk.red(`Invalid bet. Please enter a value between 1 and ${this.balance}.`));
                        resolve(this.bet); // Keep current bet
                    }
                    else {
                        resolve(bet);
                    }
                });
            });
        }
        showReels(reels) {
            console.log('\n┌───┬───┬───┐');
            console.log(`│ ${reels[0]} │ ${reels[1]} │ ${reels[2]} │`);
            console.log('└───┴───┴───┘\n');
        }
        async promptForAction() {
            console.log(chalk.cyan(`Balance: $${this.balance} | Current Bet: $${this.bet}`));
            if (this.bonusSpinsRemaining > 0) {
                console.log(chalk.magenta(`🌟 BONUS MODE: ${this.bonusSpinsRemaining} spins remaining 🌟`));
            }
            return new Promise((resolve) => {
                this.rl.question(chalk.yellow('What would you like to do? (s)pin, (b)et, (e)xit: '), (answer) => {
                    const action = answer.trim().toLowerCase()[0];
                    if (action === 's')
                        resolve('spin');
                    else if (action === 'b')
                        resolve('bet');
                    else if (action === 'e')
                        resolve('exit');
                    else {
                        console.log(chalk.red('Invalid option. Try again.'));
                        resolve(this.promptForAction());
                    }
                });
            });
        }
        startBonusGame() {
            this.bonusSpinsRemaining = 5;
            console.log(chalk.magenta.bold('🌟 BONUS ROUND ACTIVATED! 🌟'));
            console.log(chalk.magenta('You have 5 free spins with 2x multiplier on all wins!'));
        }
        triggerBonusRound() {
            this.hasBonus = true;
        }
    }
    __decorate([
        observable,
        __metadata("design:type", Object)
    ], GameContext.prototype, "balance", void 0);
    __decorate([
        observable,
        __metadata("design:type", Object)
    ], GameContext.prototype, "bet", void 0);
    __decorate([
        observable,
        __metadata("design:type", Object)
    ], GameContext.prototype, "reels", void 0);
    __decorate([
        observable,
        __metadata("design:type", Object)
    ], GameContext.prototype, "isSpinning", void 0);
    __decorate([
        observable,
        __metadata("design:type", Object)
    ], GameContext.prototype, "lastWin", void 0);
    __decorate([
        observable,
        __metadata("design:type", Object)
    ], GameContext.prototype, "hasBonus", void 0);
    __decorate([
        observable,
        __metadata("design:type", Object)
    ], GameContext.prototype, "bonusSpinsRemaining", void 0);
    __decorate([
        action,
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Number]),
        __metadata("design:returntype", void 0)
    ], GameContext.prototype, "placeBet", null);
    __decorate([
        action,
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Number]),
        __metadata("design:returntype", void 0)
    ], GameContext.prototype, "addWin", null);
    __decorate([
        action,
        __metadata("design:type", Function),
        __metadata("design:paramtypes", []),
        __metadata("design:returntype", Promise)
    ], GameContext.prototype, "spin", null);
    __decorate([
        action,
        __metadata("design:type", Function),
        __metadata("design:paramtypes", []),
        __metadata("design:returntype", Promise)
    ], GameContext.prototype, "getBet", null);
    __decorate([
        action,
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Array]),
        __metadata("design:returntype", void 0)
    ], GameContext.prototype, "showReels", null);
    __decorate([
        action,
        __metadata("design:type", Function),
        __metadata("design:paramtypes", []),
        __metadata("design:returntype", Promise)
    ], GameContext.prototype, "promptForAction", null);
    __decorate([
        action,
        __metadata("design:type", Function),
        __metadata("design:paramtypes", []),
        __metadata("design:returntype", void 0)
    ], GameContext.prototype, "startBonusGame", null);
    __decorate([
        action,
        __metadata("design:type", Function),
        __metadata("design:paramtypes", []),
        __metadata("design:returntype", void 0)
    ], GameContext.prototype, "triggerBonusRound", null);
    return new GameContext(rl);
}
//# sourceMappingURL=context.js.map
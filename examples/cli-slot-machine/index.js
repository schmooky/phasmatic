// examples/cli-slot-machine/index.ts
import { SlotMachine } from './state-machine';
import readline from 'readline';
import chalk from 'chalk';
import { createContext } from './context';
/**
 * CLI Slot Machine Example
 *
 * This demonstrates a simple CLI-based slot game that uses Phasmatic
 * for state management.
 */
async function runSlotMachine() {
    console.clear();
    console.log(chalk.yellow.bold('🎰 CLI SLOT MACHINE 🎰'));
    console.log(chalk.gray('Powered by Phasmatic state machine'));
    console.log('');
    // Create readline interface for user input
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    // Create game context
    const context = createContext(rl);
    // Create state machine
    const slotMachine = new SlotMachine(context);
    // Start the game
    slotMachine.start();
    // Handle cleanup on exit
    process.on('SIGINT', () => {
        console.log('\nExiting game...');
        rl.close();
        process.exit(0);
    });
}
// Run the slot machine if this file is executed directly
if (require.main === module) {
    runSlotMachine().catch(err => {
        console.error('Error running slot machine:', err);
        process.exit(1);
    });
}
export { runSlotMachine };
//# sourceMappingURL=index.js.map
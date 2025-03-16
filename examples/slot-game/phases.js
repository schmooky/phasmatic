var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b;
// examples/slot-game/index.ts
import { StateMachine, Phase, PhaseContext } from 'phasmatic';
// Define our phases enum
export var SlotPhase;
(function (SlotPhase) {
    SlotPhase["Init"] = "Init";
    SlotPhase["Load"] = "Load";
    SlotPhase["Idle"] = "Idle";
    SlotPhase["Spin"] = "Spin";
    SlotPhase["SpinResult"] = "SpinResult";
    SlotPhase["WinPresentation"] = "WinPresentation";
    SlotPhase["Bonus"] = "Bonus";
    SlotPhase["Error"] = "Error";
})(SlotPhase || (SlotPhase = {}));
/**
 * Slot game state machine implementation
 */
export class SlotMachine extends StateMachine {
    constructor(context) {
        // Start with Init phase, enable debug logging
        super(context, SlotPhase.Init, true);
    }
    /**
     * Initialize the game
     */
    async init(ctx) {
        console.log('Initializing game...');
        return SlotPhase.Load;
    }
    /**
     * Load game assets
     */
    async load(ctx) {
        console.log('Loading game assets...');
        // Wait for the game to be loaded
        await new Promise(resolve => {
            // If already loaded, resolve immediately
            if (ctx.context.isLoaded) {
                resolve();
                return;
            }
            // Otherwise, wait until is
        });
        // Otherwise, wait until is
    }
}
__decorate([
    Phase(SlotPhase.Init),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_a = typeof PhaseContext !== "undefined" && PhaseContext) === "function" ? _a : Object]),
    __metadata("design:returntype", Promise)
], SlotMachine.prototype, "init", null);
__decorate([
    Phase(SlotPhase.Load),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof PhaseContext !== "undefined" && PhaseContext) === "function" ? _b : Object]),
    __metadata("design:returntype", Promise)
], SlotMachine.prototype, "load", null);
// Otherwise, wait until is
//# sourceMappingURL=phases.js.map
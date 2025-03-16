/**
 * Static registry key used on StateMachine instances
 */
export const PHASE_REGISTRY = Symbol('PHASE_REGISTRY');
/**
 * Error types specific to Phasmatic
 */
export var PhasmaticErrorType;
(function (PhasmaticErrorType) {
    PhasmaticErrorType["INVALID_PHASE"] = "INVALID_PHASE";
    PhasmaticErrorType["PHASE_EXECUTION_ERROR"] = "PHASE_EXECUTION_ERROR";
    PhasmaticErrorType["INVALID_TRANSITION"] = "INVALID_TRANSITION";
    PhasmaticErrorType["SELF_TRANSITION"] = "SELF_TRANSITION";
})(PhasmaticErrorType || (PhasmaticErrorType = {}));
//# sourceMappingURL=types.js.map
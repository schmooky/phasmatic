import { PhaseHandlerOptions } from "../../../packages/core";

export async function errorPhase({
    store,
    addDisposer,
    setTimeout,
    abortSignal
}: PhaseHandlerOptions<IRootStore>): Promise<Phase> {
    
    return new Promise<Phase>((resolve) => {
        
    });
}
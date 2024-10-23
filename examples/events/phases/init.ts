import { PhaseHandlerOptions } from "../../../packages/core";

export async function initPhase({
    store,
    addDisposer,
    setTimeout,
    abortSignal
}: PhaseHandlerOptions<IRootStore>): Promise<Phase> {
    
    return new Promise<Phase>((resolve) => {
        console.log('Stuck Here')
    });
}
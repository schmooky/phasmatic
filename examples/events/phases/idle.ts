import { PhaseHandlerOptions } from "../../../packages/core";


export async function idlePhase({
    store,
    addDisposer,
    setTimeout,
    abortSignal
}: PhaseHandlerOptions<IRootStore>): Promise<Phase> {
    return new Promise<Phase>((resolve) => {
       
    });
}
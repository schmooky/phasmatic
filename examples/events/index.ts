import { PhaseHandlers, PhaseMachine } from "../../packages/core";
import { idlePhase } from "./phases";
import { errorPhase } from "./phases/error";
import { initPhase } from "./phases/init";

export const phaseHandlers: PhaseHandlers<Phase, IRootStore> = {
  error: errorPhase,
  init: initPhase,
  [Phase.Idle]: idlePhase,
};

export class RootStore implements IRootStore {
  phaseMachine: PhaseMachine<Phase, IRootStore>;

  constructor() {
    this.phaseMachine = new PhaseMachine(
      this as IRootStore,
      phaseHandlers,
      Phase.Init
    );

    //@ts-ignore
    window["store"] = this;
  }
}

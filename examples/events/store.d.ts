interface IRootStore {
    phaseMachine: PhaseMachine<Phase, IRootStore>;
}
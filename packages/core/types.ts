export type SimpleHandler = () => void;

export type PhaseDisposerType = (_disposer: SimpleHandler) => void;
export type PhaseTimeoutType = (_ms: number, _handler: SimpleHandler) => void;

export type RequiredPhases = 'error' | 'init';

export type PhaseHandlerOptions<S> = {
  store: S;
  setTimeout: PhaseTimeoutType;
  addDisposer: PhaseDisposerType;
  abortSignal: AbortSignal;
};

export type PhaseHandler<T extends string, S extends object> = (
  _options: PhaseHandlerOptions<S>,
) => T | Promise<T>;

export type PhaseHandlers<T extends string, S extends object> = Record<
  T | RequiredPhases,
  PhaseHandler<T | RequiredPhases, S>
>;

export type PhaseDisposerInfo = {
  name: string;
  timestamp: number;
  count: number;
};

export type PhaseMetadata = {
  startTime: number;
  disposers: PhaseDisposerInfo[];
  timeouts: number;
};

import { action, makeObservable, observable } from "mobx";
import { 
  PhaseHandlers, 
  SimpleHandler, 
  RequiredPhases,
  PhaseMetadata,
  PhaseDisposerInfo 
} from "./types";

export class PhaseMachine<T extends string, S extends object> {
  @observable public phase: T | RequiredPhases | undefined = undefined;
  
  protected phaseDisposers: (() => void)[] = [];
  protected currentAbortController: AbortController | null = null;
  protected phaseMetadata: Map<string, PhaseMetadata> = new Map();
  
  protected readonly store: S;
  protected readonly initPhase: T;
  protected readonly debug: boolean;
  protected readonly onError?: (error: Error) => void;
  protected readonly phaseHandlers: PhaseHandlers<T, S>;

  constructor(
    store: S,
    handlers: PhaseHandlers<T, S>,
    initPhase: T,
    debug: boolean = false,
    onError?: (error: Error) => void,
  ) {
    if (!handlers.error || !handlers.init) {
      throw new Error('Error and Init phases are required');
    }

    this.store = store;
    this.debug = debug;
    this.onError = onError;
    this.initPhase = initPhase;
    this.phaseHandlers = { ...handlers };

    makeObservable(this, {
      phase: observable,
      setPhaseName: action,
    });

    if (debug) {
      console.group('StateMachine initialized');
      console.log('Initial store state:', store);
      console.groupEnd();
    }
  }

  public init(): void {
    this.setNextPhase('init' as RequiredPhases);
  }

  public phaseTimeout(timeoutMs: number, handler: SimpleHandler): void {
    if (!this.currentAbortController) return;

    const timeout = setTimeout(() => {
      if (!this.currentAbortController?.signal.aborted) {
        handler();
      }
    }, timeoutMs);

    this.updatePhaseMetadata('timeouts');
    
    this.phaseDisposers.push(() => {
      clearTimeout(timeout);
    });
  }

  public addPhaseDisposer(disposer: SimpleHandler, name: string = 'unnamed'): void {
    this.updatePhaseMetadata('disposers', name);
    this.phaseDisposers.push(disposer);
  }

  @action
  public setPhaseName(phase: T | RequiredPhases): void {
    this.phase = phase;
  }

  protected setNextPhase(phase: T | RequiredPhases): void {
    this.setPhaseName(phase);
    this.executePhase();
  }

  protected updatePhaseMetadata(
    type: keyof PhaseMetadata, 
    disposerName?: string
  ): void {
    if (!this.phase) return;

    const metadata = this.phaseMetadata.get(this.phase) || {
      startTime: Date.now(),
      disposers: [],
      timeouts: 0
    };

    if (type === 'disposers' && disposerName) {
      const disposerInfo = metadata.disposers.find(d => d.name === disposerName);
      if (disposerInfo) {
        disposerInfo.count++;
      } else {
        metadata.disposers.push({
          name: disposerName,
          timestamp: Date.now(),
          count: 1
        });
      }
    } else if (type === 'timeouts') {
      metadata.timeouts++;
    }

    this.phaseMetadata.set(this.phase, metadata);

    if (this.debug) {
      console.log(`Phase ${this.phase} metadata updated:`, metadata);
    }
  }

  protected async executePhase(): Promise<void> {
    if (!this.phase) {
      const error = new Error("Can't execute on a null phase");
      this.handleError(error);
      return;
    }

    try {
      this.disposeCurrentPhase();
      this.currentAbortController = new AbortController();

      if (this.debug) {
        console.group(`Executing phase: ${this.phase}`);
        console.time(`Phase ${this.phase} execution`);
      }

      const result = await this.phaseHandlers[this.phase]({
        store: this.store,
        setTimeout: this.phaseTimeout.bind(this),
        addDisposer: this.addPhaseDisposer.bind(this),
        abortSignal: this.currentAbortController.signal
      });

      if (this.debug) {
        console.timeEnd(`Phase ${this.phase} execution`);
        console.groupEnd();
      }

      this.setNextPhase(result);
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  protected handleError(error: Error): void {
    if (this.debug) {
      console.error('StateMachine error:', error);
    }

    if (this.onError) {
      this.onError(error);
    }

    this.setNextPhase('error' as RequiredPhases);
  }

  protected disposeCurrentPhase(): void {
    if (this.currentAbortController) {
      this.currentAbortController.abort();
      this.currentAbortController = null;
    }

    while (this.phaseDisposers.length > 0) {
      const disposer = this.phaseDisposers.pop();
      if (disposer) {
        try {
          disposer();
        } catch (error) {
          if (this.debug) {
            console.error('Error during disposal:', error);
          }
        }
      }
    }
  }
}
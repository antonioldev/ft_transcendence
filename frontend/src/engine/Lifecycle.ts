export interface ILifecycle {
	initialize(): Promise<void>;
	dispose(): void;
	isInitialized(): boolean;
}

export enum LifecycleState {
	UNINITIALIZED = 'uninitialized',
	INITIALIZING = 'initializing',
	INITIALIZED = 'initialized',
	DISPOSING = 'disposing',
	DISPOSED = 'disposed'
}

export abstract class LifecycleComponent implements ILifecycle {
	protected lifecycleState: LifecycleState = LifecycleState.UNINITIALIZED;

	async initialize(): Promise<void> {
		if (this.lifecycleState !== LifecycleState.UNINITIALIZED) return;
		
		this.lifecycleState = LifecycleState.INITIALIZING;
		await this.onInitialize();
		this.lifecycleState = LifecycleState.INITIALIZED;
	}

	dispose(): void {
		if (this.lifecycleState === LifecycleState.DISPOSED || 
			this.lifecycleState === LifecycleState.DISPOSING) return;
		
		this.lifecycleState = LifecycleState.DISPOSING;
		this.onDispose();
		this.lifecycleState = LifecycleState.DISPOSED;
	}

	isInitialized(): boolean {
		return this.lifecycleState === LifecycleState.INITIALIZED;
	}

	protected abstract onInitialize(): Promise<void>;
	protected abstract onDispose(): void;
}
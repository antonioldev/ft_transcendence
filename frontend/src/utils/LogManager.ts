export enum LogLevel {
	DEBUG = 0,
	INFO = 1,
	WARN = 2,
	ERROR = 3
}

export class Logger {
	private static level: LogLevel = LogLevel.DEBUG; // Here we can change to check less logs

	static setLevel(level: LogLevel): void {
		this.level = level;
		this.info('Log level changed', 'Logger', { newLevel: LogLevel[level] });
	}

	static error(message: string, context?: string, data?: any): void {
		this.log(LogLevel.ERROR, message, context, data);
	}

	static errorAndThrow(message: string, context?: string, data?: any): never {
		this.log(LogLevel.ERROR, message, context, data);
		throw new Error(context ? `${context}: ${message}` : message);
	}

	static debug(message: string, context?: string, data?: any): void {
		if (this.level <= LogLevel.DEBUG) {
			this.log(LogLevel.DEBUG, message, context, data);
		}
	}

	static info(message: string, context?: string, data?: any): void {
		if (this.level <= LogLevel.INFO) {
			this.log(LogLevel.INFO, message, context, data);
		}
	}

	static warn(message: string, context?: string, data?: any): void {
		if (this.level <= LogLevel.WARN) {
			this.log(LogLevel.WARN, message, context, data);
		}
	}

	private static log(level: LogLevel, message: string, context?: string, data?: any): void {
		const timestamp = new Date().toISOString().substr(11, 8);
		const prefix = context ? `${timestamp} ${context}:` : `${timestamp}`;
		const fullMessage = `${prefix} ${message}`;

		switch (level) {
			case LogLevel.DEBUG:
				data ? console.debug(fullMessage, data) : console.debug(fullMessage);
				break;
			case LogLevel.INFO:
				data ? console.info(fullMessage, data) : console.info(fullMessage);
				break;
			case LogLevel.WARN:
				data ? console.warn(fullMessage, data) : console.warn(fullMessage);
				break;
			case LogLevel.ERROR:
				data ? console.error(fullMessage, data) : console.error(fullMessage);
				break;
			default:
				data ? console.log(fullMessage, data) : console.log(fullMessage);
		}
	}
}